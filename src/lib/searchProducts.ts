import { Deal, ExtensionSettings } from './types';
import { generateDemoDealsForQuery } from './demoDeals';

const REQUEST_TIMEOUT_MS = 10000;

interface SerperShoppingItem {
  title?: string;
  source?: string;
  link?: string;
  price?: string | number;
  imageUrl?: string;
  rating?: number;
  ratingCount?: number;
  delivery?: string;
}

interface SerpApiShoppingItem {
  title?: string;
  source?: string;
  link?: string;
  product_link?: string;
  price?: string;
  extracted_price?: number;
  thumbnail?: string;
  rating?: number;
  reviews?: number;
  delivery?: string;
}

/**
 * Extracts a numeric price from a price string like "$129.99", "129,99 €", "£89.00"
 */
export function parsePriceNumber(raw: string | number | undefined | null): number | null {
  if (typeof raw === 'number') {
    return isNaN(raw) ? null : raw;
  }
  if (!raw || typeof raw !== 'string') {
    return null;
  }
  // Remove non-numeric characters except dots and commas
  const cleaned = raw.replace(/[^0-9.,]/g, '');
  if (!cleaned) return null;

  // Handle European comma decimal separator if no dot is present or comma is near end
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    const parsed = parseFloat(cleaned.replace(',', '.'));
    return isNaN(parsed) ? null : parsed;
  }
  // Handle comma thousands separator
  const parsed = parseFloat(cleaned.replace(/,/g, ''));
  return isNaN(parsed) ? null : parsed;
}

/**
 * Formats a display price text. If missing, returns "Price on site".
 */
export function formatPriceText(raw: string | number | undefined | null, num: number | null): string {
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.trim();
  }
  if (num !== null) {
    return `$${num.toFixed(2)}`;
  }
  return 'Price on site';
}

/**
 * Normalizes raw Serper shopping results
 */
function normalizeSerperResponse(data: { shopping?: SerperShoppingItem[] }): Deal[] {
  if (!data || !Array.isArray(data.shopping)) {
    return [];
  }

  const deals: Deal[] = [];

  for (const item of data.shopping) {
    // Drop results missing title or link as per design specification
    if (!item.title?.trim() || !item.link?.trim()) {
      continue;
    }

    const priceNum = parsePriceNumber(item.price);
    const priceDisplay = formatPriceText(item.price, priceNum);

    deals.push({
      title: item.title.trim(),
      price: priceNum,
      priceText: priceDisplay,
      store: item.source?.trim() || 'Online Merchant',
      link: item.link.trim(),
      image: item.imageUrl || undefined,
      rating: typeof item.rating === 'number' ? item.rating : undefined,
      ratingCount: typeof item.ratingCount === 'number' ? item.ratingCount : undefined,
      delivery: item.delivery || undefined
    });
  }

  return deals;
}

/**
 * Normalizes raw SerpApi shopping results
 */
function normalizeSerpApiResponse(data: { shopping_results?: SerpApiShoppingItem[] }): Deal[] {
  if (!data || !Array.isArray(data.shopping_results)) {
    return [];
  }

  const deals: Deal[] = [];

  for (const item of data.shopping_results) {
    const link = item.link?.trim() || item.product_link?.trim();
    if (!item.title?.trim() || !link) {
      continue;
    }

    const priceNum = typeof item.extracted_price === 'number'
      ? item.extracted_price
      : parsePriceNumber(item.price);
    const priceDisplay = formatPriceText(item.price, priceNum);

    deals.push({
      title: item.title.trim(),
      price: priceNum,
      priceText: priceDisplay,
      store: item.source?.trim() || 'Online Merchant',
      link: link,
      image: item.thumbnail || undefined,
      rating: typeof item.rating === 'number' ? item.rating : undefined,
      ratingCount: typeof item.reviews === 'number' ? item.reviews : undefined,
      delivery: item.delivery || undefined
    });
  }

  return deals;
}

export type SearchResult =
  | { success: true; deals: Deal[] }
  | { success: false; error: string; errorType: 'MISSING_KEY' | 'RATE_LIMIT' | 'NETWORK_ERROR' | 'INVALID_QUERY' | 'TIMEOUT' | 'UNKNOWN' };

/**
 * Executes a product search across the configured provider with strict timeout and validation.
 */
export async function searchProducts(query: string, settings: ExtensionSettings): Promise<SearchResult> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) {
    return {
      success: false,
      error: 'Please enter at least 2 characters to search.',
      errorType: 'INVALID_QUERY'
    };
  }

  // Handle Demo provider
  if (settings.provider === 'demo' || !settings.apiKey?.trim()) {
    // If provider is serper/serpapi but key is missing, report MISSING_KEY
    if (settings.provider !== 'demo' && !settings.apiKey?.trim()) {
      return {
        success: false,
        error: `Please set your ${settings.provider === 'serper' ? 'Serper.dev' : 'SerpAPI'} API key in Settings.`,
        errorType: 'MISSING_KEY'
      };
    }

    // Demo provider simulates realistic network latency (300ms)
    await new Promise(resolve => setTimeout(resolve, 350));
    const demoDeals = generateDemoDealsForQuery(trimmed);
    return {
      success: true,
      deals: demoDeals
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    if (settings.provider === 'serper') {
      const response = await fetch('https://google.serper.dev/shopping', {
        method: 'POST',
        headers: {
          'X-API-KEY': settings.apiKey.trim(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: trimmed,
          gl: 'us',
          hl: 'en'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error: 'Invalid Serper API key. Please check your credentials in Settings.',
          errorType: 'MISSING_KEY'
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          error: 'Rate limit reached on Serper API. Please try again in a few moments.',
          errorType: 'RATE_LIMIT'
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: `Shopping search failed with status ${response.status}.`,
          errorType: 'NETWORK_ERROR'
        };
      }

      const json = await response.json();
      const deals = normalizeSerperResponse(json);
      return { success: true, deals };
    }

    if (settings.provider === 'serpapi') {
      const url = new URL('https://serpapi.com/search.json');
      url.searchParams.set('engine', 'google_shopping');
      url.searchParams.set('q', trimmed);
      url.searchParams.set('api_key', settings.apiKey.trim());

      const response = await fetch(url.toString(), {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error: 'Invalid SerpAPI key. Please verify your key in Settings.',
          errorType: 'MISSING_KEY'
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          error: 'Rate limit reached on SerpAPI. Please try again shortly.',
          errorType: 'RATE_LIMIT'
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: `SerpAPI returned HTTP ${response.status}.`,
          errorType: 'NETWORK_ERROR'
        };
      }

      const json = await response.json();
      const deals = normalizeSerpApiResponse(json);
      return { success: true, deals };
    }

    clearTimeout(timeoutId);
    return {
      success: false,
      error: `Unknown provider: ${settings.provider}`,
      errorType: 'UNKNOWN'
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        return {
          success: false,
          error: 'Search request timed out after 10 seconds. Check your network connection.',
          errorType: 'TIMEOUT'
        };
      }
      return {
        success: false,
        error: err.message || 'Network connection failed.',
        errorType: 'NETWORK_ERROR'
      };
    }
    return {
      success: false,
      error: 'An unexpected network error occurred.',
      errorType: 'NETWORK_ERROR'
    };
  }
}
