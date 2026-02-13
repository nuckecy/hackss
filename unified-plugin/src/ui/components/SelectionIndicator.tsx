import type { SelectionData } from '../../types/figma';
import './SelectionIndicator.css';
import { t, tp } from '../../i18n/i18n';

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

  const scanChip: Chip = { label: t('chips.scan'), message: tp('chips.scanMsg', { name }) };

  if (type === 'INSTANCE') {
    return [
      scanChip,
      { label: tp('chips.instance.rightUse', { name }), message: tp('chips.instance.rightUseMsg', { name }) },
      { label: t('chips.instance.availableVariants'), message: tp('chips.instance.availableVariantsMsg', { name }) },
      { label: t('chips.instance.spacingReview'), message: tp('chips.instance.spacingReviewMsg', { name }) },
    ];
  }

  if (type === 'TEXT') {
    return [
      scanChip,
      { label: t('chips.text.contrastRatio'), message: tp('chips.text.contrastRatioMsg', { name }) },
      { label: t('chips.text.correctToken'), message: tp('chips.text.correctTokenMsg', { name }) },
      { label: t('chips.text.fontSizeReview'), message: tp('chips.text.fontSizeReviewMsg', { name }) },
    ];
  }

  if (type === 'FRAME' || type === 'GROUP' || type === 'SECTION') {
    return [
      scanChip,
      { label: t('chips.layout.checkSpacing'), message: tp('chips.layout.checkSpacingMsg', { name }) },
      { label: t('chips.layout.accessibilityIssues'), message: tp('chips.layout.accessibilityIssuesMsg', { name }) },
      { label: t('chips.layout.alignmentCheck'), message: tp('chips.layout.alignmentCheckMsg', { name }) },
    ];
  }

  if (type === 'COMPONENT' || type === 'COMPONENT_SET') {
    return [
      scanChip,
      { label: tp('chips.component.howToUse', { name }), message: tp('chips.component.howToUseMsg', { name }) },
      { label: t('chips.component.accessibilityReqs'), message: tp('chips.component.accessibilityReqsMsg', { name }) },
      { label: t('chips.component.tokenUsage'), message: tp('chips.component.tokenUsageMsg', { name }) },
    ];
  }

  return [
    scanChip,
    { label: tp('chips.default.whatIs', { name }), message: tp('chips.default.whatIsMsg', { name }) },
    { label: t('chips.default.anyIssues'), message: tp('chips.default.anyIssuesMsg', { name }) },
    { label: t('chips.default.howToImprove'), message: tp('chips.default.howToImproveMsg', { name }) },
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
      <div class="suggestion-label">{t('emptyState.selectionNotice')}</div>
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
