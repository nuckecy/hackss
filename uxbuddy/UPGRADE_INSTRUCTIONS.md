# Upgrading to V2

When V1 is stable and you're ready to add Scan & Fix mode, follow these steps.

---

## What's in this folder

| File | Action | What it contains |
|------|--------|-----------------|
| `CLAUDE.md` | **Replace** your V1 version | All V1 rules + V2 architecture, thread boundaries, file structure |
| `README.md` | **Replace** your V1 version | All V1 info + V2 files overview, updated architecture diagram |
| `QUICKSTART.md` | **Replace** your V1 version | All V1 steps + V2 build sequence, testing, timeline |
| `PRD_V2.md` | **Add** to project root | V2 product requirements (scan, fix, smart prompts) |
| `BUILD_PROMPTS_V2.md` | **Add** to project root | 7 prompts to paste into Claude Code after V1 is done |

---

## Steps

1. Confirm V1 works (all checks from BUILD_PROMPTS.md Prompt 10 pass)

2. Replace these 3 files in your project root:
   - `CLAUDE.md` (replace with the one from this folder)
   - `README.md` (replace with the one from this folder)
   - `QUICKSTART.md` (replace with the one from this folder)

3. Add these 2 new files to your project root:
   - `PRD_V2.md`
   - `BUILD_PROMPTS_V2.md`

4. Open Claude Code and start with Prompt V2-1 from `BUILD_PROMPTS_V2.md`

That's it. Claude Code will read the updated `CLAUDE.md` automatically and understand the V2 architecture.
