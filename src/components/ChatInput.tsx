import { useState, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSend: (message: string, prefill: string) => void;
  isLoading: boolean;
  onStop: () => void;
  disabled: boolean;
}

export function ChatInput({ onSend, isLoading, onStop, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [prefill, setPrefill] = useState('');
  const [showPrefill, setShowPrefill] = useState(false);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message, prefill);
      setMessage('');
      // Keep prefill for reuse, user can clear manually
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-700 p-4 bg-gray-900">
      {/* Prefill section */}
      <div className="mb-3">
        <button
          onClick={() => setShowPrefill(!showPrefill)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showPrefill ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Assistant Prefill
          {prefill && <span className="text-blue-400">(active)</span>}
        </button>

        {showPrefill && (
          <div className="mt-2">
            <textarea
              value={prefill}
              onChange={(e) => setPrefill(e.target.value)}
              placeholder="Enter text to prefill assistant's response..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg resize-none focus:outline-none focus:border-blue-500 text-sm"
              rows={2}
            />
            <p className="text-xs text-gray-500 mt-1">
              This text will be added as the beginning of the assistant's response.
            </p>
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="flex gap-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Select at least one model...' : 'Type your message... (Enter to send, Shift+Enter for new line)'}
          className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg resize-none focus:outline-none focus:border-blue-500 disabled:opacity-50"
          rows={3}
          disabled={disabled}
        />

        <div className="flex flex-col gap-2">
          {isLoading ? (
            <button
              onClick={onStop}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={disabled || !message.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
