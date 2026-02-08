import { useState, useEffect } from 'preact/hooks';
import { postToMain } from '../../types/messages';

export type AIProviderType = 'gemini' | 'claude';

interface UseProviderReturn {
  provider: AIProviderType;
  setProvider: (provider: AIProviderType) => void;
  isLoading: boolean;
}

export function useProvider(): UseProviderReturn {
  const [provider, setProviderState] = useState<AIProviderType>('gemini');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Request provider from main thread
    postToMain({ type: 'get-provider' });

    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;
      if (msg.type === 'provider-response') {
        setProviderState(msg.provider || 'gemini');
        setIsLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  function setProvider(newProvider: AIProviderType): void {
    setProviderState(newProvider);
    postToMain({ type: 'save-provider', provider: newProvider });
  }

  return { provider, setProvider, isLoading };
}
