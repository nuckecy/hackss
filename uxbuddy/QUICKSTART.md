# UX Buddy — Quickstart Guide

A step-by-step walkthrough for building UX Buddy V1 using Claude Code in VSCode. Follow this document from top to bottom.

---

## Prerequisites

Before you start, make sure you have:

- [ ] **Node.js 18+** installed (`node --version` to check)
- [ ] **VSCode** with Claude Code extension installed
- [ ] **Figma Desktop** (plugins can only be tested in the desktop app)
- [ ] **Gemini API key** from [Google AI Studio](https://aistudio.google.com/apikey) (free tier works)
- [ ] **Git** installed

---

## Phase 1: Set Up Your Workspace (15 minutes)

### Step 1.1: Create the workspace folder

Open your terminal (not Claude Code yet) and run:

```bash
mkdir ux-buddy-workspace
cd ux-buddy-workspace
```

### Step 1.2: Create the plugin project inside the workspace

```bash
mkdir ux-buddy
cd ux-buddy
git init
```

### Step 1.3: Add the document files

Copy all the downloaded files into the `ux-buddy/` project root. Your folder should look like this:

```
ux-buddy/
├── CLAUDE.md                  ← Claude Code reads this automatically
├── PRD.md                     ← Product requirements
├── CHATBOT_PERSONA.md         ← AI persona for Gemini
├── UI_STYLE_GUIDE.md          ← Visual design specs
├── BUILD_PROMPTS.md           ← The prompts you'll paste into Claude Code
├── GEMINI_SYSTEM_PROMPT.md    ← Reference for how the AI prompt is built
├── KNOWLEDGE_BASE_SCHEMA.md   ← JSON schema reference
└── scripts/
    └── extract-knowledge.js   ← Run this later against the SDS repo
```

Create the scripts folder and move the extraction script:

```bash
mkdir scripts
mv extract-knowledge.js scripts/
```

### Step 1.4: Clone the SDS repo into the workspace

```bash
cd ..
git clone https://github.com/figma/sds.git
```

### Step 1.5: Create the VSCode workspace file

Still in the `ux-buddy-workspace/` root, create a workspace file:

```bash
cat > ux-buddy.code-workspace << 'EOF'
{
  "folders": [
    {
      "name": "UX Buddy (plugin)",
      "path": "ux-buddy"
    },
    {
      "name": "Simple Design System (reference)",
      "path": "sds"
    }
  ],
  "settings": {
    "files.exclude": {
      "**/node_modules": true,
      "**/dist": false
    }
  }
}
EOF
```

### Step 1.6: Open the workspace in VSCode

```bash
code ux-buddy.code-workspace
```

Your final workspace structure:

```
ux-buddy-workspace/
├── ux-buddy.code-workspace    ← Open this in VSCode
├── ux-buddy/                  ← Plugin project (Claude Code runs here)
│   ├── CLAUDE.md
│   ├── PRD.md
│   ├── UI_STYLE_GUIDE.md
│   ├── CHATBOT_PERSONA.md
│   ├── BUILD_PROMPTS.md
│   ├── GEMINI_SYSTEM_PROMPT.md
│   ├── KNOWLEDGE_BASE_SCHEMA.md
│   └── scripts/
│       └── extract-knowledge.js
└── sds/                       ← SDS repo (read-only reference)
    ├── src/
    │   ├── ui/primitives/     ← Component source code
    │   └── figma/             ← Code Connect files
    └── ...
```

**Why a workspace?** It keeps the SDS source visible in your file explorer for quick reference, while Claude Code operates in the `ux-buddy/` folder with its own `CLAUDE.md` context. The extraction script references SDS via relative path (`../sds`).

---

## Phase 2: Build with Claude Code

### How the prompts work

Open `BUILD_PROMPTS.md` in VSCode so you can see it alongside your terminal. The file contains **10 numbered prompts**. Here's the workflow:

1. **Open the workspace** via `ux-buddy.code-workspace` if not already open
2. **Open Claude Code** in your VSCode terminal, making sure it's running in the `ux-buddy/` folder (not the workspace root or `sds/`). Check with `pwd`.
3. **Copy a prompt** from BUILD_PROMPTS.md
4. **Paste it** into Claude Code
5. **Wait** for Claude Code to finish generating files
6. **Verify** the output (each prompt tells you what to check)
7. **Fix** any issues by telling Claude Code what went wrong
8. **Move to the next prompt**

### Important: Claude Code reads CLAUDE.md automatically

When Claude Code runs in the `ux-buddy/` folder, it automatically reads `CLAUDE.md` and understands the project structure, architecture rules, and conventions. You don't need to explain the project from scratch in each prompt. The SDS repo is available next door at `../sds/` for the extraction script.

---

### Step 2.1: Run Prompt 1 (Scaffolding)

Open Claude Code and paste **Prompt 1** from BUILD_PROMPTS.md.

**What it does:** Creates the project skeleton: package.json, Vite config, TypeScript config, manifest.json, directory structure, and placeholder entry files.

**What to verify:**
```bash
npm run build
```
This should produce `dist/main.js` and `dist/ui.html` without errors. If it fails, tell Claude Code the error and let it fix it.

**Expected result:** A buildable but empty plugin shell.

---

### Step 2.2: Run Prompt 2 (Type Definitions)

Paste **Prompt 2** into Claude Code.

**What it does:** Creates all TypeScript interfaces for messages, selection data, and knowledge base entries.

**What to verify:** No red squiggles in VSCode for the type files. Run `npm run build` to confirm types compile.

**Expected result:** `src/types/` directory with 3 files + barrel export.

---

### Step 2.3: Run Prompt 3 (Main Thread)

Paste **Prompt 3** into Claude Code.

**What it does:** Implements `src/main.ts` with selection detection, node property extraction, and postMessage communication.

**What to verify:** Build succeeds. You can't fully test selection detection until the plugin is loaded in Figma (that comes later).

**Expected result:** A main.ts that listens for selection changes and extracts node data.

---

### Step 2.4: Run Prompt 4 (Chat UI)

Paste **Prompt 4** into Claude Code. This is the big visual prompt.

**What it does:** Builds all UI components (MessageBubble, InputBar, SelectionIndicator, LoadingDots, EmptyState) with full CSS following the style guide.

**What to verify:**
1. Build succeeds
2. Load the plugin in Figma (see "How to Load in Figma" below) and check:
   - Does it look like the style guide's visual reference?
   - Are colors monochromatic with indigo accent?
   - Do assistant messages have the 2px left border?
   - Is the font compact (12px body)?
   - Does dark mode work? (toggle your Figma theme)

**If the UI looks wrong:** Tell Claude Code specifically what's off. Reference the style guide: "The assistant message bubble should have a 2px left border in --accent-primary per UI_STYLE_GUIDE.md, but it's missing."

**Expected result:** A visually complete (but non-functional) chat interface.

---

### Step 2.5: Run Prompt 5 (Settings)

Paste **Prompt 5** into Claude Code.

**What it does:** Builds the API key entry screen and the storage mechanism using figma.clientStorage.

**What to verify:** Load the plugin in Figma.
- First launch should show the "Welcome to UX Buddy" screen
- Enter a test string and click Save
- Close and reopen the plugin; it should go straight to the chat

**Expected result:** Working settings flow with persistent API key storage.

---

### Step 2.6: Run Prompt 6 (Gemini Provider)

Paste **Prompt 6** into Claude Code.

**What it does:** Creates the Gemini Flash API integration and the system prompt builder that combines persona + knowledge base + selection context.

**What to verify:** Build succeeds. The actual API integration will be tested in the next step when everything is wired together.

**Expected result:** `src/ai/` directory with gemini-provider.ts and system-prompt.ts.

---

### Step 2.7: Run Prompt 7 (Wire Everything)

Paste **Prompt 7** into Claude Code. This is the integration prompt.

**What it does:** Connects all components into a working chat flow: hooks for chat state and selection, App.tsx layout, Gemini API calls.

**What to verify:** Load the plugin in Figma with your real Gemini API key.
- [ ] Plugin loads without errors
- [ ] Settings screen works
- [ ] Chat interface appears after API key is saved
- [ ] You can type and send a message
- [ ] Gemini responds (may take 1-3 seconds)
- [ ] Selection indicator updates when you click different layers
- [ ] Ask: "What is a Button?" and get a response
- [ ] If you get an error, check the console (Plugins → Development → Open Console)

**If the API call fails:** Common issues:
- Wrong API key → you'll see a 401 error
- Missing networkAccess in manifest.json → add `generativelanguage.googleapis.com` to allowed domains
- CORS issues → shouldn't happen with Figma plugins, but check console

**Expected result:** A fully working Q&A chat, but with a minimal knowledge base.

---

### Step 2.8: Run Prompt 8 (Knowledge Base Data)

Paste **Prompt 8** into Claude Code.

**What it does:** Creates hand-crafted knowledge base JSON files for 8 core components, 10 WCAG rules, and design tokens.

**What to verify:**
- JSON files are valid (no syntax errors)
- Rebuild and test: ask "When should I use Alert vs Toast?" and check if the response uses knowledge base data
- Ask "What are the accessibility requirements for a Button?" and verify specific WCAG criteria are mentioned

**Expected result:** Rich, accurate responses grounded in the knowledge base.

---

### Step 2.9: Run Prompt 9 (Extraction Script)

Paste **Prompt 9** into Claude Code.

**What it does:** Creates/updates the extraction script for pulling component data from the SDS repo.

**What to verify:** Run the script:
```bash
node scripts/extract-knowledge.js ../sds
```
You should see a summary of extracted components. Review `src/knowledge/components-extracted.json` and merge any useful data into `components.json`.

**Expected result:** Additional component data to enrich your knowledge base over time.

---

### Step 2.10: Run Prompt 10 (Polish)

Paste **Prompt 10** into Claude Code.

**What it does:** Reviews all code for build issues, UI polish (against the style guide), error handling, code quality, and creates a README.

**What to verify:** Full test checklist (at the bottom of BUILD_PROMPTS.md):
- [ ] Plugin loads without console errors
- [ ] API key entry and storage works
- [ ] Chat sends and receives messages
- [ ] Selection detection works
- [ ] Selection context appears in responses
- [ ] Component questions get accurate answers
- [ ] Accessibility questions get accurate answers
- [ ] Error states display correctly
- [ ] Dark mode looks correct
- [ ] Clear chat works
- [ ] Empty state shows correctly

**Expected result:** A polished, shippable V1.

---

## How to Load the Plugin in Figma

You'll do this multiple times during development:

1. Run `npm run build` in your terminal
2. Open **Figma Desktop**
3. Go to **Plugins** → **Development** → **Import plugin from manifest...**
4. Navigate to your `ux-buddy/dist/` folder and select `manifest.json`
5. The plugin appears in your Development plugins list
6. Run it: **Plugins** → **Development** → **UX Buddy**

**To reload after code changes:**
1. Run `npm run build` again
2. In Figma, close the plugin panel
3. Re-run: **Plugins** → **Development** → **UX Buddy**

**To see console logs and errors:**
- **Plugins** → **Development** → **Open Console**

---

## How to Fix Issues

When something goes wrong, here's the pattern:

### Build errors
```
Tell Claude Code: "I'm getting this build error: [paste the error]. Fix it."
```

### UI looks wrong
```
Tell Claude Code: "The [component] doesn't match UI_STYLE_GUIDE.md. 
Specifically, [describe what's wrong]. Read the style guide and fix it."
```

### Gemini API errors
```
Tell Claude Code: "The Gemini API call is returning [error]. 
Check src/ai/gemini-provider.ts. Here's the console output: [paste it]."
```

### Selection not working
```
Tell Claude Code: "Selection detection isn't working. When I select a 
layer in Figma, the selection indicator doesn't update. Check main.ts 
and the postMessage flow."
```

### Bad AI responses
```
Tell Claude Code: "The AI responses aren't using the knowledge base. 
When I ask about Buttons, it gives generic answers instead of referencing 
SDS component data. Check the system prompt builder in src/ai/system-prompt.ts."
```

---

## File Reference: What Each Document Does

| File | Who reads it | Purpose |
|------|-------------|---------|
| `CLAUDE.md` | Claude Code (automatically) | Project rules, architecture, conventions (V1 + V2). Claude Code uses this to understand how to write code for this project. |
| `PRD.md` | Claude Code (when prompted) | V1 product spec. Referenced by prompts that need context about Q&A requirements. |
| `PRD_V2.md` | Claude Code (when prompted) | V2 product spec. Scan, fix, and smart prompt requirements. |
| `UI_STYLE_GUIDE.md` | Claude Code (when prompted) | Every visual detail. Prompt 4 tells Claude Code to read this before writing CSS. |
| `CHATBOT_PERSONA.md` | Claude Code + Gemini (at runtime) | Defines the AI's personality. Gets embedded into the Gemini system prompt. |
| `BUILD_PROMPTS.md` | You (copy/paste into Claude Code) | The 10 V1 prompts you feed to Claude Code sequentially. |
| `BUILD_PROMPTS_V2.md` | You (copy/paste into Claude Code) | The 7 V2 prompts, run after V1 is complete. |
| `GEMINI_SYSTEM_PROMPT.md` | Claude Code (when building the AI layer) | Template showing how persona + KB + selection combine. |
| `KNOWLEDGE_BASE_SCHEMA.md` | Claude Code (when building KB) | JSON field definitions for the knowledge base files. |
| `extract-knowledge.js` | You (run manually) | Pulls component data from the SDS repo. |

---

## Timeline Estimate

| Phase | Prompts | Estimated Time |
|-------|---------|---------------|
| Workspace setup | Steps 1.1 - 1.6 | 15 minutes |
| Scaffolding + Types | Prompts 1-2 | 20 minutes |
| Core functionality | Prompts 3-7 | 1.5 - 2 hours |
| Knowledge base | Prompts 8-9 | 30 minutes |
| Polish | Prompt 10 | 30 minutes |
| **Total** | | **~3-4 hours** |

Most of the time will be spent on Prompts 4 (UI) and 7 (integration), as those are the most complex and most likely to need iteration.

---

## What Comes Next: Building V2

Once V1 is stable and tested, V2 adds scan, fix, and smart prompt capabilities. Here's how to build it.

### V2 Prerequisites

Before starting V2, confirm:
- [ ] V1 passes all verification checks from BUILD_PROMPTS.md Prompt 10
- [ ] Q&A mode works reliably with accurate responses
- [ ] Selection detection works for all node types
- [ ] No console errors in normal usage

### V2 Files to Add

Copy these new files into your project root alongside the V1 docs:

```
ux-buddy/
├── PRD_V2.md              ← V2 product requirements (new)
├── BUILD_PROMPTS_V2.md    ← V2 prompts for Claude Code (new)
├── CLAUDE.md              ← Already updated with V2 architecture section
└── ... (all V1 files remain)
```

### V2 Build Sequence

Same workflow as V1: paste prompts from BUILD_PROMPTS_V2.md into Claude Code, one at a time.

| Prompt | What It Builds | Estimated Time |
|--------|---------------|---------------|
| V2-1 | Extended types + deep selection extraction | 20 minutes |
| V2-2 | Scan rules engine (local, no AI) | 30 minutes |
| V2-3 | Fix handler (main thread) | 20 minutes |
| V2-4 | Scan UI integration (chat, buttons, chips) | 45 minutes |
| V2-5 | Scan result formatting (Gemini prompts) | 20 minutes |
| V2-6 | Knowledge base scan rule data | 20 minutes |
| V2-7 | Polish and edge cases | 30 minutes |
| **Total** | | **~3 hours** |

### V2 Testing

After each prompt, test in Figma. The key verification moments:

**After V2-2 (scan engine):** You can test scan rules in isolation by logging results. No UI yet.

**After V2-4 (UI integration):** This is the big one. Select a component, click "Scan", and verify:
- Results appear conversationally in chat
- Fix buttons show for fixable issues
- Clicking "Fix this" modifies the layer
- Re-scanning shows the issue resolved

**After V2-7 (polish):** Run the full V2 verification checklist at the bottom of BUILD_PROMPTS_V2.md.

### V2 Architecture Summary

V2 uses a hybrid approach: local rules + AI formatting.

```
Selection → Deep Extraction (main thread)
         → Rule Evaluation (UI thread, local, fast)
         → Gemini Formatting (UI thread, API call)
         → Chat Display with Fix Buttons
         → Fix Application (main thread)
```

The scan rules are deterministic (no hallucination risk). Gemini only formats the results into conversational prose matching the persona. This keeps scans fast, accurate, and consistent.
