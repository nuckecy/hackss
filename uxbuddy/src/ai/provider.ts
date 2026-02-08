import type { ChatMessage } from './gemini-provider';
import { GeminiProvider } from './gemini-provider';
import { ClaudeProvider } from './claude-provider';
import { OpenAIProvider } from './openai-provider';

export interface AIProvider {
  chat(messages: ChatMessage[], systemPrompt: string): Promise<string>;
}

export type ProviderType = 'gemini' | 'claude' | 'gpt';

export function createProvider(type: ProviderType, apiKey: string): AIProvider {
  switch (type) {
    case 'gemini':
      return new GeminiProvider(apiKey);
    case 'claude':
      return new ClaudeProvider(apiKey);
    case 'gpt':
      return new OpenAIProvider(apiKey);
    default:
      return new GeminiProvider(apiKey);
  }
}
