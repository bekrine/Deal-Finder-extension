import React, { useState, useMemo } from 'react';
import { AlertCircle, Key, RefreshCw, ShoppingBag, ArrowUpDown, Clock } from 'lucide-react';
import { Deal } from '../lib/types';
import { DealCard } from './DealCard';

interface ResultListProps {
  isLoading: boolean;
  deals: Deal[];
  query: string;
  isCached?: boolean;
  cacheTimestamp?: number;
  errorMessage?: string | null;
  errorType?: string | null;
  onOpenSettings: () => void;
  onRetry: () => void;
  onSelectSuggestion?: (suggestion: string) => void;
}

type SortOption = 'relevance' | 'price_asc' | 'price_desc';

export const ResultList: React.FC<ResultListProps> = ({
  isLoading,
  deals,
  query,
  isCached,
  cacheTimestamp,
  errorMessage,
  errorType,
  onOpenSettings,
  onRetry,
  onSelectSuggestion
}) => {
  const [sortOption, setSortOption] = useState<SortOption>('relevance');
  const [selectedStore, setSelectedStore] = useState<string>('all');

  // Extract unique stores for store filter
  const stores = useMemo(() => {
    const set = new Set<string>();
    deals.forEach(d => {
      if (d.store) set.add(d.store);
    });
    return Array.from(set);
  }, [deals]);

  // Compute lowest price in dataset
  const lowestPrice = useMemo(() => {
    let min = Infinity;
    deals.forEach(d => {
      if (d.price !== null && d.price < min) {
        min = d.price;
      }
    });
    return min === Infinity ? null : min;
  }, [deals]);

  // Filter and sort deals
  const displayedDeals = useMemo(() => {
    let list = [...deals];

    if (selectedStore !== 'all') {
      list = list.filter(d => d.store === selectedStore);
    }

    if (sortOption === 'price_asc') {
      list.sort((a, b) => {
        if (a.price === null) return 1;
        if (b.price === null) return -1;
        return a.price - b.price;
      });
    } else if (sortOption === 'price_desc') {
      list.sort((a, b) => {
        if (a.price === null) return 1;
        if (b.price === null) return -1;
        return b.price - a.price;
      });
    }
    // 'relevance' keeps API original rank order

    return list;
  }, [deals, selectedStore, sortOption]);

  // Format cache age
  const cacheAgeText = useMemo(() => {
    if (!isCached || !cacheTimestamp) return null;
    const diffMin = Math.max(0, Math.round((Date.now() - cacheTimestamp) / 60000));
    if (diffMin === 0) return 'Cached moments ago';
    if (diffMin === 1) return 'Cached 1 min ago';
    return `Cached ${diffMin} mins ago`;
  }, [isCached, cacheTimestamp]);

  // 1. Loading State (Skeleton cards with shimmer)
  if (isLoading) {
    return (
      <div className="space-y-3 py-2" aria-live="polite" aria-busy="true">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            Searching stores for "{query}"...
          </span>
          <span className="w-16 h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl animate-pulse"
          >
            <div className="w-16 h-16 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
            <div className="flex-1 space-y-2 py-0.5">
              <div className="w-1/3 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="w-3/4 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="flex justify-between items-center pt-2">
                <div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="w-14 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 2. Error State
  if (errorMessage) {
    const isKeyError = errorType === 'MISSING_KEY';

    return (
      <div className="p-4 my-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-3" aria-live="assertive">
        <div className="w-10 h-10 mx-auto rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
          {isKeyError ? <Key className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
        </div>
        <div>
          <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1">
            {isKeyError ? 'API Key Required' : 'Search Unavailable'}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
            {errorMessage}
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 pt-1">
          {isKeyError ? (
            <button
              onClick={onOpenSettings}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              Configure in Settings
            </button>
          ) : (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 3. Initial / Empty State
  if (!deals || deals.length === 0) {
    const sampleQueries = ['Sony WH-1000XM5', 'MacBook Air', 'Nike Air Force 1', 'Kindle Paperwhite'];

    return (
      <div className="py-8 px-4 text-center space-y-4" aria-live="polite">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50 flex items-center justify-center text-sky-600 dark:text-sky-400">
          <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {query ? `No deals found for "${query}"` : 'Compare Prices Across Stores'}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            {query
              ? 'Try a more specific model name, or check your search spelling.'
              : 'Type any product name above to compare prices and check stores instantly.'}
          </p>
        </div>

        {/* Suggested Queries */}
        <div className="pt-2">
          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-2">
            Try a popular search:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {sampleQueries.map((item) => (
              <button
                key={item}
                onClick={() => onSelectSuggestion?.(item)}
                className="px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200 dark:border-slate-700 rounded-md transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 4. Success State (Render deals list with controls)
  return (
    <div className="space-y-2.5" aria-live="polite">
      {/* Results Header: Count, Cache indicator, and Sort Toggle */}
      <div className="flex items-center justify-between gap-2 px-1 text-xs">
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
            {displayedDeals.length}
          </span>
          <span>{displayedDeals.length === 1 ? 'deal found' : 'deals found'}</span>
          {cacheAgeText && (
            <>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400" title="Result cached in background storage">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{cacheAgeText}</span>
              </span>
            </>
          )}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => setSortOption('relevance')}
            className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap ${
              sortOption === 'relevance'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Best Match
          </button>
          <button
            onClick={() => setSortOption('price_asc')}
            className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-0.5 ${
              sortOption === 'price_asc'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ArrowUpDown className="w-2.5 h-2.5" />
            Lowest Price
          </button>
        </div>
      </div>

      {/* Store Filter Bar (if 2+ stores available) */}
      {stores.length > 1 && (
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px]">
          <button
            onClick={() => setSelectedStore('all')}
            className={`px-2.5 py-0.5 rounded-full whitespace-nowrap transition-colors ${
              selectedStore === 'all'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-medium'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All Stores ({deals.length})
          </button>
          {stores.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStore(s)}
              className={`px-2.5 py-0.5 rounded-full whitespace-nowrap transition-colors ${
                selectedStore === s
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-medium'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Scrollable Deals Cards List */}
      <div className="space-y-2 max-h-[390px] overflow-y-auto pr-0.5">
        {displayedDeals.map((deal, idx) => (
          <DealCard
            key={`${deal.store}-${deal.link}-${idx}`}
            deal={deal}
            isLowestPrice={deal.price !== null && deal.price === lowestPrice}
          />
        ))}
      </div>
    </div>
  );
};
