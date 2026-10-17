export type Deal = {
  title: string;
  price: number | null;
  priceText: string; // as the shop shows it, e.g. "$129.99" or "Price on site"
  store: string;
  link: string;
  image?: string;
  rating?: number;
  ratingCount?: number;
  delivery?: string;
};

export type ApiProvider = 'demo' | 'serper' | 'serpapi';

export type ExtensionSettings = {
  provider: ApiProvider;
  apiKey: string;
  sortBy: 'relevance' | 'price_asc';
};

export type CachedSearch = {
  query: string;
  deals: Deal[];
  timestamp: number;
};

export type SearchMessage = {
  type: 'SEARCH';
  query: string;
};

export type GetSettingsMessage = {
  type: 'GET_SETTINGS';
};

export type SaveSettingsMessage = {
  type: 'SAVE_SETTINGS';
  settings: ExtensionSettings;
};

export type ClearCacheMessage = {
  type: 'CLEAR_CACHE';
};

export type GetCacheStatsMessage = {
  type: 'GET_CACHE_STATS';
};

export type ExtensionMessage =
  | SearchMessage
  | GetSettingsMessage
  | SaveSettingsMessage
  | ClearCacheMessage
  | GetCacheStatsMessage;

export type SearchResponse =
  | {
      success: true;
      deals: Deal[];
      cached: boolean;
      timestamp: number;
      query: string;
    }
  | {
      success: false;
      error: string;
      errorType: 'MISSING_KEY' | 'RATE_LIMIT' | 'NETWORK_ERROR' | 'INVALID_QUERY' | 'TIMEOUT' | 'UNKNOWN';
      query: string;
    };

export type CacheStatsResponse = {
  count: number;
  queries: { query: string; ageMinutes: number; dealsCount: number }[];
};
