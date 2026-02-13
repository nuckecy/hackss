import type { AIProvider, ChatMessage } from './ai-provider';

interface GeminiContent {
  role: string;
  parts: Array<{ text: string }>;
}

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
  error?: {
    message: string;
  };
}

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export class GeminiProvider implements AIProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(messages: ChatMessage[], systemPrompt: string): Promise<string> {
    return this.requestWithRetry(messages, systemPrompt, 3);
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
        // Exponential backoff: 2s, 4s, 8s
        const attempt = 4 - retriesLeft; // 1, 2, 3
        const delay = Math.pow(2, attempt) * 1000; // 2000ms, 4000ms, 8000ms
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.requestWithRetry(messages, systemPrompt, retriesLeft - 1);
      }

      // If rate limited and out of retries, provide helpful message
      if (message.includes('Rate limited')) {
        throw new Error('Rate limit exceeded. Please wait 30-60 seconds before trying again. Consider upgrading your Gemini API tier for higher limits.');
      }

      throw error;
    }
  }

  private async makeRequest(messages: ChatMessage[], systemPrompt: string): Promise<string> {
    const contents: GeminiContent[] = messages.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    const body = {
      contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        topP: 0.9,
      },
    };

    let response: Response;
    try {
      response = await fetch(`${API_URL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      throw new Error('Gemini service error');
    }

    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }

    const data: GeminiResponse = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response generated');
    }

    const text = data.candidates[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('No response generated');
    }

    return text;
  }
}
