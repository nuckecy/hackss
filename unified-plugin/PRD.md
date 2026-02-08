# UX Buddy — Product Requirements Document (V1)

## Document Info

| Field | Value |
|-------|-------|
| **Product Name** | UX Buddy |
| **Version** | 1.0 (Q&A Mode) |
| **Author** | Otobong Okoko |
| **Date** | February 2026 |
| **Status** | Draft |

---

## 1. Overview

UX Buddy is a Figma plugin that provides contextual, conversational design system and accessibility guidance directly inside the designer's workflow. Unlike linters that passively flag violations, UX Buddy acts as a knowledgeable colleague who explains the "why" behind every recommendation.

V1 focuses exclusively on the **Q&A mode**: designers can ask questions about the Simple Design System (SDS) and WCAG accessibility guidelines, and receive contextual, actionable answers without leaving Figma.

---

## 2. Problem Statement

Designers working with the Simple Design System face several recurring pain points:

- Design system documentation is scattered across Figma files, Storybook, and GitHub
- Junior and mid-level designers are uncertain about correct component usage, variant selection, and token application
- Accessibility requirements (WCAG 2.1 AA) are often forgotten or misunderstood
- Context-switching between Figma and documentation breaks creative flow
- Fear of getting it wrong leads to handoff delays and revision cycles

---

## 3. Target User

**Primary persona:** Junior to mid-level product designers who are familiar with Figma basics, actively using or learning a design system, and may not know all accessibility requirements.

**Key behaviors:**
- Prefers quick answers over reading long docs
- Visual learner
- Wants to understand "why," not just "what"
- Time-pressured, needs guidance without context-switching
- Slightly uncertain ("Am I using the right component?")

---

## 4. V1 Scope: Q&A Mode

### 4.1 In Scope

- Chat-based Q&A interface inside a Figma plugin panel
- Questions about SDS components: usage, variants, properties, tokens, dos/don'ts
- Questions about WCAG 2.1 AA accessibility guidelines as they relate to UI components
- Context-aware responses (the plugin knows what layer/component is selected in Figma)
- Selection detection: when a user selects a layer, the plugin reads its properties and makes them available as context for questions
- Conversational memory within a single session (multi-turn)
- Persona-driven responses (friendly colleague tone, not a linter)

### 4.2 Out of Scope (V2+)

- Automated scanning/analysis of selections against the knowledge base
- "Fix it for me" functionality (duplicating and correcting layers)
- Multi-file scanning
- Code generation or developer handoff
- Custom design system support (V1 is SDS-only)
- Persistent memory across plugin sessions

---

## 5. Functional Requirements

### FR-01: Plugin Shell
- Plugin launches in a side panel within Figma
- Displays the UX Buddy branding and a chat interface
- Provides an API key input screen on first launch (stored in `figma.clientStorage`)

### FR-02: Chat Interface
- Text input field with send button at the bottom
- Message bubbles: user messages (right-aligned), assistant messages (left-aligned)
- Loading indicator while waiting for AI response
- Auto-scroll to latest message
- Markdown rendering in assistant messages (bold, lists, code tokens)
- Clear chat / new conversation button

### FR-03: Selection Awareness
- Plugin detects `selectionchange` events on the Figma canvas
- Extracts properties from the selected node(s):
  - Node type (FRAME, INSTANCE, TEXT, RECTANGLE, etc.)
  - Node name
  - Component name (if instance)
  - Variant properties (if component instance)
  - Dimensions (width, height)
  - Auto-layout properties (if applicable)
  - Fill colors (hex values)
  - Text properties (font family, size, weight, line height) if TEXT node
  - Children count and types (1 level deep)
- Sends extracted context to the UI thread via `postMessage`
- Displays a compact "Currently selected: [node name]" indicator in the chat UI
- If nothing is selected, the plugin still works for general Q&A (selection context is optional)

### FR-04: AI-Powered Responses
- User's question + selection context + knowledge base are sent to Gemini Flash API
- System prompt embeds: the persona definition, the full knowledge base, and the current selection context
- Responses follow the persona's communication guidelines (summary first, step-by-step, examples, severity levels)
- Multi-turn conversation supported (message history sent with each request)
- Token management: trim older messages if conversation exceeds context limit

### FR-05: Knowledge Base
- Bundled as a JSON file within the plugin
- Contains:
  - Component specifications (name, description, variants, properties, tokens, usage guidelines, dos/don'ts)
  - WCAG 2.1 AA guidelines relevant to UI components (contrast, touch targets, focus, ARIA, semantic structure)
  - Token reference (color tokens, spacing scale, typography scale)
- Injected into the Gemini system prompt on each request

### FR-06: Settings
- API key management (enter, update, clear Gemini API key)
- Stored securely in `figma.clientStorage`

---

## 6. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Response time | < 3 seconds for typical Q&A |
| Plugin load time | < 2 seconds |
| Min Figma version | Figma Desktop + Web (Plugin API v1) |
| Offline behavior | Graceful error message (requires internet for Gemini API) |
| Accessibility | Plugin UI itself should be keyboard-navigable |

---

## 7. Technical Architecture

### 7.1 Plugin Structure

```
ux-buddy/
├── manifest.json              # Figma plugin manifest
├── CLAUDE.md                  # Claude Code project rules
├── package.json
├── tsconfig.json
├── vite.config.ts             # Build config (Vite)
├── src/
│   ├── main.ts                # Figma main thread (sandbox)
│   ├── ui/
│   │   ├── index.html         # Plugin UI entry
│   │   ├── App.tsx            # Root component
│   │   ├── components/
│   │   │   ├── Chat.tsx       # Chat container
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── SelectionIndicator.tsx
│   │   │   ├── InputBar.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── LoadingDots.tsx
│   │   ├── styles/
│   │   │   └── global.css
│   │   └── hooks/
│   │       ├── useSelection.ts
│   │       └── useChat.ts
│   ├── ai/
│   │   ├── gemini-provider.ts  # Gemini Flash API integration
│   │   └── system-prompt.ts    # System prompt builder
│   ├── knowledge/
│   │   ├── components.json     # Component knowledge base
│   │   ├── accessibility.json  # WCAG guidelines
│   │   └── tokens.json         # Token reference
│   └── types/
│       ├── figma.ts            # Figma node types
│       ├── messages.ts         # postMessage types
│       └── knowledge.ts        # Knowledge base types
└── scripts/
    └── extract-knowledge.js    # Script to extract KB from SDS repo
```

### 7.2 Communication Flow

```
[Figma Canvas] → selectionchange
       ↓
[main.ts] → extracts node properties
       ↓ postMessage({ type: 'selection', data: {...} })
[UI iframe]
       ↓
[Chat.tsx] → user types question
       ↓
[gemini-provider.ts] → builds request:
  - System prompt (persona + knowledge base + selection context)
  - Conversation history
  - User's latest message
       ↓ fetch() to Gemini API
[Gemini Flash] → returns response
       ↓
[Chat.tsx] → renders assistant message
```

### 7.3 Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Build tool | Vite | Fast, modern, good TypeScript support |
| UI framework | React (Preact) | Lightweight, familiar, good for chat UIs |
| AI provider | Gemini Flash | User's existing API key, fast, cost-effective |
| Knowledge base format | JSON (bundled) | No external dependencies, instant access, versioned with plugin |
| Styling | CSS Modules or vanilla CSS | Keep it simple for V1, match Figma plugin aesthetic |
| Package manager | npm | Standard, works well with Claude Code |

---

## 8. Knowledge Base Schema

See `scripts/extract-knowledge.js` for the extraction script.

### Component Entry Structure
```json
{
  "id": "button",
  "name": "Button",
  "description": "Primary action trigger...",
  "category": "buttons",
  "variants": {
    "style": ["filled", "outlined", "ghost"],
    "size": ["small", "medium", "large"],
    "state": ["default", "hover", "active", "disabled", "focus"]
  },
  "properties": {
    "label": { "type": "string", "required": true },
    "icon": { "type": "instance_swap", "required": false },
    "disabled": { "type": "boolean", "default": false }
  },
  "tokens": {
    "background": "interactive.primary.default",
    "text": "text.on-color",
    "border-radius": "radius.md",
    "padding": "space.300 space.400",
    "min-height": "44px"
  },
  "accessibility": {
    "role": "button",
    "min_touch_target": "44x44px",
    "contrast_ratio": "4.5:1 for text",
    "focus_indicator": "Required, 2px outline",
    "aria_label": "Required if icon-only"
  },
  "usage": {
    "do": [
      "Use for primary actions",
      "Use filled variant for the most important CTA",
      "Limit to one primary button per view"
    ],
    "dont": [
      "Don't use for navigation (use Link instead)",
      "Don't disable without explaining why",
      "Don't use more than one filled button in a group"
    ]
  },
  "related_components": ["IconButton", "ButtonGroup", "ButtonDanger"]
}
```

---

## 9. Success Metrics (V1)

| Metric | Target |
|--------|--------|
| Plugin installs | Track adoption |
| Questions per session | Average 3+ indicates utility |
| Response accuracy | Manual review of first 50 conversations |
| Session duration | 2+ minutes indicates engagement |
| Return usage | Users open plugin in multiple sessions |

---

## 10. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gemini API latency | Poor UX, breaks flow | Loading indicators, optimistic UI, keep prompts concise |
| Knowledge base gaps | Incorrect/incomplete answers | Start with core components, iterate based on feedback |
| Context window limits | Conversation gets truncated | Implement sliding window for history, always prioritize system prompt + KB |
| Gemini hallucinations | Wrong component recommendations | Ground responses in KB, instruct model to say "I don't know" when unsure |
| API key security | Key exposure | Store in figma.clientStorage (encrypted per-user), never log or transmit to third parties |

---

## 11. Future Roadmap

| Version | Feature |
|---------|---------|
| V1.0 | Q&A mode (this PRD) |
| V1.1 | Improved knowledge base (more components, richer examples) |
| V2.0 | Scan & Analyze mode (select → identify issues) |
| V2.1 | Fix mode (duplicate selection → apply corrections) |
| V3.0 | Custom design system support (user provides their own KB) |
