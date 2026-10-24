'use client';

import React, { useState } from 'react';
import {
  Printer,
  Smartphone,
  Laptop,
  Building2,
  ShieldCheck,
  ArrowUpRight,
  Sliders,
  CheckCircle2,
  Lock,
  Sparkles,
  Layers,
  Cpu,
  FileText,
  Zap,
  ExternalLink,
  ChevronRight,
  RotateCw,
} from 'lucide-react';
import { ThemeProvider, StudioHeader, PrinterScene, useGsapStagger, useGsapCardTilt } from '@xerox/ui';

export default function MarketingLandingPage() {
  const heroLeftRef = useGsapStagger<HTMLDivElement>({ duration: 0.6, y: 15 });
  const ribbonRef = useGsapStagger<HTMLDivElement>({ selector: '.ribbon-card', stagger: 0.06, y: 12 });
  const suitesRef = useGsapStagger<HTMLDivElement>({ selector: '.suite-card', stagger: 0.08, y: 20 });
  const archRef = useGsapStagger<HTMLDivElement>({ selector: '.arch-card', stagger: 0.08, y: 20 });
  const quoteCardTiltRef = useGsapCardTilt<HTMLDivElement>(5);
  // Live Interactive Imposition & Pricing Quote Studio state
  const [pages, setPages] = useState<number>(16);
  const [copies, setCopies] = useState<number>(2);
  const [colorMode, setColorMode] = useState<'bw' | 'color'>('bw');
  const [duplex, setDuplex] = useState<'simplex' | 'duplex'>('duplex');
  const [paperSize, setPaperSize] = useState<'A4' | 'A3'>('A4');
  const [finishing, setFinishing] = useState<'none' | 'staple' | 'spiral'>('spiral');

  // Exact Indian print-shop accounting:
  // Logical pages = pages * copies
  const logicalPages = pages * copies;
  // Rendered sides = duplex ? logicalPages : logicalPages
  const renderedSides = logicalPages;
  // Physical sheets
  const sheetsPerCopy = duplex === 'duplex' ? Math.ceil(pages / 2) : pages;
  const physicalSheets = sheetsPerCopy * copies;

  // Pricing formula in Indian Paise
  // B&W: ₹1.50 per sheet side (150 paise), Color: ₹10.00 (1000 paise)
  const baseSidePaise = colorMode === 'color' ? 1000 : 150;
  // A3 multiplier: 2.0x
  const sizeMultiplier = paperSize === 'A3' ? 2 : 1;
  const printCostPaise = renderedSides * baseSidePaise * sizeMultiplier;

  // Finishing costs (staple ₹5, spiral ₹35)
  const finishingPaise = (finishing === 'staple' ? 500 : finishing === 'spiral' ? 3500 : 0) * copies;
  const totalPaise = printCostPaise + finishingPaise;
  const totalRupees = totalPaise / 100;

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[var(--pb-bg)] text-[var(--pb-text)] font-sans antialiased selection:bg-[var(--pb-accent)] selection:text-[var(--pb-on-accent)]">
        {/* Regal Studio Header */}
        <StudioHeader
          title="Print Bot"
          subtitle="Enterprise Multi-Tenant SaaS & Windows Desktop Workstation"
        >
          <nav className="hidden md:flex items-center space-x-6 text-xs font-semibold tracking-wide">
            <a href="#solutions" className="text-[var(--pb-muted)] hover:text-[var(--pb-text)] transition-colors">
              Product Suites
            </a>
            <a href="#imposition" className="text-[var(--pb-muted)] hover:text-[var(--pb-text)] transition-colors">
              Live Quote Studio
            </a>
            <a href="#architecture" className="text-[var(--pb-muted)] hover:text-[var(--pb-text)] transition-colors">
              Architecture
            </a>
            <a href="#pricing" className="text-[var(--pb-muted)] hover:text-[var(--pb-text)] transition-colors">
              The One Plan
            </a>
          </nav>
        </StudioHeader>

        {/* Archival Paper Texture Grain (Awwwards Style) */}
        <div 
          className="pointer-events-none fixed inset-0 z-50 opacity-[0.035] mix-blend-multiply dark:mix-blend-screen" 
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
        />

        {/* Editorial Archival Ticker */}
        <div className="border-y border-[var(--pb-border)] bg-[var(--pb-surface)]/70 backdrop-blur-md overflow-hidden py-2.5 text-[11px] font-mono tracking-widest uppercase text-[var(--pb-muted)] flex select-none">
          <div className="flex shrink-0 space-x-8 items-center whitespace-nowrap px-4">
            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/> CHENNAI COUNTER FLEET ACTIVE</span>
            <span>—</span>
            <span className="text-[var(--pb-accent)] font-bold">ONE ALL-INCLUSIVE PLAN: ₹999/MO</span>
            <span>—</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">ZERO PER-PAGE SOFTWARE COMMISSIONS</span>
            <span>—</span>
            <span>UNLIMITED CONNECTED PRINTERS</span>
            <span>—</span>
            <span>POSTGRESQL RLS TENANT BOUNDARIES</span>
            <span>—</span>
            <span>TPM 2.0 ASYMMETRIC DEVICE ATTESTATION</span>
            <span>—</span>
            <span>WIN32 NAMED PIPE IPC SPOOLING</span>
            <span>—</span>
            <span>COMPLETION_UNKNOWN NEVER AUTO-REPRINTS</span>
          </div>
        </div>

        {/* HERO SECTION (Split-Stage Art Direction) */}
        <section className="relative px-6 py-12 md:py-20 max-w-[1440px] mx-auto overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Bold Editorial Positioning */}
            <div ref={heroLeftRef} className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[var(--pb-raised)] border border-[var(--pb-border)] text-xs font-semibold text-[var(--pb-accent)] shadow-sm">
                <Sparkles size={14} className="text-[var(--pb-spot)]" />
                <span>The Xerox Counter, Reimagined for Indian Print Shops</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-semibold tracking-tight text-[var(--pb-text)] leading-[1.08]">
                One Windows installer. <br />
                <span className="text-[var(--pb-accent)] italic">Unlimited printers.</span> <br />
                Zero software cuts.
              </h1>

              <p className="text-base sm:text-lg text-[var(--pb-muted)] max-w-2xl leading-relaxed">
                Transform any independent Xerox counter into an automated, customer-first print studio. 
                Customers scan a shop-specific QR code, upload files, configure exact non-contiguous page ranges, 
                and receive a server-locked quote before paying via UPI.
              </p>

              {/* 4 Commercial Facts Ribbon */}
              <div ref={ribbonRef} className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
                <div className="ribbon-card p-3.5 rounded-xl bg-[var(--pb-surface)] border border-[var(--pb-border)] shadow-sm">
                  <div className="text-[10px] font-mono uppercase text-[var(--pb-muted)] font-bold">Subscription</div>
                  <div className="text-xl font-bold font-serif text-[var(--pb-accent)]">₹999 / mo</div>
                  <div className="text-[11px] text-[var(--pb-muted)]">Single all-inclusive plan</div>
                </div>

                <div className="ribbon-card p-3.5 rounded-xl bg-[var(--pb-surface)] border border-[var(--pb-border)] shadow-sm">
                  <div className="text-[10px] font-mono uppercase text-[var(--pb-muted)] font-bold">Printer Cap</div>
                  <div className="text-xl font-bold font-serif text-[var(--pb-text)]">Unlimited</div>
                  <div className="text-[11px] text-[var(--pb-muted)]">Per subscribed shop</div>
                </div>

                <div className="ribbon-card p-3.5 rounded-xl bg-[var(--pb-surface)] border border-[var(--pb-border)] shadow-sm">
                  <div className="text-[10px] font-mono uppercase text-[var(--pb-muted)] font-bold">Commission</div>
                  <div className="text-xl font-bold font-serif text-emerald-700 dark:text-emerald-400">0% Cut</div>
                  <div className="text-[11px] text-[var(--pb-muted)]">100% shop revenue kept</div>
                </div>

                <div className="ribbon-card p-3.5 rounded-xl bg-[var(--pb-surface)] border border-[var(--pb-border)] shadow-sm">
                  <div className="text-[10px] font-mono uppercase text-[var(--pb-muted)] font-bold">Quote Latency</div>
                  <div className="text-xl font-bold font-mono text-[var(--pb-text)]">3.8 ms</div>
                  <div className="text-[11px] text-[var(--pb-muted)]">Server-locked pricing</div>
                </div>
              </div>

              {/* Direct Launch Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href="http://localhost:5174"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pb-button pb-button-primary inline-flex items-center space-x-2 text-sm shadow-md"
                >
                  <Smartphone size={18} />
                  <span>Launch Customer Mobile PWA</span>
                  <ArrowUpRight size={16} />
                </a>

                <a
                  href="http://localhost:5173"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pb-button inline-flex items-center space-x-2 text-sm shadow-sm"
                >
                  <Laptop size={18} />
                  <span>Launch Counter Workstation</span>
                  <ArrowUpRight size={16} />
                </a>

                <a
                  href="http://127.0.0.1:8000/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pb-button inline-flex items-center space-x-2 text-sm shadow-sm"
                >
                  <Zap size={16} className="text-amber-600" />
                  <span>FastAPI REST Docs</span>
                </a>
              </div>
            </div>

            {/* Right Column: Interactive 3D Three.js Xerox Production Machine */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden border border-[var(--pb-border)] bg-[var(--pb-surface)] shadow-2xl p-2">
                <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--pb-border)]">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--pb-text)]">
                      Three.js Precision Hardware Engine
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[var(--pb-muted)]">WebGL2 · 60 FPS</span>
                </div>

                <div className="h-[420px] w-full">
                  <PrinterScene />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4 ENTERPRISE PRODUCT SUITES */}
        <section id="solutions" className="px-6 py-16 max-w-[1440px] mx-auto border-t border-[var(--pb-border)]">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-[var(--pb-spot)]">
              Modular Monolith Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-semibold mt-2 text-[var(--pb-text)]">
              Four dedicated environments. One seamless platform.
            </h2>
            <p className="text-sm sm:text-base text-[var(--pb-muted)] mt-2">
              Every persona operates within an isolated, audited, and responsive interface designed specifically for their role.
            </p>
          </div>

          <div ref={suitesRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Customer PWA */}
            <div className="suite-card p-6 rounded-2xl bg-[var(--pb-surface)] border border-[var(--pb-border)] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                  <Smartphone size={24} />
                </div>
                <h3 className="text-lg font-serif font-bold text-[var(--pb-text)] group-hover:text-[var(--pb-accent)] transition-colors">
                  Mobile Customer PWA
                </h3>
                <p className="text-xs text-[var(--pb-muted)] leading-relaxed">
                  Zero mandatory downloads or logins. Scan shop QR, upload multi-format documents, select non-contiguous page ranges, preview imposition, and pay via UPI.
                </p>
                <div className="pt-2 text-xs font-mono text-[var(--pb-muted)] space-y-1">
                  <div>• English, Tamil & Hindi locales</div>
                  <div>• Server-locked price quote</div>
                  <div>• Instant pickup tracking</div>
                </div>
              </div>

              <div className="pt-6">
                <a
                  href="http://localhost:5174"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-[var(--pb-raised)] hover:bg-[var(--pb-accent)] hover:text-white border border-[var(--pb-border)] text-xs font-bold flex items-center justify-between transition-all"
                >
                  <span>Open Customer Studio</span>
                  <ArrowUpRight size={16} />
                </a>
              </div>
            </div>

            {/* 2. Counter Workstation EXE */}
            <div className="suite-card p-6 rounded-2xl bg-[var(--pb-surface)] border border-[var(--pb-border)] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
                  <Laptop size={24} />
                </div>
                <h3 className="text-lg font-serif font-bold text-[var(--pb-text)] group-hover:text-[var(--pb-accent)] transition-colors">
                  Counter Workstation EXE
                </h3>
                <p className="text-xs text-[var(--pb-muted)] leading-relaxed">
                  Native Windows desktop application communicating with an independent Rust service over Named Pipe IPC (`\\.\pipe\printbot_service_ipc`).
                </p>
                <div className="pt-2 text-xs font-mono text-[var(--pb-muted)] space-y-1">
                  <div>• Direct Win32 spooler egress</div>
                  <div>• SQLite WAL pre-spool journal</div>
                  <div>• Zero auto-reprint on jams</div>
                </div>
              </div>

              <div className="pt-6">
                <a
                  href="http://localhost:5173"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-[var(--pb-raised)] hover:bg-[var(--pb-accent)] hover:text-white border border-[var(--pb-border)] text-xs font-bold flex items-center justify-between transition-all"
                >
                  <span>Launch Workstation UI</span>
                  <ArrowUpRight size={16} />
                </a>
              </div>
            </div>

            {/* 3. Shop Owner Portal */}
            <div className="suite-card p-6 rounded-2xl bg-[var(--pb-surface)] border border-[var(--pb-border)] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <Building2 size={24} />
                </div>
                <h3 className="text-lg font-serif font-bold text-[var(--pb-text)] group-hover:text-[var(--pb-accent)] transition-colors">
                  Shop Owner Admin
                </h3>
                <p className="text-xs text-[var(--pb-muted)] leading-relaxed">
                  Manage live queues, configure per-sheet pricing in Indian paise, set staff roles, customize counter branding, and choose operating modes.
                </p>
                <div className="pt-2 text-xs font-mono text-[var(--pb-muted)] space-y-1">
                  <div>• Full Automatic vs Manual Approval</div>
                  <div>• Unlimited printer routing</div>
                  <div>• End-of-day revenue reconciliation</div>
                </div>
              </div>

              <div className="pt-6">
                <a
                  href="http://localhost:5175"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-[var(--pb-raised)] hover:bg-[var(--pb-accent)] hover:text-white border border-[var(--pb-border)] text-xs font-bold flex items-center justify-between transition-all"
                >
                  <span>Open Shop Portal</span>
                  <ArrowUpRight size={16} />
                </a>
              </div>
            </div>

            {/* 4. Super Admin Fleet Console */}
            <div className="suite-card p-6 rounded-2xl bg-[var(--pb-surface)] border border-[var(--pb-border)] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 flex items-center justify-center">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-lg font-serif font-bold text-[var(--pb-text)] group-hover:text-[var(--pb-accent)] transition-colors">
                  Super Admin Console
                </h3>
                <p className="text-xs text-[var(--pb-muted)] leading-relaxed">
                  Commercial SaaS management for the platform owner. Monitor multi-tenant subscriptions, approve device pairings, and audit security events.
                </p>
                <div className="pt-2 text-xs font-mono text-[var(--pb-muted)] space-y-1">
                  <div>• Strict PostgreSQL RLS enforcement</div>
                  <div>• Asymmetric TPM key attestation</div>
                  <div>• Durable platform audit trail</div>
                </div>
              </div>

              <div className="pt-6">
                <a
                  href="http://localhost:5176"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-[var(--pb-raised)] hover:bg-[var(--pb-accent)] hover:text-white border border-[var(--pb-border)] text-xs font-bold flex items-center justify-between transition-all"
                >
                  <span>Open Fleet Console</span>
                  <ArrowUpRight size={16} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE IMPOSITION & LOCKED QUOTE STUDIO (product-performs) */}
        <section id="imposition" className="px-6 py-16 max-w-[1440px] mx-auto border-t border-[var(--pb-border)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left: Interactive Controls */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <span className="text-xs font-mono font-bold tracking-widest uppercase text-[var(--pb-spot)]">
                  Live Pricing Engine
                </span>
                <h2 className="text-3xl font-serif font-semibold mt-2 text-[var(--pb-text)]">
                  Precise accounting before payment.
                </h2>
                <p className="text-xs sm:text-sm text-[var(--pb-muted)] mt-1">
                  A document's logical pages, rendered sides, and physical sheets are strictly separated accounting quantities.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[var(--pb-surface)] border border-[var(--pb-border)] shadow-sm space-y-4">
                {/* Page Count */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Document Pages</span>
                    <span className="font-mono text-[var(--pb-accent)]">{pages} pages</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={64}
                    value={pages}
                    onChange={(e) => setPages(Number(e.target.value))}
                    className="w-full accent-[var(--pb-accent)] cursor-pointer"
                  />
                </div>

                {/* Copies */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Number of Copies</span>
                    <span className="font-mono text-[var(--pb-accent)]">{copies} copies</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={copies}
                    onChange={(e) => setCopies(Number(e.target.value))}
                    className="w-full accent-[var(--pb-accent)] cursor-pointer"
                  />
                </div>

                {/* Color Mode */}
                <div>
                  <label className="text-xs font-semibold block mb-1.5">Color Preference</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setColorMode('bw')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        colorMode === 'bw'
                          ? 'bg-[var(--pb-accent)] text-white border-transparent'
                          : 'bg-[var(--pb-raised)] text-[var(--pb-muted)] border-[var(--pb-border)]'
                      }`}
                    >
                      Black & White (₹1.50)
                    </button>
                    <button
                      type="button"
                      onClick={() => setColorMode('color')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        colorMode === 'color'
                          ? 'bg-[var(--pb-accent)] text-white border-transparent'
                          : 'bg-[var(--pb-raised)] text-[var(--pb-muted)] border-[var(--pb-border)]'
                      }`}
                    >
                      Vivid Color (₹10.00)
                    </button>
                  </div>
                </div>

                {/* Duplex Mode */}
                <div>
                  <label className="text-xs font-semibold block mb-1.5">Sides</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDuplex('simplex')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        duplex === 'simplex'
                          ? 'bg-[var(--pb-accent)] text-white border-transparent'
                          : 'bg-[var(--pb-raised)] text-[var(--pb-muted)] border-[var(--pb-border)]'
                      }`}
                    >
                      Single-Sided (Simplex)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuplex('duplex')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        duplex === 'duplex'
                          ? 'bg-[var(--pb-accent)] text-white border-transparent'
                          : 'bg-[var(--pb-raised)] text-[var(--pb-muted)] border-[var(--pb-border)]'
                      }`}
                    >
                      Double-Sided (Duplex)
                    </button>
                  </div>
                </div>

                {/* Finishing */}
                <div>
                  <label className="text-xs font-semibold block mb-1.5">Finishing Preference</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['none', 'staple', 'spiral'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFinishing(opt)}
                        className={`py-2 px-2 rounded-xl text-[11px] font-bold border capitalize transition-all ${
                          finishing === opt
                            ? 'bg-[var(--pb-accent)] text-white border-transparent'
                            : 'bg-[var(--pb-raised)] text-[var(--pb-muted)] border-[var(--pb-border)]'
                        }`}
                      >
                        {opt === 'none' ? 'None' : opt === 'staple' ? 'Staple (+₹5)' : 'Spiral (+₹35)'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Server-Authoritative Quote Audit Card */}
            <div className="lg:col-span-7 space-y-4">
              <div ref={quoteCardTiltRef} className="p-8 rounded-3xl bg-[var(--pb-surface)] border border-[var(--pb-border)] shadow-xl relative overflow-hidden transition-transform duration-200">
                <div className="flex items-center justify-between pb-6 border-b border-[var(--pb-border)]">
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--pb-spot)]">
                      Locked Quote Preview (Versioned)
                    </span>
                    <h3 className="text-2xl font-serif font-bold text-[var(--pb-text)] mt-1">
                      Server-Authoritative Price Calculation
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black font-mono text-[var(--pb-accent)]">
                      ₹{totalRupees.toFixed(2)}
                    </div>
                    <div className="text-xs text-[var(--pb-muted)] font-mono">
                      Locked at checkout
                    </div>
                  </div>
                </div>

                {/* Accounting Quantities Grid */}
                <div className="grid grid-cols-3 gap-4 py-6 border-b border-[var(--pb-border)]">
                  <div className="p-4 rounded-xl bg-[var(--pb-raised)] text-center">
                    <div className="text-xs text-[var(--pb-muted)]">Logical Pages</div>
                    <div className="text-2xl font-bold font-mono text-[var(--pb-text)] mt-1">
                      {logicalPages}
                    </div>
                    <div className="text-[10px] text-[var(--pb-muted)] mt-0.5">{pages} pages × {copies}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--pb-raised)] text-center">
                    <div className="text-xs text-[var(--pb-muted)]">Rendered Sides</div>
                    <div className="text-2xl font-bold font-mono text-[var(--pb-text)] mt-1">
                      {renderedSides}
                    </div>
                    <div className="text-[10px] text-[var(--pb-muted)] mt-0.5">
                      {duplex === 'duplex' ? '2 sides / sheet' : '1 side / sheet'}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
                    <div className="text-xs text-amber-800 dark:text-amber-400 font-semibold">Physical Sheets</div>
                    <div className="text-2xl font-black font-mono text-amber-800 dark:text-amber-300 mt-1">
                      {physicalSheets}
                    </div>
                    <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">Physical paper consumed</div>
                  </div>
                </div>

                {/* Line Item Breakdown */}
                <div className="py-6 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-[var(--pb-muted)]">
                    <span>Base Paper Egress ({renderedSides} sides @ ₹{(baseSidePaise / 100).toFixed(2)})</span>
                    <span className="text-[var(--pb-text)] font-semibold">₹{(printCostPaise / 100).toFixed(2)}</span>
                  </div>
                  {finishingPaise > 0 && (
                    <div className="flex justify-between text-[var(--pb-muted)]">
                      <span>Post-Print Finishing ({finishing} × {copies})</span>
                      <span className="text-[var(--pb-text)] font-semibold">₹{(finishingPaise / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-[var(--pb-border)] text-sm font-bold text-[var(--pb-text)]">
                    <span>Total Customer Receivable</span>
                    <span className="text-[var(--pb-accent)] font-mono">₹{totalRupees.toFixed(2)}</span>
                  </div>
                </div>

                {/* Zero Commission Guarantee Banner */}
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="font-semibold">Shop Retains 100% of Printing Revenue</span>
                  </div>
                  <span className="font-mono font-bold text-[11px] bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 rounded">
                    ₹0 Platform Fee
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ARCHITECTURAL PRINCIPLES (The Five Tenets) */}
        <section id="architecture" className="px-6 py-16 max-w-[1440px] mx-auto border-t border-[var(--pb-border)]">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-[var(--pb-spot)]">
              Engineering Rigor
            </span>
            <h2 className="text-3xl font-serif font-semibold mt-2 text-[var(--pb-text)]">
              Built for commercial distribution. Not a prototype.
            </h2>
          </div>

          <div ref={archRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="arch-card p-6 rounded-2xl bg-[var(--pb-surface)] border border-[var(--pb-border)] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--pb-raised)] flex items-center justify-center text-[var(--pb-accent)]">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-serif font-bold text-base text-[var(--pb-text)]">Zero-Leak Tenant Isolation</h3>
              <p className="text-xs text-[var(--pb-muted)] leading-relaxed">
                Guest sessions, files, queues, orders, and pricing belong to precisely one `shop_id`. PostgreSQL Row-Level Security plus application-level negative checks ensure zero cross-shop data leaks.
              </p>
            </div>

            <div className="arch-card p-6 rounded-2xl bg-[var(--pb-surface)] border border-[var(--pb-border)] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--pb-raised)] flex items-center justify-center text-[var(--pb-accent)]">
                <Lock size={20} />
              </div>
              <h3 className="font-serif font-bold text-base text-[var(--pb-text)]">Asymmetric Device Pairing</h3>
              <p className="text-xs text-[var(--pb-muted)] leading-relaxed">
                Installer is freely copyable; counter access requires authentic shop credentials and short-lived device pairing with TPM 2.0 PCP attestation. Shop and device IDs are identifiers, never secrets.
              </p>
            </div>

            <div className="arch-card p-6 rounded-2xl bg-[var(--pb-surface)] border border-[var(--pb-border)] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--pb-raised)] flex items-center justify-center text-[var(--pb-accent)]">
                <Cpu size={20} />
              </div>
              <h3 className="font-serif font-bold text-base text-[var(--pb-text)]">Never Automatic Reprint</h3>
              <p className="text-xs text-[var(--pb-muted)] leading-relaxed">
                Windows spooler disappearance does not guarantee delivered paper. Ambiguous outcomes enter `COMPLETION_UNKNOWN` for supervised operator reconciliation, eliminating duplicate print costs.
              </p>
            </div>
          </div>
        </section>

        {/* PRICING SECTION (The One Plan) */}
        <section id="pricing" className="px-6 py-16 max-w-[1440px] mx-auto border-t border-[var(--pb-border)]">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[var(--pb-surface)] via-[var(--pb-surface)] to-[var(--pb-raised)] border border-[var(--pb-border)] shadow-xl text-center max-w-3xl mx-auto space-y-6">
            <span className="px-3.5 py-1 rounded-full bg-[var(--pb-raised)] border border-[var(--pb-border)] text-xs font-mono font-bold uppercase tracking-wider text-[var(--pb-accent)]">
              Subscription Contract
            </span>

            <h2 className="text-3xl sm:text-4xl font-serif font-semibold text-[var(--pb-text)]">
              Exactly One All-Inclusive Plan.
            </h2>

            <p className="text-sm text-[var(--pb-muted)] max-w-xl mx-auto leading-relaxed">
              No Starter, Pro, or Business tiers. No paid per-printer limits or artificial software commissions. 
              Subscribed shops manage unlimited printers with complete counter autonomy.
            </p>

            <div className="py-4">
              <div className="text-5xl font-black font-serif text-[var(--pb-accent)]">
                ₹999 <span className="text-sm font-sans font-normal text-[var(--pb-muted)]">/ month</span>
              </div>
              <div className="text-xs text-[var(--pb-muted)] font-mono mt-1">
                or ₹9,990 annually (2 months free)
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-xl mx-auto pt-2 text-xs text-[var(--pb-text)] font-semibold">
              <div className="flex items-center space-x-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Unlimited Connected Printers</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Zero Commission on Prints</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Full & Manual Modes</span>
              </div>
            </div>
          </div>
        </section>

        {/* REGAL EDITORIAL FOOTER */}
        <footer className="px-6 py-12 max-w-[1440px] mx-auto border-t border-[var(--pb-border)] text-xs text-[var(--pb-muted)] space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Printer size={18} className="text-[var(--pb-accent)]" />
              <strong className="text-[var(--pb-text)] font-serif text-sm">Print Bot Platform</strong>
              <span>· Multi-Tenant SaaS & Windows Desktop Workstation</span>
            </div>

            <div className="flex items-center space-x-6 font-mono text-[11px]">
              <a href="http://localhost:5173" className="hover:text-[var(--pb-text)] transition-colors">Workstation (:5173)</a>
              <a href="http://localhost:5174" className="hover:text-[var(--pb-text)] transition-colors">Customer (:5174)</a>
              <a href="http://localhost:5175" className="hover:text-[var(--pb-text)] transition-colors">Shop (:5175)</a>
              <a href="http://localhost:5176" className="hover:text-[var(--pb-text)] transition-colors">Superadmin (:5176)</a>
              <a href="http://127.0.0.1:8000/docs" className="hover:text-[var(--pb-text)] transition-colors">FastAPI (:8000)</a>
            </div>
          </div>

          <p className="text-[11px] leading-relaxed max-w-4xl">
            Print Bot is engineered free/open-source-first under audited permissive licenses (MIT, Apache-2.0, BSD-3-Clause). 
            Windows spooler drivers and TPM 2.0 PCP attestation are integrated via native Win32 APIs without proprietary SDK royalties.
          </p>
        </footer>
      </div>
    </ThemeProvider>
  );
}