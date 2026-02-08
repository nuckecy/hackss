import { h } from 'preact';
import type { ResponseComponentProps } from '../../../types/responses';
import { Accordion } from './shared/Accordion';
import { Badge } from './shared/Badge';
import { Card } from './shared/Card';
import { ActionButton } from './shared/ActionButton';
import { ActionButtons } from './shared/ActionButtons';

interface PropRow {
  prop: string;
  type: string;
  description: string;
}

function parsePropsTable(body: string): { keyProps: PropRow[]; allProps: PropRow[] } {
  const lines = body.split('\n');
  const props: PropRow[] = [];
  let inTable = false;
  let headerPassed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect table start
    if (line.startsWith('|') && !inTable) {
      inTable = true;
      continue;
    }

    // Skip header separator (|---|---|---|)
    if (inTable && !headerPassed && line.match(/^\|[\s\-|:]+\|$/)) {
      headerPassed = true;
      continue;
    }

    // Parse table row
    if (inTable && headerPassed && line.startsWith('|')) {
      const cells = line
        .split('|')
        .map(c => c.trim())
        .filter(c => c !== '');

      if (cells.length >= 3) {
        props.push({
          prop: cells[0],
          type: cells[1],
          description: cells[2]
        });
      }
    }

    // Table end
    if (inTable && !line.startsWith('|')) {
      break;
    }
  }

  // Show first 5 props as "key props", rest are hidden
  const keyProps = props.slice(0, 5);
  const allProps = props;

  return { keyProps, allProps };
}

function parseAccessibilityNotes(body: string): string[] {
  const lines = body.split('\n');
  const notes: string[] = [];
  let inAccessibilitySection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect accessibility section
    if (trimmed.toLowerCase().includes('accessibility')) {
      inAccessibilitySection = true;
      continue;
    }

    // Collect bullet points in accessibility section
    if (inAccessibilitySection && trimmed.match(/^[-*•]\s/)) {
      notes.push(trimmed.replace(/^[-*•]\s/, ''));
    }

    // Stop at next heading or empty section
    if (inAccessibilitySection && (trimmed.match(/^#{1,3}\s/) || (notes.length > 0 && !trimmed))) {
      break;
    }
  }

  return notes;
}

function getDescription(body: string): string {
  const lines = body.split('\n');
  const paragraphs: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and headings
    if (!trimmed || trimmed.match(/^#{1,3}\s/)) continue;

    // Stop at first table, list, or section heading
    if (trimmed.startsWith('|') || trimmed.match(/^[-*•]\s/) || trimmed.includes('####')) {
      break;
    }

    paragraphs.push(trimmed);
  }

  return paragraphs.join(' ');
}

export function ComponentLookupResponse({ metadata, body, action, quickActions }: ResponseComponentProps) {
  const { componentName, status } = metadata;
  const { keyProps, allProps } = parsePropsTable(body);
  const accessibilityNotes = parseAccessibilityNotes(body);
  const description = getDescription(body);

  const statusVariant = status === 'stable' ? 'success' : status === 'beta' ? 'warning' : 'error';

  return (
    <div class="response-component-lookup">
      {componentName && (
        <div class="response-component-header">
          <h3 class="response-component-name">{componentName}</h3>
          {status && <Badge variant={statusVariant}>{status}</Badge>}
        </div>
      )}

      <ActionButtons action={action} quickActions={quickActions} />

      {description && (
        <Accordion summary="Overview" defaultExpanded={false}>
          <p class="response-description">{description}</p>
        </Accordion>
      )}

      {keyProps.length > 0 && (
        <div class="response-props-section">
          <Accordion summary={`Properties (${keyProps.length})`} defaultExpanded={false}>
            <table class="response-table">
              <thead>
                <tr>
                  <th scope="col">Prop</th>
                  <th scope="col">Type</th>
                  <th scope="col">Description</th>
                </tr>
              </thead>
              <tbody>
                {keyProps.map((prop, idx) => (
                  <tr key={idx}>
                    <td><code>{prop.prop}</code></td>
                    <td><code>{prop.type}</code></td>
                    <td>{prop.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {allProps.length > keyProps.length && (
              <Accordion summary={`Show all ${allProps.length} props`} defaultExpanded={false}>
                <table class="response-table">
                  <thead>
                    <tr>
                      <th scope="col">Prop</th>
                      <th scope="col">Type</th>
                      <th scope="col">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allProps.slice(keyProps.length).map((prop, idx) => (
                      <tr key={idx}>
                        <td><code>{prop.prop}</code></td>
                        <td><code>{prop.type}</code></td>
                        <td>{prop.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Accordion>
            )}
          </Accordion>
        </div>
      )}

      {accessibilityNotes.length > 0 && (
        <div class="response-accessibility-section">
          <Accordion summary={`Accessibility (${accessibilityNotes.length} notes)`} defaultExpanded={false}>
            <ul class="response-checklist">
              {accessibilityNotes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          </Accordion>
        </div>
      )}
    </div>
  );
}
