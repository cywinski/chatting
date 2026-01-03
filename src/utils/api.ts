import { ChatCompletionChunk, ModelInfo, ProviderInfo, SamplingParams } from '../types';

const API_BASE = 'https://openrouter.ai/api/v1';

function getApiKey(): string {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!key) {
    throw new Error('VITE_OPENROUTER_API_KEY is not set');
  }
  return key;
}

export async function fetchModels(): Promise<ModelInfo[]> {
  const response = await fetch(`${API_BASE}/models`, {
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data.map((model: { id: string; name?: string; context_length?: number; pricing?: { prompt: string; completion: string } }) => ({
    id: model.id,
    name: model.name || model.id,
    context_length: model.context_length,
    pricing: model.pricing ? {
      prompt: parseFloat(model.pricing.prompt),
      completion: parseFloat(model.pricing.completion),
    } : undefined,
  }));
}

export async function fetchProviders(): Promise<ProviderInfo[]> {
  const response = await fetch(`${API_BASE}/providers`, {
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch providers: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data.map((provider: { id: string; name?: string }) => ({
    id: provider.id,
    name: provider.name || provider.id,
  }));
}

export interface StreamCallbacks {
  onChunk: (content: string) => void;
  onReasoning: (reasoning: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

export interface StreamOptions {
  providers?: string[];
  samplingParams?: Partial<SamplingParams>;
  systemPrompt?: string;
}

export async function streamChatCompletion(
  model: string,
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  prefill: string | null,
  callbacks: StreamCallbacks,
  abortSignal?: AbortSignal,
  options?: StreamOptions
): Promise<void> {
  const apiMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

  // Add system prompt if provided
  if (options?.systemPrompt && options.systemPrompt.trim()) {
    apiMessages.push({ role: 'system', content: options.systemPrompt.trim() });
  }

  // Add conversation messages
  apiMessages.push(...messages);

  // Add assistant prefill if provided
  if (prefill && prefill.trim()) {
    apiMessages.push({ role: 'assistant', content: prefill });
    // Immediately send prefill as first chunk
    callbacks.onChunk(prefill);
  }

  // Build request body
  const requestBody: Record<string, unknown> = {
    model,
    messages: apiMessages,
    stream: true,
  };

  // Add sampling parameters if provided
  if (options?.samplingParams) {
    const params = options.samplingParams;
    if (params.temperature !== undefined) requestBody.temperature = params.temperature;
    if (params.top_p !== undefined) requestBody.top_p = params.top_p;
    if (params.top_k !== undefined && params.top_k > 0) requestBody.top_k = params.top_k;
    if (params.frequency_penalty !== undefined && params.frequency_penalty !== 0) {
      requestBody.frequency_penalty = params.frequency_penalty;
    }
    if (params.presence_penalty !== undefined && params.presence_penalty !== 0) {
      requestBody.presence_penalty = params.presence_penalty;
    }
    if (params.max_tokens !== undefined && params.max_tokens !== null) {
      requestBody.max_tokens = params.max_tokens;
    }
  }

  // Add provider filtering if specified
  if (options?.providers && options.providers.length > 0) {
    requestBody.provider = { only: options.providers };
  }

  const response = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'OpenRouter Chat',
    },
    body: JSON.stringify(requestBody),
    signal: abortSignal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data: ')) continue;

        try {
          const json = JSON.parse(trimmed.slice(6)) as ChatCompletionChunk;
          const delta = json.choices[0]?.delta;
          if (delta?.content) {
            callbacks.onChunk(delta.content);
          }
          if (delta?.reasoning) {
            callbacks.onReasoning(delta.reasoning);
          }
        } catch {
          // Skip invalid JSON lines
        }
      }
    }
    callbacks.onComplete();
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      callbacks.onComplete();
    } else {
      callbacks.onError(error as Error);
    }
  }
}

// Popular models for quick selection
export const POPULAR_MODELS: ModelInfo[] = [
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4' },
  { id: 'anthropic/claude-opus-4', name: 'Claude Opus 4' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku' },
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'openai/o1', name: 'o1' },
  { id: 'openai/o1-mini', name: 'o1-mini' },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)' },
  { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat' },
];
