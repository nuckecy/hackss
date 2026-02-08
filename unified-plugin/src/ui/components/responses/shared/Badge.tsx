import { h } from 'preact';

interface BadgeProps {
  children: preact.ComponentChildren;
  variant?: 'success' | 'info' | 'warning' | 'error' | 'neutral';
}

/**
 * Badge component for status indicators and labels
 * Uses SDS Tag pattern with semantic color variants
 */
export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  return (
    <span class={`response-badge response-badge-${variant}`}>
      {children}
    </span>
  );
}
