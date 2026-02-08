import { h } from 'preact';
import type { ResponseComponentProps } from '../../../types/responses';
import { Badge } from './shared/Badge';
import { Accordion } from './shared/Accordion';

function parseComponentList(body: string): string[] {
  const lines = body.split('\n');
  const components: string[] = [];
  let inComponentSection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect "Which SDS Components" section
    if (trimmed.toLowerCase().includes('which') && trimmed.toLowerCase().includes('component')) {
      inComponentSection = true;
      continue;
    }

    // Collect bullet points
    if (inComponentSection && trimmed.match(/^[-*•]\s/)) {
      components.push(trimmed.replace(/^[-*•]\s/, ''));
    }

    // Stop at next section
    if (inComponentSection && trimmed.match(/^#{1,3}\s/)) {
      break;
    }
  }

  return components;
}

function parseExamples(body: string): { dos: string[]; donts: string[] } {
  const lines = body.split('\n');
  const dos: string[] = [];
  const donts: string[] = [];
  let inExamplesSection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect examples section
    if (trimmed.toLowerCase().includes('example')) {
      inExamplesSection = true;
      continue;
    }

    if (inExamplesSection) {
      // Match ✓ Do: or ✓ Do patterns
      if (trimmed.match(/^[✓✅]/)) {
        dos.push(trimmed.replace(/^[✓✅]\s*(Do:?)?\s*/i, ''));
      }
      // Match ✗ Don't: or ✗ Don't patterns
      else if (trimmed.match(/^[✗✕❌]/)) {
        donts.push(trimmed.replace(/^[✗✕❌]\s*(Don't:?)?\s*/i, ''));
      }
    }
  }

  return { dos, donts };
}

function getSummary(body: string): string {
  const lines = body.split('\n');
  const paragraphs: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines, headings, and badges
    if (!trimmed || trimmed.match(/^#{1,3}\s/) || trimmed.startsWith('**Level:**')) continue;

    // Stop at first section or list
    if (trimmed.match(/^[-*•]\s/) || trimmed.includes('####')) {
      break;
    }

    paragraphs.push(trimmed);
  }

  return paragraphs.join(' ');
}

export function AccessibilityResponse({ metadata, body }: ResponseComponentProps) {
  const { criterion, level } = metadata;
  const components = parseComponentList(body);
  const { dos, donts } = parseExamples(body);
  const summary = getSummary(body);

  return (
    <div class="response-accessibility">
      {criterion && (
        <div class="response-wcag-header">
          <Badge variant="info">WCAG {criterion}</Badge>
          {level && <Badge variant="neutral">Level {level}</Badge>}
        </div>
      )}

      {summary && <p class="response-summary">{summary}</p>}

      {components.length > 0 && (
        <div class="response-components-section">
          <h4 class="response-section-heading">SDS Components That Satisfy This</h4>
          <div class="response-component-chips">
            {components.map((comp, idx) => (
              <span key={idx} class="response-chip">{comp}</span>
            ))}
          </div>
        </div>
      )}

      {(dos.length > 0 || donts.length > 0) && (
        <Accordion summary="Do/Don't Examples" defaultExpanded={false}>
          <div class="response-examples">
            {dos.length > 0 && (
              <div class="response-example-do">
                <h5 class="response-example-heading">✓ Do</h5>
                <ul class="response-example-list">
                  {dos.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {donts.length > 0 && (
              <div class="response-example-dont">
                <h5 class="response-example-heading">✗ Don't</h5>
                <ul class="response-example-list">
                  {donts.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Accordion>
      )}
    </div>
  );
}
