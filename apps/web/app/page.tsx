'use client';

import React, { useState, useEffect } from 'react';
import { PrintOptions } from '@xerox/contracts';

export default function CustomerPortal() {
  const [file, setFile] = useState<{ name: string; size: number } | null>({
    name: 'Sample_Lecture_Notes_2026.pdf',
    size: 2_450_000,
  });
  const [pageCount, setPageCount] = useState<number>(24);
  const [email, setEmail] = useState<string>('customer@example.com');
  const [phone, setPhone] = useState<string>('+1 555-0192');

  const [options, setOptions] = useState<PrintOptions>({
    copies: 1,
    colorMode: 'bw',
    paperSize: 'A4',
    duplexMode: 'duplex_long',
    orientation: 'portrait',
    binding: 'staple',
    paperGsm: 75,
  });

  const [quote, setQuote] = useState<{
    total_cents: number;
    sheets_per_copy: number;
    total_sheets: number;
    breakdown: {
      base_print_cents: number;
      paper_upgrade_cents: number;
      binding_cents: number;
      unit_price_cents: number;
    };
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<any | null>(null);

  // Live pricing calculator
  useEffect(() => {
    // Client-side quick calculation for instantaneous 60fps responsiveness
    const sheetsPerCopy =
      options.duplexMode === 'simplex' ? pageCount : Math.ceil(pageCount / 2);
    const baseRate = options.colorMode === 'color' ? 25 : 5;
    const discountFactor = options.duplexMode === 'simplex' ? 1.0 : 0.85;

    let basePrintCents = 0;
    if (options.duplexMode === 'simplex') {
      basePrintCents = pageCount * baseRate;
    } else {
      const full = sheetsPerCopy;
      const discounted = pageCount - full;
      basePrintCents = Math.round(full * baseRate + discounted * baseRate * discountFactor);
    }

    const sizeMult: Record<string, number> = { A4: 1.0, A3: 2.0, Legal: 1.25, Letter: 1.0 };
    basePrintCents = Math.round(basePrintCents * (sizeMult[options.paperSize] || 1.0));

    const gsmAddons: Record<number, number> = { 75: 0, 80: 2, 100: 5, 120: 10, 200: 25 };
    const paperUpgradeCents = sheetsPerCopy * (gsmAddons[options.paperGsm] || 0);

    const bindingCosts: Record<string, number> = {
      none: 0,
      staple: 50,
      spiral: 250,
      hard_bind: 600,
    };
    const bindingCents = (bindingCosts[options.binding] || 0) * options.copies;

    const totalCents =
      (basePrintCents + paperUpgradeCents) * options.copies + bindingCents;

    setQuote({
      total_cents: totalCents,
      sheets_per_copy: sheetsPerCopy,
      total_sheets: sheetsPerCopy * options.copies,
      breakdown: {
        base_print_cents: basePrintCents * options.copies,
        paper_upgrade_cents: paperUpgradeCents * options.copies,
        binding_cents: bindingCents,
        unit_price_cents: Math.round(totalCents / options.copies),
      },
    });
  }, [pageCount, options]);

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setIsSubmitting(true);

    try {
      const idempotencyKey = `idem_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const res = await fetch('http://localhost:8000/api/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': 'tenant-downtown-xerox',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          file_name: file.name,
          file_size_bytes: file.size,
          page_count: pageCount,
          options,
          customer_email: email,
          customer_phone: phone,
          idempotency_key: idempotencyKey,
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const orderData = await res.json();
      setSubmittedOrder(orderData);
    } catch (err: any) {
      alert(`Could not submit order: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl">
        <span className="text-xs font-bold tracking-widest uppercase text-indigo-300">
          Mobile-First Counter Service
        </span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
          Instant Document Printing
        </h1>
        <p className="text-sm text-indigo-200 mt-2 max-w-xl">
          Upload PDF or office files, configure binding and paper grades in real time, and pick up your prints at our counter station.
        </p>
      </div>

      {submittedOrder ? (
        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-6 sm:p-8 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 mx-auto text-xl font-bold">
            ✓
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Order Submitted Successfully!
          </h2>
          <p className="text-sm text-slate-500">
            Order ID: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{submittedOrder.id}</span>
          </p>
          <div className="inline-block px-3 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded-full">
            Status: {submittedOrder.status}
          </div>
          <p className="text-xs text-slate-400">
            Amount Due at Counter: ${(submittedOrder.calculated_price_cents / 100).toFixed(2)}
          </p>
          <button
            onClick={() => setSubmittedOrder(null)}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700"
          >
            Submit Another Document
          </button>
        </div>
      ) : (
        <form onSubmit={handleOrderSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Controls (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Upload Box */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
              <label className="text-sm font-bold text-slate-900 dark:text-white block mb-2">
                1. Selected Document
              </label>
              <div className="border-2 border-dashed border-indigo-200 dark:border-slate-700 rounded-xl p-5 bg-indigo-50/30 dark:bg-slate-800/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold text-xs">
                    PDF
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-xs">
                      {file?.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      2.45 MB &bull; {pageCount} pages detected
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500">Pages:</span>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={pageCount}
                    onChange={(e) => setPageCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 px-2 py-1 text-xs font-semibold border rounded text-center bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* Print Configuration Box */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
              <label className="text-sm font-bold text-slate-900 dark:text-white block">
                2. Print Specifications
              </label>

              {/* Color Mode */}
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Color Mode
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOptions({ ...options, colorMode: 'bw' })}
                    className={`p-3 rounded-lg border text-left text-xs font-semibold transition-all ${
                      options.colorMode === 'bw'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="font-bold text-sm">Black & White</div>
                    <div className="text-slate-500 text-xs mt-0.5">$0.05 / page</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOptions({ ...options, colorMode: 'color' })}
                    className={`p-3 rounded-lg border text-left text-xs font-semibold transition-all ${
                      options.colorMode === 'color'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="font-bold text-sm">Vivid Full Color</div>
                    <div className="text-slate-500 text-xs mt-0.5">$0.25 / page</div>
                  </button>
                </div>
              </div>

              {/* Duplex / 2-Sided */}
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Sides & Orientation
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'duplex_long', label: '2-Sided (Long)', desc: '15% Off' },
                    { id: 'duplex_short', label: '2-Sided (Short)', desc: 'Flip side' },
                    { id: 'simplex', label: '1-Sided', desc: 'Standard' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setOptions({ ...options, duplexMode: d.id as any })}
                      className={`p-2.5 rounded-lg border text-center text-xs font-semibold transition-all ${
                        options.duplexMode === d.id
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-bold">{d.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{d.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Paper Size & Thickness */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Paper Size
                  </label>
                  <select
                    value={options.paperSize}
                    onChange={(e) => setOptions({ ...options, paperSize: e.target.value as any })}
                    className="w-full text-xs font-semibold p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="A4">A4 (Standard 210 x 297mm)</option>
                    <option value="Letter">Letter (8.5 x 11 in)</option>
                    <option value="Legal">Legal (8.5 x 14 in)</option>
                    <option value="A3">A3 (Poster 297 x 420mm)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Paper Weight
                  </label>
                  <select
                    value={options.paperGsm}
                    onChange={(e) => setOptions({ ...options, paperGsm: parseInt(e.target.value) as any })}
                    className="w-full text-xs font-semibold p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value={75}>75 GSM (Economy)</option>
                    <option value={80}>80 GSM (Standard Copy)</option>
                    <option value={100}>100 GSM (Executive Bond)</option>
                    <option value={120}>120 GSM (Heavy Presentation)</option>
                    <option value={200}>200 GSM (Cardstock Cover)</option>
                  </select>
                </div>
              </div>

              {/* Binding */}
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Binding & Finishing
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'none', label: 'None', price: '$0.00' },
                    { id: 'staple', label: 'Corner Staple', price: '+$0.50' },
                    { id: 'spiral', label: 'Spiral Coil', price: '+$2.50' },
                    { id: 'hard_bind', label: 'Hard Bound', price: '+$6.00' },
                  ].map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setOptions({ ...options, binding: b.id as any })}
                      className={`p-2 rounded-lg border text-center text-xs font-semibold transition-all ${
                        options.binding === b.id
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-bold truncate">{b.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{b.price}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Copies Stepper */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Number of Copies
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setOptions({ ...options, copies: Math.max(1, options.copies - 1) })}
                    className="w-8 h-8 rounded border border-slate-300 dark:border-slate-700 font-bold text-sm flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-bold text-sm">{options.copies}</span>
                  <button
                    type="button"
                    onClick={() => setOptions({ ...options, copies: options.copies + 1 })}
                    className="w-8 h-8 rounded border border-slate-300 dark:border-slate-700 font-bold text-sm flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar / Checkout Card (1 col) */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Order Summary
              </h3>

              {quote && (
                <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Base Print Cost</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      ${(quote.breakdown.base_print_cents / 100).toFixed(2)}
                    </span>
                  </div>
                  {quote.breakdown.paper_upgrade_cents > 0 && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Paper GSM Upgrade</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        ${(quote.breakdown.paper_upgrade_cents / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {quote.breakdown.binding_cents > 0 && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Finishing & Binding</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        ${(quote.breakdown.binding_cents / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Grand Total</span>
                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      ${(quote.total_cents / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Customer Contact Information */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">
                    Email for Pickup Notification
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    placeholder="you@domain.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">
                    Mobile Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    placeholder="+1 555-0192"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <span>Submitting to Counter...</span>
                ) : (
                  <span>Send to Counter Station</span>
                )}
              </button>
              <p className="text-[11px] text-center text-slate-400">
                Idempotent payment webhook & hardware queue protected
              </p>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
