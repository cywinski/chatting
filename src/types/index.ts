export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning?: string;
  model?: string;
  timestamp: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  context_length?: number;
  pricing?: {
    prompt: number;
    completion: number;
  };
}

export interface ProviderInfo {
  id: string;
  name: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatCompletionChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
      reasoning?: string;
    };
    finish_reason: string | null;
  }>;
}

export interface StreamingResponse {
  modelId: string;
  content: string;
  reasoning?: string;
  isStreaming: boolean;
  error?: string;
}

export interface ConversationState {
  messages: Message[];
  responses: Map<string, StreamingResponse>;
}
