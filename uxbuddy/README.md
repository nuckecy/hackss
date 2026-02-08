# System Sidekick — UX Buddy Plugin

The main Figma plugin for System Sidekick. Provides conversational design system guidance, frame scanning, and one-click fixes for the Simple Design System (SDS).

## Features

- **Q&A Mode** — Ask about SDS components, tokens, accessibility rules, and get contextual answers
- **Scan Mode** — Run design system and accessibility compliance checks on selected frames
- **One-Click Fixes** — Apply spacing, token, and contrast fixes directly to your layers
- **Multi-Provider AI** — Gemini Flash, Claude, and OpenAI backends
- **Multilingual** — English, Spanish, French, German
- **Context-Aware** — Responses consider what you currently have selected in Figma

## Quick Start

```bash
npm install
npm run dev
```

Then in Figma Desktop: **Plugins → Development → Import plugin from manifest** → select `manifest.json`.

Enter your API key on first launch. Get a free Gemini key from [Google AI Studio](https://aistudio.google.com/apikey).

## Build

```bash
npm run build
```

Outputs `dist/main.js` and `dist/ui.html`.

## Architecture

| Layer | Technology |
|-------|-----------|
| Build | Vite + esbuild |
| UI | Preact + TypeScript |
| Styling | Vanilla CSS with custom properties |
| Main thread | TypeScript (Figma Plugin API) |
| AI | Gemini Flash, Claude, OpenAI |

### Two-Thread Model

- **Main thread** (`src/main.ts`) — Figma API access: selection detection, node extraction, fix application, API key storage
- **UI iframe** (`src/ui/`) — Chat interface, scan engine, LLM API calls, knowledge base

### Project Structure

```
src/
├── main.ts                # Figma main thread entry
├── ai/                    # LLM providers and system prompt
├── fix/                   # Fix registry for one-click fixes
├── i18n/                  # Internationalization (en, es, fr, de)
├── knowledge/             # Bundled SDS knowledge base (JSON)
├── placement/             # Component placement and mapping
├── scan/                  # Scan engine, rules, and checks
├── types/                 # TypeScript type definitions
└── ui/                    # Preact UI (components, hooks, styles)
```

## Extract Knowledge Base

```bash
git clone https://github.com/figma/sds.git ../sds
node scripts/extract-knowledge.js ../sds
```

Output goes to `src/knowledge/components-extracted.json`.

## Documentation

See [PRD.md](PRD.md) and [PRD_V2.md](PRD_V2.md) for product requirements. See [CLAUDE.md](CLAUDE.md) for architecture details and coding conventions.
