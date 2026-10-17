import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Trash2, Key, Check, ShieldCheck, Eye, EyeOff, Info } from 'lucide-react';
import { ExtensionSettings, ApiProvider, CacheStatsResponse } from '../lib/types';
import { sendExtensionMessage } from '../lib/chromeRuntime';

interface SettingsProps {
  onBack: () => void;
  onSettingsSaved?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onBack, onSettingsSaved }) => {
  const [provider, setProvider] = useState<ApiProvider>('demo');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [cacheStats, setCacheStats] = useState<CacheStatsResponse | null>(null);
  const [clearingCache, setClearingCache] = useState(false);

  // Load existing settings on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await sendExtensionMessage<{ success: boolean; settings: ExtensionSettings }>({
          type: 'GET_SETTINGS'
        });
        if (res?.success && res.settings) {
          setProvider(res.settings.provider || 'demo');
          setApiKey(res.settings.apiKey || '');
        }

        const cacheRes = await sendExtensionMessage<{ success: boolean; stats: CacheStatsResponse }>({
          type: 'GET_CACHE_STATS'
        });
        if (cacheRes?.success) {
          setCacheStats(cacheRes.stats);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await sendExtensionMessage({
        type: 'SAVE_SETTINGS',
        settings: {
          provider,
          apiKey: apiKey.trim(),
          sortBy: 'relevance'
        }
      });
      setSavedSuccess(true);
      onSettingsSaved?.();
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      await sendExtensionMessage({ type: 'CLEAR_CACHE' });
      setCacheStats({ count: 0, queries: [] });
    } catch (err) {
      console.error('Failed to clear cache:', err);
    } finally {
      setClearingCache(false);
    }
  };

  return (
    <div className="space-y-4 py-1 text-slate-900 dark:text-slate-100">
      {/* Header with back button */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Deals</span>
        </button>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Extension Settings
        </span>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Provider Selection */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
            Shopping Data Source
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
            <button
              type="button"
              onClick={() => setProvider('demo')}
              className={`py-1.5 px-2 text-xs font-medium rounded-md transition-all ${
                provider === 'demo'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Demo Index
            </button>
            <button
              type="button"
              onClick={() => setProvider('serper')}
              className={`py-1.5 px-2 text-xs font-medium rounded-md transition-all ${
                provider === 'serper'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Serper.dev
            </button>
            <button
              type="button"
              onClick={() => setProvider('serpapi')}
              className={`py-1.5 px-2 text-xs font-medium rounded-md transition-all ${
                provider === 'serpapi'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              SerpAPI
            </button>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {provider === 'demo'
              ? 'Ready immediately. Uses pre-indexed real store deals and dynamic catalog synthesis without requiring any API key.'
              : provider === 'serper'
              ? 'Real-time Google Shopping results via Serper.dev API. Requires personal API key.'
              : 'Real-time Google Shopping scraper via SerpAPI.com. Requires personal API key.'}
          </p>
        </div>

        {/* API Key Input (if not demo) */}
        {provider !== 'demo' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="api-key-input" className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                {provider === 'serper' ? 'Serper.dev API Key' : 'SerpAPI Key'}
              </label>
              <a
                href={provider === 'serper' ? 'https://serper.dev' : 'https://serpapi.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline"
              >
                Get a key
              </a>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Key className="w-3.5 h-3.5" />
              </div>
              <input
                id="api-key-input"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider === 'serper' ? 'Enter Serper API key' : 'Enter SerpAPI key'}
                className="w-full pl-8 pr-8 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                aria-label={showKey ? 'Hide key' : 'Show key'}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Saved in chrome.storage.local (never published or sent to 3rd party servers).</span>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="pt-1 flex items-center gap-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Settings Saved</span>
              </>
            ) : isSaving ? (
              <span>Saving...</span>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Configuration</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Cache Management Section */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Query Cache (30 min TTL)
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {cacheStats?.count ? `${cacheStats.count} recent searches stored in local extension memory.` : 'No search queries currently cached.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClearCache}
            disabled={clearingCache || !cacheStats?.count}
            className="px-2.5 py-1 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear Cache</span>
          </button>
        </div>

        {/* Cached queries list preview */}
        {cacheStats && cacheStats.queries.length > 0 && (
          <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 max-h-24 overflow-y-auto text-[11px] space-y-1">
            {cacheStats.queries.map((q, idx) => (
              <div key={idx} className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="font-medium truncate max-w-[190px]">"{q.query}"</span>
                <span className="text-[10px] text-slate-400 tabular-nums">
                  {q.dealsCount} deals · {q.ageMinutes}m ago
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Architecture Note */}
      <div className="p-2.5 bg-sky-50/60 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40 rounded-lg flex items-start gap-2 text-[11px] text-sky-800 dark:text-sky-300">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-sky-600 dark:text-sky-400" />
        <p className="leading-relaxed">
          Manifest V3 Security: The background service worker is the sole component with access to the API key and storage cache. Popup components never make direct API calls.
        </p>
      </div>
    </div>
  );
};
