import { useState, useEffect } from 'preact/hooks';
import { postToMain } from '../../types/messages';

interface UseApiKeyReturn {
  apiKey: string | null;
  saveApiKey: (key: string) => void;
  clearApiKey: () => void;
  isLoading: boolean;
}

export function useApiKey(): UseApiKeyReturn {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Request stored key from main thread
    postToMain({ type: 'get-api-key' });

    function handleMessage(event: MessageEvent): void {
      const msg = event.data.pluginMessage;
      if (!msg) return;

      if (msg.type === 'api-key-response') {
        setApiKey(msg.key);
        setIsLoading(false);
      } else if (msg.type === 'api-key-saved') {
        setIsLoading(false);
      } else if (msg.type === 'api-key-cleared') {
        setApiKey(null);
        setIsLoading(false);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  function saveApiKey(key: string): void {
    setIsLoading(true);
    setApiKey(key);
    postToMain({ type: 'save-api-key', key });
  }

  function clearApiKey(): void {
    setIsLoading(true);
    postToMain({ type: 'clear-api-key' });
  }

  return { apiKey, saveApiKey, clearApiKey, isLoading };
}
