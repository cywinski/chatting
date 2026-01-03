import { useState, useRef } from 'react';
import { ModelSelector } from './components/ModelSelector';
import { ProviderSelector } from './components/ProviderSelector';
import { MessageList } from './components/MessageList';
import { ResponsePanel } from './components/ResponsePanel';
import { ChatInput } from './components/ChatInput';
import { useOpenRouter } from './hooks/useOpenRouter';

function App() {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const { messages, responses, isLoading, sendMessage, clearChat, stopGeneration, saveConversation, loadConversation } = useOpenRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = (message: string, prefill: string) => {
    sendMessage(message, selectedModels, prefill, selectedProviders.length > 0 ? selectedProviders : undefined);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await loadConversation(file);
      e.target.value = '';
    }
  };

  const hasActiveResponses = Object.values(responses).some((r) => r.content || r.isStreaming);

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".json"
        className="hidden"
      />

      {/* Header */}
      <header className="flex-shrink-0 border-b border-gray-700 p-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <h1 className="text-xl font-bold text-white">OpenRouter Chat</h1>
          <div className="flex-1 max-w-md">
            <ModelSelector
              selectedModels={selectedModels}
              onSelectionChange={setSelectedModels}
            />
          </div>
          <div className="w-40">
            <ProviderSelector
              selectedProviders={selectedProviders}
              onSelectionChange={setSelectedProviders}
            />
          </div>
          <button
            onClick={() => saveConversation()}
            disabled={messages.length === 0}
            className="px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Save to conversations/ folder"
          >
            Save
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Load from JSON file"
          >
            Load
          </button>
          <button
            onClick={clearChat}
            className="px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            Clear
          </button>
        </div>
      </header>

      {/* Chat area */}
      <main className="flex-1 flex flex-col overflow-hidden max-w-6xl mx-auto w-full">
        <MessageList messages={messages} />

        {/* Streaming responses */}
        {hasActiveResponses && <ResponsePanel responses={responses} />}
      </main>

      {/* Input area */}
      <div className="flex-shrink-0 max-w-6xl mx-auto w-full">
        <ChatInput
          onSend={handleSend}
          isLoading={isLoading}
          onStop={stopGeneration}
          disabled={selectedModels.length === 0}
        />
      </div>
    </div>
  );
}

export default App;
