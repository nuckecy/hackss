# UX Buddy — Product Requirements Document (V2)

## Document Info

| Field | Value |
|-------|-------|
| **Product Name** | UX Buddy |
| **Version** | 2.0 (Scan & Fix Mode) |
| **Author** | Otobong Okoko |
| **Date** | February 2026 |
| **Status** | Draft |
| **Prerequisite** | V1.0 must be fully functional before starting V2 |

---

## 1. Overview

V2 evolves UX Buddy from a reactive Q&A tool into a proactive design review companion. The plugin now scans selected layers against the design system and accessibility rules, surfaces issues conversationally in the chat, and offers one-click fixes for mechanical violations.

**The core interaction shifts from:**
V1: Designer asks → AI answers
V2: Designer selects → AI observes and prompts → Designer scans → AI reviews → Designer fixes

**Key principle:** V2 keeps the chat-first, conversational paradigm. Scan results appear as colleague-style reviews in the chat thread, not as a separate linter panel. The plugin still feels like talking to a knowledgeable teammate, not running an audit tool.

---

## 2. What Changes from V1

| Area | V1 (Q&A Mode) | V2 (Scan & Fix Mode) |
|------|---------------|----------------------|
| Selection awareness | Passive (context for Q&A) | Active (triggers smart prompts) |
| Scan | None | Button-triggered deep analysis |
| Results display | N/A | Conversational in chat |
| Issue detection | None (user asks manually) | Automated against KB rules |
| Fixing | None | One-click fixes for mechanical issues |
| Selection depth | Single node properties | Recursive child inspection |
| Knowledge base role | Q&A reference | Scan rule engine + Q&A reference |

**What stays the same:**
- Chat interface and conversational flow
- Gemini Flash as the AI backend
- Plugin architecture (main thread + UI iframe)
- Persona and tone (friendly colleague)
- UI style (Stripe-inspired, from UI_STYLE_GUIDE.md)
- Settings flow
- V1 Q&A mode continues to work alongside V2 features

---

## 3. User Flow

### 3.1 Smart Selection Prompts (Passive)

When a designer selects a layer, UX Buddy becomes context-aware. Instead of just showing "SELECTED: Button / filled / md" (V1 behavior), the selection indicator now offers smart action suggestions.

```
Designer selects a Button instance
    ↓
Selection indicator shows: "📐 Button / filled / md"
    ↓
Below the indicator, a subtle prompt appears:
"Scan this component" [button]  ·  "Is this accessible?"  ·  "Usage tips"
    ↓
Designer clicks "Scan this component"
    ↓
Scan runs and results appear in chat
```

The smart prompts are contextual. Different node types surface different suggestions:

| Selection Type | Smart Prompts |
|---------------|---------------|
| Component Instance | "Scan this component" · "Check variants" · "Usage tips" |
| Text Node | "Check contrast" · "Typography review" · "Is this readable?" |
| Frame / Group | "Scan this frame" · "Check spacing" · "Layout review" |
| Nothing selected | No prompts (standard Q&A mode) |

These are quick-action chips, not a toolbar. They appear inline, right below the selection indicator, and disappear when selection changes or a prompt is tapped.

### 3.2 Scan Flow (Active)

The scan is explicitly triggered by the designer via:
- Tapping the "Scan this component/frame" smart prompt chip
- Clicking a dedicated "Scan" icon button in the header (always visible)
- Typing "scan" or "check" in the chat input

**Scan process:**

```
Designer triggers scan
    ↓
"Scanning [layer name]..." loading state in chat (with progress context)
    ↓
Main thread extracts deep selection data (recursive for frames)
    ↓
UI thread builds a structured scan payload
    ↓
Gemini evaluates the payload against KB rules
    ↓
Scan results appear as a conversational review in chat
```

### 3.3 Results in Chat

Scan results are presented as a single assistant message, structured but conversational. Not a table, not a panel. A message.

**Example scan result message:**

```
I checked your Button and found 2 things to look at.

**Error** · Touch target too small
This button is 36x28px, but the minimum touch target
is 44x44px per WCAG 2.5.5. Smaller targets are harder
to tap on mobile.
→ [Fix this]

**Warning** · Non-standard spacing
The horizontal padding is 8px, but `Button/filled/md`
should use `space.300` (12px). This will look tighter
than other buttons in the system.
→ [Fix this]

Everything else looks good. The contrast ratio is 7.2:1
(passes AA), and the variant usage is correct.
```

**Result structure:**
- Opens with a summary count: "found X things to look at" (or "looks good" if clean)
- Each issue includes: severity label (Error/Warning/Info), issue title, plain-language explanation of what's wrong and why it matters, and a "Fix this" action button (for fixable issues)
- Closes with a positive confirmation of what passed

**Severity definitions (carried from V1 persona):**
- **Error:** Must fix. Violates WCAG AA or breaks design system rules. Examples: contrast failure, wrong component entirely, missing required property.
- **Warning:** Should fix. Deviates from design system conventions. Examples: non-standard spacing, incorrect token value, suboptimal variant choice.
- **Info:** Nice to fix. Suggestions and best practices. Examples: could use auto-layout, related component might work better, accessibility enhancement beyond AA.

### 3.4 Fix Flow

When the designer clicks "Fix this" on a scan result:

```
Designer clicks [Fix this]
    ↓
UI sends fix request to main thread with issue details
    ↓
Main thread applies the fix directly to the selected node
    ↓
Confirmation message appears in chat:
"✓ Fixed: Padding updated to 12px (space.300)"
    ↓
If more issues remain, they stay actionable in the chat
```

**Fix behavior:**
- Fixes are applied directly to the original node (no duplication)
- Each fix is a single, reversible operation (Cmd+Z undoes it)
- Only mechanical fixes are offered (see section 5.3 for what's fixable)
- After a fix, the confirmation replaces the "Fix this" button with "✓ Fixed"
- The designer can re-scan to verify all issues are resolved

---

## 4. Functional Requirements

### FR-07: Smart Selection Prompts

- When selection changes, render contextual action chips below the selection indicator
- Chips are based on the node type (see table in section 3.1)
- Tapping a chip sends its text as a chat message (reuses existing chat flow)
- Chips disappear after one is tapped or when selection changes
- Chips are styled as subtle, compact text buttons (not primary buttons)
- Maximum 3 chips per selection
- If the chat has an active loading state, chips are disabled

### FR-08: Scan Button

- Add a "Scan" icon button to the plugin header (next to the settings gear)
- Icon: a magnifying glass or scan-lines icon (Lucide `scan` or `search`)
- Button is disabled when nothing is selected
- Button is disabled while a scan or API call is in progress
- Clicking the button triggers a scan of the current selection

### FR-09: Deep Selection Extraction

Extends V1's SelectionData to support recursive inspection for frames.

**Extended SelectionData (V2 additions):**

```typescript
interface SelectionDataV2 extends SelectionData {
  // Recursive children (for frames)
  children?: SelectionDataV2[];          // Full data for each child (up to depth limit)
  childCount?: number;                    // Total child count (even beyond depth limit)

  // Component metadata (richer than V1)
  componentId?: string;                   // Main component node ID
  componentDescription?: string;          // From component docs
  componentSetName?: string;              // Parent component set name

  // Style references
  fillStyleId?: string;                   // Figma style ID if using a style
  fillStyleName?: string;                 // Resolved style name
  strokeStyleId?: string;
  strokeStyleName?: string;
  textStyleId?: string;
  textStyleName?: string;
  effectStyleId?: string;
  effectStyleName?: string;

  // Constraints and alignment
  constraints?: { horizontal: string; vertical: string };
  layoutAlign?: string;                   // 'MIN' | 'CENTER' | 'MAX' | 'STRETCH'
  layoutGrow?: number;                    // 0 or 1

  // Computed properties for scan
  absoluteX?: number;                     // Position on canvas
  absoluteY?: number;
  opacity?: number;
  visible?: boolean;
  locked?: boolean;
  cornerRadius?: number | number[];       // Single or per-corner
}
```

**Depth limits:**
- Single component instance: extract all properties (no children needed)
- Frame with children: recurse up to **3 levels deep**
- At each level, extract up to **20 children** (skip beyond that, note "and X more")
- If the selection has more than 50 total descendant nodes, warn the user: "This frame has [N] layers. I'll focus on the top 3 levels."

**Performance guardrail:** extraction must complete within 500ms. If it takes longer (very deep/wide trees), abort and use whatever was collected.

### FR-10: Scan Engine

The scan engine runs in the UI thread. It takes the extracted SelectionDataV2 and evaluates it against rules derived from the knowledge base.

**Scan categories (in priority order):**

**1. Design System Compliance**
- Token validation: Are fill colors using known design tokens? (compare hex values against tokens.json)
- Spacing validation: Do padding and gap values match the spacing scale?
- Variant correctness: Is the component instance using valid variant combinations?
- Typography validation: Do font sizes, weights, and line heights match the type scale?
- Border radius validation: Does the radius match expected values for the component type?
- Component usage: Is this the right component for the apparent purpose? (based on usage.do/dont rules)

**2. Accessibility Checks**
- Contrast ratio: Calculate contrast between text color and background color (WCAG 1.4.3)
- Touch target size: Is the interactive element at least 44x44px? (WCAG 2.5.5)
- Text size: Is body text at least 11px? Is it using a readable font?
- Focus indicator: Does the component have a focus state variant? (informational, can't verify visually)
- Color-only information: Flag if color is the only differentiator (informational)

**3. Structural Checks**
- Auto-layout usage: Is a frame using auto-layout? (suggest it if not)
- Consistent spacing: Are child spacings uniform within a container?
- Layer naming: Are layers using descriptive names (not "Frame 47" or "Rectangle 12")?
- Hidden layers: Flag invisible layers that might be unintentional
- Detached instances: Is this a detached component that should be re-attached?

**Rule resolution:**
- Each rule has a `check()` function that receives SelectionDataV2 and returns `{ pass: boolean, severity, title, description, fix? }`
- Rules are local (no AI needed for the checks themselves)
- The AI (Gemini) is used to format the results conversationally, add context, and generate the natural-language explanation
- This hybrid approach (local rules + AI formatting) keeps scans fast and accurate while maintaining the persona

### FR-11: Fix Actions

Fixes are commands sent from the UI to the main thread to modify the selected node.

**Fixable issues (mechanical, deterministic):**

| Issue | Fix Action | Figma API |
|-------|-----------|-----------|
| Wrong padding | Set padding to correct token value | `node.paddingTop = X` etc. |
| Wrong spacing | Set itemSpacing to correct value | `node.itemSpacing = X` |
| Touch target too small | Resize to minimum 44x44px | `node.resize(w, h)` |
| Wrong fill color | Replace fill with correct token color | `node.fills = [...]` |
| Wrong border radius | Set to correct token value | `node.cornerRadius = X` |
| Wrong font size | Update to correct scale value | `node.fontSize = X` |
| Wrong font weight | Update to correct weight | `node.fontName = { family, style }` |
| Missing auto-layout | Convert frame to auto-layout | `node.layoutMode = 'VERTICAL'` |
| Wrong opacity | Set to 1.0 (or correct value) | `node.opacity = X` |
| Bad layer name | Rename to component/type convention | `node.name = '...'` |

**Not fixable (require designer judgment):**

| Issue | Why Not |
|-------|---------|
| Wrong component entirely | Can't swap component instances safely |
| Layout restructuring | Too many possible correct structures |
| Content/copy issues | Subjective, context-dependent |
| Missing states/variants | Requires creating new component instances |
| Contrast ratio failures | Multiple valid solutions (change text or bg) |

For non-fixable issues, the "Fix this" button is not shown. Instead, the explanation includes a recommendation the designer can follow manually.

**Fix message protocol:**

```typescript
// UI → Main thread
interface FixRequest {
  type: 'apply-fix';
  nodeId: string;
  fixType: string;              // e.g., 'set-padding', 'resize', 'set-fill'
  properties: Record<string, any>;  // Values to apply
}

// Main thread → UI
interface FixResult {
  type: 'fix-applied';
  nodeId: string;
  fixType: string;
  success: boolean;
  error?: string;
}
```

### FR-12: Scan History

- Scan results persist in the chat like any other message
- Each scan result is tagged with the node ID and name it was scanned against
- If the designer scans the same node again, the new results appear as a new message (not replacing the old one)
- This creates a natural audit trail: "I scanned it, fixed some things, scanned again, all clear"

---

## 5. UI Changes from V1

### 5.1 Header Update

```
┌─────────────────────────────────────────┐
│  ◆ UX Buddy                    🔍  ⚙   │
└─────────────────────────────────────────┘
                                  ↑
                           Scan button (new)
```

- Scan icon: Lucide `scan` or `search-check`, 14px, same style as settings gear
- Disabled state: `--text-tertiary` when nothing selected
- Active state: `--text-primary` on hover, `--accent-primary` while scan is running

### 5.2 Selection Indicator Update

```
┌─────────────────────────────────────────┐
│  ▪ SELECTED · Button / filled / md      │
│  Scan this component · Check variants   │  ← Smart prompt chips (new)
└─────────────────────────────────────────┘
```

- Chips row appears below the selection indicator text
- Chips: 10px, `--font-weight-medium`, `--text-link` color, no background, no border
- Separator: · (middle dot) in `--text-tertiary`
- Padding: 0 12px 6px 12px (adds bottom padding to the indicator block)
- On tap: chip text is sent as a message, all chips disappear
- On selection change: chips refresh for new context

### 5.3 Fix Button in Messages

The "Fix this" action appears inline within scan result messages.

```css
.fix-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 500;
  color: var(--accent-primary);
  background: var(--accent-subtle);
  border: 1px solid var(--accent-primary);
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: background-color 0.15s;
}

.fix-button:hover {
  background: var(--accent-primary);
  color: var(--text-inverse);
}

.fix-button--applied {
  color: var(--severity-success);
  background: var(--severity-success-bg);
  border-color: var(--severity-success);
  cursor: default;
  pointer-events: none;
}
```

- Arrow icon (→) before "Fix this" text
- After fix applied: checkmark icon (✓) + "Fixed" text, green coloring
- Button is disabled while fix is being applied (show micro-spinner)

### 5.4 Scan Loading State

While a scan is running, show a richer loading message than V1's three dots:

```
Scanning Button / filled / md...
Checking design tokens · spacing · accessibility
[·  ·  ·]
```

- First line: "Scanning [node name]..." in `--text-secondary`, 12px, medium weight
- Second line: categories being checked, 11px, `--text-tertiary`
- Third line: standard loading dots animation

### 5.5 Clean Scan Result

When no issues are found:

```
I checked your Button / filled / md and everything
looks good.

✓ Tokens match the design system
✓ Spacing follows the scale
✓ Touch target is 44x44px (passes WCAG 2.5.5)
✓ Contrast ratio is 7.2:1 (passes AA)

Nice work.
```

- Checkmarks: `--severity-success` color
- "Nice work" closing: warm but not over-the-top (matches persona)

---

## 6. Technical Architecture (V2 Additions)

### 6.1 New Files

```
src/
├── scan/
│   ├── scan-engine.ts            # Orchestrates scan: extract → check → format
│   ├── rules/
│   │   ├── index.ts              # Rule registry
│   │   ├── design-system.ts      # Token, spacing, variant, typography rules
│   │   ├── accessibility.ts      # Contrast, touch target, text size rules
│   │   └── structural.ts         # Auto-layout, naming, hidden layers rules
│   ├── checks/
│   │   ├── contrast.ts           # WCAG contrast ratio calculator
│   │   ├── token-matcher.ts      # Matches hex/px values to known tokens
│   │   └── spacing-validator.ts  # Validates against spacing scale
│   └── types.ts                  # ScanResult, ScanIssue, FixAction interfaces
├── fix/
│   ├── fix-handler.ts            # Main thread: applies fixes to Figma nodes
│   └── fix-registry.ts           # Maps issue types to fix functions
```

### 6.2 Scan Flow (Technical)

```
[User triggers scan]
       ↓
[UI thread] → postMessage('request-deep-selection')
       ↓
[Main thread] → extractDeepSelection(figma.currentPage.selection)
             → walks children recursively (3 levels, 20 per level)
             → postMessage('deep-selection-data', SelectionDataV2)
       ↓
[UI thread] → scanEngine.run(selectionDataV2, knowledgeBase)
           → iterates rules[] → each rule.check(data) → ScanIssue[]
           → groups by severity, sorts: Error → Warning → Info
       ↓
[UI thread] → formatScanResults(issues, selectionDataV2)
           → sends to Gemini with: "Format these scan results conversationally"
           → system prompt includes persona + formatting instructions
       ↓
[Gemini] → returns natural-language scan review
       ↓
[UI thread] → renders as assistant message with embedded [Fix this] buttons
```

### 6.3 Fix Flow (Technical)

```
[User clicks "Fix this"]
       ↓
[UI thread] → postMessage('apply-fix', { nodeId, fixType, properties })
       ↓
[Main thread] → fixHandler.apply(nodeId, fixType, properties)
             → finds node: figma.getNodeById(nodeId)
             → applies property changes
             → postMessage('fix-applied', { success, nodeId, fixType })
       ↓
[UI thread] → updates the fix button state to "✓ Fixed"
           → adds confirmation message to chat
```

### 6.4 Contrast Ratio Calculation

The contrast checker runs locally (no AI needed). Implement the WCAG relative luminance formula:

```typescript
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(fg: RGB, bg: RGB): number {
  const l1 = getRelativeLuminance(fg.r, fg.g, fg.b);
  const l2 = getRelativeLuminance(bg.r, bg.g, bg.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
```

Use this to check:
- Normal text (< 18px or < 14px bold): requires 4.5:1
- Large text (≥ 18px or ≥ 14px bold): requires 3:1

### 6.5 Token Matching

Build a lookup map from tokens.json at plugin init:

```typescript
interface TokenLookup {
  colors: Map<string, string>;       // hex → token name (e.g., '#635BFF' → 'interactive.primary')
  spacing: Map<number, string>;      // px → token name (e.g., 12 → 'space.300')
  radii: Map<number, string>;        // px → token name (e.g., 8 → 'radius.md')
  fontSizes: Map<number, string>;    // px → token name (e.g., 14 → 'font.size.md')
}
```

When scanning, compare the node's actual values against this map. If a value doesn't match any known token, flag it as a design system deviation and suggest the nearest token.

### 6.6 Message Types (V2 Additions)

```typescript
// New UI → Main messages
type UIToMainMessageV2 = UIToMainMessage | {
  type: 'request-deep-selection';
} | {
  type: 'apply-fix';
  nodeId: string;
  fixType: string;
  properties: Record<string, any>;
};

// New Main → UI messages
type MainToUIMessageV2 = MainToUIMessage | {
  type: 'deep-selection-data';
  data: SelectionDataV2 | null;
} | {
  type: 'fix-applied';
  nodeId: string;
  fixType: string;
  success: boolean;
  error?: string;
};
```

---

## 7. Knowledge Base Extensions

### 7.1 Rule Definitions in KB

Each component entry gets a new `scan_rules` field:

```json
{
  "id": "button",
  "name": "Button",
  "scan_rules": {
    "required_tokens": {
      "fills": ["interactive.primary.default", "interactive.primary.hover"],
      "padding_horizontal": ["space.300", "space.400"],
      "padding_vertical": ["space.200", "space.300"],
      "border_radius": ["radius.md"]
    },
    "size_constraints": {
      "min_width": 44,
      "min_height": 44,
      "size_map": {
        "small": { "height": 32, "padding_h": 12 },
        "medium": { "height": 40, "padding_h": 16 },
        "large": { "height": 48, "padding_h": 20 }
      }
    },
    "required_variants": ["style", "size"],
    "forbidden_overrides": ["fills", "strokes"]
  }
}
```

### 7.2 Accessibility Rules Extended

Each accessibility rule gets a `check_config` field for the scan engine:

```json
{
  "id": "color-contrast",
  "check_config": {
    "check_type": "contrast_ratio",
    "thresholds": {
      "normal_text": 4.5,
      "large_text": 3.0,
      "large_text_size": 18,
      "large_text_bold_size": 14
    },
    "applies_to_types": ["TEXT"],
    "severity": "error"
  }
}
```

---

## 8. Non-Functional Requirements (V2)

| Requirement | Target |
|-------------|--------|
| Scan time (single component) | < 2 seconds total (extraction + rules + AI formatting) |
| Scan time (frame, 50 children) | < 5 seconds |
| Deep extraction time | < 500ms |
| Rule evaluation time | < 200ms (local, no API) |
| Fix application time | < 300ms |
| Fix must be undoable | Single Cmd+Z undoes the fix |
| No data loss | Fixes never delete layers or remove content |

---

## 9. Success Metrics (V2)

| Metric | Target |
|--------|--------|
| Scans per session | Average 2+ indicates adoption |
| Fix acceptance rate | 60%+ of offered fixes are applied |
| Issues found per scan | Track to understand KB coverage |
| Re-scan rate | Users scanning again after fixes (validates workflow) |
| Q&A usage alongside scans | V1 features should not decline |
| False positive rate | < 15% of flagged issues are incorrect |

---

## 10. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scan results feel robotic | Breaks persona, users lose trust | Gemini formats results; keep the colleague tone |
| False positives | Annoying, erodes trust | Conservative rules; flag uncertain checks as "Info" not "Error" |
| Fixing breaks the design | Designer loses work | Fixes are single-property, Cmd+Z works, never delete/restructure |
| Deep extraction is slow | UX feels sluggish | 500ms timeout, depth/breadth limits, progress indicator |
| Token matching misses custom tokens | Reports false deviations | Allow a "known overrides" list in settings (V2.1) |
| Contrast check inaccuracy | False failures on complex backgrounds | Only check solid fill backgrounds; skip gradients/images with a note |
| Gemini formatting adds latency | Scan feels slow | Local rules run first (show preliminary count), AI formats after |

---

## 11. Rollout Plan

### Phase A: Scan Only (V2.0-alpha)

Build the scan engine and results display without fix actions. This validates:
- Deep selection extraction works reliably
- Rules produce accurate results
- Conversational formatting feels natural
- Performance meets targets

### Phase B: Add Fix Actions (V2.0-beta)

Add the fix handler and "Fix this" buttons. This validates:
- Fixes apply correctly and are undoable
- The fix → re-scan loop works
- No data loss scenarios

### Phase C: Smart Prompts (V2.0)

Add the contextual prompt chips on selection. This validates:
- Chips are helpful, not noisy
- The right prompts surface for the right node types
- Entry points feel natural

---

## 12. Out of Scope (V3+)

- Custom design system support (user provides their own tokens/components)
- Multi-selection scanning (scan multiple nodes at once)
- Page-level scanning (scan everything on the page)
- Persistent issue tracking (dashboard of open issues)
- Fix suggestions for subjective issues (contrast, component swaps)
- Code generation or developer handoff
- Plugin-to-plugin communication (e.g., triggering other linters)
- Batch fix all (apply all fixes at once)

---

## 13. Updated Roadmap

| Version | Feature | Status |
|---------|---------|--------|
| V1.0 | Q&A mode | ✅ Complete |
| V1.1 | Richer knowledge base | ✅ Complete |
| **V2.0-alpha** | **Scan engine + results in chat** | **Next** |
| **V2.0-beta** | **Fix actions** | **Next** |
| **V2.0** | **Smart selection prompts** | **Next** |
| V2.1 | Known overrides list, batch improvements | Planned |
| V3.0 | Custom design system support | Future |
