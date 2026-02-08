import { useState, useRef } from 'preact/hooks';
import { createProvider } from '../../ai/ai-provider';
import { buildSystemPrompt } from '../../ai/system-prompt';
import { detectComponentAction } from '../../ai/action-detector';
import type { AIProvider, ChatMessage, ProviderType } from '../../ai/ai-provider';
import type { SelectionData } from '../../types/figma';
import type { ComponentAction } from '../../types';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: ComponentAction;
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (text: string) => void;
  clearChat: () => void;
}

let messageCounter = 0;
function generateId(): string {
  return `msg-${Date.now()}-${++messageCounter}`;
}

export function useChat(
  apiKey: string,
  selection: SelectionData | null,
  providerType: ProviderType = 'gemini'
): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const providerRef = useRef<AIProvider | null>(null);
  const apiKeyRef = useRef<string>(apiKey);
  const providerTypeRef = useRef<ProviderType>(providerType);

  // Recreate provider if API key or provider type changes
  if (!providerRef.current || apiKeyRef.current !== apiKey || providerTypeRef.current !== providerType) {
    providerRef.current = createProvider(providerType, apiKey);
    apiKeyRef.current = apiKey;
    providerTypeRef.current = providerType;
  }

  function sendMessage(text: string): void {
    if (isLoading || !text.trim()) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    const allMessages = [...messages, userMessage];

    // Limit to last 20 messages for API
    const recentMessages = allMessages.slice(-20);

    // Convert to provider format
    const providerMessages: ChatMessage[] = recentMessages.map((msg) => ({
      role: msg.role === 'assistant' ? (providerType === 'gemini' ? 'model' : 'assistant') : 'user',
      content: msg.content,
    }));

    const systemPrompt = buildSystemPrompt(selection);

    providerRef.current!
      .chat(providerMessages, systemPrompt)
      .then((responseText) => {
        // Detect component placement action from response
        const action = detectComponentAction(responseText);

        const assistantMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: responseText,
          timestamp: new Date(),
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
        };
        setMessages((prev) => [...prev, errorMessage]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function clearChat(): void {
    setMessages([]);
    setError(null);
  }

  return { messages, isLoading, error, sendMessage, clearChat };
}
