# System Sidekick — Claude Code Build Prompts

## How to Use This File

These are sequential prompts to paste into **Claude Code (terminal)** in VSCode. Run them in order. Each prompt builds on the previous one. Wait for each step to complete and verify before moving to the next.

Before starting, make sure:
1. `CLAUDE.md`, `PRD.md`, and `CHATBOT_PERSONA.md` are in your project root
2. You have your Gemini Flash API key ready
3. You have Node.js 18+ installed

---

## PROMPT 1: Project Scaffolding

```
Read CLAUDE.md and PRD.md first.

Scaffold the System Sidekick Figma plugin project with this structure:

1. Initialize npm project with:
   - name: "system-sidekick"
   - private: true

2. Install dependencies:
   - preact (not React, for smaller bundle)
   - typescript
   - vite
   - @preact/preset-vite
   - vite-plugin-singlefile
   
3. Install dev dependencies:
   - @figma/plugin-typings

4. Create tsconfig.json with:
   - strict mode
   - JSX: "react-jsx" with jsxImportSource "preact"
   - target: ES2020
   - module: ESNext
   - paths alias "@/*" → "src/*"

5. Create vite.config.ts with dual build:
   - UI build: src/ui/index.html → dist/ui.html (singlefile, all inlined)
   - Main build: src/main.ts → dist/main.js (IIFE format, no external deps)
   - Add a "build" script that runs both builds sequentially
   - Add a "dev" script that watches and rebuilds on changes

6. Create manifest.json per the spec in CLAUDE.md

7. Create the empty directory structure from the PRD

8. Create placeholder entry files:
   - src/main.ts with: figma.showUI(__html__, { width: 360, height: 580 }); and a console.log
   - src/ui/index.html with a basic HTML shell that loads App.tsx
   - src/ui/App.tsx with a simple "System Sidekick is running" message

9. Create a .gitignore that excludes node_modules, dist, and .env

Verify the build works: npm run build should produce dist/main.js and dist/ui.html without errors.
```

---

## PROMPT 2: Type Definitions

```
Read CLAUDE.md for the type specifications.

Create all TypeScript type definitions:

File: src/types/messages.ts
- Define MainToUIMessage union type with:
  - { type: 'selection-changed', data: SelectionData | null }
  - { type: 'plugin-ready' }
- Define UIToMainMessage union type with:
  - { type: 'request-selection' }
- Export a helper: postToUI(msg: MainToUIMessage) and postToMain(msg: UIToMainMessage)

File: src/types/figma.ts
- Define SelectionData interface matching the spec in CLAUDE.md exactly
- Include all fields: id, name, type, componentName, variantProperties, width, height, fills, strokes, fontSize, fontName, lineHeight, characters, layoutMode, itemSpacing, padding fields, childrenSummary

File: src/types/knowledge.ts
- Define ComponentEntry interface:
  - id, name, description, category
  - variants: Record<string, string[]>
  - properties: Record<string, { type: string, required: boolean, default?: any, description?: string }>
  - tokens: Record<string, string>
  - accessibility: { role?: string, min_touch_target?: string, contrast_ratio?: string, focus_indicator?: string, aria_label?: string, keyboard?: string }
  - usage: { do: string[], dont: string[] }
  - related_components: string[]
- Define AccessibilityRule interface:
  - id, title, wcag_criterion, level ('A' | 'AA' | 'AAA')
  - description, requirement, how_to_check, common_violations: string[]
  - applies_to: string[] (component categories)
- Define TokenEntry interface:
  - name, value, category, description, usage_context

All types should be exported. Create a barrel index.ts in types/ that re-exports everything.
```

---

## PROMPT 3: Main Thread (Selection Detection)

```
Read CLAUDE.md for the two-thread architecture rules.

Implement src/main.ts - the Figma main thread entry point.

Requirements:
1. Show the plugin UI: figma.showUI(__html__, { width: 360, height: 580 })

2. Listen for selection changes using figma.on('selectionchange', callback)

3. When selection changes, extract data from figma.currentPage.selection:
   - If nothing selected: post { type: 'selection-changed', data: null } to UI
   - If one node selected: extract full SelectionData and post to UI
   - If multiple nodes: use the first node only

4. The extraction function should handle these node types:
   - INSTANCE: get componentName from node.mainComponent.name, get variantProperties
   - TEXT: get fontSize, fontName, lineHeight, characters (first 200 chars)
   - FRAME: get layoutMode, itemSpacing, padding
   - All types: get name, type, width, height, fills, strokes
   - For fills/strokes: only extract SOLID type, convert RGB 0-1 to hex string
   - Children summary: map first 10 children to { name, type, componentName }

5. Listen for messages from UI:
   - 'request-selection': trigger the extraction and send current selection

6. On plugin load, immediately send current selection state

7. Wrap all extraction in try/catch. If a property doesn't exist on a node type, skip it gracefully.

IMPORTANT: No fetch, no DOM, no window in this file. Only figma.* API calls.
```

---

## PROMPT 4: Chat UI Components

```
Read CLAUDE.md for architecture rules. Read UI_STYLE_GUIDE.md COMPLETELY before writing any CSS. Every color, font size, spacing value, border, shadow, and radius is specified there. Follow it exactly.

Build the chat interface components using Preact. The UI must match the Stripe-inspired style guide: monochromatic surfaces, one accent color (indigo #635BFF), fine 1px borders, micro-shadows, Inter font, compact density. No gradients, no pill shapes, no colored bubbles.

File: src/ui/styles/global.css
- Implement ALL CSS custom properties from the UI Style Guide (both light and dark mode)
- Include the scrollbar styles, transition tokens, and base typography
- Set up the root layout: full viewport, flex column, bg-primary background

File: src/ui/components/MessageBubble.tsx
Props: { role: 'user' | 'assistant', content: string, timestamp: Date, isLoading?: boolean }
- User messages: right-indented (40px left margin), --msg-user-bg, 1px border, 6px radius
- Assistant messages: full width, --msg-assistant-bg, 1px border + 2px LEFT border in --accent-primary
- Render markdown in assistant messages: **bold** (font-weight 500, not 700), `code` (monospace, 11px, accent-text color, bg-secondary background, 2px radius), bullet lists
- Timestamp: 10px, --text-tertiary, 0.02em tracking, bottom-right
- Loading state: three dots with opacity pulse animation (from style guide)
- Message gap: 2px between same-role, 8px between role changes

File: src/ui/components/InputBar.tsx
Props: { onSend: (message: string) => void, disabled?: boolean }
- Flex row: input (flex 1) + send button (36x36px square)
- Input: 36px height, 1px border, shadow-xs, 4px radius, 12px base font
- Input focus: accent-primary border + shadow-focus ring
- Send button: accent-primary bg, white arrow icon (SVG, stroke-based, 14px)
- Send button disabled: bg-tertiary, text-tertiary, not-allowed cursor
- Container: top border separator, 8px 12px padding

File: src/ui/components/SelectionIndicator.tsx
Props: { selection: SelectionData | null }
- Only renders when selection exists (no empty space when null)
- 28px height, bg-secondary, bottom border-subtle
- "SELECTED" overline: 10px, medium weight, text-tertiary, 0.02em tracking
- Separator dot (·), then component name + type: 11px, medium, text-secondary
- Text overflow: ellipsis, no wrap

File: src/ui/components/LoadingDots.tsx
- Three 4px dots, 4px gap, --text-tertiary color
- Sequential opacity pulse: 0.3 → 1.0 → 0.3, 1.2s duration, 0.2s stagger

File: src/ui/components/EmptyState.tsx
- Centered vertically and horizontally in chat area
- Primary line: "Ask me anything about the Simple Design System." 13px, medium, --text-secondary
- Example line: 'Try: "When should I use Alert vs Toast?"' 12px, regular, --text-tertiary
- Example text should be clickable (triggers a send)
- Text only. No illustrations, no mascots, no icons.

Do NOT connect these to any data yet. Build the visual components with hardcoded example data so we can verify the look. Include at least 3 example messages in a preview state.
```

---

## PROMPT 5: Settings Screen (API Key)

```
Read UI_STYLE_GUIDE.md for visual specs.

Build the settings/onboarding screen for API key entry.

File: src/ui/components/Settings.tsx
Props: { onApiKeySaved: (key: string) => void, currentKey?: string }
- Show a clean form with:
  - Title: "Welcome to System Sidekick" (on first run) or "Settings" (if key exists). Use --font-size-xl, --font-weight-semibold.
  - Brief description: "Enter your Gemini API key to get started". Use --font-size-base, --text-secondary.
  - Link text: "Get a free API key from Google AI Studio" (link to https://aistudio.google.com/apikey). Use --font-size-sm, --text-link.
  - Password-type input: same styling as chat InputBar field (36px, 1px border, shadow-xs, focus ring)
  - Save button: full-width, 36px, --accent-primary bg, --text-inverse, 4px radius. Follow .settings-button spec from style guide.
  - If key already exists, show masked version (first 8 chars + "...") and a "Change Key" / "Clear" option
- On save, call onApiKeySaved with the key

File: src/ui/hooks/useApiKey.ts
- Custom hook that:
  - On mount, sends a message to main thread requesting stored key from figma.clientStorage
  - Provides: { apiKey: string | null, saveApiKey: (key: string) => void, clearApiKey: () => void, isLoading: boolean }

Update src/main.ts to handle:
  - { type: 'get-api-key' } → reads from figma.clientStorage.getAsync('gemini-api-key') and posts back
  - { type: 'save-api-key', key: string } → writes to figma.clientStorage.setAsync('gemini-api-key', key)
  - { type: 'clear-api-key' } → deletes from figma.clientStorage

Update src/types/messages.ts with the new message types.
```

---

## PROMPT 6: Gemini AI Provider

```
Read CLAUDE.md for the Gemini API integration details.

Build the AI provider that calls Gemini Flash.

File: src/ai/gemini-provider.ts
- Export class GeminiProvider with:
  - constructor(apiKey: string)
  - async chat(messages: ChatMessage[], systemPrompt: string): Promise<string>
  
- ChatMessage type: { role: 'user' | 'model', content: string }

- The chat method:
  - Builds a request to: POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={apiKey}
  - Maps messages to Gemini format: { contents: [{ role, parts: [{ text }] }], systemInstruction: { parts: [{ text: systemPrompt }] } }
  - Sets generationConfig: { temperature: 0.7, maxOutputTokens: 1024, topP: 0.9 }
  - Parses response: extracts text from response.candidates[0].content.parts[0].text
  - Handles errors:
    - 401/403: throw "Invalid API key"
    - 429: throw "Rate limited, please wait"
    - 500+: throw "Gemini service error"
    - Network error: throw "No internet connection"
    - No candidates: throw "No response generated"

- Implement retry logic: 1 retry with 2s delay on 429 or 500 errors

File: src/ai/system-prompt.ts
- Export function buildSystemPrompt(selection: SelectionData | null): string
- Import the persona text (hardcode the content of CHATBOT_PERSONA.md as a template literal)
- Import the knowledge base JSON files
- Build the prompt in this order:
  1. Persona block
  2. "## Design System Knowledge Base" + serialized components.json
  3. "## Accessibility Guidelines" + serialized accessibility.json  
  4. "## Token Reference" + serialized tokens.json
  5. "## Current Selection Context" + (serialized selection or "No element currently selected")
  6. "## Response Instructions" with:
     - Answer using the knowledge base. If the answer isn't in the KB, say so.
     - If the user's question relates to the selected element, use that context.
     - Follow the persona's tone and communication style.
     - Reference specific component names, token names, and WCAG criteria.
     - Use severity labels (Error, Warning, Info) when identifying issues.
     - Format responses with markdown (bold for emphasis, backticks for tokens).

Make sure the total system prompt stays under 30,000 tokens for safety margin.
```

---

## PROMPT 7: Wire Everything Together

```
Connect all the components into a working chat flow.

File: src/ui/hooks/useChat.ts
- Custom hook that manages:
  - messages: Array<{ id: string, role: 'user' | 'assistant', content: string, timestamp: Date }>
  - isLoading: boolean
  - error: string | null
  - sendMessage(text: string): void
  - clearChat(): void
- sendMessage should:
  1. Add user message to messages array
  2. Set isLoading = true
  3. Build system prompt using buildSystemPrompt(currentSelection)
  4. Convert messages to Gemini format (map 'assistant' role to 'model')
  5. Call geminiProvider.chat(geminiMessages, systemPrompt)
  6. Add assistant response to messages
  7. Handle errors: add an error message bubble or set error state
  8. Set isLoading = false
- Limit conversation history to last 20 messages when sending to API

File: src/ui/hooks/useSelection.ts
- Custom hook that:
  - Listens for 'selection-changed' messages from main thread
  - Maintains current selection state: SelectionData | null
  - On mount, requests current selection from main thread

Update src/ui/App.tsx:
- Use useApiKey hook: if no key, show Settings screen
- Use useChat hook for chat state
- Use useSelection hook for selection state
- Layout (see "Visual Reference: Complete Layout" in UI_STYLE_GUIDE.md):
  - Header bar: 36px, "◆ System Sidekick" title + gear icon for settings. Follow header spec in style guide.
  - SelectionIndicator below header (if selection exists)
  - Chat messages area (scrollable, flex-grow)
  - EmptyState centered in chat area when no messages
  - InputBar at bottom (fixed)
- Auto-scroll chat to bottom when new messages arrive
- Message gap: 2px between same-role, 8px between role changes

This prompt should produce a fully working chat that:
1. Shows settings on first launch
2. After API key is saved, shows the chat
3. Detects selected Figma layers
4. Sends questions to Gemini with the full system prompt
5. Displays responses with markdown formatting
```

---

## PROMPT 8: Knowledge Base Starter Data

```
Read PRD.md section 8 for the knowledge base schema.

Create starter knowledge base files with real SDS component data. These files will be expanded later using the extraction script, but we need working data now.

File: src/knowledge/components.json
Create entries for these 8 core components (use realistic SDS data):
1. Button - filled/outlined/ghost variants, sizes, states, tokens, a11y, usage
2. IconButton - similar to Button but icon-only, requires aria-label
3. Alert - error/warning/success/info variants, dismissible property, icon requirement
4. Badge - variants (dot, count, label), positioning rules
5. Input Field - states (default, focus, error, disabled), label requirement, helper text
6. Checkbox - checked/unchecked/indeterminate states, label requirement, group usage
7. Select - dropdown behavior, placeholder, disabled, error states
8. Toast - auto-dismiss timing, positioning, severity variants, action button option

For each component, fill ALL fields in the ComponentEntry schema: id, name, description, category, variants, properties, tokens, accessibility, usage (do/dont), related_components.

File: src/knowledge/accessibility.json
Create entries for these WCAG 2.1 AA guidelines:
1. Color Contrast (1.4.3) - 4.5:1 normal text, 3:1 large text
2. Non-text Contrast (1.4.11) - 3:1 for UI components
3. Touch Target Size (2.5.8) - minimum 44x44px
4. Focus Visible (2.4.7) - visible focus indicator required
5. Name, Role, Value (4.1.2) - ARIA requirements
6. Error Identification (3.3.1) - error must be described in text
7. Labels or Instructions (3.3.2) - form inputs need labels
8. Keyboard (2.1.1) - all functionality via keyboard
9. Use of Color (1.4.1) - not sole means of conveying info
10. Reflow (1.4.10) - content reflows at 320px width

For each, fill: id, title, wcag_criterion, level, description, requirement, how_to_check, common_violations, applies_to.

File: src/knowledge/tokens.json
Create entries for:
- 10 key color tokens (primary, secondary, danger, warning, success, background, surface, text primary, text secondary, border)
- 6 spacing tokens (space-100 through space-600 with px values)
- 4 typography tokens (heading-lg, heading-md, body, caption with font specs)
- 4 radius tokens (none, sm, md, lg)

Keep the data accurate to the SDS design system. Reference the Figma community file description and the SDS GitHub repo structure.
```

---

## PROMPT 9: Knowledge Base Extraction Script

```
Create a Node.js script that extracts component data from a cloned SDS repo and generates the knowledge base JSON files.

File: scripts/extract-knowledge.js

The script should:
1. Accept the SDS repo path as a CLI argument: node scripts/extract-knowledge.js /path/to/sds
2. Scan src/ui/primitives/ for component directories
3. For each component directory:
   - Read the main .tsx file to extract:
     - Component name (from export)
     - Props interface (parse TypeScript interface for prop names, types, defaults)
     - Variant enums or union types
   - Read any .css file to extract:
     - CSS custom properties used
     - Class names that indicate variants/states
   - Read the corresponding Code Connect file in src/figma/ to extract:
     - Figma property mappings (figma.enum, figma.string, figma.boolean)
     - Variant names
4. For each component, generate a ComponentEntry with:
   - id: lowercase component name
   - name: PascalCase component name
   - description: from JSDoc comments or component file header
   - category: derived from the directory structure
   - variants: from props interface union types and Code Connect enums
   - properties: from props interface
   - tokens: from CSS custom properties (best effort)
   - accessibility: PLACEHOLDER (to be filled manually)
   - usage: PLACEHOLDER do/dont arrays (to be filled manually)
   - related_components: from imports within the component
5. Write output to src/knowledge/components-extracted.json
6. Print a summary: X components found, Y properties extracted

Include clear console output so the user can see what's being extracted.
Add error handling for missing files or parse failures (skip and warn, don't crash).

This script is a HELPER, not a complete solution. The output will need manual review and enrichment (especially accessibility and usage guidelines). Make that clear in the script's output.
```

---

## PROMPT 10: Polish and Test

```
Review all files in the project for:

1. Build verification:
   - Run npm run build and fix any TypeScript or bundling errors
   - Ensure dist/main.js and dist/ui.html are generated
   - Verify manifest.json points to correct dist paths

2. UI polish (verify against UI_STYLE_GUIDE.md):
   - Verify dark mode works (test with prefers-color-scheme: dark)
   - Verify ALL colors use CSS custom properties (no hardcoded hex in components)
   - Verify no pure black (#000000) or pure white (#FFFFFF) is used anywhere
   - Verify only --accent-primary provides color, everything else is grayscale
   - Verify message bubbles: user has indent, assistant has 2px left accent border
   - Verify font sizes are all in the 10-16px range
   - Verify border-radius is 2-8px everywhere (no pills, no large rounds)
   - Verify scrollbar is 4px thin and subtle
   - Verify focus rings use --shadow-focus
   - Check that the chat scrolls correctly
   - Ensure the selection indicator updates when selection changes
   - Verify the empty state shows centered text, no illustrations
   - Test the settings screen flow

3. Error handling:
   - What happens if the API key is wrong? (should show clear error in chat)
   - What happens if there's no internet? (should show network error)
   - What happens if Gemini returns an empty response? (should handle gracefully)

4. Code quality:
   - Remove any console.log statements except in development
   - Ensure all types are properly used (no implicit any)
   - Verify all imports resolve correctly

5. Add a README.md with:
   - What System Sidekick is (one paragraph)
   - How to install (get API key, import manifest in Figma)
   - How to develop (clone, npm install, npm run dev)
   - How to build (npm run build)
   - Link to PRD for full documentation

Fix any issues you find. The goal is a clean, working V1 that can be loaded into Figma for testing.
```

---

## Post-Build Checklist

After completing all prompts, verify in Figma:

- [ ] Plugin loads without console errors
- [ ] Settings screen appears on first launch
- [ ] API key saves and persists across plugin restarts
- [ ] Chat interface renders correctly
- [ ] Selecting a layer updates the selection indicator
- [ ] Asking "What is a Button?" returns an accurate, persona-aligned response
- [ ] Asking "When should I use Alert vs Toast?" returns a contextual comparison
- [ ] Selecting a text layer and asking "Is this accessible?" uses the selection context
- [ ] Error states display correctly (invalid key, network error)
- [ ] Dark mode looks correct
- [ ] Clear chat resets the conversation
