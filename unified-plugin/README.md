# System Sidekick — Unified Plugin

An alternate build of the System Sidekick Figma plugin with a unified architecture.

## Quick Start

```bash
npm install
npm run dev
```

Then in Figma Desktop: **Plugins → Development → Import plugin from manifest** → select `manifest.json`.

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

See the [root README](../README.md) for full project documentation.
