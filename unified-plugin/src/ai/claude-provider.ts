import type { AIProvider, ChatMessage } from './ai-provider';

interface ClaudeAPIRequest {
  message: string;
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

interface ClaudeAPIResponse {
  response: string;
  action?: {
    type: 'place_component';
    componentName: string;
    componentKey: string;
    variant: string | null;
  };
}

const API_URL = 'http://localhost:3000/api/chat';

export class ClaudeProvider implements AIProvider {
  async chat(messages: ChatMessage[], systemPrompt: string): Promise<string> {
    // The backend uses its own system prompt, so we ignore the one passed in
    // Extract the last user message and previous history
    const lastMessage = messages[messages.length - 1];
    const history = messages.slice(0, -1);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: lastMessage.content,
          history: history.map((msg) => ({
            role: msg.role === 'model' ? 'assistant' : msg.role,
            content: msg.content,
          })),
        } as ClaudeAPIRequest),
      });

      if (!response.ok) {
        if (response.status === 500) {
          throw new Error('Claude API error - check if backend is running');
        }
        throw new Error(`Request failed (${response.status})`);
      }

      const data: ClaudeAPIResponse = await response.json();
      return data.response;
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error('Cannot connect to backend API. Make sure the server is running at http://localhost:3000');
      }
      throw error;
    }
  }
}
