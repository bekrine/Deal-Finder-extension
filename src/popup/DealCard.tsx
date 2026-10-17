import React, { useState } from 'react';
import { ExternalLink, Star, ShoppingBag, Truck } from 'lucide-react';
import { Deal } from '../lib/types';

interface DealCardProps {
  deal: Deal;
  isLowestPrice?: boolean;
}

export const DealCard: React.FC<DealCardProps> = ({ deal, isLowestPrice }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <a
      href={deal.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex items-start gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-sky-500/50 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-sky-500"
      aria-label={`${deal.title} at ${deal.store} for ${deal.priceText}`}
    >
      {/* Product Image / Fallback Container */}
      <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center">
        {deal.image && !imageError ? (
          <img
            src={deal.image}
            alt={deal.title}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400">
            <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
          </div>
        )}
      </div>

      {/* Content Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
        <div>
          {/* Store & Metadata (Unboxed text with dots per zero-pill discipline) */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-0.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
              {deal.store}
            </span>
            {isLowestPrice && deal.price !== null && (
              <>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                  Best Price
                </span>
              </>
            )}
            {deal.rating && (
              <>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-medium">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                  <span className="font-mono tabular-nums text-[11px]">{deal.rating.toFixed(1)}</span>
                  {deal.ratingCount ? (
                    <span className="text-slate-400 text-[10px]">
                      ({deal.ratingCount > 999 ? `${(deal.ratingCount / 1000).toFixed(1)}k` : deal.ratingCount})
                    </span>
                  ) : null}
                </span>
              </>
            )}
          </div>

          {/* Product Title (clamped to 2 lines) */}
          <h3
            className="text-xs font-medium text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors"
            title={deal.title}
          >
            {deal.title}
          </h3>
        </div>

        {/* Price & Delivery Row */}
        <div className="flex items-center justify-between pt-1 mt-1 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-slate-950 dark:text-white font-mono tabular-nums tracking-tight">
              {deal.priceText}
            </span>
            {deal.delivery && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:inline-flex items-center gap-0.5 truncate max-w-[110px]">
                <Truck className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                <span className="truncate">{deal.delivery}</span>
              </span>
            )}
          </div>

          <div className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-600 dark:text-sky-400 group-hover:translate-x-0.5 transition-transform">
            <span>View Deal</span>
            <ExternalLink className="w-3 h-3" />
          </div>
        </div>
      </div>
    </a>
  );
};
