import { useState } from 'preact/hooks';
import type { ProviderType } from '../../ai/provider';
import './Settings.css';

interface SettingsProps {
  providerKeys: Record<ProviderType, string | null>;
  selectedProvider: ProviderType;
  onSaveKey: (provider: ProviderType, key: string) => void;
  onDeleteKey: (provider: ProviderType) => void;
  onSelectProvider: (provider: ProviderType) => void;
}

const PROVIDER_CONFIG: Record<ProviderType, {
  label: string;
  keyLabel: string;
  placeholder: string;
  helpText: string;
  helpUrl: string;
  privacyText: string;
}> = {
  gemini: {
    label: 'Gemini',
    keyLabel: 'GEMINI API KEY',
    placeholder: 'Enter Gemini API key...',
    helpText: 'Get a key at aistudio.google.com',
    helpUrl: 'https://aistudio.google.com/apikey',
    privacyText: "Your key is stored locally and only sent to Google's Gemini API.",
  },
  claude: {
    label: 'Claude',
    keyLabel: 'CLAUDE API KEY',
    placeholder: 'Enter Claude API key...',
    helpText: 'Get a key at console.anthropic.com',
    helpUrl: 'https://console.anthropic.com/',
    privacyText: "Your key is stored locally and only sent to Anthropic's Claude API.",
  },
  gpt: {
    label: 'GPT',
    keyLabel: 'GPT API KEY',
    placeholder: 'Enter GPT API key...',
    helpText: 'Get a key at platform.openai.com',
    helpUrl: 'https://platform.openai.com/api-keys',
    privacyText: "Your key is stored locally and only sent to OpenAI's GPT API.",
  },
};

const PROVIDERS: ProviderType[] = ['gemini', 'claude', 'gpt'];

export function Settings({ providerKeys, selectedProvider, onSaveKey, onDeleteKey, onSelectProvider }: SettingsProps) {
  const [inputValue, setInputValue] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const config = PROVIDER_CONFIG[selectedProvider];
  const currentKey = providerKeys[selectedProvider];

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

  async function handleTestConnection(): Promise<void> {
    const key = currentKey;
    if (!key) return;

    setTestStatus('testing');
    setTestMessage('');

    try {
      let ok = false;

      if (selectedProvider === 'gemini') {
        const res = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + key,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: 'Say "ok"' }] }],
              generationConfig: { maxOutputTokens: 5 },
            }),
          }
        );
        ok = res.ok;
      } else if (selectedProvider === 'claude') {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
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
        ok = res.ok;
      } else if (selectedProvider === 'gpt') {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
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
        ok = res.ok;
      }

      if (ok) {
        setTestStatus('success');
        setTestMessage('Connection successful!');
      } else {
        setTestStatus('error');
        setTestMessage('Invalid API key or connection failed.');
      }
    } catch (_) {
      setTestStatus('error');
      setTestMessage('Network error. Check your connection.');
    }
  }

  return (
    <div class="settings">
      {/* Provider selector */}
      <div class="settings-section-label">AI PROVIDER</div>
      <div class="settings-provider-row">
        {PROVIDERS.map((p) => (
          <button
            key={p}
            class={'settings-provider-btn' + (selectedProvider === p ? ' settings-provider-btn--active' : '')}
            onClick={() => handleProviderSwitch(p)}
          >
            {PROVIDER_CONFIG[p].label}
          </button>
        ))}
      </div>

      {/* API key section */}
      <div class="settings-section-label">{config.keyLabel}</div>
      <a
        class="settings-help-link"
        href={config.helpUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        {config.helpText}
      </a>

      <input
        class="settings-input"
        type="password"
        placeholder={config.placeholder}
        value={inputValue}
        onInput={(e) => setInputValue((e.target as HTMLInputElement).value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
        }}
      />

      {/* Action buttons */}
      <div class="settings-actions">
        <button
          class="settings-btn-save"
          onClick={handleSave}
          disabled={!inputValue.trim()}
        >
          Save Key
        </button>
        <button
          class="settings-btn-test"
          onClick={handleTestConnection}
          disabled={!currentKey || testStatus === 'testing'}
        >
          {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
        </button>
      </div>

      {/* Test result feedback */}
      {testMessage && (
        <div class={'settings-test-result' + (testStatus === 'success' ? ' settings-test-success' : ' settings-test-error')}>
          {testMessage}
        </div>
      )}

      {/* Current key indicator */}
      {currentKey && (
        <div class="settings-key-chip">
          <span class="settings-key-chip-text">
            Key saved: {currentKey.substring(0, 8)}...
          </span>
          <button
            class="settings-key-chip-delete"
            aria-label="Remove API key"
            onClick={() => {
              onDeleteKey(selectedProvider);
              setTestStatus('idle');
              setTestMessage('');
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      )}

      {/* Privacy note */}
      <div class="settings-privacy">{config.privacyText}</div>
    </div>
  );
}
