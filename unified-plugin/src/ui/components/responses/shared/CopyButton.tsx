import { h } from 'preact';
import { useState } from 'preact/hooks';

interface CopyButtonProps {
  text: string;
  label?: string;
}

/**
 * Copy to clipboard button with visual feedback
 * Meets WCAG 2.2 AA with proper focus indicators and keyboard support
 */
export function CopyButton({ text, label = 'Copy' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      class="response-copy-button"
      onClick={handleCopy}
      type="button"
      aria-label={copied ? 'Copied!' : `Copy ${label}`}
    >
      <span class="response-copy-icon" aria-hidden="true">
        {copied ? '✓' : '⎘'}
      </span>
      <span>{copied ? 'Copied!' : label}</span>
    </button>
  );
}
