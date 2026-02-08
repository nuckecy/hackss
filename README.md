# System Sidekick

An AI-powered Figma plugin that provides conversational design system guidance, accessibility auditing, and one-click fixes — all inside Figma.

Built for the [Simple Design System (SDS)](https://github.com/figma/sds). Powered by Gemini Flash, Claude, and OpenAI.

## Features

- **Chat with your design system** — Ask questions about SDS components, tokens, and usage guidelines
- **Scan frames for issues** — Run accessibility and design system compliance checks on any selection
- **One-click fixes** — Apply suggested fixes (spacing, tokens, contrast) directly to your layers
- **Context-aware answers** — The AI sees what you have selected and tailors responses accordingly
- **Multi-provider AI** — Supports Gemini Flash, Claude, and OpenAI as LLM backends
- **Multilingual** — English, Spanish, French, and German

## Repo Structure

```
hackss/
├── uxbuddy/                  # Main plugin (chat + scan + fix)
├── unified-plugin/           # Alternate plugin build
├── system-sidekick-api/      # Express backend (Claude-powered)
└── system-sidekick-plugin/   # Legacy plugin prototype
```

### `uxbuddy/` — Main Plugin

The primary Figma plugin. Includes the chat UI, scan engine, knowledge base, and multi-provider AI integration.

| Layer | Technology |
|-------|-----------|
| Build | Vite + esbuild |
| UI | Preact + TypeScript |
| Styling | Vanilla CSS with custom properties |
| Main thread | TypeScript (Figma Plugin API) |
| AI | Gemini Flash, Claude, OpenAI (called from UI iframe) |

### `system-sidekick-api/` — Backend API

An Express server that wraps the Anthropic Claude API for component recommendation. Used in development with the legacy plugin.

### `system-sidekick-plugin/` — Legacy Plugin

The original prototype built with `@create-figma-plugin`. Superseded by `uxbuddy/`.

## Quick Start

### 1. Install dependencies

```bash
cd uxbuddy
npm install
```

### 2. Get an API key

Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).

### 3. Build and run

```bash
npm run dev
```

This watches for changes and rebuilds automatically.

### 4. Load in Figma

1. Open Figma Desktop
2. Go to **Plugins → Development → Import plugin from manifest**
3. Select `uxbuddy/manifest.json`
4. Run the plugin and enter your API key on first launch

## Build

```bash
cd uxbuddy
npm run build
```

Outputs `dist/main.js` and `dist/ui.html`.

## Extract Knowledge Base

To regenerate component data from a cloned SDS repo:

```bash
git clone https://github.com/figma/sds.git ../sds
node scripts/extract-knowledge.js ../sds
```

Output goes to `src/knowledge/components-extracted.json`.

## Architecture

The plugin runs on Figma's two-thread model:

- **Main thread** (`src/main.ts`) — Accesses the Figma Plugin API for selection detection, node inspection, applying fixes, and API key storage.
- **UI iframe** (`src/ui/`) — Renders the chat interface, runs the scan engine, and calls LLM APIs directly.

Communication between threads happens via `postMessage`.

```
┌─────────────────────────────────────┐
│          FIGMA MAIN THREAD          │
│  Selection detection · Node edits   │
│  API key storage · Fix application  │
└──────────────┬──────────────────────┘
               │ postMessage
┌──────────────▼──────────────────────┐
│           PLUGIN UI (iframe)        │
│                                     │
│  Chat UI · Scan Engine · LLM calls  │
│  Knowledge base · i18n              │
└─────────────────────────────────────┘
```

## Documentation

| File | Description |
|------|-------------|
| `PRD.md` | V1 product requirements (Q&A mode) |
| `PRD_V2.md` | V2 product requirements (scan + fix) |
| `BUILD_PROMPTS.md` | V1 build prompts for Claude Code |
| `BUILD_PROMPTS_V2.md` | V2 build prompts for Claude Code |
| `CHATBOT_PERSONA.md` | AI personality and tone definition |
| `UI_STYLE_GUIDE.md` | Visual design specifications |
| `KNOWLEDGE_BASE_SCHEMA.md` | JSON schema for the knowledge base |
| `CLAUDE.md` | Project rules for Claude Code |

## License

Private project.
