import { useState, useEffect } from 'preact/hooks';
import { postToMain } from '../../types/messages';
import type { ProviderType } from '../../ai/provider';

interface UseProviderSettingsReturn {
  selectedProvider: ProviderType;
  providerKeys: Record<ProviderType, string | null>;
  isLoading: boolean;
  saveKey: (provider: ProviderType, key: string) => void;
  clearKey: (provider: ProviderType) => void;
  selectProvider: (provider: ProviderType) => void;
}

export function useProviderSettings(): UseProviderSettingsReturn {
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>('gemini');
  const [providerKeys, setProviderKeys] = useState<Record<ProviderType, string | null>>({
    gemini: null,
    claude: null,
    gpt: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    postToMain({ type: 'get-provider-settings' });

    function handleMessage(event: MessageEvent): void {
      const msg = event.data.pluginMessage;
      if (!msg) return;

      if (msg.type === 'provider-settings-response') {
        setSelectedProvider((msg.selectedProvider as ProviderType) || 'gemini');
        setProviderKeys({
          gemini: msg.keys.gemini || null,
          claude: msg.keys.claude || null,
          gpt: msg.keys.gpt || null,
        });
        setIsLoading(false);
      } else if (msg.type === 'provider-key-saved') {
        // Key already set optimistically
      } else if (msg.type === 'provider-key-cleared') {
        setProviderKeys((prev) => ({
          ...prev,
          [msg.provider as ProviderType]: null,
        }));
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  function saveKey(provider: ProviderType, key: string): void {
    setProviderKeys((prev) => ({ ...prev, [provider]: key }));
    postToMain({ type: 'save-provider-key', provider, key });
  }

  function clearKey(provider: ProviderType): void {
    setProviderKeys((prev) => ({ ...prev, [provider]: null }));
    postToMain({ type: 'clear-provider-key', provider });
  }

  function selectProvider(provider: ProviderType): void {
    setSelectedProvider(provider);
    postToMain({ type: 'set-selected-provider', provider });
  }

  return { selectedProvider, providerKeys, isLoading, saveKey, clearKey, selectProvider };
}
