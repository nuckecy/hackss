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

function getSelectionChips(selection: SelectionData): Chip[] {
  const name = selection.componentName || selection.name;
  const type = selection.type;

  const scanChip: Chip = { label: 'Scan this element', message: `Scan "${name}"` };

  if (type === 'INSTANCE') {
    return [
      scanChip,
      { label: `Right use of ${name}?`, message: `Am I using ${name} correctly here? Does it follow the design system guidelines?` },
      { label: 'Available variants?', message: `What variants does ${name} have and which one fits best here?` },
      { label: 'Spacing review', message: `Does the spacing around ${name} look correct? Any token adjustments needed?` },
    ];
  }

  if (type === 'TEXT') {
    return [
      scanChip,
      { label: 'Contrast ratio', message: `Can you check the contrast ratio on "${name}" for WCAG AA compliance?` },
      { label: 'Correct token?', message: `Am I using the right typography token for "${name}"?` },
      { label: 'Font size review', message: `Is the font size on "${name}" appropriate for its context?` },
    ];
  }

  if (type === 'FRAME' || type === 'GROUP' || type === 'SECTION') {
    return [
      scanChip,
      { label: 'Check spacing', message: `Does the spacing inside "${name}" follow the design system tokens?` },
      { label: 'Accessibility issues?', message: `Are there any accessibility concerns with the layout of "${name}"?` },
      { label: 'Alignment check', message: `Can you check if the alignment in "${name}" is consistent and correct?` },
    ];
  }

  if (type === 'COMPONENT' || type === 'COMPONENT_SET') {
    return [
      scanChip,
      { label: `How to use ${name}?`, message: `How should ${name} be used according to the design system guidelines?` },
      { label: 'Accessibility reqs', message: `What accessibility requirements should ${name} meet?` },
      { label: 'Token usage?', message: `What design tokens does ${name} use and are they applied correctly?` },
    ];
  }

  return [
    scanChip,
    { label: `What is ${name}?`, message: `Can you tell me what "${name}" is and how it fits in the design system?` },
    { label: 'Any issues?', message: `Are there any design or accessibility issues with "${name}"?` },
    { label: 'How to improve?', message: `How can I improve "${name}" to better follow the design system?` },
  ];
}

export function EmptyState({ selection, onExampleClick, userName }: EmptyStateProps) {
  const hasSelection = !!selection;
  const chips = hasSelection
    ? getSelectionChips(selection)
    : GENERAL_STARTERS;

  const firstName = userName ? userName.split(' ')[0] : null;

  return (
    <div class="empty-state">
      {/* Logo */}
      <div class="empty-state-logo">
        <img src={chatbotIcon} alt="UX Buddy" class="empty-state-logo-icon" />
      </div>

      {/* Personalized greeting */}
      <h2 class="empty-state-greeting">
        {firstName ? `Hello, ${firstName}.` : 'Hello.'}
      </h2>

      <p class="empty-state-primary">
        {hasSelection
          ? 'I noticed you selected something. Want me to help?'
          : 'Ask me anything about the Simple Design System.'}
      </p>
      <div class="empty-state-cloud">
        {chips.map((chip) => (
          <button
            key={chip.label}
            class={`empty-state-chip ${hasSelection ? 'empty-state-chip--selection' : ''}`}
            onClick={() => onExampleClick?.(chip.message)}
          >
            {chip.label}
          </button>
        ))}
      </div>
      {!hasSelection && (
        <p class="empty-state-hint">
          Or select a layer in Figma for contextual suggestions.
        </p>
      )}
    </div>
  );
}
