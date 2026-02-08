# System Sidekick — UI Style Guide

## Design Philosophy

Inspired by Stripe's design language: **precision, restraint, confidence.** Every element earns its place. Color is functional, not decorative. Surfaces are quiet so content can be loud.

**Core principles:**
- Monochromatic foundation with one intentional accent
- Typography does the heavy lifting, not color
- Depth through fine borders, not chunky shadows
- Dense but breathable (tight spacing, generous line-height)
- No gradients, no rounded-everything, no "friendly AI" pastels

**This plugin should feel like a professional tool built into Figma, not a chatbot bolted on.**

---

## Color System

### Light Mode

```css
:root {
  /* ── Backgrounds ── */
  --bg-primary:         #FFFFFF;        /* Main plugin background */
  --bg-secondary:       #F6F8FA;        /* Subtle surface (cards, code blocks) */
  --bg-tertiary:        #F0F2F4;        /* Hover states, pressed surfaces */
  --bg-inverse:         #0A2540;        /* Tooltips, dropdowns, emphasis blocks */

  /* ── Text ── */
  --text-primary:       #30313D;        /* Primary text. NOT pure black. */
  --text-secondary:     #6B7385;        /* Secondary labels, timestamps, metadata */
  --text-tertiary:      #9DA3AE;        /* Placeholder text, disabled states */
  --text-inverse:       #FFFFFF;        /* Text on dark backgrounds */
  --text-link:          #0570DE;        /* Inline links only */

  /* ── Accent (single, intentional) ── */
  --accent-primary:     #635BFF;        /* Stripe indigo. Buttons, active indicators, focus rings */
  --accent-hover:       #5851DF;        /* Accent on hover */
  --accent-subtle:      #F0EFFF;        /* Accent tinted backgrounds (selected states) */
  --accent-text:        #635BFF;        /* Accent as text color (sparingly) */

  /* ── Borders ── */
  --border-default:     #E3E5E8;        /* Standard borders */
  --border-strong:      #C4C9D0;        /* Emphasized borders (dividers, input focus) */
  --border-subtle:      #EDEEF1;        /* Very subtle separators */

  /* ── Severity (functional color only) ── */
  --severity-error:     #DF1B41;        /* Errors, critical violations */
  --severity-error-bg:  #FFF0F1;        /* Error background tint */
  --severity-warning:   #D97706;        /* Warnings, deviations */
  --severity-warning-bg:#FFFBEB;        /* Warning background tint */
  --severity-success:   #1B8F5A;        /* Success, passing checks */
  --severity-success-bg:#F0FDF4;        /* Success background tint */
  --severity-info:      #0570DE;        /* Informational, suggestions */
  --severity-info-bg:   #EFF6FF;        /* Info background tint */

  /* ── Chat-specific ── */
  --msg-user-bg:        #F6F8FA;        /* User message bubble */
  --msg-user-border:    #E3E5E8;        /* User message subtle border */
  --msg-assistant-bg:   #FFFFFF;        /* Assistant message (same as bg, bordered) */
  --msg-assistant-border:#E3E5E8;       /* Assistant message border */

  /* ── Shadows (micro, not chunky) ── */
  --shadow-xs:          0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-sm:          0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md:          0 4px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(0, 0, 0, 0.08);
  --shadow-focus:       0 0 0 3px rgba(99, 91, 255, 0.16);   /* Focus ring shadow */
}
```

### Dark Mode

```css
@media (prefers-color-scheme: dark) {
  :root {
    /* ── Backgrounds ── */
    --bg-primary:         #1A1B25;
    --bg-secondary:       #22232F;
    --bg-tertiary:        #2A2B39;
    --bg-inverse:         #F6F8FA;

    /* ── Text ── */
    --text-primary:       #E3E5E8;
    --text-secondary:     #9DA3AE;
    --text-tertiary:      #6B7385;
    --text-inverse:       #1A1B25;
    --text-link:          #7B9FFF;

    /* ── Accent ── */
    --accent-primary:     #7B73FF;
    --accent-hover:       #8D86FF;
    --accent-subtle:      #2A2844;
    --accent-text:        #A09AFF;

    /* ── Borders ── */
    --border-default:     #2E2F3E;
    --border-strong:      #3E4051;
    --border-subtle:      #252636;

    /* ── Severity ── */
    --severity-error:     #FF6B7A;
    --severity-error-bg:  #2D1519;
    --severity-warning:   #FBBF24;
    --severity-warning-bg:#2D2410;
    --severity-success:   #34D399;
    --severity-success-bg:#0D261B;
    --severity-info:      #7B9FFF;
    --severity-info-bg:   #151C2E;

    /* ── Chat ── */
    --msg-user-bg:        #22232F;
    --msg-user-border:    #2E2F3E;
    --msg-assistant-bg:   #1A1B25;
    --msg-assistant-border:#2E2F3E;

    /* ── Shadows ── */
    --shadow-xs:          0 1px 2px rgba(0, 0, 0, 0.2);
    --shadow-sm:          0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2);
    --shadow-md:          0 4px 8px rgba(0, 0, 0, 0.3), 0 0 1px rgba(0, 0, 0, 0.4);
    --shadow-focus:       0 0 0 3px rgba(123, 115, 255, 0.24);
  }
}
```

### Color Usage Rules

| Intent | Token | Never |
|--------|-------|-------|
| Primary action | `--accent-primary` | Don't use for text or backgrounds |
| Body text | `--text-primary` | Never use pure `#000000` or `#FFFFFF` |
| Errors | `--severity-error` | Never use red for non-error purposes |
| Borders | `--border-default` | Never use color for decorative borders |
| Hover | `--bg-tertiary` | Don't change text color on hover (change bg only) |
| Focus ring | `--shadow-focus` | Never remove focus indicators |

---

## Typography

Use **Inter** for everything. It is Figma's native font and guarantees zero font-loading issues in the plugin iframe. The Stripe-like precision comes from the sizing and weight system, not the font choice.

```css
:root {
  --font-family:        'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

  /* ── Scale (compact for plugin panel) ── */
  --font-size-xs:       10px;     /* Timestamps, meta labels */
  --font-size-sm:       11px;     /* Secondary text, captions */
  --font-size-base:     12px;     /* Body text, chat messages */
  --font-size-md:       13px;     /* Input text, emphasized body */
  --font-size-lg:       14px;     /* Section headers */
  --font-size-xl:       16px;     /* Plugin title only */

  /* ── Weights ── */
  --font-weight-regular:  400;
  --font-weight-medium:   500;    /* Default for UI labels */
  --font-weight-semibold: 600;    /* Headers, emphasis */

  /* ── Line Heights ── */
  --line-height-tight:    1.2;    /* Headers */
  --line-height-base:     1.5;    /* Body text, messages */
  --line-height-relaxed:  1.6;    /* Long-form content in assistant messages */

  /* ── Letter Spacing ── */
  --tracking-tight:     -0.01em;  /* Headers */
  --tracking-normal:     0;       /* Body */
  --tracking-wide:       0.02em;  /* Overline labels, meta text */
}
```

### Type Hierarchy (exact specs)

| Element | Size | Weight | Color | Line Height | Letter Spacing |
|---------|------|--------|-------|-------------|----------------|
| Plugin title | 16px | 600 | `--text-primary` | 1.2 | -0.01em |
| Section header | 14px | 600 | `--text-primary` | 1.2 | -0.01em |
| Chat message | 12px | 400 | `--text-primary` | 1.5 | 0 |
| Inline code | 11px | 500 | `--accent-text` | 1.5 | 0 |
| Timestamp | 10px | 400 | `--text-tertiary` | 1.2 | 0.02em |
| Selection label | 11px | 500 | `--text-secondary` | 1.2 | 0.02em |
| Placeholder | 12px | 400 | `--text-tertiary` | 1.5 | 0 |
| Error label | 11px | 500 | `--severity-error` | 1.2 | 0 |
| Button text | 12px | 500 | `--text-inverse` | 1 | 0.01em |

### Typography Rules

- **No bold chat messages.** Use `font-weight: 500` (medium) for emphasis within messages, not 700.
- **Monospace for tokens.** Inline code uses `'SF Mono', 'Fira Code', 'Consolas', monospace` at 11px.
- **No ALL CAPS** except for overline labels (e.g., "SELECTED ELEMENT"), and even then use `--tracking-wide`.
- **Truncate with ellipsis**, never wrap, for: component names in the selection indicator, long token names.

---

## Spacing System

4px base grid. Every margin, padding, and gap should be a multiple of 4.

```css
:root {
  --space-0:    0;
  --space-1:    2px;      /* Micro: icon-to-text nudge */
  --space-2:    4px;      /* Tight: between related items */
  --space-3:    6px;      /* Compact: input padding-y */
  --space-4:    8px;      /* Base: standard gap between elements */
  --space-5:    12px;     /* Comfortable: section padding */
  --space-6:    16px;     /* Generous: card padding, section gaps */
  --space-8:    24px;     /* Large: major section separators */
  --space-10:   32px;     /* XL: only for page-level spacing */
}
```

### Spacing Application

| Context | Value | Token |
|---------|-------|-------|
| Chat message padding | 8px 10px | `--space-4` h / custom |
| Gap between messages | 2px | `--space-1` |
| Input bar padding | 8px | `--space-4` |
| Section separator margin | 16px | `--space-6` |
| Selection indicator padding | 6px 10px | `--space-3` / custom |
| Header padding | 12px 12px | `--space-5` |
| Plugin body padding (horizontal) | 0px | none (messages go edge-to-edge) |
| Message content to timestamp | 4px | `--space-2` |

---

## Border Radius

Tight. Not rounded. Stripe, not Slack.

```css
:root {
  --radius-none:  0;
  --radius-xs:    2px;     /* Tags, severity labels */
  --radius-sm:    4px;     /* Input fields, code blocks */
  --radius-md:    6px;     /* Message bubbles, cards */
  --radius-lg:    8px;     /* Modal, settings panel */
  --radius-full:  9999px;  /* Avatars, dot indicators only */
}
```

### Radius Rules

- Message bubbles: `6px` (not 12px+, not pill-shaped)
- Input fields: `4px`
- Buttons: `4px`
- Selection indicator bar: `4px`
- Never use `border-radius: 50%` except for circular status dots

---

## Borders

Fine, precise, functional. Borders define structure, not decoration.

```css
/* Standard border */
border: 1px solid var(--border-default);

/* Emphasized border (active input, dividers) */
border: 1px solid var(--border-strong);

/* Subtle separator (between messages) */
border-bottom: 1px solid var(--border-subtle);
```

### Border Rules

- **1px only.** Never 2px borders except for focus rings.
- **No colored borders** except: accent for focus (`--accent-primary`), severity borders on severity cards.
- Assistant message bubbles use a left-side accent: `border-left: 2px solid var(--border-default)`. This is the ONLY place a 2px border appears in normal state.

---

## Shadows

Micro-shadows. If you can obviously see the shadow, it's too strong.

```css
/* Use cases */
.input-field       { box-shadow: var(--shadow-xs); }
.selection-bar     { box-shadow: var(--shadow-xs); }
.settings-panel    { box-shadow: var(--shadow-md); }
.tooltip           { box-shadow: var(--shadow-md); }

/* Focus ring (replaces outline) */
.input-field:focus  { box-shadow: var(--shadow-focus), var(--shadow-xs); }
.send-button:focus  { box-shadow: var(--shadow-focus); }
```

### Shadow Rules

- No shadows on message bubbles
- No shadows on buttons in default state
- Focus rings are `box-shadow`, not `outline` (allows border-radius)
- Never combine more than 2 shadow layers

---

## Component Specifications

### Plugin Header

```
┌─────────────────────────────────────────┐
│  ◆ System Sidekick                        ⚙   │  ← 36px height
├─────────────────────────────────────────┤
│  ▪ SELECTED · Button / filled / md      │  ← 28px height (conditional)
├─────────────────────────────────────────┤
```

- Height: 36px
- Background: `--bg-primary`
- Bottom border: `1px solid var(--border-default)`
- Title: 14px, `--font-weight-semibold`, `--text-primary`
- Icon (◆): 12px, `--accent-primary` (the only decorative color in the header)
- Settings gear: 14px icon, `--text-secondary`, hover: `--text-primary`
- Padding: `0 12px`
- Flexbox: `space-between`, `center`

### Selection Indicator

- Appears ONLY when a layer is selected
- Height: 28px
- Background: `--bg-secondary`
- Bottom border: `1px solid var(--border-subtle)`
- Label "SELECTED": 10px, `--font-weight-medium`, `--text-tertiary`, `--tracking-wide`
- Value: 11px, `--font-weight-medium`, `--text-secondary`
- Separator dot (·): `--text-tertiary`
- Padding: `0 12px`
- Text overflow: `ellipsis`

### Chat Area

- Background: `--bg-primary`
- Flex: `1 1 auto` (takes remaining space)
- Overflow-y: `auto`
- Scroll padding bottom: `8px`
- Padding: `8px 0` (messages handle their own horizontal padding)

### Message Bubbles

**User Message:**
```css
.message-user {
  background: var(--msg-user-bg);
  border: 1px solid var(--msg-user-border);
  border-radius: var(--radius-md);
  padding: 8px 10px;
  margin: 1px 12px 1px 40px;        /* Left margin creates indent */
  font-size: var(--font-size-base);
  color: var(--text-primary);
  line-height: var(--line-height-base);
}
```

**Assistant Message:**
```css
.message-assistant {
  background: var(--msg-assistant-bg);
  border: 1px solid var(--msg-assistant-border);
  border-left: 2px solid var(--accent-primary);  /* Signature detail */
  border-radius: var(--radius-md);
  padding: 8px 10px;
  margin: 1px 12px;                  /* Full width */
  font-size: var(--font-size-base);
  color: var(--text-primary);
  line-height: var(--line-height-relaxed);
}
```

**Timestamp (shared):**
```css
.message-timestamp {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin-top: 4px;
  letter-spacing: var(--tracking-wide);
}
```

**Message gap:** `2px` between consecutive same-role messages, `8px` between role changes.

### Inline Code in Messages

```css
.message code {
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 11px;
  font-weight: 500;
  color: var(--accent-text);
  background: var(--bg-secondary);
  padding: 1px 4px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-subtle);
}
```

### Severity Labels in Messages

Used when the assistant flags issues. Inline, compact, not badge-shaped.

```css
.severity-error {
  color: var(--severity-error);
  font-size: 11px;
  font-weight: 600;
}

.severity-warning {
  color: var(--severity-warning);
  font-size: 11px;
  font-weight: 600;
}

.severity-info {
  color: var(--severity-info);
  font-size: 11px;
  font-weight: 600;
}
```

Format: `**Error:** Description` or `**Warning:** Description`. Text-only, no colored blocks or badges. The text color alone carries the severity.

### Input Bar

```
┌─────────────────────────────────────────┐
│                                         │
│  ┌────────────────────────────── ┬───┐  │
│  │ Ask about components, a11y...  │ → │  │  ← 36px input height
│  └────────────────────────────── ┴───┘  │
│                                         │
└─────────────────────────────────────────┘
```

```css
.input-bar {
  display: flex;
  gap: 6px;
  padding: 8px 12px;
  border-top: 1px solid var(--border-default);
  background: var(--bg-primary);
}

.input-field {
  flex: 1;
  height: 36px;
  padding: 0 10px;
  font-size: var(--font-size-base);
  font-family: var(--font-family);
  color: var(--text-primary);
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-xs);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.input-field:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: var(--shadow-focus), var(--shadow-xs);
}

.input-field::placeholder {
  color: var(--text-tertiary);
}
```

### Send Button

```css
.send-button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-primary);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background-color 0.15s;
}

.send-button:hover {
  background: var(--accent-hover);
}

.send-button:disabled {
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
  cursor: not-allowed;
}

.send-button:focus-visible {
  box-shadow: var(--shadow-focus);
  outline: none;
}
```

The send icon: a simple arrow (→) or paper plane, **not** a filled circle with an arrow. Use an SVG at 14px. Stroke-based, 1.5px stroke width.

### Loading Indicator

Three dots, sequential fade. Not bouncing, not scaling. Opacity pulse.

```css
.loading-dots {
  display: flex;
  gap: 4px;
  padding: 8px 10px;
}

.loading-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--text-tertiary);
  animation: dot-pulse 1.2s infinite ease-in-out;
}

.loading-dot:nth-child(2) { animation-delay: 0.2s; }
.loading-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes dot-pulse {
  0%, 60%, 100% { opacity: 0.3; }
  30% { opacity: 1; }
}
```

### Settings Screen

```css
.settings {
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  letter-spacing: var(--tracking-tight);
}

.settings-description {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  line-height: var(--line-height-base);
}

.settings-link {
  font-size: var(--font-size-sm);
  color: var(--text-link);
  text-decoration: none;
}

.settings-link:hover {
  text-decoration: underline;
}

.settings-button {
  width: 100%;
  height: 36px;
  background: var(--accent-primary);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background-color 0.15s;
}

.settings-button:hover {
  background: var(--accent-hover);
}
```

### Empty / Welcome State

When the chat is empty, show a centered prompt. Not a mascot. Not an illustration. Text.

```
          Ask me anything about the
          Simple Design System.

          Try: "When should I use Alert
          vs Toast?"
```

- Centered vertically and horizontally in the chat area
- Primary text: 13px, `--font-weight-medium`, `--text-secondary`
- Example text: 12px, `--font-weight-regular`, `--text-tertiary`
- Optional: make the example text clickable (sends it as a message)

---

## Scrollbar

```css
::-webkit-scrollbar {
  width: 4px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--border-default);
  border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--border-strong);
}
```

---

## Transitions

Keep it fast. 150ms for interactions, 200ms max.

```css
:root {
  --transition-fast:    0.1s ease;
  --transition-base:    0.15s ease;
  --transition-slow:    0.2s ease;
}
```

| Element | Property | Duration |
|---------|----------|----------|
| Button background | background-color | 0.15s |
| Input focus | border-color, box-shadow | 0.15s |
| Message appear | opacity | 0.15s |
| Hover color change | color, background | 0.1s |

No bouncy spring animations. No ease-in-out on everything. `ease` for enters, `ease` for exits.

---

## Iconography

- Use **Lucide** icons (stroke-based, 1.5px stroke)
- Icon size: 14px in UI, 16px only for the header brand mark
- Color: `--text-secondary` default, `--text-primary` on hover
- Never use filled icons (they're too heavy at small sizes)
- The plugin brand icon (◆): a simple diamond/gem shape in `--accent-primary`

---

## Responsive Behavior (Plugin Width)

The plugin panel can be resized by the user.

| Width | Behavior |
|-------|----------|
| 280px (min) | Full layout holds, messages compress, input wraps if needed |
| 320px | Default. Comfortable. Target this. |
| 400px+ | No change. Don't stretch elements. Max message width stays capped. |

Max message content width: `calc(100% - 24px)` (12px padding each side).

---

## Anti-Patterns (What NOT to Do)

| Don't | Why |
|-------|-----|
| Rounded pill-shaped buttons | Looks like a toy, not a tool |
| Gradient backgrounds | Adds visual noise with no function |
| Colored message bubbles (blue/green) | Distracting. Monochrome bubbles, accent on border. |
| Emoji as severity indicators | Unprofessional. Use text labels with color. |
| Animated message entry (slide-in) | Slow. Messages should appear instantly. |
| Background patterns or textures | This is a utility, not a landing page. |
| Multiple accent colors | One accent color. That's it. |
| Thick borders (2px+) | Heavy. 1px everywhere except the assistant message left accent. |
| Large font sizes (16px+ for body) | Plugin panel is narrow. Keep it compact. |
| Pure black (#000000) text | Too harsh. Use `--text-primary` (#30313D). |
| Pure white (#FFFFFF) dark mode bg | Blinding. Use `--bg-primary` dark values. |
| Box shadows on messages | Adds visual weight. Messages should be flat with borders. |

---

## Visual Reference: Complete Layout

```
360px wide
┌─────────────────────────────────────────┐
│  ◆ System Sidekick                        ⚙   │  header: 36px
├─────────────────────────────────────────┤
│  ▪ SELECTED · Button / filled / md      │  selection: 28px
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Which variant should I use for  │    │  user msg
│  │ a destructive action?           │    │
│  │                        10:24 AM │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌╴─────────────────────────────────┐   │
│  │ Use **ButtonDanger** for         │   │  assistant msg
│  │ destructive actions like delete  │   │  (2px left accent)
│  │ or remove.                       │   │
│  │                                  │   │
│  │ **Error** variant with token     │   │
│  │ `feedback.danger.bg` ensures     │   │
│  │ the action reads as destructive. │   │
│  │                                  │   │
│  │ If the action is reversible,     │   │
│  │ you could use a standard Button  │   │
│  │ with a confirmation dialog.      │   │
│  │                        10:24 AM  │   │
│  └──────────────────────────────────┘   │
│                                         │
│  ┌────────────────────────────── ┬───┐  │
│  │ Ask about components, a11y...  │ → │  │  input: 36px
│  └────────────────────────────── ┴───┘  │
│                                   8px   │
└─────────────────────────────────────────┘
```

---

## Implementation Checklist

When Claude Code builds the UI, verify:

- [ ] All colors use CSS custom properties (no hardcoded hex in components)
- [ ] Dark mode works via `prefers-color-scheme` media query
- [ ] No element uses pure black or pure white
- [ ] Only `--accent-primary` provides color (everything else is gray-scale)
- [ ] Font sizes are 10-16px range only
- [ ] All border-radius values are 2-8px (no pills, no circles except dots)
- [ ] Scrollbar is thin (4px) and subtle
- [ ] Focus states use `--shadow-focus` ring
- [ ] Transitions are 150ms or less
- [ ] Message bubbles have no box-shadow
- [ ] Assistant messages have the 2px left accent border
- [ ] Severity is communicated through text color, not backgrounds or badges
- [ ] The empty state is text-only, centered, no illustrations
- [ ] The plugin looks equally sharp at 280px and 400px width
