import { render } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import './styles/global.css';
import { MessageBubble } from './components/MessageBubble';
import { InputBar } from './components/InputBar';
import { SelectionIndicator } from './components/SelectionIndicator';
import { EmptyState } from './components/EmptyState';
import { Settings } from './components/Settings';
import { SuggestionChips } from './components/SuggestionChips';
import { ScanFrameButton } from './components/ScanFrameButton';
import { useApiKey } from './hooks/useApiKey';
import { useSelection } from './hooks/useSelection';
import { useChat } from './hooks/useChat';
import { useProvider } from './hooks/useProvider';

function App() {
  const { apiKey, saveApiKey, clearApiKey, isLoading: keyLoading } = useApiKey();
  const { provider, setProvider, isLoading: providerLoading } = useProvider();
  const [showSettings, setShowSettings] = useState(false);

  const needsApiKey = !keyLoading && !providerLoading && !apiKey && provider === 'gemini';
  const showSettingsScreen = needsApiKey || showSettings;

  // Loading state while fetching API key and provider
  if (keyLoading || providerLoading) {
    return (
      <div class="app-shell">
        <div class="app-header">
          <div class="app-header-title">
            <span class="app-header-icon">{'◆'}</span>
            <span>UX Buddy</span>
          </div>
        </div>
      </div>
    );
  }

  // First run: no key yet, show settings only
  if (needsApiKey) {
    return (
      <div class="app-shell">
        <div class="app-header">
          <div class="app-header-title">
            <span class="app-header-icon">{'◆'}</span>
            <span>UX Buddy</span>
          </div>
        </div>
        <Settings
          currentProvider={provider}
          onProviderChange={setProvider}
          onApiKeySaved={(key) => {
            saveApiKey(key);
          }}
          onClearKey={clearApiKey}
        />
      </div>
    );
  }

  // Has API key: render both chat and settings, toggle visibility via display
  return (
    <>
      {showSettings && (
        <div class="app-shell">
          <div class="app-header">
            <div class="app-header-title">
              <span class="app-header-icon">{'◆'}</span>
              <span>UX Buddy</span>
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
            currentKey={apiKey || undefined}
            currentProvider={provider}
            onProviderChange={setProvider}
            onApiKeySaved={(key) => {
              saveApiKey(key);
              setShowSettings(false);
            }}
            onClearKey={clearApiKey}
          />
        </div>
      )}
      <div style={{ display: showSettings ? 'none' : 'contents' }}>
        <ChatScreen apiKey={apiKey!} provider={provider} onOpenSettings={() => setShowSettings(true)} />
      </div>
    </>
  );
}

function ChatScreen({
  apiKey,
  provider,
  onOpenSettings
}: {
  apiKey: string;
  provider: 'gemini' | 'claude';
  onOpenSettings: () => void;
}) {
  const { selection } = useSelection();
  const { messages, isLoading, sendMessage, clearChat } = useChat(apiKey, selection, provider);
  const [analysisMessages, setAnalysisMessages] = useState<any[]>([]);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const prevSelectionId = useRef<string | null>(null);

  // Combine regular messages with analysis messages
  const allMessages = [...messages, ...analysisMessages];

  // Show suggestions when selection changes to a new element
  useEffect(() => {
    const newId = selection?.id ?? null;
    if (newId && newId !== prevSelectionId.current) {
      setShowSuggestions(true);
    } else if (!newId) {
      setShowSuggestions(false);
    }
    prevSelectionId.current = newId;
  }, [selection]);

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

  const handleSuggestionClick = (text: string): void => {
    setShowSuggestions(false);
    sendMessage(text);
  };

  const handleSend = (text: string): void => {
    setShowSuggestions(false);
    sendMessage(text);
  };

  const hasMessages = allMessages.length > 0;

  return (
    <div class="app-shell">
      {/* Header */}
      <div class="app-header">
        <div class="app-header-title">
          <span class="app-header-icon">{'◆'}</span>
          <span>UX Buddy</span>
        </div>
        <div class="app-header-actions">
          {hasMessages && (
            <button
              class="app-header-settings"
              aria-label="Clear chat"
              onClick={clearChat}
            >
              <span class="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
            </button>
          )}
          <button
            class="app-header-settings"
            aria-label="Settings"
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
          </div>
        ) : (
          <EmptyState selection={selection} onExampleClick={handleSend} />
        )}
      </div>

      {/* Suggestion Chips — only when chat has messages */}
      {hasMessages && (
        <SuggestionChips
          selection={selection}
          onChipClick={handleSuggestionClick}
          visible={showSuggestions && !isLoading}
        />
      )}

      {/* Input Bar */}
      <InputBar onSend={handleSend} disabled={isLoading} />
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
