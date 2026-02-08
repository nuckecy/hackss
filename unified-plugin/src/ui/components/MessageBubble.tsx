import { LoadingDots } from './LoadingDots';
import { PlacementButton } from './PlacementButton';
import type { ComponentAction } from '../../types';
import './MessageBubble.css';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  action?: ComponentAction;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function renderInline(text: string, baseKey: number): (string | preact.JSX.Element)[] {
  const parts: (string | preact.JSX.Element)[] = [];
  let key = baseKey * 100;

  // Match **bold** and `code` patterns
  const regex = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      parts.push(<strong key={`b-${key++}`}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<code key={`c-${key++}`}>{match[3]}</code>);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function renderMarkdown(text: string) {
  const parts: preact.JSX.Element[] = [];
  let key = 0;

  const lines = text.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // Heading lines (### Heading)
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      parts.push(
        <div class="message-heading" key={`h-${key++}`}>
          {renderInline(headingMatch[2], key++)}
        </div>
      );
      i++;
      continue;
    }

    // Bullet list items (-, *, •)
    if (trimmed.match(/^[-*•]\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().match(/^[-*•]\s/)) {
        items.push(lines[i].trim().replace(/^[-*•]\s/, ''));
        i++;
      }
      parts.push(
        <ul class="message-list" key={`ul-${key++}`}>
          {items.map((item, idx) => (
            <li class="message-list-item" key={`li-${key++}-${idx}`}>
              {renderInline(item, key++)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list items (1. text, 2. text)
    if (trimmed.match(/^\d+[.)]\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().match(/^\d+[.)]\s/)) {
        items.push(lines[i].trim().replace(/^\d+[.)]\s/, ''));
        i++;
      }
      parts.push(
        <ol class="message-list message-list-ordered" key={`ol-${key++}`}>
          {items.map((item, idx) => (
            <li class="message-list-item" key={`li-${key++}-${idx}`}>
              {renderInline(item, key++)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Regular paragraph — collect consecutive non-special lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trim().match(/^[-*•]\s/) &&
      !lines[i].trim().match(/^\d+[.)]\s/) &&
      !lines[i].trim().match(/^#{1,3}\s/)
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }

    if (paraLines.length > 0) {
      parts.push(
        <p class="message-paragraph" key={`p-${key++}`}>
          {renderInline(paraLines.join(' '), key++)}
        </p>
      );
    }
  }

  return parts;
}

export function MessageBubble({ role, content, timestamp, isLoading, action }: MessageBubbleProps) {
  const className = role === 'user' ? 'message message-user' : 'message message-assistant';

  return (
    <div class={className}>
      {isLoading ? (
        <LoadingDots />
      ) : (
        <>
          <div class="message-content">
            {renderMarkdown(content)}
          </div>
          {action && action.type === 'place_component' && (
            <PlacementButton action={action} />
          )}
        </>
      )}
      {!isLoading && (
        <div class="message-timestamp">{formatTime(timestamp)}</div>
      )}
    </div>
  );
}
