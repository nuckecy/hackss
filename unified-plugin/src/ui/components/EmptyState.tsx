import type { SelectionData } from '../../types/figma';
import './EmptyState.css';
import { t } from '../../i18n/i18n';

interface EmptyStateProps {
  selection: SelectionData | null;
  onExampleClick?: (text: string, topic: string) => void;
}

interface Chip {
  label: string;
  message: string;
  topic: string;
}

function getGeneralStarters(): Chip[] {
  return [
    { label: t('chips.general.alertVsToast'), message: t('chips.general.alertVsToastMsg'), topic: 'general.alertVsToast' },
    { label: t('chips.general.spacingTokens'), message: t('chips.general.spacingTokensMsg'), topic: 'general.spacingTokens' },
    { label: t('chips.general.accessibleForms'), message: t('chips.general.accessibleFormsMsg'), topic: 'general.accessibleForms' },
    { label: t('chips.general.buttonVariants'), message: t('chips.general.buttonVariantsMsg'), topic: 'general.buttonVariants' },
    { label: t('chips.general.colorContrast'), message: t('chips.general.colorContrastMsg'), topic: 'general.colorContrast' },
    { label: t('chips.general.typographyScale'), message: t('chips.general.typographyScaleMsg'), topic: 'general.typographyScale' },
    { label: t('chips.general.iconUsage'), message: t('chips.general.iconUsageMsg'), topic: 'general.iconUsage' },
    { label: t('chips.general.responsiveLayout'), message: t('chips.general.responsiveLayoutMsg'), topic: 'general.responsiveLayout' },
  ];
}

export function EmptyState({ selection, onExampleClick }: EmptyStateProps) {
  return (
    <div class="empty-state">
      <p class="empty-state-primary">
        {t('emptyState.welcome')}
      </p>
      <div class="empty-state-cloud">
        {getGeneralStarters().map((chip) => (
          <button
            key={chip.label}
            class="empty-state-chip"
            onClick={() => onExampleClick?.(chip.message, chip.topic)}
          >
            {chip.label}
          </button>
        ))}
      </div>
      {!selection && (
        <p class="empty-state-hint">
          {t('emptyState.hint')}
        </p>
      )}
    </div>
  );
}
