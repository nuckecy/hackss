import { h } from 'preact';

interface CardProps {
  children: preact.ComponentChildren;
  className?: string;
}

/**
 * Card container component using SDS card pattern
 * Provides consistent spacing, borders, and background
 */
export function Card({ children, className = '' }: CardProps) {
  return (
    <div class={`response-card ${className}`.trim()}>
      {children}
    </div>
  );
}
