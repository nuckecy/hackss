import { useState } from 'preact/hooks';
import { LoadingDots } from './LoadingDots';
import { PlacementButton } from './PlacementButton';
import type { ComponentAction } from '../../types';
import { parseResponse } from './ResponseParser';
import { ComponentLookupResponse } from './responses/ComponentLookupResponse';
import { AccessibilityResponse } from './responses/AccessibilityResponse';
import { TokenResponse } from './responses/TokenResponse';
import { ComparisonResponse } from './responses/ComparisonResponse';
import { NotFoundResponse } from './responses/NotFoundResponse';
import { DesignAnalysisResponse } from './responses/DesignAnalysisResponse';
import './MessageBubble.css';

interface QuickAction {
  label: string;
  onClick: () => void;
  icon?: string;
}

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  action?: ComponentAction;
  quickActions?: QuickAction[];
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

/**
 * Renders content with specialized response components or falls back to markdown
 */
function renderContent(content: string): preact.JSX.Element | preact.JSX.Element[] {
  const { metadata, body } = parseResponse(content);

  // If we have a response type, render specialized component
  switch (metadata.type) {
    case 'component-lookup':
      return <ComponentLookupResponse metadata={metadata} body={body} />;
    case 'accessibility':
      return <AccessibilityResponse metadata={metadata} body={body} />;
    case 'token':
      return <TokenResponse metadata={metadata} body={body} />;
    case 'comparison':
      return <ComparisonResponse metadata={metadata} body={body} />;
    case 'not-found':
      return <NotFoundResponse metadata={metadata} body={body} />;
    case 'design-analysis':
      return <DesignAnalysisResponse metadata={metadata} body={body} />;
    default:
      // Fallback to standard markdown rendering
      return <>{renderMarkdown(content)}</>;
  }
}

export function MessageBubble({ role, content, timestamp, isLoading, action, quickActions }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const className = role === 'user' ? 'message message-user' : 'message message-assistant';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div class={className}>
      {isLoading ? (
        <LoadingDots />
      ) : (
        <>
          <div class="message-content">
            {renderContent(content)}
          </div>
          {action && action.type === 'place_component' && (
            <PlacementButton action={action} />
          )}
          {quickActions && quickActions.length > 0 && (
            <div class="message-quick-actions">
              {quickActions.map((qa, idx) => (
                <button
                  key={idx}
                  class="quick-action-button"
                  onClick={qa.onClick}
                >
                  {qa.icon && <span class="material-symbols-outlined">{qa.icon}</span>}
                  {qa.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      {!isLoading && (
        <div class="message-footer">
          <div class="message-timestamp">{formatTime(timestamp)}</div>
          {role === 'assistant' && (
            <button
              class="message-copy-button"
              onClick={handleCopy}
              aria-label="Copy message"
              title="Copy to clipboard"
            >
              <span class="material-symbols-outlined">
                {copied ? 'check' : 'content_copy'}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
