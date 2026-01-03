import { useState, useEffect, useRef } from 'react';
import { ModelInfo } from '../types';
import { fetchModels, POPULAR_MODELS } from '../utils/api';

interface ModelSelectorProps {
  selectedModels: string[];
  onSelectionChange: (models: string[]) => void;
}

export function ModelSelector({ selectedModels, onSelectionChange }: ModelSelectorProps) {
  const [models, setModels] = useState<ModelInfo[]>(POPULAR_MODELS);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadModels = async () => {
      setIsLoadingModels(true);
      setFetchError(null);
      try {
        const fetched = await fetchModels();
        console.log(`Loaded ${fetched.length} models from OpenRouter`);
        setModels(fetched);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to fetch models:', errorMsg);
        setFetchError(errorMsg);
        setModels(POPULAR_MODELS);
      } finally {
        setIsLoadingModels(false);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredModels = models.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.id.toLowerCase().includes(search.toLowerCase())
  );

  const toggleModel = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      onSelectionChange(selectedModels.filter((id) => id !== modelId));
    } else {
      onSelectionChange([...selectedModels, modelId]);
    }
  };

  const getDisplayText = () => {
    if (selectedModels.length === 0) return 'Select models...';
    if (selectedModels.length === 1) {
      const model = models.find((m) => m.id === selectedModels[0]);
      return model?.name || selectedModels[0];
    }
    return `${selectedModels.length} models selected`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left bg-gray-800 border border-gray-700 rounded-lg hover:border-gray-600 focus:outline-none focus:border-blue-500 flex items-center justify-between"
      >
        <span className="truncate">{getDisplayText()}</span>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-80 overflow-hidden">
          <div className="p-2 border-b border-gray-700">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search models..."
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>

          {isLoadingModels && (
            <div className="p-4 text-center text-gray-400">Loading models...</div>
          )}

          {fetchError && (
            <div className="px-4 py-2 text-xs text-yellow-500 bg-yellow-900/20 border-b border-gray-700">
              Failed to load models: {fetchError}. Using {models.length} fallback models.
            </div>
          )}

          {!isLoadingModels && !fetchError && (
            <div className="px-4 py-1 text-xs text-gray-500 border-b border-gray-700">
              {filteredModels.length} of {models.length} models
            </div>
          )}

          <div className="overflow-y-auto max-h-56">
            {filteredModels.map((model) => (
              <label
                key={model.id}
                className="flex items-center px-4 py-2 hover:bg-gray-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedModels.includes(model.id)}
                  onChange={() => toggleModel(model.id)}
                  className="w-4 h-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
                />
                <span className="ml-3 truncate">{model.name}</span>
                <span className="ml-auto text-xs text-gray-500 truncate max-w-32">{model.id}</span>
              </label>
            ))}
          </div>

          {selectedModels.length > 0 && (
            <div className="p-2 border-t border-gray-700">
              <button
                onClick={() => onSelectionChange([])}
                className="w-full px-3 py-1 text-sm text-gray-400 hover:text-white"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
