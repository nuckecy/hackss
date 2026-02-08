import { useState, useEffect } from 'preact/hooks';
import { postToMain } from '../../types/messages';

interface UseCurrentUserReturn {
  userName: string | null;
  isLoading: boolean;
}

export function useCurrentUser(): UseCurrentUserReturn {
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    function handleMessage(event: MessageEvent): void {
      var msg = event.data && event.data.pluginMessage;
      if (!msg) return;
      if (msg.type === 'current-user') {
        setUserName(msg.name || null);
        setIsLoading(false);
      }
    }

    window.addEventListener('message', handleMessage);
    postToMain({ type: 'request-current-user' });

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return { userName, isLoading };
}
