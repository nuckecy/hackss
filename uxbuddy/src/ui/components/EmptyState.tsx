import type { SelectionData } from '../../types/figma';
import chatbotIcon from '../chatbot-icon.png';
import './EmptyState.css';

interface EmptyStateProps {
  selection: SelectionData | null;
  onExampleClick?: (text: string) => void;
  userName?: string | null;
}

interface Chip {
  label: string;
  message: string;
}

const GENERAL_STARTERS: Chip[] = [
  { label: 'Alert vs Toast?', message: 'When should I use an Alert instead of a Toast notification?' },
  { label: 'Spacing tokens', message: 'What spacing tokens are available and when should I use each one?' },
  { label: 'Accessible forms', message: 'How do I make a form accessible following WCAG guidelines?' },
  { label: 'Button variants', message: 'What button variants are available and when should I use each one?' },
  { label: 'Color contrast', message: 'What are the color contrast requirements I need to follow?' },
  { label: 'Typography scale', message: 'Can you walk me through the typography scale and when to use each size?' },
  { label: 'Icon usage', message: 'What are the best practices for using icons in the design system?' },
  { label: 'Responsive layout', message: 'How should I handle responsive layouts with the design system?' },
];

export function EmptyState({ selection, onExampleClick, userName }: EmptyStateProps) {
  const firstName = userName ? userName.split(' ')[0] : null;

  return (
    <div class="empty-state">
      {/* Logo */}
      <div class="empty-state-logo">
        <img src={chatbotIcon} alt="System Sidekick" class="empty-state-logo-icon" />
      </div>

      {/* Personalized greeting */}
      <h2 class="empty-state-greeting">
        {firstName ? `Hello, ${firstName}.` : 'Hello.'}
      </h2>

      <p class="empty-state-primary">
        Ask me anything about the Simple Design System.
      </p>
      <div class="empty-state-cloud">
        {GENERAL_STARTERS.map((chip) => (
          <button
            key={chip.label}
            class="empty-state-chip"
            onClick={() => onExampleClick?.(chip.message)}
          >
            {chip.label}
          </button>
        ))}
      </div>
      {!selection && (
        <p class="empty-state-hint">
          Or select a layer in Figma for contextual suggestions.
        </p>
      )}
    </div>
  );
}
