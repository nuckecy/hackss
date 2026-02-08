import { h } from 'preact';
import type { ResponseComponentProps } from '../../../types/responses';

function parseSuggestions(body: string): string[] {
  const lines = body.split('\n');
  const suggestions: string[] = [];
  let inSuggestionsSection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect "Did you mean" section
    if (trimmed.toLowerCase().includes('did you mean')) {
      inSuggestionsSection = true;
      continue;
    }

    // Collect bullet points
    if (inSuggestionsSection && trimmed.match(/^[-*•]\s/)) {
      suggestions.push(trimmed.replace(/^[-*•]\s/, ''));
    }

    // Stop at next section
    if (inSuggestionsSection && trimmed.toLowerCase().includes('try asking')) {
      break;
    }
  }

  return suggestions;
}

function parseRelatedQueries(body: string): string[] {
  const lines = body.split('\n');
  const queries: string[] = [];
  let inQueriesSection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect "Try asking" section
    if (trimmed.toLowerCase().includes('try asking')) {
      inQueriesSection = true;
      continue;
    }

    // Collect bullet points or quoted questions
    if (inQueriesSection && trimmed.match(/^[-*•]\s/)) {
      const query = trimmed.replace(/^[-*•]\s/, '').replace(/^[""](.+)[""]$/, '$1');
      queries.push(query);
    }
  }

  return queries;
}

function getMessage(body: string): string {
  const lines = body.split('\n');
  const paragraphs: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and headings
    if (!trimmed || trimmed.match(/^#{1,3}\s/)) continue;

    // Stop at first section
    if (trimmed.toLowerCase().includes('did you mean') ||
        trimmed.toLowerCase().includes('try asking') ||
        trimmed.toLowerCase().includes('note:')) {
      break;
    }

    paragraphs.push(trimmed);
  }

  return paragraphs.join(' ');
}

export function NotFoundResponse({ metadata, body }: ResponseComponentProps) {
  const { query, suggestions: metaSuggestions = [] } = metadata;
  const bodySuggestions = parseSuggestions(body);
  const relatedQueries = parseRelatedQueries(body);
  const message = getMessage(body);

  // Combine suggestions from metadata and body
  const allSuggestions = [...new Set([...metaSuggestions, ...bodySuggestions])];

  return (
    <div class="response-not-found">
      <div class="response-not-found-icon" aria-hidden="true">
        🔍
      </div>

      <h3 class="response-not-found-heading">Hmm, I couldn't find that</h3>

      {message && <p class="response-not-found-message">{message}</p>}

      {query && (
        <p class="response-not-found-query">
          <em>"{query}"</em>
        </p>
      )}

      {allSuggestions.length > 0 && (
        <div class="response-suggestions-section">
          <h4 class="response-section-heading">Did you mean:</h4>
          <div class="response-suggestion-chips">
            {allSuggestions.map((suggestion, idx) => (
              <button
                key={idx}
                class="response-suggestion-chip"
                type="button"
                aria-label={`Try "${suggestion}"`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {relatedQueries.length > 0 && (
        <div class="response-queries-section">
          <h4 class="response-section-heading">Try asking:</h4>
          <div class="response-related-queries">
            {relatedQueries.map((queryText, idx) => (
              <button
                key={idx}
                class="response-query-button"
                type="button"
                aria-label={`Ask: ${queryText}`}
              >
                {queryText}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
