import React, { useState, useEffect, useCallback } from 'react';
import { Settings as SettingsIcon, Tag, Sparkles, RefreshCw } from 'lucide-react';
import { Deal, SearchResponse, ExtensionSettings } from '../lib/types';
import { sendExtensionMessage } from '../lib/chromeRuntime';
import { SearchBox } from './SearchBox';
import { ResultList } from './ResultList';
import { Settings } from './Settings';

interface PopupProps {
  standalone?: boolean;
}

export const Popup: React.FC<PopupProps> = ({ standalone = false }) => {
  const [currentView, setCurrentView] = useState<'search' | 'settings'>('search');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isCached, setIsCached] = useState(false);
  const [cacheTimestamp, setCacheTimestamp] = useState<number | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);

  // Check if API key is configured on initial load
  useEffect(() => {
    async function checkSetup() {
      try {
        const res = await sendExtensionMessage<{ success: boolean; settings: ExtensionSettings }>({
          type: 'GET_SETTINGS'
        });
        if (res?.success && res.settings) {
          // If user chose serper or serpapi but has no key, open settings first per design doc
          if (res.settings.provider !== 'demo' && !res.settings.apiKey?.trim()) {
            setCurrentView('settings');
          }
        }
      } catch (err) {
        console.warn('Could not verify initial settings:', err);
      }
    }
    checkSetup();
  }, []);

  const handleSearch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 2) return;

    setQuery(trimmed);
    setIsLoading(true);
    setErrorMessage(null);
    setErrorType(null);

    try {
      const response = await sendExtensionMessage<SearchResponse>({
        type: 'SEARCH',
        query: trimmed
      });

      if (response.success) {
        setDeals(response.deals);
        setIsCached(response.cached);
        setCacheTimestamp(response.timestamp);
      } else {
        setErrorMessage(response.error);
        setErrorType(response.errorType);
        setDeals([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to communicate with extension background worker.';
      setErrorMessage(msg);
      setErrorType('NETWORK_ERROR');
      setDeals([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRetry = () => {
    if (query) {
      handleSearch(query);
    }
  };

  return (
    <div
      className={`w-full max-w-[400px] min-h-[480px] bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans select-none ${
        standalone ? 'shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-800' : ''
      }`}
      style={{ width: '100%', maxWidth: '390px' }}
    >
      {/* Header bar */}
      <header className="px-3.5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-sky-600 flex items-center justify-center text-white shadow-xs">
            <Tag className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            Deal Finder
          </span>
        </div>

        <div className="flex items-center gap-1">
          {deals.length > 0 && currentView === 'search' && (
            <button
              onClick={() => handleSearch(query)}
              disabled={isLoading || !query}
              title="Refresh search from stores"
              aria-label="Refresh search"
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}

          <button
            onClick={() => setCurrentView(currentView === 'search' ? 'settings' : 'search')}
            title={currentView === 'search' ? 'Open Settings' : 'Back to Search'}
            aria-label={currentView === 'search' ? 'Open Settings' : 'Back to Search'}
            className={`p-1.5 rounded-md transition-colors ${
              currentView === 'settings'
                ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-3.5 overflow-y-auto">
        {currentView === 'settings' ? (
          <Settings
            onBack={() => setCurrentView('search')}
            onSettingsSaved={() => {
              if (query) handleSearch(query);
            }}
          />
        ) : (
          <div className="space-y-3">
            {/* Search Input Box */}
            <SearchBox
              initialQuery={query}
              isLoading={isLoading}
              onSearch={handleSearch}
            />

            {/* Results / Empty / Loading / Error List */}
            <ResultList
              isLoading={isLoading}
              deals={deals}
              query={query}
              isCached={isCached}
              cacheTimestamp={cacheTimestamp}
              errorMessage={errorMessage}
              errorType={errorType}
              onOpenSettings={() => setCurrentView('settings')}
              onRetry={handleRetry}
              onSelectSuggestion={(suggestion) => handleSearch(suggestion)}
            />
          </div>
        )}
      </main>

      {/* Footer bar */}
      <footer className="px-3.5 py-2 border-t border-slate-200/80 dark:border-slate-800/80 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between shrink-0 bg-slate-50/40 dark:bg-slate-900/20">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-sky-500" />
          <span>Real-time shop comparison</span>
        </span>
        <span>Manifest V3</span>
      </footer>
    </div>
  );
};
