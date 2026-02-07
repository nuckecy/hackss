import { useState, useRef } from 'preact/hooks';
import { GeminiProvider } from '../../ai/gemini-provider';
import { buildSystemPrompt } from '../../ai/system-prompt';
import type { ChatMessage } from '../../ai/gemini-provider';
import type { SelectionData } from '../../types/figma';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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

export function useChat(apiKey: string, selection: SelectionData | null): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const providerRef = useRef<GeminiProvider | null>(null);
  const apiKeyRef = useRef<string>(apiKey);

  if (!providerRef.current || apiKeyRef.current !== apiKey) {
    providerRef.current = new GeminiProvider(apiKey);
    apiKeyRef.current = apiKey;
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

    // Convert to Gemini format
    const geminiMessages: ChatMessage[] = recentMessages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      content: msg.content,
    }));

    const systemPrompt = buildSystemPrompt(selection);

    providerRef.current!
      .chat(geminiMessages, systemPrompt)
      .then((responseText) => {
        const assistantMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: responseText,
          timestamp: new Date(),
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
