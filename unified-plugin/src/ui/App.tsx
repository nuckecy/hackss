import { render } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import './styles/global.css';
import { MessageBubble } from './components/MessageBubble';
import { InputBar } from './components/InputBar';
import { SelectionIndicator, SuggestionPanel, getFollowUpSuggestions, detectTopicFromText } from './components/SelectionIndicator';
import { EmptyState } from './components/EmptyState';
import { Settings } from './components/Settings';
import { ScanFrameButton } from './components/ScanFrameButton';
import { useSelection } from './hooks/useSelection';
import { useChat } from './hooks/useChat';
import { useProviderSettings } from './hooks/useProviderSettings';
import { useLocale } from './hooks/useLocale';
import { useAccessibility } from './hooks/useAccessibility';
import { setLocale, t } from '../i18n/i18n';

function App() {
  const { selectedProvider, providerKeys, isLoading: settingsLoading, saveKey, clearKey, selectProvider } = useProviderSettings();
  const { locale, updateLocale } = useLocale();
  const { settings: accessibilitySettings, updateSettings: updateAccessibilitySettings } = useAccessibility();
  const [showSettings, setShowSettings] = useState(false);

  // Get the API key for the currently selected provider
  const currentApiKey = providerKeys[selectedProvider];

  // Check if we need an API key for the selected provider (Claude doesn't need one)
  const needsApiKey = !settingsLoading && !currentApiKey && selectedProvider !== 'claude';
  const showSettingsScreen = needsApiKey || showSettings;

  // Apply font size globally
  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', accessibilitySettings.fontSize);
  }, [accessibilitySettings.fontSize]);

  // Apply theme to document root
  useEffect(() => {
    const applyTheme = (mode: 'light' | 'dark') => {
      document.documentElement.setAttribute('data-theme', mode);
    };

    if (accessibilitySettings.theme === 'light' || accessibilitySettings.theme === 'dark') {
      applyTheme(accessibilitySettings.theme);
    } else {
      // Auto: follow OS preference
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mq.matches ? 'dark' : 'light');
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [accessibilitySettings.theme]);

  // Apply locale globally
  useEffect(() => {
    setLocale(locale);
  }, [locale]);

  // Loading state while fetching provider settings
  if (settingsLoading) {
    return (
      <div class="app-shell" key={locale}>
        <div class="app-header">
          <div class="app-header-title">
            <span class="app-header-icon">{'◆'}</span>
            <span>{t('common.appName')}</span>
          </div>
        </div>
      </div>
    );
  }

  // First run: no key yet, show settings only
  if (needsApiKey) {
    return (
      <div class="app-shell" key={locale}>
        <div class="app-header">
          <div class="app-header-title">
            <span class="app-header-icon">{'◆'}</span>
            <span>{t('common.appName')}</span>
          </div>
        </div>
        <Settings
          selectedProvider={selectedProvider}
          providerKeys={providerKeys}
          onProviderChange={selectProvider}
          onSaveKey={saveKey}
          onClearKey={clearKey}
          fontSize={accessibilitySettings.fontSize}
          onFontSizeChange={(size) => updateAccessibilitySettings({ fontSize: size })}
          theme={accessibilitySettings.theme}
          onThemeChange={(theme) => updateAccessibilitySettings({ theme })}
          locale={locale}
          onLocaleChange={updateLocale}
        />
      </div>
    );
  }

  // Has API key: render both chat and settings, toggle visibility via display
  return (
    <>
      {showSettings && (
        <div class="app-shell" key={`settings-${locale}`}>
          <div class="app-header">
            <div class="app-header-title">
              <span class="app-header-icon">{'◆'}</span>
              <span>{t('common.appName')}</span>
            </div>
            <button
              class="app-header-settings"
              aria-label="Back to chat"
              onClick={() => setShowSettings(false)}
            >
              <span class="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
            </button>
          </div>
          <Settings
            selectedProvider={selectedProvider}
            providerKeys={providerKeys}
            onProviderChange={selectProvider}
            onSaveKey={saveKey}
            onClearKey={clearKey}
            fontSize={accessibilitySettings.fontSize}
            onFontSizeChange={(size) => updateAccessibilitySettings({ fontSize: size })}
            theme={accessibilitySettings.theme}
            onThemeChange={(theme) => updateAccessibilitySettings({ theme })}
            locale={locale}
            onLocaleChange={updateLocale}
            onClose={() => setShowSettings(false)}
          />
        </div>
      )}
      <div style={{ display: showSettings ? 'none' : 'contents' }} key={`chat-${locale}`}>
        <ChatScreen apiKey={currentApiKey || ''} provider={selectedProvider} onOpenSettings={() => setShowSettings(true)} />
      </div>
    </>
  );
}

import type { ProviderType } from '../ai/ai-provider';

function ChatScreen({
  apiKey,
  provider,
  onOpenSettings
}: {
  apiKey: string;
  provider: ProviderType;
  onOpenSettings: () => void;
}) {
  const { selection } = useSelection();
  const { messages, isLoading, sendMessage, clearChat } = useChat(apiKey, selection, provider);
  const [analysisMessages, setAnalysisMessages] = useState<any[]>([]);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const [lastChipTopic, setLastChipTopic] = useState<string | null>(null);

  // Combine regular messages with analysis messages
  const allMessages = [...messages, ...analysisMessages];

  // Clear follow-up topic when selection changes
  useEffect(() => {
    setLastChipTopic(null);
  }, [selection?.id]);

  // Auto-scroll to bottom on new messages or loading state change
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [allMessages, isLoading]);

  // Handle frame analysis results
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;

      if (msg.type === 'analysis-data') {
        // Send frame data to backend for analysis
        fetch('http://localhost:3000/api/analyze-frame', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ frameData: msg.data }),
        })
          .then((res) => res.json())
          .then((result) => {
            // Display analysis as assistant message
            const analysisMessage = {
              id: `analysis-${Date.now()}`,
              role: 'assistant' as const,
              content: `## Frame Analysis: ${msg.frameName}\n\n${result.analysis}`,
              timestamp: new Date(),
            };
            setAnalysisMessages((prev) => [...prev, analysisMessage]);
          })
          .catch((error) => {
            const errorMessage = {
              id: `error-${Date.now()}`,
              role: 'assistant' as const,
              content: `Failed to analyze frame: ${error.message}. Make sure the backend server is running.`,
              timestamp: new Date(),
            };
            setAnalysisMessages((prev) => [...prev, errorMessage]);
          });
      }

      if (msg.type === 'analysis-error') {
        const errorMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant' as const,
          content: msg.message,
          timestamp: new Date(),
        };
        setAnalysisMessages((prev) => [...prev, errorMessage]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleSuggestionClick = (text: string, topic: string): void => {
    setLastChipTopic(topic);
    sendMessage(text);
  };

  const handleSend = (text: string): void => {
    const detected = detectTopicFromText(text, selection);
    setLastChipTopic(detected);
    sendMessage(text);
  };

  const handleEmptyStateClick = (text: string, topic: string): void => {
    setLastChipTopic(topic);
    sendMessage(text);
  };

  // Generate quick actions based on message content
  const getQuickActions = (msg: any) => {
    if (msg.role !== 'assistant') return undefined;

    const actions = [];
    const content = msg.content.toLowerCase();

    // If message mentions a specific component, add "Place Component" action
    const componentMatch = content.match(/(?:use|try|place)\s+(?:the\s+)?(\w+)(?:\s+component)?/i);
    if (componentMatch && selection) {
      const componentName = componentMatch[1];
      actions.push({
        label: `Place ${componentName}`,
        icon: 'add_circle',
        onClick: () => {
          // Trigger component placement
          parent.postMessage({
            pluginMessage: {
              type: 'place-component',
              componentKey: componentName.toLowerCase(),
              componentName: componentName,
            }
          }, '*');
        }
      });
    }

    // If message mentions variants, add "Show Variants" action
    if (content.includes('variant') && selection?.componentName) {
      actions.push({
        label: 'Show Variants',
        icon: 'tune',
        onClick: () => {
          sendMessage(`What variants does ${selection.componentName} have?`);
        }
      });
    }

    // If message mentions accessibility issues, add "Run Full Scan" action
    if ((content.includes('accessibility') || content.includes('wcag')) && selection) {
      actions.push({
        label: 'Run Full Scan',
        icon: 'fact_check',
        onClick: () => {
          parent.postMessage({ pluginMessage: { type: 'analyze-frame' } }, '*');
        }
      });
    }

    // If message mentions tokens or spacing, add "Check Tokens" action
    if ((content.includes('token') || content.includes('spacing')) && selection) {
      actions.push({
        label: 'Check Tokens',
        icon: 'format_paint',
        onClick: () => {
          sendMessage(`What design tokens should be used for ${selection.name}?`);
        }
      });
    }

    return actions.length > 0 ? actions : undefined;
  };

  const hasMessages = allMessages.length > 0;
  const followUpChips = lastChipTopic
    ? getFollowUpSuggestions(lastChipTopic, selection)
    : hasMessages
      ? getFollowUpSuggestions('general.default', selection)
      : [];

  const handleExport = () => {
    const markdown = allMessages
      .map((msg) => {
        const role = msg.role === 'user' ? t('chat.you') : t('common.appName');
        const time = msg.timestamp.toLocaleString();
        return `### ${role} (${time})\n\n${msg.content}\n\n---\n`;
      })
      .join('\n');

    const blob = new Blob([`# ${t('chat.conversationTitle')}\n\n${markdown}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-sidekick-chat-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div class="app-shell">
      {/* Header */}
      <div class="app-header">
        <div class="app-header-title">
          <span class="app-header-icon">{'◆'}</span>
          <span>{t('common.appName')}</span>
        </div>
        <div class="app-header-actions">
          <button
            class="app-header-settings"
            aria-label={t('chat.newChat') || 'New chat'}
            onClick={() => { clearChat(); setAnalysisMessages([]); setLastChipTopic(null); }}
            title={t('chat.newChat') || 'New chat'}
          >
            <span class="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
          </button>
          {hasMessages && (
            <button
              class="app-header-settings"
              aria-label={t('chat.exportConversation')}
              onClick={handleExport}
              title={t('chat.exportConversation')}
            >
              <span class="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
            </button>
          )}
          <button
            class="app-header-settings"
            aria-label={t('common.settings')}
            onClick={onOpenSettings}
          >
            <span class="material-symbols-outlined" style={{ fontSize: '16px' }}>settings</span>
          </button>
        </div>
      </div>

      {/* Selection Indicator */}
      <SelectionIndicator selection={selection} />

      {/* Scan Frame Button - only show with Claude provider */}
      {provider === 'claude' && selection && (
        <div style={{ padding: '0 12px 8px' }}>
          <ScanFrameButton />
        </div>
      )}

      {/* Chat Area */}
      <div class="chat-area" ref={chatAreaRef}>
        {hasMessages ? (
          <div class="chat-messages">
            {allMessages.map((msg, i) => {
              const prevMsg = allMessages[i - 1];
              const gapClass = prevMsg && prevMsg.role !== msg.role ? 'message-gap-lg' : 'message-gap-sm';
              return (
                <div key={msg.id} class={i > 0 ? gapClass : ''}>
                  <MessageBubble
                    role={msg.role}
                    content={msg.content}
                    timestamp={msg.timestamp}
                    action={msg.action}
                    quickActions={getQuickActions(msg)}
                  />
                </div>
              );
            })}
            {isLoading && (
              <div class="message-gap-lg">
                <MessageBubble
                  role="assistant"
                  content=""
                  timestamp={new Date()}
                  isLoading={true}
                />
              </div>
            )}
            {!isLoading && followUpChips.length > 0 && (
              <div class="message-gap-sm chips-inline">
                <div class="suggestion-label">{t('emptyState.relatedQuestions')}</div>
                <div class="suggestion-list">
                  {followUpChips.map((chip) => (
                    <button
                      key={chip.label}
                      class="suggestion-chip"
                      disabled={isLoading}
                      onClick={() => handleSuggestionClick(chip.message, chip.topic)}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <EmptyState selection={selection} onExampleClick={handleEmptyStateClick} />
        )}
      </div>

      {/* Footer — suggestion panel (selection-based when no messages) + input */}
      <div class="chat-footer">
        {!hasMessages && (
          <SuggestionPanel
            selection={selection}
            onChipClick={handleSuggestionClick}
            disabled={isLoading}
          />
        )}
        <InputBar onSend={handleSend} disabled={isLoading} />
      </div>
    </div>
  );
}

function mount() {
  render(<App />, document.getElementById('app')!);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
