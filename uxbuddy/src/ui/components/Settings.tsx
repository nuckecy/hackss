import { useState } from 'preact/hooks';
import type { ProviderType } from '../../ai/provider';
import { useAccessibility, type FontSize, type ThemeMode } from '../hooks/useAccessibility';
import { t } from '../../i18n/i18n';
import type { SupportedLocale } from '../../i18n/i18n';
import './Settings.css';

interface SettingsProps {
  providerKeys: Record<ProviderType, string | null>;
  selectedProvider: ProviderType;
  onSaveKey: (provider: ProviderType, key: string) => void;
  onDeleteKey: (provider: ProviderType) => void;
  onSelectProvider: (provider: ProviderType) => void;
  onClose?: () => void;
  locale?: SupportedLocale;
  onLocaleChange?: (locale: SupportedLocale) => void;
}

const PROVIDERS: { key: ProviderType; label: string }[] = [
  { key: 'gemini', label: 'Gemini' },
  { key: 'claude', label: 'Claude' },
  { key: 'gpt', label: 'GPT' },
];

const API_URLS: Record<ProviderType, string> = {
  gemini: 'https://aistudio.google.com/apikey',
  claude: 'https://console.anthropic.com/',
  gpt: 'https://platform.openai.com/api-keys',
};

const API_HELP_KEYS: Record<ProviderType, { help: string; placeholder: string }> = {
  gemini: { help: 'settings.geminiHelp', placeholder: 'settings.geminiPlaceholder' },
  claude: { help: 'settings.claudeHelp', placeholder: 'settings.claudePlaceholder' },
  gpt: { help: 'settings.gptHelp', placeholder: 'settings.gptPlaceholder' },
};

const FONT_SIZES: { key: FontSize; pt: string }[] = [
  { key: 'small', pt: '12pt' },
  { key: 'medium', pt: '14pt' },
  { key: 'large', pt: '16pt' },
];

const LANGUAGES: { code: SupportedLocale; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'de', label: 'DE' },
  { code: 'fr', label: 'FR' },
];

const THEME_MODES: { key: ThemeMode; labelKey: string }[] = [
  { key: 'light', labelKey: 'settings.themeLight' },
  { key: 'dark', labelKey: 'settings.themeDark' },
  { key: 'auto', labelKey: 'settings.themeSystem' },
];

export function Settings({ providerKeys, selectedProvider, onSaveKey, onDeleteKey, onSelectProvider, onClose, locale: localeProp, onLocaleChange }: SettingsProps) {
  const [inputValue, setInputValue] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const locale = localeProp || 'en';
  const updateLocale = onLocaleChange || (() => {});
  const { settings: accessibilitySettings, updateSettings: updateAccessibilitySettings } = useAccessibility();

  const currentKey = providerKeys[selectedProvider];
  const apiUrl = API_URLS[selectedProvider];
  const helpKeys = API_HELP_KEYS[selectedProvider];

  function handleSave(): void {
    const trimmed = inputValue.trim();
    if (trimmed) {
      onSaveKey(selectedProvider, trimmed);
      setInputValue('');
      setTestStatus('idle');
      setTestMessage('');
    }
  }

  function handleProviderSwitch(provider: ProviderType): void {
    onSelectProvider(provider);
    setInputValue('');
    setTestStatus('idle');
    setTestMessage('');
  }

  function handleFontSizeChange(size: FontSize): void {
    updateAccessibilitySettings({ fontSize: size });
  }

  async function handleTestConnection(): Promise<void> {
    const key = currentKey;
    if (!key) return;

    setTestStatus('testing');
    setTestMessage('');

    try {
      let res: Response | null = null;

      if (selectedProvider === 'gemini') {
        res = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + key,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: 'Say "ok"' }] }],
              generationConfig: { maxOutputTokens: 5 },
            }),
          }
        );
      } else if (selectedProvider === 'claude') {
        res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 5,
            messages: [{ role: 'user', content: 'Say "ok"' }],
          }),
        });
      } else if (selectedProvider === 'gpt') {
        res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + key,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'Say "ok"' }],
            max_tokens: 5,
          }),
        });
      }

      if (res && res.ok) {
        setTestStatus('success');
        setTestMessage(t('settings.connected'));
      } else if (res) {
        let detail = `Status ${res.status}`;
        try {
          const errBody = await res.json();
          detail = errBody?.error?.message || JSON.stringify(errBody).slice(0, 150);
        } catch (_) { /* ignore */ }
        setTestStatus('error');
        setTestMessage(detail);
      } else {
        setTestStatus('error');
        setTestMessage(t('settings.noResponse'));
      }
    } catch (_) {
      setTestStatus('error');
      setTestMessage(t('settings.networkError'));
    }
  }

  const maskKey = (key: string) => key.substring(0, 8) + '\u2026';

  return (
    <div class="settings">
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
          {currentKey ? (
            <div class="settings-key-card">
              <div class="settings-key-saved">
                <span class="settings-key-check material-symbols-outlined">check_circle</span>
                <span class="settings-key-value">{maskKey(currentKey)}</span>
              </div>
              <div class="settings-key-actions">
                <button
                  class="settings-action-btn"
                  onClick={handleTestConnection}
                  disabled={testStatus === 'testing'}
                >
                  <span class="material-symbols-outlined settings-action-icon">bolt</span>
                  {testStatus === 'testing' ? t('settings.testing') : t('settings.test')}
                </button>
                <button
                  class="settings-action-btn settings-action-btn--danger"
                  onClick={() => {
                    onDeleteKey(selectedProvider);
                    setTestStatus('idle');
                    setTestMessage('');
                  }}
                >
                  <span class="material-symbols-outlined settings-action-icon">delete</span>
                  {t('settings.clearKey')}
                </button>
              </div>
              {testMessage && (
                <div class={`settings-test-msg ${testStatus === 'success' ? 'settings-test-msg--ok' : 'settings-test-msg--err'}`}>
                  {testMessage}
                </div>
              )}
              <a class="settings-help-link" href={apiUrl} target="_blank" rel="noopener noreferrer">
                {t(helpKeys.help)}
              </a>
            </div>
          ) : (
            <div class="settings-key-card">
              <input
                class="settings-key-input"
                type="password"
                placeholder={t(helpKeys.placeholder)}
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
              <a class="settings-help-link" href={apiUrl} target="_blank" rel="noopener noreferrer">
                {t(helpKeys.help)}
              </a>
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
                class={`settings-lang-btn ${accessibilitySettings.theme === m.key ? 'active' : ''}`}
                onClick={() => updateAccessibilitySettings({ theme: m.key })}
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
                class={`settings-font-btn ${accessibilitySettings.fontSize === s.key ? 'active' : ''}`}
                onClick={() => handleFontSizeChange(s.key)}
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
                onClick={() => updateLocale(l.code)}
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
