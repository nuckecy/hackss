import { h } from 'preact';
import type { ResponseComponentProps } from '../../../types/responses';
import { CopyButton } from './shared/CopyButton';

function parseUseCases(body: string): string[] {
  const lines = body.split('\n');
  const cases: string[] = [];
  let inUseCasesSection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect "Common Uses" or "Usage" section
    if (trimmed.toLowerCase().includes('common') || trimmed.toLowerCase().includes('usage')) {
      inUseCasesSection = true;
      continue;
    }

    // Collect bullet points
    if (inUseCasesSection && trimmed.match(/^[-*•]\s/)) {
      cases.push(trimmed.replace(/^[-*•]\s/, ''));
    }

    // Stop at next section
    if (inUseCasesSection && (trimmed.match(/^#{1,3}\s/) || (cases.length > 0 && !trimmed))) {
      break;
    }
  }

  return cases;
}

interface TokenSwatchProps {
  category: string;
  value: string;
}

function TokenSwatch({ category, value }: TokenSwatchProps) {
  if (category === 'color') {
    return (
      <div class="token-swatch token-swatch-color-wrapper">
        <div
          class="token-swatch-color"
          style={{ backgroundColor: value }}
          aria-label={`Color swatch: ${value}`}
        />
        <span class="token-value">{value}</span>
      </div>
    );
  }

  if (category === 'spacing') {
    const pixels = parseInt(value);
    if (!isNaN(pixels)) {
      return (
        <div class="token-swatch token-swatch-spacing-wrapper">
          <div
            class="token-swatch-spacing"
            style={{ width: `${pixels}px` }}
            aria-label={`Spacing bar: ${pixels}px`}
          />
          <span class="token-value">{value}</span>
        </div>
      );
    }
  }

  if (category === 'typography') {
    return (
      <div class="token-swatch token-swatch-typography">
        <span style={{ fontSize: value }} aria-label={`Typography sample: ${value}`}>
          Aa
        </span>
        <span class="token-value">{value}</span>
      </div>
    );
  }

  // Default: just show value
  return <span class="token-value">{value}</span>;
}

export function TokenResponse({ metadata, body }: ResponseComponentProps) {
  const { tokenName, category, value } = metadata;
  const useCases = parseUseCases(body);

  return (
    <div class="response-token">
      {tokenName && (
        <div class="response-token-header">
          <code class="response-token-name">{tokenName}</code>
          {tokenName && <CopyButton text={tokenName} label="Copy token" />}
        </div>
      )}

      {category && value && (
        <div class="response-token-preview">
          <TokenSwatch category={category} value={value} />
          {value && <CopyButton text={value} label="Copy value" />}
        </div>
      )}

      {category && (
        <p class="response-token-category">
          <strong>Category:</strong> {category}
        </p>
      )}

      {useCases.length > 0 && (
        <div class="response-token-usage">
          <h4 class="response-section-heading">Common Uses</h4>
          <ul class="response-usage-list">
            {useCases.map((useCase, idx) => (
              <li key={idx}>{useCase}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
