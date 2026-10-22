import React from 'react';
import { PrintOptions } from '@xerox/contracts';

export interface LivePriceCalculatorProps {
  pageCount: number;
  options: PrintOptions;
  quote: {
    total_cents: number;
    currency: string;
    sheets_per_copy: number;
    total_sheets: number;
    breakdown: {
      base_print_cents: number;
      paper_upgrade_cents: number;
      binding_cents: number;
      unit_price_cents: number;
    };
  } | null;
}

export const LivePriceCalculator: React.FC<LivePriceCalculatorProps> = ({
  pageCount,
  options,
  quote,
}) => {
  const formatMoney = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  if (!quote) {
    return (
      <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 animate-pulse text-sm text-slate-500">
        Calculating pricing...
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-gradient-to-br from-indigo-50/50 to-slate-50 dark:from-slate-900 dark:to-slate-800/80 border border-indigo-100 dark:border-slate-700/60 p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400">
            Live Pricing Estimate
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {quote.total_sheets} total physical sheets ({quote.sheets_per_copy} per copy)
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {formatMoney(quote.total_cents)}
          </div>
          <div className="text-xs text-slate-500">
            {formatMoney(quote.breakdown.unit_price_cents)} / copy
          </div>
        </div>
      </div>

      <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex justify-between">
          <span>Base Printing ({options.colorMode.toUpperCase()}, {options.paperSize})</span>
          <span className="font-medium text-slate-900 dark:text-white">{formatMoney(quote.breakdown.base_print_cents)}</span>
        </div>
        {quote.breakdown.paper_upgrade_cents > 0 && (
          <div className="flex justify-between">
            <span>Paper Upgrade ({options.paperGsm} GSM)</span>
            <span className="font-medium text-slate-900 dark:text-white">{formatMoney(quote.breakdown.paper_upgrade_cents)}</span>
          </div>
        )}
        {quote.breakdown.binding_cents > 0 && (
          <div className="flex justify-between">
            <span>Finishing ({options.binding.replace('_', ' ').toUpperCase()})</span>
            <span className="font-medium text-slate-900 dark:text-white">{formatMoney(quote.breakdown.binding_cents)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
