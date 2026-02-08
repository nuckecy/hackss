# CLAUDE.md - UX Buddy Figma Plugin

## Project Overview

UX Buddy is a Figma plugin that provides conversational design system and accessibility guidance. V1 implements Q&A mode only: designers ask questions about the Simple Design System (SDS) and WCAG guidelines, and receive contextual answers powered by Gemini Flash.

Read `PRD.md` for full requirements. Read `CHATBOT_PERSONA.md` for the AI assistant's personality and tone. Read `UI_STYLE_GUIDE.md` for all visual design specifications (colors, typography, spacing, component styles). The style guide is the single source of truth for how the plugin looks.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Build | Vite |
| UI | Preact + TypeScript |
| Styling | Vanilla CSS (Figma plugin design conventions) |
| Main thread | TypeScript (Figma Plugin API) |
| AI backend | Google Gemini Flash API (called from UI iframe) |
| Package manager | npm |

---

## Project Structure

```
ux-buddy/
├── manifest.json              # Figma plugin manifest (editorType: figma)
├── CLAUDE.md                  # This file
├── PRD.md                     # Product requirements
├── CHATBOT_PERSONA.md         # AI persona definition
├── UI_STYLE_GUIDE.md          # Visual design specs (colors, typography, spacing, components)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.ts                # Figma main thread entry
│   ├── ui/
│   │   ├── index.html         # UI iframe entry
│   │   ├── App.tsx            # Root UI component
│   │   ├── components/        # Preact components
│   │   ├── styles/            # CSS files
│   │   └── hooks/             # Custom hooks
│   ├── ai/
│   │   ├── gemini-provider.ts # Gemini Flash integration
│   │   └── system-prompt.ts   # Builds the system prompt from persona + KB
│   ├── knowledge/
│   │   ├── components.json    # SDS component specs
│   │   ├── accessibility.json # WCAG 2.1 AA rules
│   │   └── tokens.json        # Design token reference
│   └── types/
│       ├── figma.ts
│       ├── messages.ts
│       └── knowledge.ts
└── scripts/
    └── extract-knowledge.js   # Node script to extract KB from SDS repo
```

---

## Figma Plugin Architecture Rules

### Two Thread Model
Figma plugins run in two separate contexts that communicate via `postMessage`:

1. **Main thread** (`src/main.ts`): Has access to the Figma Plugin API (`figma.*`). Runs in a sandbox. NO DOM access, NO `fetch`, NO `window`. This is where you read/write Figma document data.

2. **UI thread** (`src/ui/`): Runs in an iframe. Has full DOM, `fetch`, `window`. NO access to `figma.*` API. This is where the chat UI lives and where API calls to Gemini are made.

### Communication Pattern
```typescript
// main.ts → UI
figma.ui.postMessage({ type: 'selection-changed', data: nodeData });

// UI → main.ts
parent.postMessage({ pluginMessage: { type: 'get-selection' } }, '*');

// main.ts listens
figma.ui.onmessage = (msg) => { ... };

// UI listens
window.onmessage = (event) => { const msg = event.data.pluginMessage; ... };
```

### CRITICAL: Never do these things
- NEVER use `fetch()` or `XMLHttpRequest` in main.ts (no network in sandbox)
- NEVER reference `figma.*` in UI code (not available)
- NEVER use `require()` in main.ts (use ES module bundling via Vite)
- NEVER store API keys in code (use `figma.clientStorage`)

### manifest.json Format
```json
{
  "name": "UX Buddy",
  "id": "ux-buddy-plugin-id",
  "api": "1.0.0",
  "main": "dist/main.js",
  "ui": "dist/ui.html",
  "editorType": ["figma"],
  "networkAccess": {
    "allowedDomains": [
      "generativelanguage.googleapis.com"
    ]
  }
}
```

---

## Vite Configuration

Use a dual-build Vite config: one for the UI (HTML entry) and one for the main thread (library mode, IIFE format).

```typescript
// vite.config.ts pattern
// Build 1: UI bundle → dist/ui.html (inlined JS/CSS)
// Build 2: Main thread → dist/main.js (IIFE, no imports)
```

Key requirements:
- UI HTML must have all JS/CSS inlined (Figma loads a single HTML file)
- Main thread must output a single IIFE file (no ES modules in Figma sandbox)
- Use `vite-plugin-singlefile` for the UI build to inline everything
- Knowledge base JSON files should be imported and bundled into the UI build

---

## Coding Conventions

### TypeScript
- Strict mode enabled
- Explicit return types on exported functions
- Use `interface` for object shapes, `type` for unions
- No `any` unless absolutely necessary (prefer `unknown`)

### Naming
- Components: PascalCase (`MessageBubble.tsx`)
- Hooks: camelCase with `use` prefix (`useSelection.ts`)
- Types/interfaces: PascalCase (`SelectionData`)
- Constants: UPPER_SNAKE_CASE (`MAX_MESSAGES`)
- Message types: kebab-case strings (`'selection-changed'`, `'send-message'`)

### File Organization
- One component per file
- Co-locate component CSS with component
- Types in `types/` directory, re-exported from barrel files
- AI logic isolated in `ai/` directory

### CSS Conventions
- **Follow `UI_STYLE_GUIDE.md` exactly.** Every color, font size, spacing value, border radius, and shadow is specified there.
- All colors must use CSS custom properties (never hardcoded hex in components)
- Dark mode via `@media (prefers-color-scheme: dark)` on `:root`
- Stripe-inspired aesthetic: monochromatic, one accent color, fine borders, micro-shadows
- Keep the UI compact (plugin panels are narrow, typically 300-400px wide)
- No gradients, no pill-shaped buttons, no colored message bubbles, no emoji indicators

---

## Message Protocol (main ↔ UI)

Define all message types in `src/types/messages.ts`:

```typescript
// Main → UI messages
interface SelectionChangedMessage {
  type: 'selection-changed';
  data: SelectionData | null;
}

interface PluginReadyMessage {
  type: 'plugin-ready';
}

// UI → Main messages
interface RequestSelectionMessage {
  type: 'request-selection';
}

type MainToUIMessage = SelectionChangedMessage | PluginReadyMessage;
type UIToMainMessage = RequestSelectionMessage;
```

---

## Selection Data Extraction

When extracting data from a selected Figma node, capture:

```typescript
interface SelectionData {
  id: string;
  name: string;
  type: string;                    // e.g., 'INSTANCE', 'FRAME', 'TEXT'
  componentName?: string;          // If instance, the main component name
  variantProperties?: Record<string, string>;  // If instance with variants
  width: number;
  height: number;
  fills?: Array<{ type: string; color?: { r: number; g: number; b: number }; opacity?: number }>;
  strokes?: Array<{ type: string; color?: { r: number; g: number; b: number } }>;
  // Text-specific
  fontSize?: number;
  fontName?: { family: string; style: string };
  lineHeight?: { value: number; unit: string };
  characters?: string;
  // Layout
  layoutMode?: string;            // 'HORIZONTAL' | 'VERTICAL' | 'NONE'
  itemSpacing?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  // Children summary (1 level deep)
  childrenSummary?: Array<{ name: string; type: string; componentName?: string }>;
}
```

---

## Gemini Flash API Integration

### API Endpoint
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={API_KEY}
```

### Request Format
```json
{
  "contents": [
    { "role": "user", "parts": [{ "text": "..." }] },
    { "role": "model", "parts": [{ "text": "..." }] }
  ],
  "systemInstruction": {
    "parts": [{ "text": "SYSTEM_PROMPT_HERE" }]
  },
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 1024,
    "topP": 0.9
  }
}
```

### System Prompt Construction (`system-prompt.ts`)
The system prompt is built dynamically from three parts:
1. **Persona** (from CHATBOT_PERSONA.md, hardcoded as a string constant)
2. **Knowledge base** (from the JSON files, serialized)
3. **Current selection context** (dynamic, from the latest selection data)

Pattern:
```
[PERSONA BLOCK]
---
[KNOWLEDGE BASE BLOCK]
---
[CURRENT SELECTION CONTEXT]
The user currently has the following element selected in Figma:
{serialized selection data or "No element is currently selected."}
---
[INSTRUCTIONS]
Answer the user's question using the knowledge base above.
If the question relates to the selected element, incorporate that context.
If you don't know the answer, say so. Don't make things up.
Always reference specific component names, token names, and WCAG criteria.
```

### Context Window Management
- Gemini Flash context: ~1M tokens (generous)
- Keep the knowledge base concise but complete
- Send full conversation history up to 20 messages
- If conversation exceeds 20 messages, keep system prompt + last 16 messages

---

## Error Handling

- Wrap all Gemini API calls in try/catch
- Show user-friendly error messages in the chat (not raw errors)
- Handle: network failures, invalid API key, rate limits, malformed responses
- If API key is missing, prompt user to enter it in Settings
- Never crash the plugin; always degrade gracefully

---

## Testing Approach

- Manual testing during development (run in Figma Desktop)
- Test matrix:
  - [ ] Plugin loads without errors
  - [ ] API key entry and storage works
  - [ ] Chat sends and receives messages
  - [ ] Selection detection works (single node)
  - [ ] Selection context appears in chat
  - [ ] Questions about components get accurate answers
  - [ ] Questions about accessibility get accurate answers
  - [ ] Loading state displays correctly
  - [ ] Error states display correctly
  - [ ] Clear chat works
  - [ ] Dark mode displays correctly
  - [ ] No selection still allows general Q&A

---

## Build & Run

```bash
# Install dependencies
npm install

# Development (watch mode)
npm run dev

# Production build
npm run build

# Output: dist/main.js and dist/ui.html
# Import dist/manifest.json in Figma → Plugins → Development → Import plugin from manifest
```

---

## Important Reminders

1. Always read this file and PRD.md before starting any task
2. The plugin has TWO entry points: `src/main.ts` and `src/ui/index.html`
3. Network calls (Gemini API) happen ONLY in the UI iframe
4. Figma API calls happen ONLY in main.ts
5. Communication between the two is ONLY via postMessage
6. The knowledge base is bundled, not fetched at runtime
7. Keep the UI compact and Figma-native in appearance
8. Follow the persona in CHATBOT_PERSONA.md for all AI responses
