import type { SelectionData } from '../../types/figma';
import './SuggestionChips.css';
import { t, tp } from '../../i18n/i18n';

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
      { label: tp('chips.instance.rightUse', { name }), message: `Am I using ${name} correctly here? Does it follow the design system guidelines?` },
      { label: t('chips.instance.accessibilityCheck'), message: `Can you run an accessibility check on ${name} and flag any issues?` },
      { label: t('chips.instance.availableVariants'), message: `What variants does ${name} have and which one fits best here?` },
    ];
  }

  if (type === 'TEXT') {
    return [
      { label: t('chips.text.textAccessible'), message: `Is this text element "${name}" accessible? Check size, weight, and contrast.` },
      { label: t('chips.text.contrastRatio'), message: `Can you check the contrast ratio on "${name}" for WCAG AA compliance?` },
      { label: t('chips.text.correctToken'), message: `Am I using the right typography token for "${name}"?` },
    ];
  }

  if (type === 'FRAME' || type === 'GROUP' || type === 'SECTION') {
    return [
      { label: t('chips.layout.reviewLayout'), message: `Can you review the layout of "${name}" and suggest improvements?` },
      { label: t('chips.layout.checkSpacing'), message: `Does the spacing inside "${name}" follow the design system tokens?` },
      { label: t('chips.layout.accessibilityIssues'), message: `Are there any accessibility concerns with the layout of "${name}"?` },
    ];
  }

  if (type === 'COMPONENT' || type === 'COMPONENT_SET') {
    return [
      { label: tp('chips.component.howToUse', { name }), message: `How should ${name} be used according to the design system guidelines?` },
      { label: t('chips.component.accessibilityReqs'), message: `What accessibility requirements should ${name} meet?` },
      { label: t('chips.component.tokenUsage'), message: `What design tokens does ${name} use and are they applied correctly?` },
    ];
  }

  return [
    { label: tp('chips.default.whatIs', { name }), message: `Can you tell me what "${name}" is and how it fits in the design system?` },
    { label: t('chips.default.anyIssues'), message: `Are there any design or accessibility issues with "${name}"?` },
    { label: t('chips.default.howToImprove'), message: `How can I improve "${name}" to better follow the design system?` },
  ];
}

export function SuggestionChips({ selection, onChipClick, visible }: SuggestionChipsProps) {
  if (!visible || !selection) return null;

  const suggestions = getSuggestions(selection);

  return (
    <div class="suggestion-chips">
      <div class="suggestion-label">{t('emptyState.selectionNotice')}</div>
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
