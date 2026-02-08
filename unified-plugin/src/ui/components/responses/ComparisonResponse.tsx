import { h } from 'preact';
import type { ResponseComponentProps } from '../../../types/responses';
import { Card } from './shared/Card';
import { ActionButtons } from './shared/ActionButtons';
import { Accordion } from './shared/Accordion';

interface ComparisonOption {
  name: string;
  useFor?: string;
  trigger?: string;
  content?: string;
  example?: string;
}

function parseComparisonCards(body: string, options: string[] = []): ComparisonOption[] {
  const lines = body.split('\n');
  const cards: ComparisonOption[] = [];
  let currentCard: ComparisonOption | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect card heading (bold component name)
    const boldMatch = trimmed.match(/^\*\*(.+?)\*\*$/);
    if (boldMatch) {
      if (currentCard) cards.push(currentCard);
      currentCard = { name: boldMatch[1] };
      continue;
    }

    if (currentCard) {
      // Parse key-value lines
      if (trimmed.toLowerCase().startsWith('use for:')) {
        currentCard.useFor = trimmed.replace(/^use for:\s*/i, '');
      } else if (trimmed.toLowerCase().startsWith('trigger:')) {
        currentCard.trigger = trimmed.replace(/^trigger:\s*/i, '');
      } else if (trimmed.toLowerCase().startsWith('content:')) {
        currentCard.content = trimmed.replace(/^content:\s*/i, '');
      } else if (trimmed.toLowerCase().startsWith('example:')) {
        currentCard.example = trimmed.replace(/^example:\s*/i, '');
      }
    }
  }

  if (currentCard) cards.push(currentCard);

  // If we couldn't parse cards but have options, create skeleton cards
  if (cards.length === 0 && options.length > 0) {
    return options.map(opt => ({ name: opt }));
  }

  return cards;
}

function parseRecommendation(body: string): string {
  const lines = body.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    // Find recommendation line (starts with **Recommendation:**)
    if (trimmed.toLowerCase().startsWith('**recommendation:**')) {
      return trimmed.replace(/^\*\*recommendation:\*\*\s*/i, '');
    }
  }

  return '';
}

export function ComparisonResponse({ metadata, body, action, quickActions }: ResponseComponentProps) {
  const { options = [] } = metadata;
  const cards = parseComparisonCards(body, options);
  const recommendation = parseRecommendation(body);

  return (
    <div class="response-comparison">
      <ActionButtons action={action} quickActions={quickActions} />

      {cards.length > 0 && (
        <Accordion summary={`Options (${cards.length})`} defaultExpanded={false}>
          <div class="response-comparison-grid">
            {cards.map((card, idx) => (
              <Card key={idx} className="response-comparison-card">
                <h4 class="response-comparison-card-name">{card.name}</h4>
                {card.useFor && (
                  <p class="response-comparison-item">
                    <strong>Use for:</strong> {card.useFor}
                  </p>
                )}
                {card.trigger && (
                  <p class="response-comparison-item">
                    <strong>Trigger:</strong> {card.trigger}
                  </p>
                )}
                {card.content && (
                  <p class="response-comparison-item">
                    <strong>Content:</strong> {card.content}
                  </p>
                )}
                {card.example && (
                  <p class="response-comparison-example">
                    <em>Example: {card.example}</em>
                  </p>
                )}
              </Card>
            ))}
          </div>
        </Accordion>
      )}

      {recommendation && (
        <Accordion summary="Recommendation" defaultExpanded={false}>
          <div class="response-recommendation">
            <p>{recommendation}</p>
          </div>
        </Accordion>
      )}
    </div>
  );
}
