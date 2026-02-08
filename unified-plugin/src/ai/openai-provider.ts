import type { ChatMessage } from './ai-provider';
import type { AIProvider } from './ai-provider';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices?: Array<{
    message: { role: string; content: string };
  }>;
  error?: { message: string };
}

const API_URL = 'https://api.openai.com/v1/chat/completions';

export class OpenAIProvider implements AIProvider {
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
    const openaiMessages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((msg): OpenAIMessage => ({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.content,
      })),
    ];

    const body = {
      model: 'gpt-4o-mini',
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 1024,
    };

    let response: Response;
    try {
      response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.apiKey,
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
      throw new Error('OpenAI service error');
    }

    if (!response.ok) {
      throw new Error('Request failed (' + response.status + ')');
    }

    const data: OpenAIResponse = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response generated');
    }

    const text = data.choices[0].message.content;
    if (!text) {
      throw new Error('No response generated');
    }

    return text;
  }
}
