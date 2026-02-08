import { render } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import './styles/global.css';
import { MessageBubble } from './components/MessageBubble';
import { InputBar } from './components/InputBar';
import { SelectionIndicator, SuggestionPanel } from './components/SelectionIndicator';
import { EmptyState } from './components/EmptyState';
import { Settings } from './components/Settings';

import { ScanResultMessage } from './components/ScanResultMessage';
import { ScanLoadingState } from './components/ScanLoadingState';
import { Drawer } from './components/Drawer';
import { useProviderSettings } from './hooks/useProviderSettings';
import { useSelection } from './hooks/useSelection';
import { useChat } from './hooks/useChat';
import { useScan } from './hooks/useScan';
import { useCurrentUser } from './hooks/useCurrentUser';
import { useAccessibility } from './hooks/useAccessibility';
import { postToMain } from '../types/messages';
import type { ProviderType } from '../ai/provider';
import chatbotIcon from './chatbot-icon.png';


var SCAN_KEYWORDS = /\b(scan|check|review|audit)\b/i;

function App() {
  const { selectedProvider, providerKeys, isLoading: settingsLoading, saveKey, clearKey, selectProvider } = useProviderSettings();
  const [showSettings, setShowSettings] = useState(false);
  const { settings: accessibilitySettings } = useAccessibility();

  // Apply font size to body element
  useEffect(() => {
    document.body.setAttribute('data-font-size', accessibilitySettings.fontSize);
  }, [accessibilitySettings.fontSize]);

  const apiKey = providerKeys[selectedProvider];
  const needsApiKey = !settingsLoading && !apiKey;
  const showSettingsScreen = needsApiKey || showSettings;

  // Loading state while fetching provider settings
  if (settingsLoading) {
    return (
      <div class="app-shell">
        <div class="app-header">
          <div class="app-header-title">
            <img src={chatbotIcon} alt="" class="app-header-icon" />
            <span>System Sidekick</span>
          </div>
        </div>
      </div>
    );
  }

  // First run or no key for selected provider: show settings only
  if (needsApiKey) {
    return (
      <div class="app-shell">
        <div class="app-header">
          <div class="app-header-title">
            <img src={chatbotIcon} alt="" class="app-header-icon" />
            <span>System Sidekick</span>
          </div>
        </div>
        <Settings
          providerKeys={providerKeys}
          selectedProvider={selectedProvider}
          onSaveKey={saveKey}
          onDeleteKey={clearKey}
          onSelectProvider={selectProvider}
        />
      </div>
    );
  }

  // Has API key: render both chat and settings, toggle visibility
  return (
    <>
      {showSettings && (
        <div class="app-shell">
          <div class="app-header">
            <div class="app-header-title">
              <img src={chatbotIcon} alt="" class="app-header-icon" />
              <span>System Sidekick</span>
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
            providerKeys={providerKeys}
            selectedProvider={selectedProvider}
            onSaveKey={saveKey}
            onDeleteKey={clearKey}
            onSelectProvider={selectProvider}
            onClose={() => setShowSettings(false)}
          />
        </div>
      )}
      <div style={{ display: showSettings ? 'none' : 'contents' }}>
        <ChatScreen
          apiKey={apiKey!}
          selectedProvider={selectedProvider}
          onOpenSettings={() => setShowSettings(true)}
        />
      </div>
    </>
  );
}

function ChatScreen({ apiKey, selectedProvider, onOpenSettings }: { apiKey: string; selectedProvider: ProviderType; onOpenSettings: () => void }) {
  const { selection } = useSelection();
  const { messages, isLoading, sendMessage, addMessage, clearChat } = useChat(apiKey, selectedProvider, selection);
  const { isScanning, scanNodeName, fixStatuses, fixErrors, triggerScan, handleFix } = useScan(apiKey, selectedProvider, addMessage);
  const { userName } = useCurrentUser();
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Auto-scroll to bottom on new messages or loading state change
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading, isScanning]);

  const handleSuggestionClick = (text: string): void => {
    handleSendOrScan(text);
  };

  function handleSendOrScan(text: string): void {
    // Intercept scan/check keywords when something is selected
    if (selection && SCAN_KEYWORDS.test(text)) {
      addMessage('user', text, undefined, selection.id);
      triggerScan();
    } else {
      sendMessage(text);
    }
  }

  const handleSend = (text: string): void => {
    handleSendOrScan(text);
  };

  function handleScanClick(): void {
    if (!selection || isScanning || isLoading) return;
    var name = selection.componentName || selection.name;
    addMessage('user', 'Scan "' + name + '"', undefined, selection.id);
    triggerScan();
  }

  function handleClearSelection(): void {
    postToMain({ type: 'clear-selection' });
    if (selection && messages.some(function (m) { return m.selectionId === selection.id; })) {
      clearChat();
    }
  }

  const hasMessages = messages.length > 0;
  const busy = isLoading || isScanning;

  return (
      <div class="app-shell">
      {/* Drawer overlay */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} userName={userName} />

      {/* Header */}
      <div class="app-header">
        <div class="app-header-left">
          <button
            class="app-header-hamburger"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
          >
            <span class="material-symbols-outlined" style={{ fontSize: '18px' }}>menu</span>
          </button>
          <div class="app-header-title">
            <img src={chatbotIcon} alt="" class="app-header-icon" />
            <span>System Sidekick</span>
          </div>
        </div>
        <div class="app-header-actions">
          {/* Scan button */}
          <button
            class={'app-header-settings' + (isScanning ? ' app-header-scan-active' : '')}
            aria-label="Scan selection"
            onClick={handleScanClick}
            disabled={!selection || busy}
          >
            <span class="material-symbols-outlined" style={{ fontSize: '16px' }}>search</span>
          </button>
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
      <SelectionIndicator
        selection={selection}
        onClear={handleClearSelection}
      />

      {/* Chat Area */}
      <div class="chat-area-wrapper">
        <div class="chat-area" ref={chatAreaRef}>
          {hasMessages ? (
            <div class="chat-messages">
              {messages.map((msg, i) => {
                const prevMsg = messages[i - 1];
                const gapClass = prevMsg && prevMsg.role !== msg.role ? 'message-gap-lg' : 'message-gap-sm';

                // Scan result messages get special rendering
                if (msg.scanResult) {
                  return (
                    <div key={msg.id} class={i > 0 ? gapClass : ''}>
                      <ScanResultMessage
                        scanResult={msg.scanResult}
                        formattedContent={msg.content}
                        timestamp={msg.timestamp}
                        fixStatuses={fixStatuses}
                        fixErrors={fixErrors}
                        onFix={handleFix}
                      />
                    </div>
                  );
                }

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
              {isScanning && scanNodeName && (
                <div class="message-gap-lg">
                  <ScanLoadingState nodeName={scanNodeName} />
                </div>
              )}
              {isLoading && !isScanning && (
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
            <EmptyState selection={selection} onExampleClick={handleSend} userName={userName} />
          )}
        </div>
      </div>

      {/* Suggestion Panel — floating card above input */}
      <SuggestionPanel
        selection={selection}
        onChipClick={handleSuggestionClick}
        disabled={busy}
      />

      {/* Input Bar */}
      <InputBar onSend={handleSend} disabled={busy} />
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
