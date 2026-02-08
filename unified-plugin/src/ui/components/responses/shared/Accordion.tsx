import { h } from 'preact';
import { useState } from 'preact/hooks';

interface AccordionProps {
  summary: string;
  children: preact.ComponentChildren;
  defaultExpanded?: boolean;
}

/**
 * Collapsible accordion component for progressive disclosure
 * Meets WCAG 2.2 AA with keyboard support and proper ARIA attributes
 */
export function Accordion({ summary, children, defaultExpanded = false }: AccordionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div class="response-accordion">
      <button
        class="response-accordion-trigger"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        type="button"
      >
        <span class="response-accordion-icon" aria-hidden="true">
          {isExpanded ? '▼' : '▶'}
        </span>
        <span>{summary}</span>
      </button>
      {isExpanded && (
        <div class="response-accordion-content">
          {children}
        </div>
      )}
    </div>
  );
}
