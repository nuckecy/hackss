import { h } from 'preact';

interface ActionButtonProps {
  children: preact.ComponentChildren;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

/**
 * Action button for contextual actions in responses
 * Uses SDS Button pattern with variants
 */
export function ActionButton({
  children,
  onClick,
  variant = 'primary',
  disabled = false
}: ActionButtonProps) {
  return (
    <button
      class={`response-action-button response-action-button-${variant}`}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
}
