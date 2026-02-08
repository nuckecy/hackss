import { h } from 'preact';
import { PlacementButton } from '../../PlacementButton';

interface ActionButtonsProps {
  action?: any;
  quickActions?: Array<{ label: string; onClick: () => void; icon?: string }>;
}

export function ActionButtons({ action, quickActions }: ActionButtonsProps) {
  // Don't render anything if no actions
  if (!action && (!quickActions || quickActions.length === 0)) {
    return null;
  }

  return (
    <div class="response-action-buttons">
      {action && action.type === 'place_component' && (
        <PlacementButton action={action} />
      )}
      {quickActions && quickActions.length > 0 && (
        <div class="message-quick-actions">
          {quickActions.map((qa, idx) => (
            <button
              key={idx}
              class="quick-action-button"
              onClick={qa.onClick}
            >
              {qa.icon && <span class="material-symbols-outlined">{qa.icon}</span>}
              {qa.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
