import { useState, useEffect } from 'preact/hooks';

export type FontSize = 'small' | 'medium' | 'large';
export type ThemeMode = 'auto' | 'light' | 'dark';

export interface AccessibilitySettings {
  fontSize: FontSize;
  theme: ThemeMode;
}

export function useAccessibility() {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    fontSize: 'medium',
    theme: 'auto',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    parent.postMessage({
      pluginMessage: { type: 'get-accessibility-settings' }
    }, '*');

    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;
      if (msg.type === 'accessibility-settings-response') {
        setSettings({
          fontSize: msg.fontSize || 'medium',
          theme: msg.theme || 'auto',
        });
        setIsLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    parent.postMessage({
      pluginMessage: {
        type: 'save-accessibility-settings',
        fontSize: updated.fontSize,
        theme: updated.theme,
      }
    }, '*');
  };

  return { settings, updateSettings, isLoading };
}
