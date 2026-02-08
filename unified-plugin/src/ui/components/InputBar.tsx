import { useState, useRef, useEffect } from 'preact/hooks';
import './InputBar.css';
import { t } from '../../i18n/i18n';

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
    el.style.height = `${Math.min(el.scrollHeight, el.offsetHeight === 0 ? Infinity : el.scrollHeight)}px`;
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
      <textarea
        ref={textareaRef}
        class="input-field"
        placeholder={t('chat.placeholder')}
        value={value}
        onInput={(e) => setValue((e.target as HTMLTextAreaElement).value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={4}
      />
      <button
        class="send-button"
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        aria-label={t('chat.sendMessage')}
      >
        <span class="material-symbols-outlined" style={{ fontSize: '16px' }}>send</span>
      </button>
    </div>
  );
}
