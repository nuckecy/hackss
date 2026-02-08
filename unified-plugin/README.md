# UX Buddy

A Figma plugin that provides conversational design system and accessibility guidance. Ask questions about the Simple Design System (SDS) components, WCAG accessibility rules, and design tokens — and get contextual answers powered by Gemini Flash, right inside Figma.

## Install

1. Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. In Figma Desktop, go to **Plugins > Development > Import plugin from manifest**
3. Select `uxbuddy/manifest.json` from this repo
4. Run the plugin and enter your API key on first launch

## Develop

```bash
git clone https://github.com/nuckecy/hackss.git
cd hackss/uxbuddy
npm install
npm run dev
```

`npm run dev` watches for file changes and rebuilds automatically.

## Build

```bash
npm run build
```

Outputs `dist/main.js` and `dist/ui.html`. The root `manifest.json` points to these.

## Extract Knowledge Base

To extract component data from a cloned SDS repo:

```bash
git clone https://github.com/figma/sds.git ../sds
node scripts/extract-knowledge.js ../sds
```

Output goes to `src/knowledge/components-extracted.json`. Review and enrich manually before using.

## Architecture

| Layer | Technology |
|-------|-----------|
| Build | Vite + esbuild |
| UI | Preact + TypeScript |
| Styling | Vanilla CSS with custom properties |
| Main thread | TypeScript (Figma Plugin API) |
| AI backend | Gemini Flash (called from UI iframe) |

The plugin has two threads: the **main thread** (`src/main.ts`) accesses the Figma API for selection detection and API key storage, while the **UI iframe** (`src/ui/`) renders the chat interface and calls Gemini directly.

## Documentation

See [PRD.md](PRD.md) for full product requirements and [CLAUDE.md](CLAUDE.md) for architecture details.
