import { useState } from 'preact/hooks';
import './Settings.css';

interface SettingsProps {
  onApiKeySaved: (key: string) => void;
  onClearKey?: () => void;
  currentKey?: string;
  currentProvider?: 'gemini' | 'claude';
  onProviderChange?: (provider: 'gemini' | 'claude') => void;
}

export function Settings({
  onApiKeySaved,
  onClearKey,
  currentKey,
  currentProvider = 'gemini',
  onProviderChange
}: SettingsProps) {
  const [inputValue, setInputValue] = useState('');
  const [isEditing, setIsEditing] = useState(!currentKey && currentProvider === 'gemini');

  const isFirstRun = !currentKey && currentProvider === 'gemini';
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

      {/* Provider Selection */}
      <div class="settings-section">
        <div class="settings-label">AI Provider</div>
        <div class="settings-provider-options">
          <label class={`settings-provider-option ${currentProvider === 'gemini' ? 'active' : ''}`}>
            <input
              type="radio"
              name="provider"
              value="gemini"
              checked={currentProvider === 'gemini'}
              onChange={() => onProviderChange?.('gemini')}
            />
            <span>Gemini</span>
          </label>
          <label class={`settings-provider-option ${currentProvider === 'claude' ? 'active' : ''}`}>
            <input
              type="radio"
              name="provider"
              value="claude"
              checked={currentProvider === 'claude'}
              onChange={() => onProviderChange?.('claude')}
            />
            <span>Claude</span>
          </label>
        </div>
      </div>

      {/* API Key section - only for Gemini */}
      {currentProvider === 'gemini' && (
        <>
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
        </>
      )}

      {currentProvider === 'claude' && (
        <div class="settings-description">
          Claude uses the backend API at localhost:3000. Make sure the server is running.
        </div>
      )}

      {currentProvider === 'gemini' && (
        <>
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
        </>
      )}
    </div>
  );
}
