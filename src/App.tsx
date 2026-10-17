import React, { useState, useEffect } from 'react';
import {
  Download,
  ExternalLink,
  Layers,
  Monitor,
  Smartphone,
  ShieldCheck,
  Tag,
  Zap,
  Code2,
  FileCode,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Search,
  Sparkles,
  Database
} from 'lucide-react';
import { Popup } from './popup/Popup';
import { generateExtensionZip } from './lib/exportZip';
import { getCacheStats, clearCache } from './background/service-worker';
import { CacheStatsResponse } from './lib/types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'standalone' | 'docs' | 'install'>('simulator');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(true);
  const [cacheStats, setCacheStats] = useState<CacheStatsResponse | null>(null);
  const [simulatedUrl, setSimulatedUrl] = useState('https://www.bestbuy.com/site/headphones');

  const refreshCache = async () => {
    try {
      const stats = await getCacheStats();
      setCacheStats(stats);
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    refreshCache();
    const interval = setInterval(refreshCache, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleDownloadZip = async () => {
    try {
      setIsDownloading(true);
      const blob = await generateExtensionZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'deal-finder-chrome-extension.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to export zip:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClearCache = async () => {
    await clearCache();
    refreshCache();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-7 h-7 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-xs">
            <Tag className="w-4 h-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-white">
            Deal Finder
          </span>
          <span className="text-xs text-sky-400 font-mono font-medium pl-1 hidden sm:inline">
            Manifest V3
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeTab === 'simulator' ? 'text-sky-400 font-semibold' : ''
            }`}
          >
            Chrome Simulator
          </button>
          <button
            onClick={() => setActiveTab('standalone')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeTab === 'standalone' ? 'text-sky-400 font-semibold' : ''
            }`}
          >
            Popup Only (380px)
          </button>
          <button
            onClick={() => setActiveTab('install')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeTab === 'install' ? 'text-sky-400 font-semibold' : ''
            }`}
          >
            Load in Chrome Guide
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeTab === 'docs' ? 'text-sky-400 font-semibold' : ''
            }`}
          >
            Extension Architecture
          </button>
        </nav>

        {/* Zone 3: Primary Action CTA */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleDownloadZip}
            disabled={isDownloading}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-60 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {downloadSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>Downloaded ZIP</span>
              </>
            ) : isDownloading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Packaging...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download Extension (.zip)</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Tab 1: Chrome Extension Simulator */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Chrome Browser Mock Window (8 columns) */}
            <div className="lg:col-span-8 flex flex-col bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
              {/* Chrome Browser Window Top Header */}
              <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-4">
                {/* Window Traffic Lights */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>

                {/* Browser Tab */}
                <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded-md text-xs text-slate-300 max-w-[200px] truncate border border-slate-700/50">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span className="truncate">Best Buy Deals & Shopping</span>
                </div>

                <div className="flex-1" />

                <div className="text-[11px] text-slate-400 hidden sm:block">
                  Google Chrome · Manifest V3
                </div>
              </div>

              {/* Chrome Navigation & Extension Toolbar Row */}
              <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center gap-3">
                {/* Back / Forward / Refresh Mock buttons */}
                <div className="flex items-center gap-1 text-slate-500">
                  <span className="px-1 text-sm select-none">←</span>
                  <span className="px-1 text-sm select-none">→</span>
                  <span className="px-1 text-xs select-none">↻</span>
                </div>

                {/* Omnibox / Address Bar */}
                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-400 font-mono truncate flex items-center gap-2">
                  <span className="text-emerald-500 text-[10px]">🔒</span>
                  <input
                    type="text"
                    value={simulatedUrl}
                    onChange={(e) => setSimulatedUrl(e.target.value)}
                    className="bg-transparent border-none text-slate-300 focus:outline-none w-full text-xs font-mono"
                  />
                </div>

                {/* Browser Extensions Zone */}
                <div className="flex items-center gap-1.5 shrink-0 pl-1">
                  {/* Extension Icon Button (Toggles Popup) */}
                  <button
                    onClick={() => setIsPopupOpen(!isPopupOpen)}
                    className={`relative p-1.5 rounded-lg border transition-all flex items-center justify-center ${
                      isPopupOpen
                        ? 'bg-sky-600 text-white border-sky-500 shadow-md ring-2 ring-sky-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                    title="Deal Finder Extension (Click to toggle popup)"
                  >
                    <Tag className="w-4 h-4" />
                    {/* Active Extension badge */}
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-sky-400 text-slate-950 font-bold text-[9px] rounded-full flex items-center justify-center font-mono">
                      ✓
                    </span>
                  </button>

                  <div className="w-px h-4 bg-slate-800 mx-0.5" />

                  {/* Profile avatar mock */}
                  <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-400 font-semibold">
                    MB
                  </div>
                </div>
              </div>

              {/* Viewport content + Floating Extension Popup Overlay */}
              <div className="relative min-h-[580px] bg-slate-950 flex flex-col overflow-hidden">
                {/* Background Webpage Simulation */}
                <div className="p-8 max-w-2xl mx-auto w-full space-y-6 opacity-40 pointer-events-none select-none filter blur-[0.3px]">
                  <div className="h-6 w-48 bg-slate-800 rounded-md" />
                  <div className="h-28 w-full bg-slate-800/60 rounded-xl border border-slate-800" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-36 bg-slate-800/40 rounded-xl" />
                    <div className="h-36 bg-slate-800/40 rounded-xl" />
                  </div>
                  <div className="h-16 w-full bg-slate-800/30 rounded-xl" />
                </div>

                {/* Floating Extension Popup Container */}
                {isPopupOpen ? (
                  <div className="absolute top-2 right-4 z-40 animate-in fade-in zoom-in-95 duration-150">
                    <div className="relative">
                      {/* Triangle pointer to toolbar icon */}
                      <div className="absolute -top-1.5 right-4 w-3 h-3 bg-slate-950 rotate-45 border-t border-l border-slate-700" />
                      <div className="shadow-2xl rounded-2xl overflow-hidden border border-slate-700 bg-slate-950">
                        <Popup standalone={false} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <button
                      onClick={() => setIsPopupOpen(true)}
                      className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-semibold text-xs shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
                    >
                      <Tag className="w-4 h-4" />
                      <span>Open Deal Finder Popup</span>
                    </button>
                    <p className="text-xs text-slate-500 mt-2">
                      Or click the Deal Finder icon in the simulated Chrome toolbar above.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Side Controls & Background Service Worker Diagnostics (4 columns) */}
            <div className="lg:col-span-4 space-y-4">
              {/* Quick Search Test Presets */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Quick Search Presets
                  </h3>
                  <span className="text-[11px] text-slate-500">Instant test</span>
                </div>
                <p className="text-xs text-slate-400">
                  Try searching top consumer products to test relevance ranking and price comparison:
                </p>
                <div className="flex flex-col gap-1.5">
                  {[
                    { label: 'Sony WH-1000XM5 Headphones', desc: 'Audio / 5 stores' },
                    { label: 'MacBook Air M3', desc: 'Laptops / Tech' },
                    { label: 'Nike Air Force 1', desc: 'Sneakers / Footwear' }
                  ].map((p, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 rounded-lg text-xs transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-200">{p.label}</div>
                        <div className="text-[11px] text-slate-500">{p.desc}</div>
                      </div>
                      <span className="text-[11px] text-sky-400">Searchable</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Background Service Worker & 30-min Cache Status */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-sky-400" />
                    <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                      Storage & 30m Cache
                    </h3>
                  </div>
                  <button
                    onClick={refreshCache}
                    className="p-1 text-slate-500 hover:text-slate-300"
                    title="Refresh cache stats"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-900 border border-slate-800/80 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Cached Queries</span>
                    <span className="text-sm font-bold text-slate-100 font-mono tabular-nums">
                      {cacheStats?.count || 0}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900 border border-slate-800/80 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">TTL Window</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      30 mins
                    </span>
                  </div>
                </div>

                {cacheStats && cacheStats.queries.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] text-slate-400 font-medium">Active entries in storage:</div>
                    <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                      {cacheStats.queries.map((q, i) => (
                        <div
                          key={i}
                          className="p-1.5 bg-slate-900/80 rounded border border-slate-800 text-[11px] flex items-center justify-between"
                        >
                          <span className="text-slate-300 truncate max-w-[140px]">"{q.query}"</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {q.ageMinutes}m ago · {q.dealsCount} deals
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleClearCache}
                      className="w-full mt-2 py-1.5 text-xs text-rose-400 hover:bg-rose-950/30 border border-rose-900/50 rounded-lg transition-colors font-medium"
                    >
                      Clear Storage Cache
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Execute searches in the popup to see query caching in action. Subsequent searches within 30 minutes return instantly without network requests.
                  </p>
                )}
              </div>

              {/* Manifest V3 Architecture Notes */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Manifest V3 Compliance</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  • <strong>Permissions:</strong> strictly <code className="bg-slate-900 px-1 py-0.5 rounded text-sky-300 font-mono">storage</code> and shopping host permissions.<br />
                  • <strong>Security:</strong> zero content scripts; no browsing history or DOM access to user tabs.<br />
                  • <strong>Isolation:</strong> background service worker isolates API keys from popup.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Standalone 380px Popup View */}
        {activeTab === 'standalone' && (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="mb-4 text-center">
              <h2 className="text-base font-semibold text-slate-200">
                Extension Popup (380px native dimensions)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                This is the exact view rendered when clicking the toolbar icon in Google Chrome.
              </p>
            </div>
            <div className="shadow-2xl rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
              <Popup standalone={true} />
            </div>
          </div>
        )}

        {/* Tab 3: Installation in Chrome Guide */}
        {activeTab === 'install' && (
          <div className="max-w-3xl mx-auto w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">
                How to Install Deal Finder in Google Chrome
              </h2>
              <p className="text-xs text-slate-400">
                Follow these simple steps to load and test the unpacked extension in any Chromium browser (Chrome, Brave, Edge).
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  step: '01',
                  title: 'Download the Extension Archive',
                  desc: 'Click the "Download Extension (.zip)" button above. Extract the zip archive into a folder on your computer (e.g. ~/deal-finder-extension).'
                },
                {
                  step: '02',
                  title: 'Open Chrome Extensions Manager',
                  desc: 'Open Google Chrome and navigate to chrome://extensions in the URL bar (or Menu → Extensions → Manage Extensions).'
                },
                {
                  step: '03',
                  title: 'Enable Developer Mode',
                  desc: 'Turn on the "Developer mode" toggle located in the upper-right corner of the Extensions page.'
                },
                {
                  step: '04',
                  title: 'Click "Load Unpacked"',
                  desc: 'Click the "Load unpacked" button in the upper-left, and select the extracted extension folder containing manifest.json.'
                },
                {
                  step: '05',
                  title: 'Pin Deal Finder & Search',
                  desc: 'Click the Extensions puzzle icon in the Chrome toolbar, click the pin icon next to Deal Finder, and start finding deals anytime!'
                }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 bg-slate-900 border border-slate-800/80 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-sky-600/20 border border-sky-500/30 text-sky-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200">{item.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-center">
              <button
                onClick={handleDownloadZip}
                disabled={isDownloading}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-md transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Extension ZIP Now</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Architecture & Manifest Specification */}
        {activeTab === 'docs' && (
          <div className="max-w-4xl mx-auto w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">
                Architecture & Implementation Blueprint
              </h2>
              <p className="text-xs text-slate-400">
                Built strictly to match the design specifications in the Deal Finder Chrome Extension document.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase">
                  <Code2 className="w-4 h-4" />
                  <span>Popup (React UI)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Autofocused search box, accessible form, 4 states (skeleton loading, empty with suggestions, error with settings routing, success). Never calls external APIs directly; communicates via message passing.
                </p>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase">
                  <Cpu className="w-4 h-4" />
                  <span>Background Service Worker</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Listens to <code className="text-sky-300 font-mono">SEARCH</code> messages. Checks <code className="text-sky-300 font-mono">chrome.storage.local</code> for the same query within 30 minutes; on miss, executes 10s timeout search and normalizes response.
                </p>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase">
                  <FileCode className="w-4 h-4" />
                  <span>Data Model & Normalizer</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Strictly normalizes any provider to <code className="text-sky-300 font-mono">Deal</code>: title, price (numeric), priceText, store, link, image, and rating. Discards invalid links and missing titles.
                </p>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Security & Permissions</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Manifest V3 without content scripts or page inspection permissions. API keys reside only in extension storage and are never committed or logged.
                </p>
              </div>
            </div>

            {/* Manifest JSON snippet */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300">manifest.json</span>
              <pre className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`{
  "manifest_version": 3,
  "name": "Deal Finder - Shop & Price Search",
  "version": "1.0.0",
  "action": {
    "default_popup": "popup.html",
    "default_icon": { "16": "icons/icon16.png", "48": "icons/icon48.png", "128": "icons/icon128.png" }
  },
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "permissions": ["storage"],
  "host_permissions": ["https://google.serper.dev/*", "https://serpapi.com/*"]
}`}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 bg-slate-950/40">
        <span>Deal Finder Chrome Extension · Manifest V3 · TypeScript + React</span>
      </footer>
    </div>
  );
}
