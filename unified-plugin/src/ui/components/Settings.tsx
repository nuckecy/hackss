import { useState } from 'preact/hooks';
import './Settings.css';
import { t } from '../../i18n/i18n';
import type { ProviderType } from '../../ai/ai-provider';

interface SettingsProps {
  selectedProvider: ProviderType;
  providerKeys: Record<ProviderType, string | null>;
  onProviderChange: (provider: ProviderType) => void;
  onSaveKey: (provider: ProviderType, key: string) => void;
  onClearKey: (provider: ProviderType) => void;
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
  selectedProvider,
  providerKeys,
  onProviderChange,
  onSaveKey,
  onClearKey,
  fontSize,
  onFontSizeChange,
  locale,
  onLocaleChange,
  onClose
}: SettingsProps) {
  const [editingProvider, setEditingProvider] = useState<ProviderType | null>(null);
  const [inputValues, setInputValues] = useState<Record<ProviderType, string>>({
    gemini: '',
    claude: '',
    gpt: '',
  });

  // Check if this is first run (no provider has a key and gemini is selected)
  const hasAnyKey = Object.values(providerKeys).some(key => key !== null);
  const isFirstRun = !hasAnyKey && selectedProvider === 'gemini';

  function handleSave(provider: ProviderType): void {
    const trimmed = inputValues[provider].trim();
    if (trimmed) {
      onSaveKey(provider, trimmed);
      setInputValues(prev => ({ ...prev, [provider]: '' }));
      setEditingProvider(null);
    }
  }

  function handleClear(provider: ProviderType): void {
    onClearKey(provider);
    setEditingProvider(null);
  }

  function getProviderLabel(provider: ProviderType): string {
    switch (provider) {
      case 'gemini': return 'Gemini';
      case 'claude': return 'Claude';
      case 'gpt': return 'OpenAI (GPT)';
      default: return provider;
    }
  }

  function getProviderApiKeyLink(provider: ProviderType): string | null {
    switch (provider) {
      case 'gemini': return 'https://aistudio.google.com/apikey';
      case 'gpt': return 'https://platform.openai.com/api-keys';
      case 'claude': return null; // Claude uses backend
      default: return null;
    }
  }

  function needsApiKey(provider: ProviderType): boolean {
    return provider !== 'claude'; // Claude doesn't need user-provided API key
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

  const maskKey = (key: string) => key.substring(0, 8) + '...';

  return (
    <div class="settings">
      <div class="settings-title">
        {isFirstRun ? t('settings.welcome') : t('common.settings')}
      </div>

      {/* Provider Selection */}
      <div class="settings-section">
        <div class="settings-label">{t('settings.aiProvider')}</div>
        <div class="settings-provider-options">
          <label class={`settings-provider-option ${selectedProvider === 'gemini' ? 'active' : ''}`}>
            <input
              type="radio"
              name="provider"
              value="gemini"
              checked={selectedProvider === 'gemini'}
              onChange={() => onProviderChange('gemini')}
            />
            <span>Gemini</span>
          </label>
          <label class={`settings-provider-option ${selectedProvider === 'claude' ? 'active' : ''}`}>
            <input
              type="radio"
              name="provider"
              value="claude"
              checked={selectedProvider === 'claude'}
              onChange={() => onProviderChange('claude')}
            />
            <span>Claude</span>
          </label>
          <label class={`settings-provider-option ${selectedProvider === 'gpt' ? 'active' : ''}`}>
            <input
              type="radio"
              name="provider"
              value="gpt"
              checked={selectedProvider === 'gpt'}
              onChange={() => onProviderChange('gpt')}
            />
            <span>OpenAI</span>
          </label>
        </div>
      </div>

      {/* API Keys Section - Per Provider */}
      <div class="settings-section">
        <div class="settings-label">API Keys</div>

        {(['gemini', 'claude', 'gpt'] as ProviderType[]).map((provider) => {
          const currentKey = providerKeys[provider];
          const isEditing = editingProvider === provider;
          const apiKeyLink = getProviderApiKeyLink(provider);
          const requiresKey = needsApiKey(provider);

          if (!requiresKey) {
            // Claude doesn't need API key
            return (
              <div key={provider} class="settings-provider-key-section">
                <div class="settings-provider-key-header">
                  <strong>{getProviderLabel(provider)}</strong>
                </div>
                <div class="settings-description" style={{ fontSize: '12px', opacity: 0.7 }}>
                  Uses backend API (no key required)
                </div>
              </div>
            );
          }

          return (
            <div key={provider} class="settings-provider-key-section">
              <div class="settings-provider-key-header">
                <strong>{getProviderLabel(provider)}</strong>
                {apiKeyLink && (
                  <a
                    class="settings-link"
                    href={apiKeyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '12px' }}
                  >
                    Get API Key
                  </a>
                )}
              </div>

              {currentKey && !isEditing ? (
                <div class="settings-current-key">
                  <div class="settings-key-display">{maskKey(currentKey)}</div>
                  <div class="settings-actions">
                    <button
                      class="settings-button-secondary"
                      onClick={() => setEditingProvider(provider)}
                    >
                      Change
                    </button>
                    <button
                      class="settings-button-secondary"
                      onClick={() => handleClear(provider)}
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
                    placeholder={`Enter ${getProviderLabel(provider)} API key`}
                    value={inputValues[provider]}
                    onInput={(e) => setInputValues(prev => ({
                      ...prev,
                      [provider]: (e.target as HTMLInputElement).value
                    }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave(provider);
                    }}
                  />
                  <button
                    class="settings-button"
                    onClick={() => handleSave(provider)}
                    disabled={!inputValues[provider].trim()}
                  >
                    Save
                  </button>
                  {currentKey && (
                    <button
                      class="settings-button-secondary"
                      onClick={() => setEditingProvider(null)}
                    >
                      {t('common.cancel')}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
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
