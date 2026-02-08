import type { SelectionData } from '../../types/figma';
import './SelectionIndicator.css';

interface SelectionIndicatorProps {
  selection: SelectionData | null;
  onClear?: () => void;
  onChipClick?: (text: string) => void;
  disabled?: boolean;
}

interface Chip {
  label: string;
  message: string;
}

function getSuggestions(selection: SelectionData | null): Chip[] {
  if (!selection) return [];

  const name = selection.componentName || selection.name;
  const type = selection.type;

  const scanChip: Chip = { label: 'Scan this element', message: `Scan "${name}"` };

  if (type === 'INSTANCE') {
    return [
      scanChip,
      { label: `Right use of ${name}?`, message: `Am I using ${name} correctly here? Does it follow the design system guidelines?` },
      { label: 'Available variants?', message: `What variants does ${name} have and which one fits best here?` },
      { label: 'Spacing review', message: `Does the spacing around ${name} look correct? Any token adjustments needed?` },
    ];
  }

  if (type === 'TEXT') {
    return [
      scanChip,
      { label: 'Contrast ratio', message: `Can you check the contrast ratio on "${name}" for WCAG AA compliance?` },
      { label: 'Correct token?', message: `Am I using the right typography token for "${name}"?` },
      { label: 'Font size review', message: `Is the font size on "${name}" appropriate for its context?` },
    ];
  }

  if (type === 'FRAME' || type === 'GROUP' || type === 'SECTION') {
    return [
      scanChip,
      { label: 'Check spacing', message: `Does the spacing inside "${name}" follow the design system tokens?` },
      { label: 'Accessibility issues?', message: `Are there any accessibility concerns with the layout of "${name}"?` },
      { label: 'Alignment check', message: `Can you check if the alignment in "${name}" is consistent and correct?` },
    ];
  }

  if (type === 'COMPONENT' || type === 'COMPONENT_SET') {
    return [
      scanChip,
      { label: `How to use ${name}?`, message: `How should ${name} be used according to the design system guidelines?` },
      { label: 'Accessibility reqs', message: `What accessibility requirements should ${name} meet?` },
      { label: 'Token usage?', message: `What design tokens does ${name} use and are they applied correctly?` },
    ];
  }

  return [
    scanChip,
    { label: `What is ${name}?`, message: `Can you tell me what "${name}" is and how it fits in the design system?` },
    { label: 'Any issues?', message: `Are there any design or accessibility issues with "${name}"?` },
    { label: 'How to improve?', message: `How can I improve "${name}" to better follow the design system?` },
  ];
}

export function SelectionIndicator({ selection, onClear }: SelectionIndicatorProps) {
  if (!selection) return null;

  const label = selection.componentName
    ? selection.type + ' \u00b7 ' + selection.componentName
    : selection.type + ' \u00b7 ' + selection.name;

  return (
    <div class="selection-strip">
      <span class="selection-overline">SELECTED</span>
      <span class="selection-dot">{'\u00b7'}</span>
      <span class="selection-value" title={label}>{label}</span>
      <button
        class="selection-clear"
        aria-label="Clear selection"
        onClick={onClear}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>
    </div>
  );
}

interface SuggestionPanelProps {
  selection: SelectionData | null;
  onChipClick?: (text: string) => void;
  disabled?: boolean;
}

export function SuggestionPanel({ selection, onChipClick, disabled }: SuggestionPanelProps) {
  if (!selection) return null;

  const suggestions = getSuggestions(selection);
  if (suggestions.length === 0) return null;

  const label = selection.componentName
    ? selection.type + ' \u00b7 ' + selection.componentName
    : selection.type + ' \u00b7 ' + selection.name;

  return (
    <div class="selection-panel">
      <div class="selection-panel-title">
        <span class="selection-overline">SELECTED</span>
        <span class="selection-dot">{'\u00b7'}</span>
        <span class="selection-value" title={label}>{label}</span>
      </div>
      <div class="suggestion-label">I noticed you selected something. Want me to help?</div>
      <div class="suggestion-list">
        {suggestions.map((chip) => (
          <button
            key={chip.label}
            class="suggestion-chip"
            disabled={disabled}
            onClick={() => onChipClick?.(chip.message)}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
