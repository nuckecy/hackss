import type { SelectionData } from '../../types/figma';
import './EmptyState.css';
import { t, tp } from '../../i18n/i18n';

interface EmptyStateProps {
  selection: SelectionData | null;
  onExampleClick?: (text: string) => void;
}

interface Chip {
  label: string;
  message: string;
}

function getGeneralStarters(): Chip[] {
  return [
    { label: t('chips.general.alertVsToast'), message: 'When should I use an Alert instead of a Toast notification?' },
    { label: t('chips.general.spacingTokens'), message: 'What spacing tokens are available and when should I use each one?' },
    { label: t('chips.general.accessibleForms'), message: 'How do I make a form accessible following WCAG guidelines?' },
    { label: t('chips.general.buttonVariants'), message: 'What button variants are available and when should I use each one?' },
    { label: t('chips.general.colorContrast'), message: 'What are the color contrast requirements I need to follow?' },
    { label: t('chips.general.typographyScale'), message: 'Can you walk me through the typography scale and when to use each size?' },
    { label: t('chips.general.iconUsage'), message: 'What are the best practices for using icons in the design system?' },
    { label: t('chips.general.responsiveLayout'), message: 'How should I handle responsive layouts with the design system?' },
  ];
}

function getSelectionChips(selection: SelectionData): Chip[] {
  const name = selection.componentName || selection.name;
  const type = selection.type;

  if (type === 'INSTANCE') {
    return [
      { label: tp('chips.instance.rightUse', { name }), message: `Am I using ${name} correctly here? Does it follow the design system guidelines?` },
      { label: t('chips.instance.accessibilityCheck'), message: `Can you run an accessibility check on ${name} and flag any issues?` },
      { label: t('chips.instance.availableVariants'), message: `What variants does ${name} have and which one fits best here?` },
      { label: t('chips.instance.spacingReview'), message: `Does the spacing around ${name} look correct? Any token adjustments needed?` },
    ];
  }

  if (type === 'TEXT') {
    return [
      { label: t('chips.text.textAccessible'), message: `Is this text element "${name}" accessible? Check size, weight, and contrast.` },
      { label: t('chips.text.contrastRatio'), message: `Can you check the contrast ratio on "${name}" for WCAG AA compliance?` },
      { label: t('chips.text.correctToken'), message: `Am I using the right typography token for "${name}"?` },
      { label: t('chips.text.fontSizeReview'), message: `Is the font size on "${name}" appropriate for its context?` },
    ];
  }

  if (type === 'FRAME' || type === 'GROUP' || type === 'SECTION') {
    return [
      { label: t('chips.layout.reviewLayout'), message: `Can you review the layout of "${name}" and suggest improvements?` },
      { label: t('chips.layout.checkSpacing'), message: `Does the spacing inside "${name}" follow the design system tokens?` },
      { label: t('chips.layout.accessibilityIssues'), message: `Are there any accessibility concerns with the layout of "${name}"?` },
      { label: t('chips.layout.alignmentCheck'), message: `Can you check if the alignment in "${name}" is consistent and correct?` },
    ];
  }

  if (type === 'COMPONENT' || type === 'COMPONENT_SET') {
    return [
      { label: tp('chips.component.howToUse', { name }), message: `How should ${name} be used according to the design system guidelines?` },
      { label: t('chips.component.accessibilityReqs'), message: `What accessibility requirements should ${name} meet?` },
      { label: t('chips.component.tokenUsage'), message: `What design tokens does ${name} use and are they applied correctly?` },
      { label: t('chips.component.bestPractices'), message: `What are the best practices for implementing ${name}?` },
    ];
  }

  return [
    { label: tp('chips.default.whatIs', { name }), message: `Can you tell me what "${name}" is and how it fits in the design system?` },
    { label: t('chips.default.anyIssues'), message: `Are there any design or accessibility issues with "${name}"?` },
    { label: t('chips.default.howToImprove'), message: `How can I improve "${name}" to better follow the design system?` },
    { label: t('chips.instance.accessibilityCheck'), message: `Can you run an accessibility check on "${name}" and flag any issues?` },
  ];
}

export function EmptyState({ selection, onExampleClick }: EmptyStateProps) {
  const hasSelection = !!selection;
  const chips = hasSelection
    ? getSelectionChips(selection)
    : getGeneralStarters();

  return (
    <div class="empty-state">
      <p class="empty-state-primary">
        {hasSelection
          ? t('emptyState.selectionNotice')
          : t('emptyState.welcome')}
      </p>
      <div class="empty-state-cloud">
        {chips.map((chip) => (
          <button
            key={chip.label}
            class={`empty-state-chip ${hasSelection ? 'empty-state-chip--selection' : ''}`}
            onClick={() => onExampleClick?.(chip.message)}
          >
            {chip.label}
          </button>
        ))}
      </div>
      {!hasSelection && (
        <p class="empty-state-hint">
          {t('emptyState.hint')}
        </p>
      )}
    </div>
  );
}
