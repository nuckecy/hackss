export interface ChatMessage {
  role: 'user' | 'model' | 'assistant';
  content: string;
}

export interface AIProvider {
  chat(messages: ChatMessage[], systemPrompt: string): Promise<string>;
}
