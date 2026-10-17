import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBoxProps {
  initialQuery?: string;
  isLoading: boolean;
  onSearch: (query: string) => void;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  initialQuery = '',
  isLoading,
  onSearch
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    // Autofocus input on popup mount
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setValidationError('Please enter a product name');
      inputRef.current?.focus();
      return;
    }
    if (trimmed.length < 2) {
      setValidationError('Type at least 2 characters');
      inputRef.current?.focus();
      return;
    }

    setValidationError(null);
    onSearch(trimmed);
  };

  const handleClear = () => {
    setQuery('');
    setValidationError(null);
    inputRef.current?.focus();
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2" role="search">
        <label htmlFor="deal-search-input" className="sr-only">
          Search products across stores
        </label>
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="deal-search-input"
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (validationError && e.target.value.trim().length >= 2) {
                setValidationError(null);
              }
            }}
            placeholder="Search products (e.g. Sony XM5, MacBook)..."
            disabled={isLoading}
            className="w-full pl-9 pr-8 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all disabled:opacity-60"
          />
          {query && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search input"
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1"
        >
          {isLoading ? (
            <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            'Find Deals'
          )}
        </button>
      </form>

      {validationError && (
        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 pl-1">
          {validationError}
        </p>
      )}
    </div>
  );
};
