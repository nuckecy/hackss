# System Sidekick — V2 Build Prompts

These prompts extend the V1 codebase. Run them sequentially in Claude Code after V1 is fully working. Each prompt builds on the previous one.

**Before starting:** Make sure V1 passes all verification checks in BUILD_PROMPTS.md (Prompt 10 checklist). V2 builds on top of V1, so any V1 bugs will cascade.

---

## PROMPT V2-1: Extended Types and Selection Extraction

```
Read CLAUDE.md and PRD_V2.md for context. V2 adds scan, fix, and smart prompt capabilities to the existing V1 plugin.

Step 1: Extend the type definitions.

File: src/types/figma.ts
- Add SelectionDataV2 that extends SelectionData with:
  - children?: SelectionDataV2[] (recursive child data)
  - childCount?: number
  - componentId?: string
  - componentDescription?: string
  - componentSetName?: string
  - fillStyleId?: string, fillStyleName?: string
  - strokeStyleId?: string, strokeStyleName?: string
  - textStyleId?: string, textStyleName?: string
  - effectStyleId?: string, effectStyleName?: string
  - constraints?: { horizontal: string; vertical: string }
  - layoutAlign?: string
  - layoutGrow?: number
  - absoluteX?: number, absoluteY?: number
  - opacity?: number
  - visible?: boolean
  - locked?: boolean
  - cornerRadius?: number | number[]

File: src/types/scan.ts (new file)
- ScanIssue interface: { id: string, severity: 'error' | 'warning' | 'info', category: 'design-system' | 'accessibility' | 'structural', title: string, description: string, nodeId: string, nodeName: string, fixable: boolean, fixType?: string, fixProperties?: Record<string, any>, currentValue?: string, expectedValue?: string }
- ScanResult interface: { nodeId: string, nodeName: string, nodeType: string, timestamp: Date, issues: ScanIssue[], passed: string[] }
- FixAction interface: { type: string, nodeId: string, properties: Record<string, any> }
- FixResult interface: { success: boolean, fixType: string, nodeId: string, error?: string }

File: src/types/messages.ts
- Add new message types to UIToMainMessage union:
  - { type: 'request-deep-selection' }
  - { type: 'apply-fix', nodeId: string, fixType: string, properties: Record<string, any> }
- Add new message types to MainToUIMessage union:
  - { type: 'deep-selection-data', data: SelectionDataV2 | null }
  - { type: 'fix-applied', nodeId: string, fixType: string, success: boolean, error?: string }

Update the barrel export in src/types/index.ts.

Step 2: Add deep selection extraction to the main thread.

File: src/main.ts
- Add a new function extractDeepSelection(node: SceneNode, depth: number = 0): SelectionDataV2
- This recursively extracts child data up to 3 levels deep and 20 children per level
- At each level, extract: all existing V1 properties PLUS the new V2 fields (styles, constraints, layout, position, visibility, corner radius)
- For component instances: also extract componentId (mainComponent.id), componentDescription (mainComponent.description), componentSetName (mainComponent.parent?.name if parent is COMPONENT_SET)
- For style references: extract fillStyleId and resolve to fillStyleName via figma.getStyleById()
- Add a performance guard: if extraction takes more than 500ms, stop recursing and return what you have
- Listen for 'request-deep-selection' messages and respond with 'deep-selection-data'
- The existing selectionchange listener continues to send the V1 'selection-changed' messages (don't break V1)

Test the extraction by logging the output when a complex frame is selected.
```

---

## PROMPT V2-2: Scan Rules Engine

```
Read PRD_V2.md section "FR-10: Scan Engine" for the full spec.

Build the local scan rules engine. Rules run in the UI thread (no API calls). They take SelectionDataV2 and knowledge base data as input and return ScanIssue arrays.

File: src/scan/types.ts
- Import ScanIssue from src/types/scan.ts
- Define ScanRule interface: { id: string, category: 'design-system' | 'accessibility' | 'structural', check: (node: SelectionDataV2, kb: KnowledgeBase) => ScanIssue[] }
- Define KnowledgeBase type that combines components.json, accessibility.json, and tokens.json

File: src/scan/checks/token-matcher.ts
- Build a TokenLookup class that indexes tokens.json at init:
  - colors: Map<string, string> (hex lowercase → token name)
  - spacing: Map<number, string> (px → token name)
  - radii: Map<number, string> (px → token name)
  - fontSizes: Map<number, string> (px → token name)
- Add method: findClosestToken(value: string | number, category: 'color' | 'spacing' | 'radius' | 'fontSize') → { match: string | null, suggestion: string | null }
- For colors: exact hex match
- For numbers: exact match, then find the nearest value in the scale

File: src/scan/checks/contrast.ts
- Implement getRelativeLuminance(r: number, g: number, b: number): number
  using the WCAG formula (see PRD_V2.md section 6.4)
- Implement getContrastRatio(fg: RGB, bg: RGB): number
- Implement checkContrast(node: SelectionDataV2): ScanIssue | null
  - Only applies to TEXT nodes
  - Extracts text fill color and tries to determine background from parent's fills
  - If parent has no solid fill, skip with a note (can't check against gradients/images)
  - Normal text (< 18px or < 14px bold): requires 4.5:1
  - Large text (>= 18px or >= 14px bold): requires 3:1
  - Returns error-severity issue if fails, null if passes

File: src/scan/checks/spacing-validator.ts
- Implement validateSpacing(node: SelectionDataV2, tokenLookup: TokenLookup): ScanIssue[]
- Check paddingTop/Right/Bottom/Left against spacing scale
- Check itemSpacing against spacing scale
- For each non-matching value: return warning-severity issue with the current value and suggested token
- Make the fix properties: { fixType: 'set-padding' or 'set-spacing', properties: { paddingTop: X, ... } }

File: src/scan/rules/design-system.ts
- Export an array of ScanRule objects:
  1. token-fills: Check if fill colors match known color tokens (use TokenLookup). Fixable.
  2. token-spacing: Check padding and spacing values (use spacing-validator). Fixable.
  3. token-radius: Check cornerRadius against known radius tokens. Fixable.
  4. token-typography: Check fontSize and fontWeight against type scale. Fixable.
  5. variant-validity: If instance, check variantProperties against component's known variants from KB. Not fixable (info only).
  6. component-usage: If instance, check usage.dont rules from KB. Not fixable (info only).

File: src/scan/rules/accessibility.ts
- Export an array of ScanRule objects:
  1. contrast-ratio: Use contrast checker. Not fixable (multiple valid solutions).
  2. touch-target: Check width/height >= 44px for interactive components (buttons, inputs, checkboxes). Fixable (resize).
  3. text-size: Check fontSize >= 11px for readability. Fixable.

File: src/scan/rules/structural.ts
- Export an array of ScanRule objects:
  1. auto-layout: Check if frame has layoutMode !== 'NONE'. Fixable (set to VERTICAL).
  2. layer-naming: Check if name matches generic patterns like /^(Frame|Rectangle|Group|Ellipse)\s*\d*$/. Fixable (rename to type + purpose).
  3. hidden-layers: Check visible === false. Not fixable (intentional choice).

File: src/scan/rules/index.ts
- Import all rule arrays and export a combined allRules array
- Export function getRulesForNodeType(type: string): ScanRule[] that filters rules by applicability

File: src/scan/scan-engine.ts
- Export class ScanEngine with:
  - constructor(knowledgeBase: KnowledgeBase) — initializes TokenLookup and rule registry
  - scan(node: SelectionDataV2): ScanResult — runs all applicable rules, collects issues, sorts by severity (error first), builds passed list
  - scanRecursive(node: SelectionDataV2): ScanResult[] — scans node + children, returns flat array of results
- The scan method should be synchronous and fast (< 200ms for a single node)

Write unit-testable code. Each check function should be a pure function that can be tested without Figma.
```

---

## PROMPT V2-3: Fix Handler

```
Read PRD_V2.md section "FR-11: Fix Actions" for the full spec.

Build the fix system. Fixes run in the main thread (they need Figma API access).

File: src/fix/fix-registry.ts (main thread)
- Define a map of fix type strings to handler functions:

  'set-padding': (node, props) => {
    if (props.paddingTop !== undefined) node.paddingTop = props.paddingTop;
    if (props.paddingRight !== undefined) node.paddingRight = props.paddingRight;
    if (props.paddingBottom !== undefined) node.paddingBottom = props.paddingBottom;
    if (props.paddingLeft !== undefined) node.paddingLeft = props.paddingLeft;
  }

  'set-spacing': (node, props) => {
    node.itemSpacing = props.itemSpacing;
  }

  'set-fill': (node, props) => {
    // Replace the first solid fill with the new color
    const fills = JSON.parse(JSON.stringify(node.fills));
    const solidFill = fills.find(f => f.type === 'SOLID');
    if (solidFill && props.color) {
      solidFill.color = { r: props.color.r / 255, g: props.color.g / 255, b: props.color.b / 255 };
    }
    node.fills = fills;
  }

  'set-radius': (node, props) => {
    node.cornerRadius = props.cornerRadius;
  }

  'set-font-size': (node, props) => {
    // Must load font first
    await figma.loadFontAsync(node.fontName);
    node.fontSize = props.fontSize;
  }

  'resize': (node, props) => {
    node.resize(
      Math.max(node.width, props.minWidth || node.width),
      Math.max(node.height, props.minHeight || node.height)
    );
  }

  'set-auto-layout': (node, props) => {
    node.layoutMode = props.layoutMode || 'VERTICAL';
    node.itemSpacing = props.itemSpacing || 8;
    node.paddingTop = props.padding || 0;
    node.paddingRight = props.padding || 0;
    node.paddingBottom = props.padding || 0;
    node.paddingLeft = props.padding || 0;
  }

  'rename': (node, props) => {
    node.name = props.name;
  }

  'set-opacity': (node, props) => {
    node.opacity = props.opacity;
  }

- Export function applyFix(nodeId: string, fixType: string, properties: Record<string, any>): { success: boolean, error?: string }
  - Get node via figma.getNodeById(nodeId)
  - Validate node exists and is editable
  - Look up handler in registry
  - Wrap in try/catch
  - Return result

File: src/main.ts (update)
- Import applyFix from fix-registry
- Add message listener for 'apply-fix':
  - Call applyFix(msg.nodeId, msg.fixType, msg.properties)
  - Send 'fix-applied' message back to UI with the result
- Important: wrap font operations in async handling (figma.loadFontAsync)

Ensure all fixes are single-property operations that Cmd+Z can undo in Figma.
```

---

## PROMPT V2-4: Scan UI Integration

```
Read PRD_V2.md sections 3 and 5 for the UI spec. Read UI_STYLE_GUIDE.md for visual design.

Wire the scan engine into the chat interface.

File: src/ui/hooks/useScan.ts (new)
- Custom hook that manages scan state:
  - isScanning: boolean
  - lastScanResult: ScanResult | null
  - triggerScan(): requests deep selection from main thread, runs scan engine, formats results via Gemini, adds result to chat
  - applyFix(issue: ScanIssue): sends fix request to main thread, updates issue state
- The hook should:
  1. Send 'request-deep-selection' to main thread
  2. Wait for 'deep-selection-data' response
  3. Run scanEngine.scan() locally (synchronous, fast)
  4. Build a structured summary of issues
  5. Send to Gemini with a formatting prompt: "Format these scan results as a conversational design review. Use the persona tone. Include severity labels (Error/Warning/Info). For fixable issues, note that a fix is available."
  6. Add the Gemini-formatted response as an assistant message with embedded fix actions
  7. Store the raw ScanResult for fix button references

File: src/ui/components/ScanResultMessage.tsx (new)
- A specialized message component for scan results
- Props: { scanResult: ScanResult, formattedContent: string, onFix: (issue: ScanIssue) => void }
- Renders the formatted content as markdown (like regular assistant messages)
- For each fixable issue: renders an inline FixButton component
- The fix buttons are positioned after each issue's description line (identified by matching issue IDs)

File: src/ui/components/FixButton.tsx (new)
- Props: { issue: ScanIssue, onFix: () => void, status: 'idle' | 'applying' | 'applied' | 'failed' }
- idle: "→ Fix this" in accent color, accent-subtle background
- applying: spinner icon, disabled
- applied: "✓ Fixed" in success color, success-bg background
- failed: "✗ Failed" in error color, retry on click
- Follow the .fix-button CSS spec from PRD_V2.md section 5.3
- Compact: 11px text, 2px 8px padding, radius-xs

File: src/ui/components/SelectionIndicator.tsx (update)
- Below the existing selection text, add smart prompt chips
- Chips are contextual based on node type:
  - INSTANCE: "Scan this component" · "Check variants" · "Usage tips"
  - TEXT: "Check contrast" · "Typography review"
  - FRAME: "Scan this frame" · "Check spacing" · "Layout review"
- Chips: 10px, --font-weight-medium, --text-link color, no background, no border
- Separator: middle dot (·) in --text-tertiary
- On click: chip text is sent as a chat message via the existing sendMessage flow
- Chips disappear after one is clicked
- If isScanning or isLoading (from useChat), chips are disabled (--text-tertiary, no pointer)

File: src/ui/components/ScanLoadingState.tsx (new)
- Richer loading state for scans (not just three dots)
- Shows: "Scanning [node name]..." in --text-secondary
- Below: "Checking design tokens · spacing · accessibility" in --text-tertiary, 11px
- Below: standard LoadingDots component
- Used instead of LoadingDots when a scan is in progress

Update src/ui/App.tsx:
- Add scan button to header (magnifying glass icon, next to settings gear)
- Scan button disabled when nothing selected or scan in progress
- Scan button uses --text-secondary default, --text-primary hover, --accent-primary while scanning
- Wire useScan hook
- Handle scan trigger from: header button click, smart prompt chip click, or typing "scan"/"check" in chat
- When chat input contains "scan" or "check" and there's a selection, intercept and trigger scan instead of normal Q&A

Build and test:
1. Select a component in Figma
2. Click the scan button
3. Verify scan results appear conversationally in chat
4. Verify fix buttons appear for fixable issues
5. Click a fix button
6. Verify the fix is applied and button changes to "✓ Fixed"
7. Re-scan and verify the fixed issue no longer appears
```

---

## PROMPT V2-5: Scan Result Formatting

```
Read CHATBOT_PERSONA.md and GEMINI_SYSTEM_PROMPT.md for tone and formatting guidelines.

Create the system prompt additions for formatting scan results.

File: src/ai/system-prompt.ts (update)
- Add a new function: buildScanFormatPrompt(issues: ScanIssue[], passed: string[], nodeName: string, nodeType: string): string
- This builds a Gemini prompt that asks the AI to format raw scan results into a conversational review
- The prompt should include:

  1. The persona instructions (same as Q&A mode)
  2. Formatting rules specific to scan results:
     - Open with a summary: "I checked your [node name] and found [N] things to look at." (or "everything looks good" if clean)
     - Group issues by severity: errors first, then warnings, then info
     - For each issue, use this format:
       **[Severity]** · [Title]
       [1-2 sentence explanation of what's wrong and why it matters]
       Current: [current value] → Expected: [expected value]
       →FIX:[issue_id] (this marker will be replaced by a FixButton in the UI)
     - Close with what passed: list 2-3 passing checks as "✓ [check name]"
     - End with encouragement if there are issues, or "Nice work." if clean
  3. The raw scan data as structured input:
     - issues array (severity, title, description, currentValue, expectedValue, fixable, id)
     - passed checks array
     - node context (name, type, component name if applicable)

- Add a scan formatting instruction to the system prompt that tells Gemini:
  - Use the →FIX:[id] marker exactly as provided (the UI will parse and replace these)
  - Never invent issues beyond what's in the scan data
  - Keep each issue explanation to 1-2 sentences max
  - Use specific token names, WCAG criteria, and pixel values
  - Maintain the friendly colleague tone, not an audit report tone

File: src/ui/utils/parse-scan-response.ts (new)
- Function: parseScanResponse(content: string, issues: ScanIssue[]): { segments: Array<{ type: 'text' | 'fix-button', content?: string, issueId?: string }> }
- Splits the formatted response at →FIX:[id] markers
- Returns an array of segments that the ScanResultMessage component can render
- Text segments get rendered as markdown
- Fix-button segments get rendered as FixButton components matched to the corresponding ScanIssue by ID

Test with various scenarios:
1. Clean scan (no issues) → "everything looks good" message
2. Single error → one issue with fix button
3. Multiple issues across severities → properly grouped and formatted
4. Non-fixable issue → explanation without fix button
5. Mixed fixable and non-fixable → appropriate buttons on each
```

---

## PROMPT V2-6: Knowledge Base Scan Rules

```
Read KNOWLEDGE_BASE_SCHEMA.md and PRD_V2.md section 7 for the extended KB format.

Extend the knowledge base JSON files with scan rule data so the scan engine has richer checking criteria.

File: src/knowledge/components.json (update)
- Add a "scan_rules" field to each of the 8 existing component entries
- For each component, define:
  - required_tokens: which token categories apply and their expected values
  - size_constraints: min dimensions and size variants
  - required_variants: which variant dimensions should be set
  - forbidden_overrides: which properties should NOT be locally overridden on instances
- Example for Button:
  {
    "scan_rules": {
      "required_tokens": {
        "fills": ["interactive.primary.default"],
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

File: src/knowledge/accessibility.json (update)
- Add a "check_config" field to each rule:
  - check_type: what kind of check (contrast_ratio, min_size, has_property, etc.)
  - thresholds: numeric thresholds for the check
  - applies_to_types: which Figma node types this check applies to
  - severity: default severity level
- Do this for all 10 existing rules

File: src/knowledge/tokens.json (update)
- Ensure every token has a resolved numeric or hex value that the TokenLookup can index
- Add any missing tokens that components reference in their scan_rules
- Group clearly by category: color, spacing, typography, radius

File: src/scan/rules/design-system.ts (update)
- Update the design-system rules to use the new scan_rules data from components.json
- When checking a component instance, look up its component name in the KB and use its specific scan_rules for validation
- For non-component frames, fall back to general token checking

Build and verify:
1. Scan a Button instance → should check against Button-specific scan_rules
2. Scan a generic frame → should check general spacing and layout rules
3. Manually introduce a wrong padding value → verify the scan catches it and suggests the correct token
```

---

## PROMPT V2-7: Polish and Edge Cases

```
Read PRD_V2.md section 10 (Risks and Mitigations) for edge cases to handle.

Review and fix all V2 edge cases:

1. Deep extraction edge cases:
   - Select a deeply nested frame (5+ levels) → should stop at 3 levels with a note
   - Select a frame with 100+ children → should cap at 20 per level with "and X more" note
   - Select a node inside a component that's inside an instance → should extract correctly
   - Select nothing and click scan → scan button should be disabled, show nothing

2. Scan edge cases:
   - Scan a TEXT node with no parent (top-level) → contrast check should skip gracefully
   - Scan a node with gradient fills → token check should skip with "gradient fills can't be validated" note
   - Scan a node with mixed fills (solid + image) → check only the solid fill
   - Scan a frame with no children → should still check the frame's own properties
   - Scan an instance with overridden fills → should flag if fills are in forbidden_overrides

3. Fix edge cases:
   - Fix a node that was deleted between scan and fix click → show "This layer no longer exists"
   - Fix a font size on a text node with mixed font sizes → show "Mixed text styles can't be auto-fixed"
   - Fix is applied but Gemini formatting fails → still show the raw fix confirmation
   - Two rapid fix clicks on the same button → debounce, only apply once

4. UI edge cases:
   - Very long node names in selection indicator → ellipsis, max-width
   - Many issues (10+) in a single scan → still conversational, no scrolling issues
   - Fix button in a scrolled-away message → should still work when clicked
   - Dark mode → verify all new components (FixButton, ScanLoadingState, chips) use CSS variables

5. Performance:
   - Run scan on a complex frame with 50+ descendants → should complete within 5 seconds
   - Profile the token matcher → ensure Map lookups are O(1)
   - Verify no memory leaks from repeated scans (check for uncleared listeners)

6. V1 compatibility:
   - Verify Q&A mode still works exactly as before
   - Verify selection indicator still shows V1-style when smart prompts are ignored
   - Verify settings flow is unchanged
   - Run the V1 test checklist from BUILD_PROMPTS.md Prompt 10

Build, test thoroughly, and fix any issues found.
```

---

## Post-Build Verification Checklist

After all V2 prompts are complete, verify:

**Scan flow:**
- [ ] Scan button in header is visible and responds to selection state
- [ ] Clicking scan with a component selected triggers analysis
- [ ] Scan results appear conversationally in chat (not as a table or panel)
- [ ] Results include severity labels (Error/Warning/Info)
- [ ] Results reference specific token names, pixel values, WCAG criteria
- [ ] Clean scan shows "everything looks good" with passing checks
- [ ] Scan loading state shows "Scanning [name]..." with category details

**Smart prompts:**
- [ ] Chips appear below selection indicator when something is selected
- [ ] Chips are contextual (different for Instance vs Text vs Frame)
- [ ] Clicking a chip sends it as a message and chips disappear
- [ ] Chips are disabled during loading

**Fix actions:**
- [ ] "Fix this" buttons appear inline for fixable issues
- [ ] Clicking "Fix this" applies the change to the Figma layer
- [ ] Button changes to "✓ Fixed" after successful fix
- [ ] Cmd+Z undoes the fix in Figma
- [ ] Re-scanning shows the fixed issue is resolved
- [ ] Non-fixable issues have no "Fix this" button

**Design system checks:**
- [ ] Wrong fill color is detected and correct token suggested
- [ ] Wrong padding is detected and correct spacing token suggested
- [ ] Wrong border radius is detected
- [ ] Wrong font size is detected

**Accessibility checks:**
- [ ] Low contrast text is flagged with the actual ratio and required ratio
- [ ] Small touch targets are flagged with actual size and minimum
- [ ] Gradient/image backgrounds are skipped gracefully

**V1 regression:**
- [ ] Q&A mode works as before
- [ ] Selection awareness works as before
- [ ] Settings flow works as before
- [ ] Dark mode works as before

**Performance:**
- [ ] Single component scan completes in < 2 seconds
- [ ] Frame scan (50 children) completes in < 5 seconds
- [ ] No visible lag when switching selections
