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

export interface SamplingParams {
  temperature: number;
  top_p: number;
  top_k: number;
  frequency_penalty: number;
  presence_penalty: number;
  max_tokens: number | null;
}

export const DEFAULT_SAMPLING_PARAMS: SamplingParams = {
  temperature: 1.0,
  top_p: 1.0,
  top_k: 0, // 0 means disabled
  frequency_penalty: 0,
  presence_penalty: 0,
  max_tokens: null, // null means model default
};

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
