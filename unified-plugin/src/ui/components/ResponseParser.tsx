import { h } from 'preact';
import type { ParsedResponse, ResponseMetadata } from '../../types/responses';

/**
 * Parses a response string to extract frontmatter metadata and body content
 *
 * Example input:
 * ```
 * ---
 * type: component-lookup
 * componentName: Button
 * status: stable
 * ---
 * ### Button
 * Brief description...
 * ```
 *
 * @param content - The full response string
 * @returns Parsed metadata and body content
 */
export function parseResponse(content: string): ParsedResponse {
  const frontmatterRegex = /^---\n([\s\S]+?)\n---\n/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { metadata: {}, body: content };
  }

  const metadataText = match[1];
  const body = content.slice(match[0].length);

  // Parse metadata (simple key:value pairs)
  const metadata: ResponseMetadata = {};
  metadataText.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return;

    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();

    if (key && value) {
      // Handle array values (comma-separated)
      if (key === 'options' || key === 'suggestions') {
        try {
          // Try parsing as JSON array first
          metadata[key] = JSON.parse(value);
        } catch {
          // Fallback to comma-separated string
          metadata[key] = value.split(',').map(s => s.trim());
        }
      } else {
        (metadata as any)[key] = value;
      }
    }
  });

  return { metadata, body };
}
