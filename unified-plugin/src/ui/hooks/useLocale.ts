import { useState, useEffect } from 'preact/hooks';
import { setLocale, type SupportedLocale } from '../../i18n/i18n';

export function useLocale() {
  const [locale, setLocaleState] = useState<SupportedLocale>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Request locale from main thread
    parent.postMessage({ pluginMessage: { type: 'get-locale' } }, '*');

    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;
      if (msg.type === 'locale-response') {
        const newLocale = msg.locale || 'en';
        setLocaleState(newLocale);
        setLocale(newLocale); // Update i18n singleton
        setIsLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const updateLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    setLocale(newLocale);
    parent.postMessage({
      pluginMessage: { type: 'save-locale', locale: newLocale }
    }, '*');
  };

  return { locale, updateLocale, isLoading };
}
