import { useState, useEffect } from 'preact/hooks';
import { postToMain } from '../../types/messages';
import type { SelectionData } from '../../types/figma';

interface UseSelectionReturn {
  selection: SelectionData | null;
}

export function useSelection(): UseSelectionReturn {
  const [selection, setSelection] = useState<SelectionData | null>(null);

  useEffect(() => {
    postToMain({ type: 'request-selection' });

    function handleMessage(event: MessageEvent): void {
      const msg = event.data.pluginMessage;
      if (!msg) return;

      if (msg.type === 'selection-changed') {
        setSelection(msg.data);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return { selection };
}
