import { useState, useRef } from 'preact/hooks';
import { createProvider } from '../../ai/provider';
import type { AIProvider, ProviderType } from '../../ai/provider';
import { buildSystemPrompt } from '../../ai/system-prompt';
import type { ChatMessage } from '../../ai/gemini-provider';
import type { SelectionData } from '../../types/figma';
import type { ScanResult } from '../../types/scan';
import type { ComponentAction } from '../../types/messages';
import { detectComponentAction } from '../../ai/action-detector';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  scanResult?: ScanResult;
  selectionId?: string;
  action?: ComponentAction;
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (text: string) => void;
  addMessage: (role: 'user' | 'assistant', content: string, scanResult?: ScanResult, selectionId?: string) => void;
  clearChat: () => void;
}

let messageCounter = 0;
function generateId(): string {
  return `msg-${Date.now()}-${++messageCounter}`;
}

export function useChat(apiKey: string, selectedProvider: ProviderType, selection: SelectionData | null): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const providerRef = useRef<AIProvider | null>(null);
  const apiKeyRef = useRef<string>(apiKey);
  const providerTypeRef = useRef<ProviderType>(selectedProvider);

  if (!providerRef.current || apiKeyRef.current !== apiKey || providerTypeRef.current !== selectedProvider) {
    providerRef.current = createProvider(selectedProvider, apiKey);
    apiKeyRef.current = apiKey;
    providerTypeRef.current = selectedProvider;
  }

  function sendMessage(text: string): void {
    if (isLoading || !text.trim()) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
      selectionId: selection ? selection.id : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    const allMessages = [...messages, userMessage];

    // Limit to last 20 messages for API
    const recentMessages = allMessages.slice(-20);

    // Convert to provider format — each provider handles role mapping internally
    const chatMessages: ChatMessage[] = recentMessages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      content: msg.content,
    }));

    const systemPrompt = buildSystemPrompt(selection);

    providerRef.current!
      .chat(chatMessages, systemPrompt)
      .then((responseText) => {
        // Detect component placement actions in the response
        const action = detectComponentAction(responseText);

        const assistantMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: responseText,
          timestamp: new Date(),
          selectionId: selection ? selection.id : undefined,
          action: action || undefined,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      })
      .catch((err) => {
        const errorText = err instanceof Error ? err.message : 'Something went wrong';
        setError(errorText);
        const errorMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: `Sorry, I ran into an issue: ${errorText}`,
          timestamp: new Date(),
          selectionId: selection ? selection.id : undefined,
        };
        setMessages((prev) => [...prev, errorMessage]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function addMessage(role: 'user' | 'assistant', content: string, scanResult?: ScanResult, selectionId?: string): void {
    const msg: Message = {
      id: generateId(),
      role,
      content,
      timestamp: new Date(),
      scanResult,
      selectionId,
    };
    setMessages(function (prev) { return prev.concat([msg]); });
  }

  function clearChat(): void {
    setMessages([]);
    setError(null);
  }

  return { messages, isLoading, error, sendMessage, addMessage, clearChat };
}
