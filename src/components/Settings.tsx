import { useState } from 'react';
import { SamplingParams, DEFAULT_SAMPLING_PARAMS } from '../types';

interface SettingsProps {
  systemPrompt: string;
  onSystemPromptChange: (prompt: string) => void;
  samplingParams: SamplingParams;
  onSamplingParamsChange: (params: SamplingParams) => void;
}

export function Settings({
  systemPrompt,
  onSystemPromptChange,
  samplingParams,
  onSamplingParamsChange,
}: SettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleParamChange = (key: keyof SamplingParams, value: number | null) => {
    onSamplingParamsChange({ ...samplingParams, [key]: value });
  };

  const resetToDefaults = () => {
    onSamplingParamsChange(DEFAULT_SAMPLING_PARAMS);
  };

  const isModified =
    systemPrompt !== '' ||
    samplingParams.temperature !== DEFAULT_SAMPLING_PARAMS.temperature ||
    samplingParams.top_p !== DEFAULT_SAMPLING_PARAMS.top_p ||
    samplingParams.top_k !== DEFAULT_SAMPLING_PARAMS.top_k ||
    samplingParams.frequency_penalty !== DEFAULT_SAMPLING_PARAMS.frequency_penalty ||
    samplingParams.presence_penalty !== DEFAULT_SAMPLING_PARAMS.presence_penalty ||
    samplingParams.max_tokens !== DEFAULT_SAMPLING_PARAMS.max_tokens;

  return (
    <div className="border-b border-gray-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 flex items-center justify-between text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span>Settings</span>
          {isModified && <span className="text-blue-400 text-xs">(modified)</span>}
        </div>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-4 py-3 bg-gray-800/30 space-y-4">
          {/* System Prompt */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">System Prompt</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => onSystemPromptChange(e.target.value)}
              placeholder="Enter system prompt (optional)..."
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg resize-none focus:outline-none focus:border-blue-500 text-sm"
              rows={2}
            />
          </div>

          {/* Sampling Parameters */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Temperature</label>
              <input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={samplingParams.temperature}
                onChange={(e) => handleParamChange('temperature', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Top P</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={samplingParams.top_p}
                onChange={(e) => handleParamChange('top_p', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Top K (0=off)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={samplingParams.top_k}
                onChange={(e) => handleParamChange('top_k', parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Freq. Penalty</label>
              <input
                type="number"
                min="-2"
                max="2"
                step="0.1"
                value={samplingParams.frequency_penalty}
                onChange={(e) => handleParamChange('frequency_penalty', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Pres. Penalty</label>
              <input
                type="number"
                min="-2"
                max="2"
                step="0.1"
                value={samplingParams.presence_penalty}
                onChange={(e) => handleParamChange('presence_penalty', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Max Tokens</label>
              <input
                type="number"
                min="1"
                step="100"
                value={samplingParams.max_tokens ?? ''}
                onChange={(e) => handleParamChange('max_tokens', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="default"
                className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Reset button */}
          <div className="flex justify-end">
            <button
              onClick={resetToDefaults}
              className="px-3 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              Reset to defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
