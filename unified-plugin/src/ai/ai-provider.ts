export interface ChatMessage {
  role: 'user' | 'model' | 'assistant';
  content: string;
}

export interface AIProvider {
  chat(messages: ChatMessage[], systemPrompt: string): Promise<string>;
}

export type ProviderType = 'gemini' | 'claude' | 'gpt';

import { GeminiProvider } from './gemini-provider';
import { ClaudeProvider } from './claude-provider';
import { OpenAIProvider } from './openai-provider';

export function createProvider(providerType: ProviderType, apiKey: string): AIProvider {
  switch (providerType) {
    case 'gemini':
      return new GeminiProvider(apiKey);
    case 'claude':
      return new ClaudeProvider();
    case 'gpt':
      return new OpenAIProvider(apiKey);
    default:
      throw new Error(`Unknown provider: ${providerType}`);
  }
}
