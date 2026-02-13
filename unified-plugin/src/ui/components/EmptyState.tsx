import type { SelectionData } from '../../types/figma';
import './EmptyState.css';
import { t } from '../../i18n/i18n';

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
    { label: t('chips.general.alertVsToast'), message: t('chips.general.alertVsToastMsg') },
    { label: t('chips.general.spacingTokens'), message: t('chips.general.spacingTokensMsg') },
    { label: t('chips.general.accessibleForms'), message: t('chips.general.accessibleFormsMsg') },
    { label: t('chips.general.buttonVariants'), message: t('chips.general.buttonVariantsMsg') },
    { label: t('chips.general.colorContrast'), message: t('chips.general.colorContrastMsg') },
    { label: t('chips.general.typographyScale'), message: t('chips.general.typographyScaleMsg') },
    { label: t('chips.general.iconUsage'), message: t('chips.general.iconUsageMsg') },
    { label: t('chips.general.responsiveLayout'), message: t('chips.general.responsiveLayoutMsg') },
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
            onClick={() => onExampleClick?.(chip.message)}
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
