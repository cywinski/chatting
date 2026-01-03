import { useState } from 'react';
import { StreamingResponse } from '../types';
import { ReasoningToggle } from './ReasoningToggle';

interface ResponsePanelProps {
  responses: Record<string, StreamingResponse>;
}

export function ResponsePanel({ responses }: ResponsePanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const responseList = Object.values(responses);

  if (responseList.length === 0) return null;

  const copyToClipboard = async (content: string, modelId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(modelId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Single model - full width
  if (responseList.length === 1) {
    const response = responseList[0];
    return (
      <div className="border-t border-gray-700 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-400">{response.modelId}</span>
            {response.isStreaming && (
              <span className="flex items-center gap-1 text-xs text-blue-400">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                Streaming
              </span>
            )}
          </div>
          <button
            onClick={() => copyToClipboard(response.content, response.modelId)}
            className="p-1 hover:bg-gray-700 rounded"
            title="Copy response"
          >
            {copiedId === response.modelId ? (
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
          </button>
        </div>
        {response.error ? (
          <div className="text-red-400 text-sm">{response.error}</div>
        ) : (
          <>
            {response.reasoning && <ReasoningToggle reasoning={response.reasoning} />}
            <div className="whitespace-pre-wrap text-gray-100">{response.content}</div>
          </>
        )}
      </div>
    );
  }

  // Multiple models - grid layout
  return (
    <div className="border-t border-gray-700 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {responseList.map((response) => (
          <div
            key={response.modelId}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-300 truncate">
                  {response.modelId.split('/').pop()}
                </span>
                {response.isStreaming && (
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                )}
              </div>
              <button
                onClick={() => copyToClipboard(response.content, response.modelId)}
                className="p-1 hover:bg-gray-700 rounded flex-shrink-0"
                title="Copy response"
              >
                {copiedId === response.modelId ? (
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </button>
            </div>
            <div className="text-xs text-gray-500 mb-2 truncate">{response.modelId}</div>
            {response.error ? (
              <div className="text-red-400 text-sm">{response.error}</div>
            ) : (
              <>
                {response.reasoning && <ReasoningToggle reasoning={response.reasoning} />}
                <div className="whitespace-pre-wrap text-gray-100 text-sm max-h-64 overflow-y-auto">
                  {response.content || (
                    <span className="text-gray-500 italic">Waiting for response...</span>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
