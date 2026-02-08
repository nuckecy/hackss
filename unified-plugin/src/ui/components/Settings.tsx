import { useState } from 'preact/hooks';
import './Settings.css';
import { t } from '../../i18n/i18n';

interface SettingsProps {
  onApiKeySaved: (key: string) => void;
  onClearKey?: () => void;
  currentKey?: string;
  currentProvider?: 'gemini' | 'claude';
  onProviderChange?: (provider: 'gemini' | 'claude') => void;
  // Accessibility settings
  fontSize: 'small' | 'medium' | 'large';
  onFontSizeChange: (size: 'small' | 'medium' | 'large') => void;
  // Localization
  locale: 'en' | 'es' | 'de' | 'fr';
  onLocaleChange: (locale: 'en' | 'es' | 'de' | 'fr') => void;
  // Navigation
  onClose?: () => void;
}

export function Settings({
  onApiKeySaved,
  onClearKey,
  currentKey,
  currentProvider = 'gemini',
  onProviderChange,
  fontSize,
  onFontSizeChange,
  locale,
  onLocaleChange,
  onClose
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

  function getLanguageName(localeCode: string): string {
    const names: Record<string, string> = {
      en: 'English',
      es: 'Español',
      de: 'Deutsch',
      fr: 'Français',
    };
    return names[localeCode] || localeCode;
  }

  function getLanguageFlag(localeCode: string): string {
    const flags: Record<string, string> = {
      en: '🇬🇧',
      es: '🇪🇸',
      de: '🇩🇪',
      fr: '🇫🇷',
    };
    return flags[localeCode] || '';
  }

  return (
    <div class="settings">
      <div class="settings-title">
        {isFirstRun ? t('settings.welcome') : t('common.settings')}
      </div>

      {/* Provider Selection */}
      <div class="settings-section">
        <div class="settings-label">{t('settings.aiProvider')}</div>
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

      {/* Accessibility Settings */}
      <div class="settings-section">
        <div class="settings-label">{t('settings.accessibility')}</div>

        {/* Font Size */}
        <div class="settings-subsection">
          <div class="settings-description">{t('settings.fontSize')}</div>
          <div class="settings-font-size-options">
            <button
              class={`font-size-option ${fontSize === 'small' ? 'active' : ''}`}
              onClick={() => onFontSizeChange('small')}
              aria-label={t('settings.fontSizeSmall')}
            >
              A
            </button>
            <button
              class={`font-size-option ${fontSize === 'medium' ? 'active' : ''}`}
              onClick={() => onFontSizeChange('medium')}
              aria-label={t('settings.fontSizeMedium')}
            >
              A
            </button>
            <button
              class={`font-size-option ${fontSize === 'large' ? 'active' : ''}`}
              onClick={() => onFontSizeChange('large')}
              aria-label={t('settings.fontSizeLarge')}
            >
              A
            </button>
          </div>
        </div>
      </div>

      {/* Language Settings */}
      <div class="settings-section">
        <div class="settings-label">{t('settings.language')}</div>
        <div class="settings-language-options">
          {(['en', 'es', 'de', 'fr'] as const).map((lang) => (
            <button
              key={lang}
              class={`language-option ${locale === lang ? 'active' : ''}`}
              onClick={() => onLocaleChange(lang)}
              aria-label={getLanguageName(lang)}
            >
              {getLanguageFlag(lang)} {getLanguageName(lang)}
            </button>
          ))}
        </div>
      </div>

      {/* API Key section - only for Gemini */}
      {currentProvider === 'gemini' && (
        <>
          <div class="settings-description">
            {t('settings.enterApiKey')}
          </div>

          <a
            class="settings-link"
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('settings.getApiKey')}
          </a>
        </>
      )}

      {currentProvider === 'claude' && (
        <div class="settings-description">
          {t('settings.claudeInfo')}
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
                  {t('settings.changeKey')}
                </button>
                <button
                  class="settings-button-secondary"
                  onClick={() => {
                    if (onClearKey) onClearKey();
                  }}
                >
                  {t('settings.clearKey')}
                </button>
              </div>
            </div>
          ) : (
            <div class="settings-form">
              <input
                class="settings-input"
                type="password"
                placeholder={t('settings.apiKeyPlaceholder')}
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
                {t('settings.saveKey')}
              </button>
              {currentKey && (
                <button
                  class="settings-button-secondary"
                  onClick={() => setIsEditing(false)}
                >
                  {t('common.cancel')}
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Footer with Save button - only show when onClose is available (not first run) */}
      {onClose && !isFirstRun && (
        <div class="settings-footer">
          <button
            class="settings-button"
            onClick={onClose}
          >
            {t('common.save')}
          </button>
        </div>
      )}
    </div>
  );
}
