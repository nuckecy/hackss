import type { SelectionData } from '../../types/figma';
import './SuggestionChips.css';

interface SuggestionChipsProps {
  selection: SelectionData | null;
  onChipClick: (text: string) => void;
  visible: boolean;
}

interface Chip {
  label: string;
  message: string;
}

function getSuggestions(selection: SelectionData | null): Chip[] {
  if (!selection) return [];

  const name = selection.componentName || selection.name;
  const type = selection.type;

  if (type === 'INSTANCE') {
    return [
      { label: `Right use of ${name}?`, message: `Am I using ${name} correctly here? Does it follow the design system guidelines?` },
      { label: 'Accessibility check', message: `Can you run an accessibility check on ${name} and flag any issues?` },
      { label: 'Available variants?', message: `What variants does ${name} have and which one fits best here?` },
    ];
  }

  if (type === 'TEXT') {
    return [
      { label: 'Text accessible?', message: `Is this text element "${name}" accessible? Check size, weight, and contrast.` },
      { label: 'Contrast ratio', message: `Can you check the contrast ratio on "${name}" for WCAG AA compliance?` },
      { label: 'Correct token?', message: `Am I using the right typography token for "${name}"?` },
    ];
  }

  if (type === 'FRAME' || type === 'GROUP' || type === 'SECTION') {
    return [
      { label: 'Review layout', message: `Can you review the layout of "${name}" and suggest improvements?` },
      { label: 'Check spacing', message: `Does the spacing inside "${name}" follow the design system tokens?` },
      { label: 'Accessibility issues?', message: `Are there any accessibility concerns with the layout of "${name}"?` },
    ];
  }

  if (type === 'COMPONENT' || type === 'COMPONENT_SET') {
    return [
      { label: `How to use ${name}?`, message: `How should ${name} be used according to the design system guidelines?` },
      { label: 'Accessibility reqs', message: `What accessibility requirements should ${name} meet?` },
      { label: 'Token usage?', message: `What design tokens does ${name} use and are they applied correctly?` },
    ];
  }

  return [
    { label: `What is ${name}?`, message: `Can you tell me what "${name}" is and how it fits in the design system?` },
    { label: 'Any issues?', message: `Are there any design or accessibility issues with "${name}"?` },
    { label: 'How to improve?', message: `How can I improve "${name}" to better follow the design system?` },
  ];
}

export function SuggestionChips({ selection, onChipClick, visible }: SuggestionChipsProps) {
  if (!visible || !selection) return null;

  const suggestions = getSuggestions(selection);

  return (
    <div class="suggestion-chips">
      <div class="suggestion-label">I noticed you selected something. Want me to help?</div>
      <div class="suggestion-list">
        {suggestions.map((chip) => (
          <button
            key={chip.label}
            class="suggestion-chip"
            onClick={() => onChipClick(chip.message)}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
