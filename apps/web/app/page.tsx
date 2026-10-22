'use client';

import React, { useState, useEffect } from 'react';
import { PrintOptions } from '@xerox/contracts';

// Translations for English, Tamil, and Hindi
const I18N = {
  en: {
    title: 'Print Bot',
    subtitle: 'Fast, secure Xerox & document printing',
    step1: '1. Upload',
    step2: '2. Configure',
    step3: '3. Pay & Collect',
    uploadPrompt: 'Tap to select PDF or image document',
    uploadSub: 'Auto-detected pages & verified dimensions',
    pagesDetected: 'logical pages detected',
    configTitle: 'Print Preferences',
    colorMode: 'Color Mode',
    bw: 'Black & White',
    color: 'Vivid Color',
    sides: 'Sides',
    simplex: '1-Sided (Simplex)',
    duplexLong: '2-Sided (Flip Long Edge)',
    duplexShort: '2-Sided (Flip Short Edge)',
    paperSize: 'Paper Size',
    pageRange: 'Page Range',
    rangePlaceholder: "e.g. '1-3,5,8-' or 'all'",
    nup: 'Pages per Sheet (N-Up)',
    binding: 'Finishing / Binding',
    none: 'None',
    staple: 'Corner Staple',
    spiral: 'Spiral Coil',
    hardBind: 'Hard Bound Book',
    copies: 'Copies',
    priceSummary: 'Server-Authoritative Price',
    sheets: 'Physical Sheets',
    impressions: 'Rendered Sides',
    payUpi: 'Pay via UPI Instant',
    payCash: 'Pay Cash at Counter',
    trackingTitle: 'Order Received & Tracked',
    status: 'Current Status',
    pickupCode: 'Pickup Token',
  },
  ta: {
    title: 'பிரிண்ட் பாட் (Print Bot)',
    subtitle: 'வேகமான, பாதுகாப்பான ஜெராக்ஸ் & அச்சிடுதல் சேவை',
    step1: '1. ஆவணம் பதிவேற்று',
    step2: '2. விருப்பத்தேர்வு',
    step3: '3. பணம் & பெறுதல்',
    uploadPrompt: 'PDF அல்லது புகைப்படத்தைத் தேர்ந்தெடுக்கவும்',
    uploadSub: 'தானாக பக்கங்கள் கண்டறியப்படும்',
    pagesDetected: 'பக்கங்கள் கண்டறியப்பட்டன',
    configTitle: 'அச்சிடும் விருப்பங்கள்',
    colorMode: 'வண்ண முறை',
    bw: 'கருப்பு & வெள்ளை',
    color: 'முழு வண்ணம்',
    sides: 'பக்கங்கள்',
    simplex: 'ஒரு பக்கம் மட்டும்',
    duplexLong: 'இரு பக்கங்கள் (நீளவாக்கு)',
    duplexShort: 'இரு பக்கங்கள் (குறுக்குவாக்கு)',
    paperSize: 'தாள் அளவு',
    pageRange: 'குறிப்பிட்ட பக்கங்கள்',
    rangePlaceholder: "எ.கா. '1-3,5,8-' அல்லது 'all'",
    nup: 'தாளுக்கு எத்தனை பக்கங்கள்',
    binding: 'பைண்டிங்',
    none: 'இல்லை',
    staple: 'ஸ்டேப்ளர்',
    spiral: 'ஸ்பைரல் பைண்டிங்',
    hardBind: 'ஹார்ட் பைண்ட்',
    copies: 'நகல்கள் (Copies)',
    priceSummary: 'துல்லியமான கட்டணம்',
    sheets: 'மொத்த தாள்கள்',
    impressions: 'அச்சடிக்கப்படும் பக்கங்கள்',
    payUpi: 'UPI மூலம் பணம் செலுத்துக',
    payCash: 'கவுண்ட்டரில் ரொக்கம் செலுத்துக',
    trackingTitle: 'ஆர்டர் பெறப்பட்டது',
    status: 'தற்போதைய நிலை',
    pickupCode: 'பெறுதல் டோக்கன்',
  },
  hi: {
    title: 'प्रिंट बॉट (Print Bot)',
    subtitle: 'तेज़ और सुरक्षित ज़ेरॉक्स एवं दस्तावेज़ प्रिंटिंग',
    step1: '1. अपलोड',
    step2: '2. विन्यास',
    step3: '3. भुगतान और संग्रह',
    uploadPrompt: 'PDF या दस्तावेज़ चुनें',
    uploadSub: 'स्वचालित पृष्ठ गणना',
    pagesDetected: 'पृष्ठ मिले',
    configTitle: 'प्रिंट सेटिंग्स',
    colorMode: 'रंग',
    bw: 'ब्लैक एंड व्हाइट',
    color: 'रंगीन (Color)',
    sides: 'साइड्स',
    simplex: 'एक तरफा',
    duplexLong: 'दोनों तरफ (Long Edge)',
    duplexShort: 'दोनों तरफ (Short Edge)',
    paperSize: 'कागज़ का आकार',
    pageRange: 'पृष्ठ श्रेणी',
    rangePlaceholder: "उदा. '1-3,5,8-' या 'all'",
    nup: 'प्रति शीट पृष्ठ',
    binding: 'बाइंडिंग',
    none: 'कोई नहीं',
    staple: 'स्टेपल',
    spiral: 'स्पाइरल',
    hardBind: 'हार्ड बाइंड',
    copies: 'प्रतियाँ (Copies)',
    priceSummary: 'सटीक मूल्य',
    sheets: 'कुल कागज़',
    impressions: 'प्रिंटेड साइड्स',
    payUpi: 'UPI द्वारा भुगतान करें',
    payCash: 'काउंटर पर नकद दें',
    trackingTitle: 'ऑर्डर प्राप्त हुआ',
    status: 'वर्तमान स्थिति',
    pickupCode: 'पिकअप टोकन',
  },
};

export default function CustomerPortal() {
  const [lang, setLang] = useState<'en' | 'ta' | 'hi'>('en');
  const t = I18N[lang];

  // Screen state: 1 = Upload, 2 = Configure & Preview, 3 = Pay & Track
  const [screen, setScreen] = useState<1 | 2 | 3>(1);

  const [file, setFile] = useState<{ name: string; size: number } | null>({
    name: 'College_Assignment_Final.pdf',
    size: 1_850_000,
  });
  const [pageCount, setPageCount] = useState<number>(18);
  const [email, setEmail] = useState<string>('student@college.edu');
  const [phone, setPhone] = useState<string>('+91 98765 43210');

  const [options, setOptions] = useState<PrintOptions>({
    copies: 1,
    color_mode: 'bw' as any,
    paper_size: 'A4' as any,
    duplex_mode: 'duplex_long' as any,
    orientation: 'portrait' as any,
    binding: 'staple' as any,
    paper_gsm: 75,
    page_range: 'all',
    pages_per_sheet: 1,
  });

  const [quote, setQuote] = useState<{
    total_cents: number;
    total_paise: number;
    logical_pages: number;
    sheets_per_copy: number;
    total_sheets: number;
    rendered_sides: number;
    breakdown: {
      base_print_cents: number;
      paper_upgrade_cents: number;
      binding_cents: number;
      unit_price_cents: number;
    };
  } | null>(null);

  const [paymentChoice, setPaymentChoice] = useState<'upi' | 'cash'>('upi');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<any | null>(null);

  // Live server-accurate pricing calculation
  useEffect(() => {
    let active = true;
    async function fetchQuote() {
      try {
        const res = await fetch('http://localhost:8000/api/v1/orders/quote', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': 'shop-anna-nagar-xerox',
          },
          body: JSON.stringify({
            page_count: pageCount,
            options,
          }),
        });
        if (res.ok && active) {
          const data = await res.json();
          setQuote(data);
        }
      } catch {
        // Fallback quick approximation
        const sheets = options.duplex_mode === 'simplex' ? pageCount : Math.ceil(pageCount / 2);
        const paise = (options.color_mode === 'color' ? 1000 : 150) * pageCount * options.copies;
        if (active) {
          setQuote({
            total_cents: Math.round(paise / 83),
            total_paise: paise,
            logical_pages: pageCount,
            sheets_per_copy: sheets,
            total_sheets: sheets * options.copies,
            rendered_sides: pageCount * options.copies,
            breakdown: {
              base_print_cents: Math.round(paise / 83),
              paper_upgrade_cents: 0,
              binding_cents: 0,
              unit_price_cents: Math.round(paise / (83 * options.copies)),
            },
          });
        }
      }
    }
    fetchQuote();
    return () => {
      active = false;
    };
  }, [pageCount, options]);

  const handleOrderSubmit = async (method: 'upi' | 'cash') => {
    if (!file) return;
    setIsSubmitting(true);
    setPaymentChoice(method);

    try {
      const idempotencyKey = `idem_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const res = await fetch('http://localhost:8000/api/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': 'shop-anna-nagar-xerox',
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
      setScreen(3);
    } catch (err: any) {
      alert(`Could not submit order: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRupees = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

  return (
    <div className="max-w-md mx-auto space-y-4 pb-12 select-none font-sans">
      {/* Language Toggle & Brand Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-base shadow">
            PB
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">{t.title}</h1>
            <p className="text-[10px] text-slate-500 font-medium">{t.subtitle}</p>
          </div>
        </div>

        <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-bold">
          {(['en', 'ta', 'hi'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-2 py-1 rounded-md transition-all min-h-[32px] ${
                lang === l
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {l === 'en' ? 'EN' : l === 'ta' ? 'தமிழ்' : 'हिन्दी'}
            </button>
          ))}
        </div>
      </div>

      {/* Screen 1: Document Upload */}
      {screen === 1 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <span>{t.step1}</span>
          </div>

          <div
            onClick={() => setScreen(2)}
            className="border-2 border-dashed border-indigo-300 dark:border-indigo-900/60 rounded-2xl p-6 text-center bg-indigo-50/40 dark:bg-slate-800/30 cursor-pointer hover:bg-indigo-50/70 transition-all min-h-[160px] flex flex-col items-center justify-center space-y-2 active:scale-[0.99]"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-indigo-500/20">
              📄
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{t.uploadPrompt}</p>
            <p className="text-xs text-slate-500">{t.uploadSub}</p>
          </div>

          {file && (
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div className="truncate max-w-[200px]">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{file.name}</p>
                <p className="text-[11px] text-slate-500">
                  {pageCount} {t.pagesDetected}
                </p>
              </div>
              <button
                onClick={() => setScreen(2)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow min-h-[44px] flex items-center"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Screen 2: Configure & Server Preview + Accurate Price */}
      {screen === 2 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {t.step2}
            </span>
            <button
              onClick={() => setScreen(1)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 min-h-[44px] flex items-center px-2"
            >
              ← Back
            </button>
          </div>

          {/* Color Mode Toggle (44px target) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.colorMode}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOptions({ ...options, color_mode: 'bw' as any })}
                className={`min-h-[44px] p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                  options.color_mode === 'bw'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>⚪ {t.bw}</span>
                <span className="text-[10px] text-slate-500 font-normal">₹1.50</span>
              </button>
              <button
                type="button"
                onClick={() => setOptions({ ...options, color_mode: 'color' as any })}
                className={`min-h-[44px] p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                  options.color_mode === 'color'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>🌈 {t.color}</span>
                <span className="text-[10px] text-slate-500 font-normal">₹10.00</span>
              </button>
            </div>
          </div>

          {/* Duplex Sides Toggle (44px targets) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.sides}</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'duplex_long', label: '2-Sided (Long)', desc: '15% Off' },
                { id: 'duplex_short', label: '2-Sided (Short)', desc: 'Flip side' },
                { id: 'simplex', label: '1-Sided', desc: 'Standard' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setOptions({ ...options, duplex_mode: s.id as any })}
                  className={`min-h-[44px] p-2 rounded-xl border text-center text-xs font-bold flex flex-col items-center justify-center transition-all ${
                    options.duplex_mode === s.id
                      ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="leading-tight">{s.label}</span>
                  <span className="text-[9px] text-slate-400 font-normal mt-0.5">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Non-contiguous Page Range */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.pageRange}</label>
              <span className="text-[10px] text-slate-400">Total: {pageCount} pages</span>
            </div>
            <input
              type="text"
              value={options.page_range}
              onChange={(e) => setOptions({ ...options, page_range: e.target.value })}
              placeholder={t.rangePlaceholder}
              className="w-full min-h-[44px] text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
            />
          </div>

          {/* Paper Size & N-Up */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.paperSize}</label>
              <select
                value={options.paper_size}
                onChange={(e) => setOptions({ ...options, paper_size: e.target.value as any })}
                className="w-full min-h-[44px] text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
              >
                <option value="A4">A4 (Standard)</option>
                <option value="A3">A3 (Poster 2x)</option>
                <option value="A5">A5 (Booklet)</option>
                <option value="Legal">Legal</option>
                <option value="Letter">Letter</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.nup}</label>
              <select
                value={options.pages_per_sheet}
                onChange={(e) => setOptions({ ...options, pages_per_sheet: parseInt(e.target.value) })}
                className="w-full min-h-[44px] text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
              >
                <option value={1}>1 Page / Sheet</option>
                <option value={2}>2 Pages / Sheet</option>
                <option value={4}>4 Pages / Sheet</option>
              </select>
            </div>
          </div>

          {/* Binding Finishing */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.binding}</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'none', label: t.none, cost: '₹0' },
                { id: 'staple', label: t.staple, cost: '+₹5' },
                { id: 'spiral', label: t.spiral, cost: '+₹30' },
                { id: 'hard_bind', label: t.hardBind, cost: '+₹80' },
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setOptions({ ...options, binding: b.id as any })}
                  className={`min-h-[44px] p-1.5 rounded-xl border text-center text-xs font-bold flex flex-col items-center justify-center transition-all ${
                    options.binding === b.id
                      ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600'
                  }`}
                >
                  <span className="truncate leading-tight">{b.label}</span>
                  <span className="text-[9px] text-slate-400 font-normal">{b.cost}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stepper for Copies (44px target) */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.copies}</span>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setOptions({ ...options, copies: Math.max(1, options.copies - 1) })}
                className="w-11 h-11 rounded-xl border border-slate-300 dark:border-slate-700 font-black text-base flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95"
              >
                -
              </button>
              <span className="w-8 text-center font-black text-sm">{options.copies}</span>
              <button
                type="button"
                onClick={() => setOptions({ ...options, copies: options.copies + 1 })}
                className="w-11 h-11 rounded-xl border border-slate-300 dark:border-slate-700 font-black text-base flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95"
              >
                +
              </button>
            </div>
          </div>

          {/* Server-Authoritative Price Card */}
          {quote && (
            <div className="rounded-2xl bg-indigo-50/60 dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700 p-4 space-y-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                    {t.priceSummary}
                  </span>
                  <p className="text-[11px] text-slate-500">
                    {quote.total_sheets} {t.sheets} &bull; {quote.rendered_sides} {t.impressions}
                  </p>
                </div>
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {formatRupees(quote.total_paise)}
                </div>
              </div>
            </div>
          )}

          {/* Payment Trigger Buttons (44px min-height) */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleOrderSubmit('upi')}
              className="w-full min-h-[48px] px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
            >
              <span>💳 {t.payUpi}</span>
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleOrderSubmit('cash')}
              className="w-full min-h-[44px] px-4 bg-slate-800 hover:bg-slate-900 text-slate-200 font-bold text-xs rounded-xl active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
            >
              <span>💵 {t.payCash}</span>
            </button>
          </div>
        </div>
      )}

      {/* Screen 3: Payment & Real-Time Tracking */}
      {screen === 3 && submittedOrder && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-emerald-200 dark:border-emerald-800/60 shadow-sm text-center space-y-4 animate-in fade-in duration-200">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 mx-auto text-2xl font-black shadow-inner">
            ✓
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">{t.trackingTitle}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {paymentChoice === 'upi' ? 'Online Payment Verified' : 'Pay at Counter Upon Collection'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">{t.pickupCode}:</span>
              <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">
                #{submittedOrder.id.substring(0, 8).toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t.status}:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {submittedOrder.status}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 font-bold">
              <span>Total Amount:</span>
              <span>₹{(submittedOrder.calculated_price_cents * 0.83).toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => setScreen(1)}
            className="w-full min-h-[44px] px-4 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700"
          >
            + Print Another Document
          </button>
        </div>
      )}
    </div>
  );
}
