import { useState, useEffect, useRef } from 'react';
import { ProviderInfo } from '../types';
import { fetchProviders } from '../utils/api';

interface ProviderSelectorProps {
  selectedProviders: string[];
  onSelectionChange: (providers: string[]) => void;
}

export function ProviderSelector({ selectedProviders, onSelectionChange }: ProviderSelectorProps) {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadProviders = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const fetched = await fetchProviders();
        console.log(`Loaded ${fetched.length} providers from OpenRouter`);
        setProviders(fetched);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to fetch providers:', errorMsg);
        setFetchError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };
    loadProviders();
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

  const filteredProviders = providers.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  const toggleProvider = (providerId: string) => {
    if (selectedProviders.includes(providerId)) {
      onSelectionChange(selectedProviders.filter((id) => id !== providerId));
    } else {
      onSelectionChange([...selectedProviders, providerId]);
    }
  };

  const getDisplayText = () => {
    if (selectedProviders.length === 0) return 'All providers';
    if (selectedProviders.length === 1) {
      const provider = providers.find((p) => p.id === selectedProviders[0]);
      return provider?.name || selectedProviders[0];
    }
    return `${selectedProviders.length} providers`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 text-left text-sm bg-gray-800 border rounded-lg hover:border-gray-600 focus:outline-none focus:border-blue-500 flex items-center justify-between ${
          selectedProviders.length > 0 ? 'border-blue-600' : 'border-gray-700'
        }`}
      >
        <span className="truncate">{getDisplayText()}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-64 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-80 overflow-hidden">
          <div className="p-2 border-b border-gray-700">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search providers..."
              className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>

          {isLoading && (
            <div className="p-4 text-center text-gray-400 text-sm">Loading providers...</div>
          )}

          {fetchError && (
            <div className="px-4 py-2 text-xs text-yellow-500 bg-yellow-900/20 border-b border-gray-700">
              Failed to load providers: {fetchError}
            </div>
          )}

          {!isLoading && providers.length > 0 && (
            <div className="px-4 py-1 text-xs text-gray-500 border-b border-gray-700">
              {filteredProviders.length} of {providers.length} providers
              {selectedProviders.length === 0 && ' (none selected = all)'}
            </div>
          )}

          <div className="overflow-y-auto max-h-48">
            {filteredProviders.map((provider) => (
              <label
                key={provider.id}
                className="flex items-center px-4 py-2 hover:bg-gray-700 cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedProviders.includes(provider.id)}
                  onChange={() => toggleProvider(provider.id)}
                  className="w-4 h-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
                />
                <span className="ml-3 truncate">{provider.name}</span>
              </label>
            ))}
          </div>

          {selectedProviders.length > 0 && (
            <div className="p-2 border-t border-gray-700">
              <button
                onClick={() => onSelectionChange([])}
                className="w-full px-3 py-1 text-sm text-gray-400 hover:text-white"
              >
                Clear (use all)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
