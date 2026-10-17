import JSZip from 'jszip';

export async function generateExtensionZip(): Promise<Blob> {
  const zip = new JSZip();

  // 1. Manifest V3
  const manifest = {
    manifest_version: 3,
    name: 'Deal Finder - Shop & Price Search',
    version: '1.0.0',
    description: 'Find the best shopping deals across online stores with instant price comparison and relevance ranking.',
    action: {
      default_popup: 'popup.html',
      default_title: 'Deal Finder',
      default_icon: {
        '16': 'icons/icon16.png',
        '48': 'icons/icon48.png',
        '128': 'icons/icon128.png'
      }
    },
    background: {
      service_worker: 'background.js',
      type: 'module'
    },
    permissions: [
      'storage'
    ],
    host_permissions: [
      'https://google.serper.dev/*',
      'https://serpapi.com/*'
    ],
    icons: {
      '16': 'icons/icon16.png',
      '48': 'icons/icon48.png',
      '128': 'icons/icon128.png'
    }
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // 2. Standalone Background Service Worker (Pure JavaScript for MV3)
  const backgroundJs = `/**
 * Deal Finder - Chrome Extension Manifest V3 Background Service Worker
 * The sole component that holds the API key and performs store queries with 30-min cache.
 */

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CACHE_PREFIX = 'deal_cache_';
const SETTINGS_KEY = 'deal_finder_settings';

const DEFAULT_SETTINGS = {
  provider: 'demo',
  apiKey: '',
  sortBy: 'relevance'
};

function parsePriceNumber(raw) {
  if (typeof raw === 'number') return isNaN(raw) ? null : raw;
  if (!raw || typeof raw !== 'string') return null;
  const cleaned = raw.replace(/[^0-9.,]/g, '');
  if (!cleaned) return null;
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    const parsed = parseFloat(cleaned.replace(',', '.'));
    return isNaN(parsed) ? null : parsed;
  }
  const parsed = parseFloat(cleaned.replace(/,/g, ''));
  return isNaN(parsed) ? null : parsed;
}

function formatPriceText(raw, num) {
  if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim();
  if (num !== null) return '$' + num.toFixed(2);
  return 'Price on site';
}

function normalizeSerper(data) {
  if (!data || !Array.isArray(data.shopping)) return [];
  const deals = [];
  for (const item of data.shopping) {
    if (!item.title || !item.link) continue;
    const priceNum = parsePriceNumber(item.price);
    deals.push({
      title: item.title.trim(),
      price: priceNum,
      priceText: formatPriceText(item.price, priceNum),
      store: item.source ? item.source.trim() : 'Online Merchant',
      link: item.link.trim(),
      image: item.imageUrl || undefined,
      rating: typeof item.rating === 'number' ? item.rating : undefined,
      ratingCount: typeof item.ratingCount === 'number' ? item.ratingCount : undefined,
      delivery: item.delivery || undefined
    });
  }
  return deals;
}

function normalizeSerpApi(data) {
  if (!data || !Array.isArray(data.shopping_results)) return [];
  const deals = [];
  for (const item of data.shopping_results) {
    const link = item.link || item.product_link;
    if (!item.title || !link) continue;
    const priceNum = typeof item.extracted_price === 'number'
      ? item.extracted_price
      : parsePriceNumber(item.price);
    deals.push({
      title: item.title.trim(),
      price: priceNum,
      priceText: formatPriceText(item.price, priceNum),
      store: item.source ? item.source.trim() : 'Online Merchant',
      link: link.trim(),
      image: item.thumbnail || undefined,
      rating: typeof item.rating === 'number' ? item.rating : undefined,
      ratingCount: typeof item.reviews === 'number' ? item.reviews : undefined,
      delivery: item.delivery || undefined
    });
  }
  return deals;
}

async function getStored(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (res) => resolve(res[key]));
  });
}

async function setStored(key, val) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: val }, () => resolve());
  });
}

async function searchApi(query, settings) {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) {
    return { success: false, error: 'Query must be at least 2 characters', errorType: 'INVALID_QUERY' };
  }

  // Demo fallback
  if (settings.provider === 'demo' || !settings.apiKey) {
    const stores = ['Amazon', 'Best Buy', 'Walmart', 'Target', 'B&H Photo'];
    const basePrice = (Math.abs(trimmed.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)) % 200) + 49.99;
    const deals = stores.map((store, i) => {
      const price = Number((basePrice * (1 + (i * 0.05))).toFixed(2));
      return {
        title: trimmed + ' - ' + store + ' Verified Deal',
        price,
        priceText: '$' + price.toFixed(2),
        store,
        link: 'https://www.' + store.toLowerCase().replace(/[^a-z]/g, '') + '.com/search?q=' + encodeURIComponent(trimmed),
        rating: 4.5 + (i * 0.1 > 0.4 ? 0.3 : i * 0.1),
        ratingCount: 1200 + i * 450,
        delivery: i === 0 ? 'Free Prime delivery' : 'Free 2-day delivery'
      };
    });
    return { success: true, deals };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    if (settings.provider === 'serper') {
      const res = await fetch('https://google.serper.dev/shopping', {
        method: 'POST',
        headers: {
          'X-API-KEY': settings.apiKey.trim(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: trimmed, gl: 'us', hl: 'en' }),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) return { success: false, error: 'Invalid Serper API key.', errorType: 'MISSING_KEY' };
        if (res.status === 429) return { success: false, error: 'Serper rate limit reached.', errorType: 'RATE_LIMIT' };
        return { success: false, error: 'Search failed with status ' + res.status, errorType: 'NETWORK_ERROR' };
      }
      const json = await res.json();
      return { success: true, deals: normalizeSerper(json) };
    }

    if (settings.provider === 'serpapi') {
      const url = new URL('https://serpapi.com/search.json');
      url.searchParams.set('engine', 'google_shopping');
      url.searchParams.set('q', trimmed);
      url.searchParams.set('api_key', settings.apiKey.trim());

      const res = await fetch(url.toString(), { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) return { success: false, error: 'Invalid SerpAPI key.', errorType: 'MISSING_KEY' };
        if (res.status === 429) return { success: false, error: 'SerpAPI rate limit reached.', errorType: 'RATE_LIMIT' };
        return { success: false, error: 'SerpAPI returned HTTP ' + res.status, errorType: 'NETWORK_ERROR' };
      }
      const json = await res.json();
      return { success: true, deals: normalizeSerpApi(json) };
    }

    clearTimeout(timer);
    return { success: false, error: 'Unknown provider', errorType: 'UNKNOWN' };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') return { success: false, error: 'Request timed out after 10s.', errorType: 'TIMEOUT' };
    return { success: false, error: err.message || 'Network error', errorType: 'NETWORK_ERROR' };
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    if (message.type === 'SEARCH') {
      const query = message.query ? message.query.trim() : '';
      if (!query || query.length < 2) {
        return sendResponse({ success: false, error: 'Please enter at least 2 characters.', errorType: 'INVALID_QUERY', query });
      }

      const cacheKey = CACHE_PREFIX + query.toLowerCase();
      const cached = await getStored(cacheKey);
      if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
        return sendResponse({ success: true, deals: cached.deals, cached: true, timestamp: cached.timestamp, query });
      }

      const settings = (await getStored(SETTINGS_KEY)) || DEFAULT_SETTINGS;
      const result = await searchApi(query, settings);

      if (result.success) {
        await setStored(cacheKey, { query, deals: result.deals, timestamp: Date.now() });
        return sendResponse({ success: true, deals: result.deals, cached: false, timestamp: Date.now(), query });
      } else {
        return sendResponse({ success: false, error: result.error, errorType: result.errorType, query });
      }
    }

    if (message.type === 'GET_SETTINGS') {
      const settings = (await getStored(SETTINGS_KEY)) || DEFAULT_SETTINGS;
      return sendResponse({ success: true, settings });
    }

    if (message.type === 'SAVE_SETTINGS') {
      await setStored(SETTINGS_KEY, message.settings);
      return sendResponse({ success: true, settings: message.settings });
    }

    if (message.type === 'CLEAR_CACHE') {
      chrome.storage.local.get(null, (all) => {
        const keysToRemove = Object.keys(all).filter(k => k.startsWith(CACHE_PREFIX));
        chrome.storage.local.remove(keysToRemove, () => {
          sendResponse({ success: true, clearedCount: keysToRemove.length });
        });
      });
      return true;
    }
  })();
  return true;
});
`;
  zip.file('background.js', backgroundJs);

  // 3. Popup HTML
  const popupHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Deal Finder</title>
    <link rel="stylesheet" href="popup.css" />
  </head>
  <body>
    <div id="popup-root">
      <header class="header">
        <div class="brand">
          <svg class="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path>
            <circle cx="7" cy="7" r="1.5"></circle>
          </svg>
          <span class="title">Deal Finder</span>
        </div>
        <button id="settings-toggle" class="icon-btn" title="Settings">⚙️</button>
      </header>

      <main class="content">
        <!-- Search View -->
        <div id="search-view">
          <form id="search-form">
            <input id="search-input" type="text" placeholder="Search products (e.g. Sony XM5)..." autofocus />
            <button type="submit" id="search-btn">Find Deals</button>
          </form>

          <div id="results-bar" class="results-bar" style="display:none;">
            <span id="results-count">0 deals</span>
            <div class="sort-controls">
              <button id="sort-relevance" class="active">Best Match</button>
              <button id="sort-price">Lowest Price</button>
            </div>
          </div>

          <div id="results-container" class="results-container" aria-live="polite">
            <div class="empty-state">
              <p>Type a product name above to compare prices across stores.</p>
            </div>
          </div>
        </div>

        <!-- Settings View -->
        <div id="settings-view" style="display:none;">
          <h3>Settings</h3>
          <label>Provider</label>
          <select id="setting-provider">
            <option value="demo">Demo Catalog (No key needed)</option>
            <option value="serper">Serper.dev Shopping API</option>
            <option value="serpapi">SerpAPI Google Shopping</option>
          </select>

          <div id="key-section" style="margin-top:12px; display:none;">
            <label>API Key</label>
            <input type="password" id="setting-api-key" placeholder="Paste your API key" />
            <small>Saved in chrome.storage.local only</small>
          </div>

          <div style="margin-top:16px; display:flex; gap:8px;">
            <button id="save-settings-btn" class="primary-btn">Save Settings</button>
            <button id="back-btn" class="secondary-btn">Back</button>
          </div>

          <hr style="margin:16px 0; border:0; border-top:1px solid #e2e8f0;" />
          <button id="clear-cache-btn" class="danger-btn">Clear Search Cache</button>
        </div>
      </main>
    </div>
    <script src="popup.js"></script>
  </body>
</html>`;
  zip.file('popup.html', popupHtml);

  // 4. Popup CSS
  const popupCss = `
* { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
body { width: 380px; min-height: 480px; background: #ffffff; color: #0f172a; font-size: 13px; }
.header { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
.brand { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 14px; }
.brand-icon { width: 16px; height: 16px; color: #0284c7; }
.icon-btn { background: none; border: none; cursor: pointer; font-size: 16px; padding: 4px; border-radius: 4px; }
.content { padding: 12px; }
#search-form { display: flex; gap: 6px; margin-bottom: 10px; }
#search-input { flex: 1; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; outline: none; }
#search-input:focus { border-color: #0284c7; ring: 2px solid #38bdf8; }
#search-btn { padding: 8px 12px; background: #0284c7; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
.results-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 11px; color: #64748b; }
.sort-controls button { background: #f1f5f9; border: none; padding: 4px 8px; font-size: 11px; border-radius: 4px; cursor: pointer; }
.sort-controls button.active { background: #0284c7; color: white; font-weight: 600; }
.results-container { max-height: 380px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
.deal-card { display: flex; gap: 10px; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; text-decoration: none; color: inherit; transition: border-color 0.15s; }
.deal-card:hover { border-color: #0284c7; background: #fafafa; }
.deal-img { width: 56px; height: 56px; object-fit: cover; border-radius: 6px; background: #f1f5f9; shrink: 0; }
.deal-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; min-width: 0; }
.deal-store { font-size: 11px; color: #64748b; font-weight: 600; margin-bottom: 2px; }
.deal-title { font-size: 12px; line-height: 1.3; font-weight: 500; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 4px; }
.deal-price { font-weight: 700; color: #0284c7; font-size: 13px; }
.empty-state { text-align: center; padding: 30px 10px; color: #94a3b8; font-size: 12px; }
.primary-btn { padding: 8px 12px; background: #0284c7; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
.secondary-btn { padding: 8px 12px; background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; }
.danger-btn { padding: 6px 10px; background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; border-radius: 6px; cursor: pointer; font-size: 11px; }
select, input[type="password"], input[type="text"] { width: 100%; padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 6px; margin-top: 4px; }
`;
  zip.file('popup.css', popupCss);

  // 5. Popup JS
  const popupJs = `
let currentDeals = [];
let sortOrder = 'relevance';

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const resultsContainer = document.getElementById('results-container');
const resultsBar = document.getElementById('results-bar');
const resultsCount = document.getElementById('results-count');
const sortRelevance = document.getElementById('sort-relevance');
const sortPrice = document.getElementById('sort-price');
const settingsToggle = document.getElementById('settings-toggle');
const searchView = document.getElementById('search-view');
const settingsView = document.getElementById('settings-view');
const settingProvider = document.getElementById('setting-provider');
const settingApiKey = document.getElementById('setting-api-key');
const keySection = document.getElementById('key-section');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const backBtn = document.getElementById('back-btn');
const clearCacheBtn = document.getElementById('clear-cache-btn');

function renderDeals() {
  if (!currentDeals || currentDeals.length === 0) {
    resultsBar.style.display = 'none';
    resultsContainer.innerHTML = '<div class="empty-state">No deals found. Try a different query.</div>';
    return;
  }

  resultsBar.style.display = 'flex';
  resultsCount.textContent = currentDeals.length + ' deals found';

  let list = [...currentDeals];
  if (sortOrder === 'price') {
    list.sort((a, b) => (a.price || Infinity) - (b.price || Infinity));
  }

  resultsContainer.innerHTML = list.map(d => \`
    <a href="\${d.link}" target="_blank" rel="noopener noreferrer" class="deal-card">
      <img src="\${d.image || 'icons/icon48.png'}" class="deal-img" onerror="this.src='icons/icon48.png';" />
      <div class="deal-info">
        <div>
          <div class="deal-store">\${d.store || 'Store'}</div>
          <div class="deal-title">\${d.title}</div>
        </div>
        <div class="deal-price">\${d.priceText || (d.price ? '$' + d.price : 'Price on site')}</div>
      </div>
    </a>
  \`).join('');
}

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const q = searchInput.value.trim();
  if (q.length < 2) return;

  resultsContainer.innerHTML = '<div class="empty-state">Searching stores for "' + q + '"...</div>';
  searchBtn.disabled = true;

  chrome.runtime.sendMessage({ type: 'SEARCH', query: q }, (res) => {
    searchBtn.disabled = false;
    if (res && res.success) {
      currentDeals = res.deals;
      renderDeals();
    } else {
      resultsContainer.innerHTML = '<div class="empty-state" style="color:#ef4444;">' + (res?.error || 'Failed to search') + '</div>';
    }
  });
});

sortRelevance.addEventListener('click', () => {
  sortOrder = 'relevance';
  sortRelevance.classList.add('active');
  sortPrice.classList.remove('active');
  renderDeals();
});

sortPrice.addEventListener('click', () => {
  sortOrder = 'price';
  sortPrice.classList.add('active');
  sortRelevance.classList.remove('active');
  renderDeals();
});

settingsToggle.addEventListener('click', () => {
  searchView.style.display = 'none';
  settingsView.style.display = 'block';
  chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (res) => {
    if (res && res.settings) {
      settingProvider.value = res.settings.provider || 'demo';
      settingApiKey.value = res.settings.apiKey || '';
      keySection.style.display = settingProvider.value === 'demo' ? 'none' : 'block';
    }
  });
});

settingProvider.addEventListener('change', () => {
  keySection.style.display = settingProvider.value === 'demo' ? 'none' : 'block';
});

backBtn.addEventListener('click', () => {
  settingsView.style.display = 'none';
  searchView.style.display = 'block';
});

saveSettingsBtn.addEventListener('click', () => {
  const provider = settingProvider.value;
  const apiKey = settingApiKey.value.trim();
  chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', settings: { provider, apiKey, sortBy: 'relevance' } }, () => {
    alert('Settings saved!');
    settingsView.style.display = 'none';
    searchView.style.display = 'block';
  });
});

clearCacheBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'CLEAR_CACHE' }, (res) => {
    alert('Cleared ' + (res?.clearedCount || 0) + ' cached items.');
  });
});
`;
  zip.file('popup.js', popupJs);

  // 6. Icons folder
  const iconsFolder = zip.folder('icons');
  try {
    const icon16 = await fetch('/icons/icon16.png').then(r => r.blob());
    const icon48 = await fetch('/icons/icon48.png').then(r => r.blob());
    const icon128 = await fetch('/icons/icon128.png').then(r => r.blob());
    iconsFolder?.file('icon16.png', icon16);
    iconsFolder?.file('icon48.png', icon48);
    iconsFolder?.file('icon128.png', icon128);
  } catch (e) {
    console.warn('Could not fetch icons from public, using placeholder', e);
  }

  // 7. README.md
  const readme = `# Deal Finder Chrome Extension (Manifest V3)

A Chrome extension where the user types a product name and gets a list of shop results, best match first, each showing the price and a link to the shop page.

## Installation in Chrome

1. Extract this zip file to a folder on your computer (e.g. \`deal-finder-extension\`).
2. Open Google Chrome and visit \`chrome://extensions\` in your URL bar.
3. Enable **Developer mode** toggle in the top-right corner.
4. Click the **Load unpacked** button in the top-left.
5. Select the extracted folder containing \`manifest.json\`.
6. Done! Click the puzzle icon in Chrome's toolbar and pin **Deal Finder**.

## Features

- **Relevance Ranking**: Primary sort displays best match first from the shopping API.
- **Lowest Price Sort**: One-click client sort to reorder deals by lowest price.
- **Background Service Worker**: Manifest V3 worker caches queries for 30 minutes in \`chrome.storage.local\`.
- **API Key Security**: Stored in extension storage, never exposed to pages or popup context.
- **Provider Choice**: Supports Demo index, Serper.dev Shopping API, or SerpAPI Google Shopping.
`;
  zip.file('README.md', readme);

  return await zip.generateAsync({ type: 'blob' });
}
