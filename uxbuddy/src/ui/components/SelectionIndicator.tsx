import type { SelectionData } from '../../types/figma';
import './SelectionIndicator.css';
import { t, tp } from '../../i18n/i18n';

interface SelectionIndicatorProps {
  selection: SelectionData | null;
  onClear?: () => void;
  onChipClick?: (text: string, topic: string) => void;
  disabled?: boolean;
}

export interface Chip {
  label: string;
  message: string;
  topic: string;
}

function getSuggestions(selection: SelectionData | null): Chip[] {
  if (!selection) return [];

  const name = selection.componentName || selection.name;
  const type = selection.type;

  const scanChip: Chip = { label: t('chips.scan'), message: tp('chips.scanMsg', { name }), topic: 'scan' };

  if (type === 'INSTANCE') {
    return [
      scanChip,
      { label: tp('chips.instance.rightUse', { name }), message: tp('chips.instance.rightUseMsg', { name }), topic: 'instance.rightUse' },
      { label: t('chips.instance.availableVariants'), message: tp('chips.instance.availableVariantsMsg', { name }), topic: 'instance.variants' },
      { label: t('chips.instance.spacingReview'), message: tp('chips.instance.spacingReviewMsg', { name }), topic: 'instance.spacing' },
    ];
  }

  if (type === 'TEXT') {
    return [
      scanChip,
      { label: t('chips.text.contrastRatio'), message: tp('chips.text.contrastRatioMsg', { name }), topic: 'text.contrast' },
      { label: t('chips.text.correctToken'), message: tp('chips.text.correctTokenMsg', { name }), topic: 'text.token' },
      { label: t('chips.text.fontSizeReview'), message: tp('chips.text.fontSizeReviewMsg', { name }), topic: 'text.fontSize' },
    ];
  }

  if (type === 'FRAME' || type === 'GROUP' || type === 'SECTION') {
    return [
      scanChip,
      { label: t('chips.layout.checkSpacing'), message: tp('chips.layout.checkSpacingMsg', { name }), topic: 'layout.spacing' },
      { label: t('chips.layout.accessibilityIssues'), message: tp('chips.layout.accessibilityIssuesMsg', { name }), topic: 'layout.accessibility' },
      { label: t('chips.layout.alignmentCheck'), message: tp('chips.layout.alignmentCheckMsg', { name }), topic: 'layout.alignment' },
    ];
  }

  if (type === 'COMPONENT' || type === 'COMPONENT_SET') {
    return [
      scanChip,
      { label: tp('chips.component.howToUse', { name }), message: tp('chips.component.howToUseMsg', { name }), topic: 'component.howToUse' },
      { label: t('chips.component.accessibilityReqs'), message: tp('chips.component.accessibilityReqsMsg', { name }), topic: 'component.accessibility' },
      { label: t('chips.component.tokenUsage'), message: tp('chips.component.tokenUsageMsg', { name }), topic: 'component.tokenUsage' },
    ];
  }

  return [
    scanChip,
    { label: tp('chips.default.whatIs', { name }), message: tp('chips.default.whatIsMsg', { name }), topic: 'default.whatIs' },
    { label: t('chips.default.anyIssues'), message: tp('chips.default.anyIssuesMsg', { name }), topic: 'default.anyIssues' },
    { label: t('chips.default.howToImprove'), message: tp('chips.default.howToImproveMsg', { name }), topic: 'default.howToImprove' },
  ];
}

export function getFollowUpSuggestions(topic: string, selection: SelectionData | null): Chip[] {
  const name = selection ? (selection.componentName || selection.name) : '';

  // After scan: show the non-scan chips for the current selection type
  if (topic === 'scan' && selection) {
    const type = selection.type;
    if (type === 'INSTANCE') return [
      { label: tp('chips.instance.rightUse', { name }), message: tp('chips.instance.rightUseMsg', { name }), topic: 'instance.rightUse' },
      { label: t('chips.instance.availableVariants'), message: tp('chips.instance.availableVariantsMsg', { name }), topic: 'instance.variants' },
      { label: t('chips.instance.spacingReview'), message: tp('chips.instance.spacingReviewMsg', { name }), topic: 'instance.spacing' },
    ];
    if (type === 'TEXT') return [
      { label: t('chips.text.contrastRatio'), message: tp('chips.text.contrastRatioMsg', { name }), topic: 'text.contrast' },
      { label: t('chips.text.correctToken'), message: tp('chips.text.correctTokenMsg', { name }), topic: 'text.token' },
      { label: t('chips.text.fontSizeReview'), message: tp('chips.text.fontSizeReviewMsg', { name }), topic: 'text.fontSize' },
    ];
    if (type === 'FRAME' || type === 'GROUP' || type === 'SECTION') return [
      { label: t('chips.layout.checkSpacing'), message: tp('chips.layout.checkSpacingMsg', { name }), topic: 'layout.spacing' },
      { label: t('chips.layout.accessibilityIssues'), message: tp('chips.layout.accessibilityIssuesMsg', { name }), topic: 'layout.accessibility' },
      { label: t('chips.layout.alignmentCheck'), message: tp('chips.layout.alignmentCheckMsg', { name }), topic: 'layout.alignment' },
    ];
    if (type === 'COMPONENT' || type === 'COMPONENT_SET') return [
      { label: tp('chips.component.howToUse', { name }), message: tp('chips.component.howToUseMsg', { name }), topic: 'component.howToUse' },
      { label: t('chips.component.accessibilityReqs'), message: tp('chips.component.accessibilityReqsMsg', { name }), topic: 'component.accessibility' },
      { label: t('chips.component.tokenUsage'), message: tp('chips.component.tokenUsageMsg', { name }), topic: 'component.tokenUsage' },
    ];
    return [
      { label: tp('chips.default.whatIs', { name }), message: tp('chips.default.whatIsMsg', { name }), topic: 'default.whatIs' },
      { label: t('chips.default.anyIssues'), message: tp('chips.default.anyIssuesMsg', { name }), topic: 'default.anyIssues' },
      { label: t('chips.default.howToImprove'), message: tp('chips.default.howToImproveMsg', { name }), topic: 'default.howToImprove' },
    ];
  }

  const map: Record<string, () => Chip[]> = {
    // Instance follow-ups: show sibling chips
    'instance.rightUse': () => [
      { label: t('chips.instance.availableVariants'), message: tp('chips.instance.availableVariantsMsg', { name }), topic: 'instance.variants' },
      { label: t('chips.instance.spacingReview'), message: tp('chips.instance.spacingReviewMsg', { name }), topic: 'instance.spacing' },
      { label: t('chips.scan'), message: tp('chips.scanMsg', { name }), topic: 'scan' },
    ],
    'instance.variants': () => [
      { label: tp('chips.instance.rightUse', { name }), message: tp('chips.instance.rightUseMsg', { name }), topic: 'instance.rightUse' },
      { label: t('chips.instance.spacingReview'), message: tp('chips.instance.spacingReviewMsg', { name }), topic: 'instance.spacing' },
      { label: t('chips.scan'), message: tp('chips.scanMsg', { name }), topic: 'scan' },
    ],
    'instance.spacing': () => [
      { label: tp('chips.instance.rightUse', { name }), message: tp('chips.instance.rightUseMsg', { name }), topic: 'instance.rightUse' },
      { label: t('chips.instance.availableVariants'), message: tp('chips.instance.availableVariantsMsg', { name }), topic: 'instance.variants' },
      { label: t('chips.scan'), message: tp('chips.scanMsg', { name }), topic: 'scan' },
    ],

    // Text follow-ups
    'text.contrast': () => [
      { label: t('chips.text.correctToken'), message: tp('chips.text.correctTokenMsg', { name }), topic: 'text.token' },
      { label: t('chips.text.fontSizeReview'), message: tp('chips.text.fontSizeReviewMsg', { name }), topic: 'text.fontSize' },
      { label: t('chips.scan'), message: tp('chips.scanMsg', { name }), topic: 'scan' },
    ],
    'text.token': () => [
      { label: t('chips.text.contrastRatio'), message: tp('chips.text.contrastRatioMsg', { name }), topic: 'text.contrast' },
      { label: t('chips.text.fontSizeReview'), message: tp('chips.text.fontSizeReviewMsg', { name }), topic: 'text.fontSize' },
      { label: t('chips.scan'), message: tp('chips.scanMsg', { name }), topic: 'scan' },
    ],
    'text.fontSize': () => [
      { label: t('chips.text.contrastRatio'), message: tp('chips.text.contrastRatioMsg', { name }), topic: 'text.contrast' },
      { label: t('chips.text.correctToken'), message: tp('chips.text.correctTokenMsg', { name }), topic: 'text.token' },
      { label: t('chips.scan'), message: tp('chips.scanMsg', { name }), topic: 'scan' },
    ],

    // Layout follow-ups
    'layout.spacing': () => [
      { label: t('chips.layout.accessibilityIssues'), message: tp('chips.layout.accessibilityIssuesMsg', { name }), topic: 'layout.accessibility' },
      { label: t('chips.layout.alignmentCheck'), message: tp('chips.layout.alignmentCheckMsg', { name }), topic: 'layout.alignment' },
      { label: t('chips.scan'), message: tp('chips.scanMsg', { name }), topic: 'scan' },
    ],
    'layout.accessibility': () => [
      { label: t('chips.layout.checkSpacing'), message: tp('chips.layout.checkSpacingMsg', { name }), topic: 'layout.spacing' },
      { label: t('chips.layout.alignmentCheck'), message: tp('chips.layout.alignmentCheckMsg', { name }), topic: 'layout.alignment' },
      { label: t('chips.scan'), message: tp('chips.scanMsg', { name }), topic: 'scan' },
    ],
    'layout.alignment': () => [
      { label: t('chips.layout.checkSpacing'), message: tp('chips.layout.checkSpacingMsg', { name }), topic: 'layout.spacing' },
      { label: t('chips.layout.accessibilityIssues'), message: tp('chips.layout.accessibilityIssuesMsg', { name }), topic: 'layout.accessibility' },
      { label: t('chips.scan'), message: tp('chips.scanMsg', { name }), topic: 'scan' },
    ],

    // Component follow-ups
    'component.howToUse': () => [
      { label: t('chips.component.accessibilityReqs'), message: tp('chips.component.accessibilityReqsMsg', { name }), topic: 'component.accessibility' },
      { label: t('chips.component.tokenUsage'), message: tp('chips.component.tokenUsageMsg', { name }), topic: 'component.tokenUsage' },
      { label: t('chips.scan'), message: tp('chips.scanMsg', { name }), topic: 'scan' },
    ],
    'component.accessibility': () => [
      { label: tp('chips.component.howToUse', { name }), message: tp('chips.component.howToUseMsg', { name }), topic: 'component.howToUse' },
      { label: t('chips.component.tokenUsage'), message: tp('chips.component.tokenUsageMsg', { name }), topic: 'component.tokenUsage' },
      { label: t('chips.scan'), message: tp('chips.scanMsg', { name }), topic: 'scan' },
    ],
    'component.tokenUsage': () => [
      { label: tp('chips.component.howToUse', { name }), message: tp('chips.component.howToUseMsg', { name }), topic: 'component.howToUse' },
      { label: t('chips.component.accessibilityReqs'), message: tp('chips.component.accessibilityReqsMsg', { name }), topic: 'component.accessibility' },
      { label: t('chips.scan'), message: tp('chips.scanMsg', { name }), topic: 'scan' },
    ],

    // Default follow-ups
    'default.whatIs': () => [
      { label: t('chips.default.anyIssues'), message: tp('chips.default.anyIssuesMsg', { name }), topic: 'default.anyIssues' },
      { label: t('chips.default.howToImprove'), message: tp('chips.default.howToImproveMsg', { name }), topic: 'default.howToImprove' },
      { label: t('chips.scan'), message: tp('chips.scanMsg', { name }), topic: 'scan' },
    ],
    'default.anyIssues': () => [
      { label: tp('chips.default.whatIs', { name }), message: tp('chips.default.whatIsMsg', { name }), topic: 'default.whatIs' },
      { label: t('chips.default.howToImprove'), message: tp('chips.default.howToImproveMsg', { name }), topic: 'default.howToImprove' },
      { label: t('chips.scan'), message: tp('chips.scanMsg', { name }), topic: 'scan' },
    ],
    'default.howToImprove': () => [
      { label: tp('chips.default.whatIs', { name }), message: tp('chips.default.whatIsMsg', { name }), topic: 'default.whatIs' },
      { label: t('chips.default.anyIssues'), message: tp('chips.default.anyIssuesMsg', { name }), topic: 'default.anyIssues' },
      { label: t('chips.scan'), message: tp('chips.scanMsg', { name }), topic: 'scan' },
    ],

    // General follow-ups (from EmptyState chips — no selection needed)
    'general.alertVsToast': () => [
      { label: t('chips.general.buttonVariants'), message: t('chips.general.buttonVariantsMsg'), topic: 'general.buttonVariants' },
      { label: t('chips.general.accessibleForms'), message: t('chips.general.accessibleFormsMsg'), topic: 'general.accessibleForms' },
      { label: t('chips.general.iconUsage'), message: t('chips.general.iconUsageMsg'), topic: 'general.iconUsage' },
    ],
    'general.spacingTokens': () => [
      { label: t('chips.general.typographyScale'), message: t('chips.general.typographyScaleMsg'), topic: 'general.typographyScale' },
      { label: t('chips.general.colorContrast'), message: t('chips.general.colorContrastMsg'), topic: 'general.colorContrast' },
      { label: t('chips.general.responsiveLayout'), message: t('chips.general.responsiveLayoutMsg'), topic: 'general.responsiveLayout' },
    ],
    'general.accessibleForms': () => [
      { label: t('chips.general.colorContrast'), message: t('chips.general.colorContrastMsg'), topic: 'general.colorContrast' },
      { label: t('chips.general.spacingTokens'), message: t('chips.general.spacingTokensMsg'), topic: 'general.spacingTokens' },
      { label: t('chips.general.buttonVariants'), message: t('chips.general.buttonVariantsMsg'), topic: 'general.buttonVariants' },
    ],
    'general.buttonVariants': () => [
      { label: t('chips.general.iconUsage'), message: t('chips.general.iconUsageMsg'), topic: 'general.iconUsage' },
      { label: t('chips.general.alertVsToast'), message: t('chips.general.alertVsToastMsg'), topic: 'general.alertVsToast' },
      { label: t('chips.general.colorContrast'), message: t('chips.general.colorContrastMsg'), topic: 'general.colorContrast' },
    ],
    'general.colorContrast': () => [
      { label: t('chips.general.accessibleForms'), message: t('chips.general.accessibleFormsMsg'), topic: 'general.accessibleForms' },
      { label: t('chips.general.typographyScale'), message: t('chips.general.typographyScaleMsg'), topic: 'general.typographyScale' },
      { label: t('chips.general.spacingTokens'), message: t('chips.general.spacingTokensMsg'), topic: 'general.spacingTokens' },
    ],
    'general.typographyScale': () => [
      { label: t('chips.general.spacingTokens'), message: t('chips.general.spacingTokensMsg'), topic: 'general.spacingTokens' },
      { label: t('chips.general.colorContrast'), message: t('chips.general.colorContrastMsg'), topic: 'general.colorContrast' },
      { label: t('chips.general.responsiveLayout'), message: t('chips.general.responsiveLayoutMsg'), topic: 'general.responsiveLayout' },
    ],
    'general.iconUsage': () => [
      { label: t('chips.general.buttonVariants'), message: t('chips.general.buttonVariantsMsg'), topic: 'general.buttonVariants' },
      { label: t('chips.general.responsiveLayout'), message: t('chips.general.responsiveLayoutMsg'), topic: 'general.responsiveLayout' },
      { label: t('chips.general.typographyScale'), message: t('chips.general.typographyScaleMsg'), topic: 'general.typographyScale' },
    ],
    'general.responsiveLayout': () => [
      { label: t('chips.general.spacingTokens'), message: t('chips.general.spacingTokensMsg'), topic: 'general.spacingTokens' },
      { label: t('chips.general.typographyScale'), message: t('chips.general.typographyScaleMsg'), topic: 'general.typographyScale' },
      { label: t('chips.general.iconUsage'), message: t('chips.general.iconUsageMsg'), topic: 'general.iconUsage' },
    ],
    'general.default': () => [
      { label: t('chips.general.spacingTokens'), message: t('chips.general.spacingTokensMsg'), topic: 'general.spacingTokens' },
      { label: t('chips.general.accessibleForms'), message: t('chips.general.accessibleFormsMsg'), topic: 'general.accessibleForms' },
      { label: t('chips.general.typographyScale'), message: t('chips.general.typographyScaleMsg'), topic: 'general.typographyScale' },
      { label: t('chips.general.colorContrast'), message: t('chips.general.colorContrastMsg'), topic: 'general.colorContrast' },
    ],
  };

  const getter = map[topic];
  return getter ? getter() : [];
}

export function detectTopicFromText(text: string, selection: SelectionData | null): string | null {
  const lower = text.toLowerCase();

  if (selection) {
    if (/\b(contrast|wcag|color ratio)\b/.test(lower)) return 'text.contrast';
    if (/\b(spacing|padding|margin|gap)\b/.test(lower)) return 'layout.spacing';
    if (/\b(accessibility|a11y|accessible)\b/.test(lower)) return 'layout.accessibility';
    if (/\b(variant)\b/.test(lower)) return 'instance.variants';
    if (/\b(alignment|align)\b/.test(lower)) return 'layout.alignment';
    if (/\b(token|design token)\b/.test(lower)) return 'component.tokenUsage';
    if (/\b(how to use|usage|guidelines)\b/.test(lower)) return 'component.howToUse';
    if (/\b(font|typography|text size|font size)\b/.test(lower)) return 'text.fontSize';
    if (/\b(issue|problem|wrong|fix)\b/.test(lower)) return 'default.anyIssues';
    if (/\b(improve|better|enhance)\b/.test(lower)) return 'default.howToImprove';
    if (/\b(what is|explain|tell me)\b/.test(lower)) return 'default.whatIs';
  }

  if (/\b(alert|toast|notification)\b/.test(lower)) return 'general.alertVsToast';
  if (/\b(button)\b/.test(lower)) return 'general.buttonVariants';
  if (/\b(icon)\b/.test(lower)) return 'general.iconUsage';
  if (/\b(form|forms|input|label)\b/.test(lower)) return 'general.accessibleForms';
  if (/\b(contrast|color)\b/.test(lower)) return 'general.colorContrast';
  if (/\b(spacing|space|spaces|token)\b/.test(lower)) return 'general.spacingTokens';
  if (/\b(font|typography|text)\b/.test(lower)) return 'general.typographyScale';
  if (/\b(responsive|layout|breakpoint)\b/.test(lower)) return 'general.responsiveLayout';
  if (/\b(accessibility|a11y|wcag|accessible)\b/.test(lower)) return 'general.accessibleForms';

  return null;
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
  onChipClick?: (text: string, topic: string) => void;
  disabled?: boolean;
  followUpChips?: Chip[];
}

export function SuggestionPanel({ selection, onChipClick, disabled, followUpChips }: SuggestionPanelProps) {
  // Show follow-up chips when available (works even without selection for general topics)
  if (followUpChips && followUpChips.length > 0) {
    return (
      <div class="selection-panel">
        <div class="suggestion-label">{t('emptyState.relatedQuestions')}</div>
        <div class="suggestion-list">
          {followUpChips.map((chip) => (
            <button
              key={chip.label}
              class="suggestion-chip"
              disabled={disabled}
              onClick={() => onChipClick?.(chip.message, chip.topic)}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // No follow-ups: show initial selection-based chips
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
            onClick={() => onChipClick?.(chip.message, chip.topic)}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
