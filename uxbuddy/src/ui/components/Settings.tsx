import { useState } from 'preact/hooks';
import './Settings.css';

interface SettingsProps {
  onApiKeySaved: (key: string) => void;
  onClearKey?: () => void;
  currentKey?: string;
}

export function Settings({ onApiKeySaved, onClearKey, currentKey }: SettingsProps) {
  const [inputValue, setInputValue] = useState('');
  const [isEditing, setIsEditing] = useState(!currentKey);

  const isFirstRun = !currentKey;
  const maskedKey = currentKey ? currentKey.substring(0, 8) + '...' : '';

  function handleSave(): void {
    const trimmed = inputValue.trim();
    if (trimmed) {
      onApiKeySaved(trimmed);
      setInputValue('');
      setIsEditing(false);
    }
  }

  return (
    <div class="settings">
      <div class="settings-title">
        {isFirstRun ? 'Welcome to UX Buddy' : 'Settings'}
      </div>

      <div class="settings-description">
        Enter your Gemini API key to get started.
      </div>

      <a
        class="settings-link"
        href="https://aistudio.google.com/apikey"
        target="_blank"
        rel="noopener noreferrer"
      >
        Get a free API key from Google AI Studio
      </a>

      {currentKey && !isEditing ? (
        <div class="settings-current-key">
          <div class="settings-key-display">{maskedKey}</div>
          <div class="settings-actions">
            <button
              class="settings-button-secondary"
              onClick={() => setIsEditing(true)}
            >
              Change Key
            </button>
            <button
              class="settings-button-secondary"
              onClick={() => {
                if (onClearKey) onClearKey();
              }}
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        <div class="settings-form">
          <input
            class="settings-input"
            type="password"
            placeholder="Paste your Gemini API key"
            value={inputValue}
            onInput={(e) => setInputValue((e.target as HTMLInputElement).value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
            }}
          />
          <button
            class="settings-button"
            onClick={handleSave}
            disabled={!inputValue.trim()}
          >
            Save Key
          </button>
          {currentKey && (
            <button
              class="settings-button-secondary"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
