import { useState, useRef, useEffect } from 'preact/hooks';
import './InputBar.css';

interface InputBarProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function InputBar({ onSend, disabled }: InputBarProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = (): void => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 72)}px`;
  };

  useEffect(() => {
    resize();
  }, [value]);

  const handleSubmit = (): void => {
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div class="input-bar">
      <div class={'input-pill' + (disabled ? ' input-pill--disabled' : '')}>
        <textarea
          ref={textareaRef}
          class="input-field"
          placeholder="Ask about components, a11y..."
          value={value}
          onInput={(e) => setValue((e.target as HTMLTextAreaElement).value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
        />
        <button
          class="send-button"
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
        >
          <span class="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_upward</span>
        </button>
      </div>
    </div>
  );
}
