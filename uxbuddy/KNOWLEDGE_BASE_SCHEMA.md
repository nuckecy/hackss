# System Sidekick — Knowledge Base Schema

This document defines the JSON schema for all three knowledge base files. Use this as the authoritative reference when building or extending the knowledge base.

---

## 1. components.json

An array of `ComponentEntry` objects.

```json
{
  "$schema": "ComponentEntry[]",
  "example": {
    "id": "button",
    "name": "Button",
    "description": "A clickable element that triggers an action. The primary interactive control in the design system.",
    "category": "buttons",
    "figma_component_key": "9762:426",
    "variants": {
      "style": ["filled", "outlined", "ghost"],
      "size": ["small", "medium", "large"],
      "state": ["default", "hover", "active", "focus", "disabled"]
    },
    "properties": {
      "label": {
        "type": "string",
        "required": true,
        "description": "The visible text on the button"
      },
      "icon_leading": {
        "type": "instance_swap",
        "required": false,
        "description": "Optional icon before the label"
      },
      "icon_trailing": {
        "type": "instance_swap",
        "required": false,
        "description": "Optional icon after the label"
      },
      "disabled": {
        "type": "boolean",
        "required": false,
        "default": false,
        "description": "Disables the button and applies disabled styling"
      }
    },
    "tokens": {
      "background_filled": "interactive.primary.default",
      "background_outlined": "transparent",
      "background_ghost": "transparent",
      "text_filled": "text.on-color",
      "text_outlined": "interactive.primary.default",
      "border_outlined": "interactive.primary.default",
      "border_radius": "radius.md",
      "padding_horizontal": "space.400",
      "padding_vertical": "space.200",
      "min_height_small": "32px",
      "min_height_medium": "40px",
      "min_height_large": "48px",
      "font_size": "14px",
      "font_weight": "600"
    },
    "accessibility": {
      "role": "button",
      "min_touch_target": "44x44px (use padding to meet this if component is smaller)",
      "contrast_ratio": "4.5:1 for button text against background",
      "focus_indicator": "Required. 2px outline with 2px offset, using focus ring token",
      "aria_label": "Required ONLY if the button has no visible text (icon-only)",
      "keyboard": "Activate with Enter or Space. Must be focusable (not if disabled).",
      "disabled_handling": "Use aria-disabled='true' instead of removing from tab order. Provide tooltip explaining why disabled."
    },
    "usage": {
      "do": [
        "Use for triggering actions (submit, save, delete, confirm)",
        "Use filled variant for the primary/most important action on the page",
        "Use outlined variant for secondary actions",
        "Use ghost variant for tertiary or low-emphasis actions",
        "Limit to ONE filled button per view/section",
        "Use clear, action-oriented labels (e.g., 'Save changes' not 'OK')",
        "Provide visual feedback on interaction (hover, active states)"
      ],
      "dont": [
        "Don't use for navigation (use Link component instead)",
        "Don't use more than one filled button in a button group",
        "Don't disable buttons without explaining why (use tooltip)",
        "Don't use vague labels like 'Click here' or 'Submit'",
        "Don't change button style/variant based on hover state",
        "Don't make buttons look like links or links look like buttons"
      ]
    },
    "related_components": ["IconButton", "ButtonDanger", "ButtonGroup"]
  }
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique lowercase identifier |
| `name` | string | ✅ | Display name (PascalCase) |
| `description` | string | ✅ | One-sentence description of the component's purpose |
| `category` | string | ✅ | Grouping category (buttons, inputs, feedback, navigation, layout, content, avatars, cards) |
| `figma_component_key` | string | ❌ | Node ID from the SDS Figma file |
| `variants` | object | ✅ | Map of variant dimension name to array of option values |
| `properties` | object | ✅ | Map of property name to { type, required, default?, description? } |
| `tokens` | object | ✅ | Map of token purpose to token name or CSS value |
| `accessibility` | object | ✅ | Accessibility requirements specific to this component |
| `usage` | object | ✅ | { do: string[], dont: string[] } usage guidelines |
| `related_components` | string[] | ✅ | Names of related components |

---

## 2. accessibility.json

An array of `AccessibilityRule` objects.

```json
{
  "$schema": "AccessibilityRule[]",
  "example": {
    "id": "contrast-minimum",
    "title": "Color Contrast (Minimum)",
    "wcag_criterion": "1.4.3",
    "level": "AA",
    "description": "Text must have sufficient contrast against its background to be readable by people with moderately low vision.",
    "requirement": "Normal text (under 18px or under 14px bold): minimum 4.5:1 contrast ratio. Large text (18px+ or 14px+ bold): minimum 3:1 contrast ratio.",
    "how_to_check": "Use a contrast checker tool. In Figma, compare the text fill color against the background fill color. Account for opacity. Check ALL text states including hover, focus, disabled, and error.",
    "common_violations": [
      "Light gray text on white backgrounds (e.g., placeholder text, disabled states)",
      "Colored text on colored backgrounds without checking ratio",
      "Text over images or gradients without overlay",
      "Reduced opacity making text too transparent",
      "Error text in red that doesn't meet ratio against its background"
    ],
    "applies_to": ["buttons", "inputs", "feedback", "navigation", "content", "cards"]
  }
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique identifier (kebab-case) |
| `title` | string | ✅ | Human-readable rule title |
| `wcag_criterion` | string | ✅ | WCAG criterion number (e.g., "1.4.3") |
| `level` | string | ✅ | "A", "AA", or "AAA" |
| `description` | string | ✅ | Plain-language explanation of the rule |
| `requirement` | string | ✅ | Specific technical requirement |
| `how_to_check` | string | ✅ | Practical steps to verify compliance in Figma |
| `common_violations` | string[] | ✅ | Typical ways this rule gets violated |
| `applies_to` | string[] | ✅ | Component categories this rule is relevant to |

---

## 3. tokens.json

An array of `TokenEntry` objects, organized by category.

```json
{
  "$schema": "TokenEntry[]",
  "example": {
    "name": "interactive.primary.default",
    "value": "#2563EB",
    "category": "color",
    "description": "Primary interactive color for buttons, links, and active elements",
    "usage_context": "Use for filled button backgrounds, link text color, active tab indicators, checkbox checked state"
  }
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Token name as used in the design system |
| `value` | string | ✅ | Resolved value (hex color, px, font string) |
| `category` | string | ✅ | "color", "spacing", "typography", "radius", "shadow", "border" |
| `description` | string | ✅ | What the token represents |
| `usage_context` | string | ✅ | Where and when to use this token |

### Token Categories to Include

**Colors**: primary, secondary, danger, warning, success, info, background, surface, text-primary, text-secondary, text-disabled, border-default, border-strong, focus-ring

**Spacing**: space-050 (2px), space-100 (4px), space-200 (8px), space-300 (12px), space-400 (16px), space-500 (24px), space-600 (32px), space-800 (48px)

**Typography**: heading-xl, heading-lg, heading-md, heading-sm, body-lg, body-md, body-sm, caption, overline

**Radius**: radius-none (0), radius-sm (4px), radius-md (6px), radius-lg (8px), radius-xl (12px), radius-full (9999px)

---

## 4. patterns.json

An array of `DesignPattern` objects. Each pattern provides a decision framework for a specific design scenario, with cross-references to existing KB entries instead of duplicating facts.

```json
{
  "$schema": "DesignPattern[]",
  "example": {
    "id": "button-hierarchy",
    "title": "Button Hierarchy in Action Groups",
    "category": "component-usage",
    "rule": "One filled (primary action) button per action group. Forward-progress action gets filled; alternatives get outlined or ghost.",
    "decision_framework": {
      "steps": [
        "Identify the user's forward-progress goal",
        "Assign filled variant to that action",
        "Assign outlined to secondary actions",
        "Assign ghost to dismissive actions"
      ]
    },
    "reasoning": ["flow_progression", "decision_clarity", "cognitive_load"],
    "common_violations": ["Multiple filled buttons in one group"],
    "guidance_approach": "Recommend and explain using variant names. Don't auto-fix.",
    "see_also": ["Button.usage", "Button.variants"]
  }
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (kebab-case) |
| `title` | string | Yes | Human-readable pattern title |
| `category` | string | Yes | Grouping category (see below) |
| `rule` | string | Yes | Core principle statement in one sentence |
| `decision_framework` | object | Yes | Steps or decision tree for applying the pattern |
| `reasoning` | string[] | Yes | Why the pattern exists (system principles, not generic UX) |
| `common_violations` | string[] | Yes | Typical ways this pattern gets violated |
| `guidance_approach` | string | Yes | How to communicate findings to designers |
| `see_also` | string[] | No | Cross-references to related KB entries (e.g., "Button.usage") |

### Pattern Categories

- **component-usage**: How to choose and combine components (e.g., button hierarchy, input vs select)
- **layout**: Spacing, alignment, and structural patterns
- **token-strategy**: When and how to apply design tokens
- **flow-design**: Multi-screen flow and journey-level patterns

### Guidelines for Adding New Patterns

1. **Reference, don't repeat**: If the information exists in components.json, accessibility.json, or tokens.json, use `see_also` instead of restating it.
2. **Use system terminology**: Use actual variant names (filled/outlined/ghost), token names (space.4), and component names (Select/Input) from the existing KB.
3. **Focus on decisions**: Patterns should answer "when do I use X vs Y?" and "why does this matter?" -- not repeat component specs.
4. **Keep it compact**: Each pattern should be under 2KB. The full file should stay under 10KB.

---

## Enrichment Guidelines

When manually enriching auto-extracted data:

1. **Descriptions**: Write from the designer's perspective ("Use this when..." not "This component renders...")
2. **Accessibility**: Be specific about WCAG criteria numbers. Include keyboard interaction patterns.
3. **Usage do/dont**: Write actionable, scenario-based guidelines. Avoid vague rules.
4. **Tokens**: Always include the resolved value AND the token name. Designers think in both.
5. **Related components**: Help designers find alternatives ("If this isn't right, try X instead")
6. **Patterns**: Add decision frameworks for cross-component scenarios. Use `see_also` to reference existing KB entries rather than duplicating information.
