import { useState } from 'preact/hooks';
import './Settings.css';
import { t } from '../../i18n/i18n';
import type { ProviderType } from '../../ai/ai-provider';

type ThemeMode = 'auto' | 'light' | 'dark';

interface SettingsProps {
  selectedProvider: ProviderType;
  providerKeys: Record<ProviderType, string | null>;
  onProviderChange: (provider: ProviderType) => void;
  onSaveKey: (provider: ProviderType, key: string) => void;
  onClearKey: (provider: ProviderType) => void;
  // Accessibility settings
  fontSize: 'small' | 'medium' | 'large';
  onFontSizeChange: (size: 'small' | 'medium' | 'large') => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  // Localization
  locale: 'en' | 'es' | 'de' | 'fr';
  onLocaleChange: (locale: 'en' | 'es' | 'de' | 'fr') => void;
  // Navigation
  onClose?: () => void;
}

const PROVIDERS: { key: ProviderType; label: string }[] = [
  { key: 'gemini', label: 'Gemini' },
  { key: 'claude', label: 'Claude' },
  { key: 'gpt', label: 'OpenAI' },
];

const API_LINKS: Partial<Record<ProviderType, string>> = {
  gemini: 'https://aistudio.google.com/apikey',
  gpt: 'https://platform.openai.com/api-keys',
};

const FONT_SIZES: { key: 'small' | 'medium' | 'large'; pt: string }[] = [
  { key: 'small', pt: '12pt' },
  { key: 'medium', pt: '14pt' },
  { key: 'large', pt: '16pt' },
];

const LANGUAGES = [
  { code: 'en' as const, label: 'EN' },
  { code: 'es' as const, label: 'ES' },
  { code: 'de' as const, label: 'DE' },
  { code: 'fr' as const, label: 'FR' },
];

const THEME_MODES: { key: ThemeMode; labelKey: string }[] = [
  { key: 'light', labelKey: 'settings.themeLight' },
  { key: 'dark', labelKey: 'settings.themeDark' },
  { key: 'auto', labelKey: 'settings.themeSystem' },
];

export function Settings({
  selectedProvider,
  providerKeys,
  onProviderChange,
  onSaveKey,
  onClearKey,
  fontSize,
  onFontSizeChange,
  theme,
  onThemeChange,
  locale,
  onLocaleChange,
  onClose,
}: SettingsProps) {
  const [inputValue, setInputValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const currentKey = providerKeys[selectedProvider];
  const needsKey = selectedProvider !== 'claude';
  const apiLink = API_LINKS[selectedProvider];
  const hasAnyKey = Object.values(providerKeys).some(key => key !== null);
  const isFirstRun = !hasAnyKey && selectedProvider === 'gemini';

  function handleSave(): void {
    const trimmed = inputValue.trim();
    if (trimmed) {
      onSaveKey(selectedProvider, trimmed);
      setInputValue('');
      setIsEditing(false);
    }
  }

  function handleClear(): void {
    onClearKey(selectedProvider);
    setIsEditing(false);
  }

  function handleProviderSwitch(provider: ProviderType): void {
    onProviderChange(provider);
    setInputValue('');
    setIsEditing(false);
  }

  const maskKey = (key: string) => key.substring(0, 8) + '\u2026';

  return (
    <div class="settings">
      <div class="settings-header">
        {isFirstRun ? t('settings.welcome') : t('common.settings')}
      </div>

      {/* Provider */}
      <div class="settings-group">
        <div class="settings-section-title">{t('settings.aiProvider')}</div>
        <div class="settings-section">
          <div class="settings-segment">
            {PROVIDERS.map((p) => (
              <button
                key={p.key}
                class={`settings-segment-btn ${selectedProvider === p.key ? 'active' : ''}`}
                onClick={() => handleProviderSwitch(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* API Key */}
      <div class="settings-group">
        <div class="settings-section-title">{t('settings.apiKey')}</div>
        <div class="settings-section">
          {!needsKey ? (
            <div class="settings-note">{t('settings.noKeyNeeded')}</div>
          ) : currentKey && !isEditing ? (
            <div class="settings-key-card">
              <div class="settings-key-saved">
                <span class="settings-key-check material-symbols-outlined">check_circle</span>
                <span class="settings-key-value">{maskKey(currentKey)}</span>
              </div>
              <div class="settings-key-actions">
                <button class="settings-action-btn" onClick={() => setIsEditing(true)}>
                  <span class="material-symbols-outlined settings-action-icon">edit</span>
                  {t('settings.changeKey')}
                </button>
                <button class="settings-action-btn settings-action-btn--danger" onClick={handleClear}>
                  <span class="material-symbols-outlined settings-action-icon">delete</span>
                  {t('settings.clearKey')}
                </button>
              </div>
              {apiLink && (
                <a class="settings-help-link" href={apiLink} target="_blank" rel="noopener noreferrer">
                  {t('settings.getApiKey')}
                </a>
              )}
            </div>
          ) : (
            <div class="settings-key-card">
              <input
                class="settings-key-input"
                type="password"
                placeholder={t('settings.apiKeyPlaceholder')}
                value={inputValue}
                onInput={(e) => setInputValue((e.target as HTMLInputElement).value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              />
              <button
                class="settings-key-save"
                onClick={handleSave}
                disabled={!inputValue.trim()}
              >
                {t('settings.saveKey')}
              </button>
              {isEditing && currentKey && (
                <button
                  class="settings-action-btn"
                  onClick={() => { setIsEditing(false); setInputValue(''); }}
                >
                  {t('common.cancel')}
                </button>
              )}
              {apiLink && (
                <a class="settings-help-link" href={apiLink} target="_blank" rel="noopener noreferrer">
                  {t('settings.getApiKey')}
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Display */}
      <div class="settings-group">
        <div class="settings-section-title">{t('settings.display')}</div>
        <div class="settings-section">
          <div class="settings-row">
            <span class="settings-row-label">{t('settings.theme')}</span>
          </div>
          <div class="settings-langs">
            {THEME_MODES.map((m) => (
              <button
                key={m.key}
                class={`settings-lang-btn ${theme === m.key ? 'active' : ''}`}
                onClick={() => onThemeChange(m.key)}
              >
                {t(m.labelKey)}
              </button>
            ))}
          </div>

          <div class="settings-display-divider" />

          <div class="settings-row">
            <span class="settings-row-label">{t('settings.fontSize')}</span>
          </div>
          <div class="settings-font-sizes">
            {FONT_SIZES.map((s) => (
              <button
                key={s.key}
                class={`settings-font-btn ${fontSize === s.key ? 'active' : ''}`}
                onClick={() => onFontSizeChange(s.key)}
                aria-label={s.pt}
              >
                <span class="settings-font-btn-letter">A</span>
                <span class="settings-font-btn-pt">{s.pt}</span>
              </button>
            ))}
          </div>

          <div class="settings-display-divider" />

          <div class="settings-row">
            <span class="settings-row-label">{t('settings.language')}</span>
          </div>
          <div class="settings-langs">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                class={`settings-lang-btn ${locale === l.code ? 'active' : ''}`}
                onClick={() => onLocaleChange(l.code)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      {onClose && (
        <div class="settings-footer">
          <button class="settings-done" onClick={onClose}>
            {t('common.save')}
          </button>
        </div>
      )}
    </div>
  );
}
