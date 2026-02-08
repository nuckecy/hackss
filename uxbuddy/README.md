# System Sidekick — Document Package

This folder contains everything you need to build System Sidekick using Claude Code in VSCode.

**Start here:** Read `QUICKSTART.md` for the full step-by-step walkthrough.

---

## Files Overview

### Core Documents (V1 + V2)

| File | Purpose | When to Use |
|------|---------|-------------|
| **QUICKSTART.md** | Step-by-step build walkthrough | Follow this from start to finish |
| **CLAUDE.md** | Claude Code project rules (V1 + V2) | Copy to project root. Claude Code reads this automatically. |
| **UI_STYLE_GUIDE.md** | Visual design specifications | Stripe-inspired colors, typography, spacing, component specs. |
| **CHATBOT_PERSONA.md** | AI personality definition | Referenced by CLAUDE.md and embedded in the Gemini system prompt. |
| **GEMINI_SYSTEM_PROMPT.md** | Template for the Gemini system prompt | Reference for how the system prompt is constructed at runtime. |
| **KNOWLEDGE_BASE_SCHEMA.md** | JSON schema for knowledge base files | Reference when building or extending the knowledge base. |
| **extract-knowledge.js** | Node.js extraction script | Run locally against a cloned SDS repo to generate component data. |

### V1 (Q&A Mode)

| File | Purpose |
|------|---------|
| **PRD.md** | V1 product requirements (Q&A mode) |
| **BUILD_PROMPTS.md** | 10 sequential prompts for Claude Code |

### V2 (Scan & Fix Mode)

| File | Purpose |
|------|---------|
| **PRD_V2.md** | V2 product requirements (scan, fix, smart prompts) |
| **BUILD_PROMPTS_V2.md** | 7 sequential prompts for Claude Code (extends V1) |

---

## Getting Started

See **QUICKSTART.md** for the full walkthrough, including workspace setup, build sequence, and testing instructions.

**Quick version:**
1. Create a workspace with the plugin project and SDS repo side by side
2. Copy the doc files into the project root
3. Open Claude Code, paste prompts from BUILD_PROMPTS.md (V1), then BUILD_PROMPTS_V2.md (V2)
4. Test in Figma Desktop

---

## Architecture Summary

```
┌──────────────────────────────────────────┐
│              FIGMA MAIN THREAD           │
│  main.ts                                 │
│  - Detects selection changes             │
│  - Extracts node properties (V1)         │
│  - Deep recursive extraction (V2)        │
│  - Applies fixes to nodes (V2)           │
│  - Manages API key storage               │
│  - Sends data to UI via postMessage      │
└────────────────┬─────────────────────────┘
                 │ postMessage
┌────────────────▼─────────────────────────┐
│              PLUGIN UI (iframe)          │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │  App.tsx                         │    │
│  │  ├─ Settings (API key entry)     │    │
│  │  ├─ SelectionIndicator + Chips   │    │
│  │  ├─ Chat (messages + scan results│    │
│  │  │       + fix buttons)          │    │
│  │  └─ InputBar (text + send)       │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │  Scan Engine (V2)               │    │
│  │  - Local rules (no API)          │    │
│  │  - Token matching                │    │
│  │  - Contrast calculation          │    │
│  │  - Spacing validation            │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │  Gemini Provider                 │    │
│  │  - Builds system prompt from:    │    │
│  │    • Persona (CHATBOT_PERSONA)   │    │
│  │    • Knowledge Base (3 JSONs)    │    │
│  │    • Current selection context   │    │
│  │  - Calls Gemini Flash API        │    │
│  │  - Formats scan results (V2)     │    │
│  └──────────────────────────────────┘    │
└──────────────────────────────────────────┘
```

---

## Scope Summary

### V1 — Q&A Mode
- ✅ Ask questions about SDS components and accessibility
- ✅ Context-aware answers (knows what's selected)
- ✅ Conversational, persona-driven responses

### V2 — Scan & Fix Mode (builds on V1)
- ✅ Button-triggered scan of selected layers
- ✅ Smart prompt chips on selection (contextual suggestions)
- ✅ Design system compliance checks (tokens, spacing, variants, typography)
- ✅ Accessibility checks (contrast, touch targets, text size)
- ✅ One-click fixes for mechanical issues
- ✅ Results in chat (conversational, not a linter panel)

### V3 — Future
- ❌ Custom design system support (user provides their own KB)
- ❌ Multi-selection / page-level scanning
- ❌ Persistent issue tracking
