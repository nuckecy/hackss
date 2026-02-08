import type { ChatMessage } from './gemini-provider';
import type { AIProvider } from './provider';

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  content?: Array<{ type: string; text?: string }>;
  error?: { type: string; message: string };
}

const API_URL = 'https://api.anthropic.com/v1/messages';

export class ClaudeProvider implements AIProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(messages: ChatMessage[], systemPrompt: string): Promise<string> {
    return this.requestWithRetry(messages, systemPrompt, 1);
  }

  private async requestWithRetry(
    messages: ChatMessage[],
    systemPrompt: string,
    retriesLeft: number
  ): Promise<string> {
    try {
      return await this.makeRequest(messages, systemPrompt);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isRetryable = message.includes('Rate limited') || message.includes('service error');

      if (isRetryable && retriesLeft > 0) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return this.requestWithRetry(messages, systemPrompt, retriesLeft - 1);
      }

      throw error;
    }
  }

  private async makeRequest(messages: ChatMessage[], systemPrompt: string): Promise<string> {
    const claudeMessages: ClaudeMessage[] = messages.map((msg) => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.content,
    }));

    const body = {
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: systemPrompt,
      messages: claudeMessages,
    };

    let response: Response;
    try {
      response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify(body),
      });
    } catch (_) {
      throw new Error('No internet connection');
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error('Invalid API key');
    }

    if (response.status === 429) {
      throw new Error('Rate limited, please wait');
    }

    if (response.status >= 500) {
      throw new Error('Claude service error');
    }

    if (!response.ok) {
      throw new Error('Request failed (' + response.status + ')');
    }

    const data: ClaudeResponse = await response.json();

    if (!data.content || data.content.length === 0) {
      throw new Error('No response generated');
    }

    const textBlock = data.content.find((block) => block.type === 'text');
    if (!textBlock || !textBlock.text) {
      throw new Error('No response generated');
    }

    return textBlock.text;
  }
}
