import { useState, useCallback, useRef, useEffect } from 'react';
import { Message, StreamingResponse, SamplingParams } from '../types';
import { streamChatCompletion } from '../utils/api';

export interface SendMessageOptions {
  providers?: string[];
  samplingParams?: Partial<SamplingParams>;
  systemPrompt?: string;
}

interface Conversation {
  id: string;
  name: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

interface UseOpenRouterReturn {
  messages: Message[];
  responses: Record<string, StreamingResponse>;
  isLoading: boolean;
  sendMessage: (content: string, selectedModels: string[], prefill: string, options?: SendMessageOptions) => Promise<void>;
  clearChat: () => void;
  stopGeneration: () => void;
  saveConversation: (name?: string) => void;
  loadConversation: (file: File) => Promise<void>;
}

export function useOpenRouter(): UseOpenRouterReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [responses, setResponses] = useState<Record<string, StreamingResponse>>({});
  const [isLoading, setIsLoading] = useState(false);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const stopGeneration = useCallback(() => {
    abortControllersRef.current.forEach((controller) => {
      controller.abort();
    });
    abortControllersRef.current.clear();
    setIsLoading(false);
    setResponses((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((modelId) => {
        if (updated[modelId].isStreaming) {
          updated[modelId] = { ...updated[modelId], isStreaming: false };
        }
      });
      return updated;
    });
  }, []);

  const sendMessage = useCallback(
    async (content: string, selectedModels: string[], prefill: string, options?: SendMessageOptions) => {
      if (!content.trim() || selectedModels.length === 0) return;

      // Add user message
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Initialize responses for each model
      const initialResponses: Record<string, StreamingResponse> = {};
      selectedModels.forEach((modelId) => {
        initialResponses[modelId] = {
          modelId,
          content: '',
          isStreaming: true,
        };
      });
      setResponses(initialResponses);

      // Prepare messages for API
      const apiMessages = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
      apiMessages.push({ role: 'user', content: content.trim() });

      // Stream from each model concurrently
      const streamPromises = selectedModels.map(async (modelId) => {
        const abortController = new AbortController();
        abortControllersRef.current.set(modelId, abortController);

        try {
          await streamChatCompletion(
            modelId,
            apiMessages,
            prefill.trim() || null,
            {
              onChunk: (chunk) => {
                setResponses((prev) => ({
                  ...prev,
                  [modelId]: {
                    ...prev[modelId],
                    content: prev[modelId].content + chunk,
                  },
                }));
              },
              onReasoning: (reasoning) => {
                setResponses((prev) => ({
                  ...prev,
                  [modelId]: {
                    ...prev[modelId],
                    reasoning: (prev[modelId].reasoning || '') + reasoning,
                  },
                }));
              },
              onComplete: () => {
                setResponses((prev) => ({
                  ...prev,
                  [modelId]: {
                    ...prev[modelId],
                    isStreaming: false,
                  },
                }));
                abortControllersRef.current.delete(modelId);
              },
              onError: (error) => {
                setResponses((prev) => ({
                  ...prev,
                  [modelId]: {
                    ...prev[modelId],
                    isStreaming: false,
                    error: error.message,
                  },
                }));
                abortControllersRef.current.delete(modelId);
              },
            },
            abortController.signal,
            options
          );
        } catch (error) {
          setResponses((prev) => ({
            ...prev,
            [modelId]: {
              ...prev[modelId],
              isStreaming: false,
              error: (error as Error).message,
            },
          }));
          abortControllersRef.current.delete(modelId);
        }
      });

      await Promise.allSettled(streamPromises);
      setIsLoading(false);

      // Add assistant messages to history after streaming completes, then clear responses
      setResponses((currentResponses) => {
        const assistantMessages: Message[] = Object.values(currentResponses)
          .filter((r) => r.content && !r.error)
          .map((r) => ({
            id: crypto.randomUUID(),
            role: 'assistant' as const,
            content: r.content,
            reasoning: r.reasoning,
            model: r.modelId,
            timestamp: Date.now(),
          }));

        if (assistantMessages.length > 0) {
          setMessages((prev) => [...prev, ...assistantMessages]);
        }
        // Clear responses so ResponsePanel hides after messages are added
        return {};
      });
    },
    [messages]
  );

  const clearChat = useCallback(() => {
    stopGeneration();
    setMessages([]);
    setResponses({});
    localStorage.removeItem('openrouter-chat-messages');
  }, [stopGeneration]);

  const saveConversation = useCallback((name?: string) => {
    if (messages.length === 0) return;

    const conversation: Conversation = {
      id: crypto.randomUUID(),
      name: name || `conversation-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`,
      messages,
      createdAt: messages[0]?.timestamp || Date.now(),
      updatedAt: Date.now(),
    };

    const blob = new Blob([JSON.stringify(conversation, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversation.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [messages]);

  const loadConversation = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const conversation: Conversation = JSON.parse(text);
      if (conversation.messages && Array.isArray(conversation.messages)) {
        setMessages(conversation.messages);
        setResponses({});
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('openrouter-chat-messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('openrouter-chat-messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
        }
      } catch {
        // Ignore invalid JSON
      }
    }
  }, []);

  return {
    messages,
    responses,
    isLoading,
    sendMessage,
    clearChat,
    stopGeneration,
    saveConversation,
    loadConversation,
  };
}
