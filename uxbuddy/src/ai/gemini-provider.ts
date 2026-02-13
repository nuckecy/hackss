import type { AIProvider } from './provider';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

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

    if (!response.ok) {
      let detail = '';
      try {
        const errData = await response.json();
        detail = errData?.error?.message || JSON.stringify(errData).slice(0, 200);
      } catch (_) { /* ignore parse errors */ }

      if (response.status === 401 || response.status === 403) {
        throw new Error('Invalid API key' + (detail ? ': ' + detail : ''));
      }
      if (response.status === 429) {
        throw new Error('Rate limited, please wait');
      }
      if (response.status >= 500) {
        throw new Error('Gemini service error' + (detail ? ': ' + detail : ''));
      }
      throw new Error(`Request failed (${response.status})${detail ? ': ' + detail : ''}`);
    }

    const data: GeminiResponse = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      const blockReason = (data as any)?.promptFeedback?.blockReason;
      throw new Error(blockReason ? 'Response blocked: ' + blockReason : 'No response generated');
    }

    const text = data.candidates[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('No response generated');
    }

    return text;
  }
}
