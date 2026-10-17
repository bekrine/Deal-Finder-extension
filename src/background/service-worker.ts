import {
  ExtensionMessage,
  SearchResponse,
  ExtensionSettings,
  CachedSearch,
  CacheStatsResponse
} from '../lib/types';
import { searchProducts } from '../lib/searchProducts';

export const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes TTL as per design specification
const CACHE_PREFIX = 'deal_cache_';
const SETTINGS_KEY = 'deal_finder_settings';

export const DEFAULT_SETTINGS: ExtensionSettings = {
  provider: 'demo',
  apiKey: '',
  sortBy: 'relevance'
};

/**
 * Storage adapter abstraction that works with chrome.storage.local if available,
 * or localStorage in browser fallback mode.
 */
export const storageAdapter = {
  async get<T = any>(key: string): Promise<T | null> {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise<T | null>((resolve) => {
        chrome.storage.local.get([key], (result: { [k: string]: any }) => {
          resolve(result[key] !== undefined ? (result[key] as T) : null);
        });
      });
    }
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  async set(key: string, value: any): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, () => resolve());
      });
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Storage set error:', e);
    }
  },

  async getAllKeys(): Promise<string[]> {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get(null, (items) => {
          resolve(Object.keys(items));
        });
      });
    }
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) keys.push(k);
      }
      return keys;
    } catch {
      return [];
    }
  },

  async remove(keys: string | string[]): Promise<void> {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.remove(keyArray, () => resolve());
      });
    }
    try {
      keyArray.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Storage remove error:', e);
    }
  }
};

/**
 * Normalizes query string for cache keys (trimmed, lowercased)
 */
export function getCacheKey(query: string): string {
  return `${CACHE_PREFIX}${query.trim().toLowerCase()}`;
}

/**
 * Retrieves valid cached search if within 30-minute window
 */
export async function getCachedDeals(query: string): Promise<CachedSearch | null> {
  const key = getCacheKey(query);
  const cached = await storageAdapter.get<CachedSearch>(key);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp < CACHE_TTL_MS) {
    return cached;
  }
  // Evict expired entry
  await storageAdapter.remove(key);
  return null;
}

/**
 * Stores search results in cache
 */
export async function setCachedDeals(query: string, deals: any[]): Promise<void> {
  const key = getCacheKey(query);
  const data: CachedSearch = {
    query: query.trim(),
    deals,
    timestamp: Date.now()
  };
  await storageAdapter.set(key, data);
}

/**
 * Retrieves extension settings (API key, provider)
 */
export async function getSettings(): Promise<ExtensionSettings> {
  const stored = await storageAdapter.get<ExtensionSettings>(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(stored || {}) };
}

/**
 * Saves extension settings
 */
export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  await storageAdapter.set(SETTINGS_KEY, settings);
}

/**
 * Clears all cached search results
 */
export async function clearCache(): Promise<number> {
  const keys = await storageAdapter.getAllKeys();
  const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
  if (cacheKeys.length > 0) {
    await storageAdapter.remove(cacheKeys);
  }
  return cacheKeys.length;
}

/**
 * Inspects cache stats for debug and settings
 */
export async function getCacheStats(): Promise<CacheStatsResponse> {
  const keys = await storageAdapter.getAllKeys();
  const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
  const queries: { query: string; ageMinutes: number; dealsCount: number }[] = [];
  const now = Date.now();

  for (const k of cacheKeys) {
    const cached = await storageAdapter.get<CachedSearch>(k);
    if (cached) {
      const ageMinutes = Math.round((now - cached.timestamp) / 60000);
      queries.push({
        query: cached.query,
        ageMinutes,
        dealsCount: cached.deals?.length || 0
      });
    }
  }

  return {
    count: queries.length,
    queries
  };
}

/**
 * Core Service Worker Message Handler
 * Implements MV3 Background logic:
 * 1. Checks storage cache (30m TTL)
 * 2. On miss, calls searchProducts with 10s timeout
 * 3. Caches response in chrome.storage.local
 * 4. Always replies with structured result
 */
export async function handleExtensionMessage(message: ExtensionMessage): Promise<any> {
  switch (message.type) {
    case 'SEARCH': {
      const query = message.query?.trim();
      if (!query || query.length < 2) {
        const errorResponse: SearchResponse = {
          success: false,
          error: 'Please enter at least 2 characters to search.',
          errorType: 'INVALID_QUERY',
          query: query || ''
        };
        return errorResponse;
      }

      // Check cache first (Step 3: 30-minute cache)
      const cached = await getCachedDeals(query);
      if (cached) {
        const cachedResponse: SearchResponse = {
          success: true,
          deals: cached.deals,
          cached: true,
          timestamp: cached.timestamp,
          query
        };
        return cachedResponse;
      }

      // Cache miss: Load settings & execute search
      const settings = await getSettings();
      const result = await searchProducts(query, settings);

      if (result.success) {
        // Cache normalized deals
        await setCachedDeals(query, result.deals);
        const successResponse: SearchResponse = {
          success: true,
          deals: result.deals,
          cached: false,
          timestamp: Date.now(),
          query
        };
        return successResponse;
      } else {
        const failureResponse: SearchResponse = {
          success: false,
          error: result.error,
          errorType: result.errorType,
          query
        };
        return failureResponse;
      }
    }

    case 'GET_SETTINGS': {
      const settings = await getSettings();
      return { success: true, settings };
    }

    case 'SAVE_SETTINGS': {
      await saveSettings(message.settings);
      return { success: true, settings: message.settings };
    }

    case 'CLEAR_CACHE': {
      const clearedCount = await clearCache();
      return { success: true, clearedCount };
    }

    case 'GET_CACHE_STATS': {
      const stats = await getCacheStats();
      return { success: true, stats };
    }

    default:
      return { success: false, error: 'Unknown message type' };
  }
}

// In standard Manifest V3 environment, register chrome.runtime.onMessage
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    handleExtensionMessage(message)
      .then((response) => sendResponse(response))
      .catch((err) => {
        sendResponse({
          success: false,
          error: err?.message || 'Internal background worker error'
        });
      });
    return true; // Keep channel open for async response
  });
}
