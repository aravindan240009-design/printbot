import { useState } from 'react';
import {
  ScanLine,
  SlidersHorizontal,
  Printer,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  QrCode,
  FileText,
  RotateCcw,
  ChevronRight,
  ArrowUpRight,
  type LucideIcon
} from 'lucide-react';

interface StageData {
  id: number;
  step: string;
  badge: string;
  tagline: string;
  title: string;
  text: string;
  icon: LucideIcon;
}

const STAGES: StageData[] = [
  {
    id: 0,
    step: '01',
    badge: 'Zero Friction',
    tagline: 'Instant QR Handshake',
    title: 'A scan. And you’re in.',
    text: 'Your customer scans your shop’s unique counter QR code. No app download, no account creation, no password. Just an instant, secure mobile session bound directly to your shop.',
    icon: ScanLine,
  },
  {
    id: 1,
    step: '02',
    badge: 'Precise Accounting',
    tagline: 'Live Sheet Math & Pricing',
    title: 'Every detail, their way.',
    text: 'Upload any PDF, document or image. Our server engine scans the file, renders true-to-print previews, accurately distinguishes logical pages from physical duplex sheets, and quotes your exact rates in rupees.',
    icon: SlidersHorizontal,
  },
  {
    id: 2,
    step: '03',
    badge: 'Hardware Spooling',
    tagline: 'Verified Payment & Native Dispatch',
    title: 'Verified. Then printed.',
    text: 'Eligible jobs proceed only after verified online payment or authorized counter cash approval. The Print Bot Windows workstation reconciles the queue and dispatches directly to your local printer driver.',
    icon: Printer,
  },
];

export function InteractiveExperience() {
  const [activeStage, setActiveStage] = useState(0);

  // Interactive controls state for Stage 02
  const [paperSize, setPaperSize] = useState<'A4' | 'A3' | 'Legal'>('A4');
  const [colorMode, setColorMode] = useState<'bw' | 'color'>('bw');
  const [duplexMode, setDuplexMode] = useState<'duplex' | 'single'>('duplex');

  // Dynamic price math
  const logicalPages = 14;
  const physicalSheets = duplexMode === 'duplex' ? Math.ceil(logicalPages / 2) : logicalPages;
  const ratePerSide = colorMode === 'color' ? (paperSize === 'A3' ? 20 : 10) : (paperSize === 'A3' ? 5 : 2);
  const duplexDiscountMultiplier = duplexMode === 'duplex' ? 0.9 : 1.0;
  const totalPrice = Math.round(logicalPages * ratePerSide * duplexDiscountMultiplier);

  return (
    <section id="experience" className="atelier-section shell section-space" data-reveal>
      {/* Section Header */}
      <div className="section-heading">
        <div>
          <span className="atelier-eyebrow">
            <Sparkles size={14} /> COUNTER TRANSFORMATION EXPERIENCE
          </span>
          <h2>
            From “can you print this?”<br />
            <span className="serif-note">to already on its way.</span>
          </h2>
        </div>
        <p>
          Give every customer a simpler way to print.<br />
          Give yourself room to do more at the counter.
        </p>
      </div>

      {/* Main Grid: Left Tabs & Right Interactive Stage Canvas */}
      <div className="atelier-grid">
        {/* Left Column: Interactive Step Selector Tabs */}
        <div className="atelier-tabs" role="tablist" aria-label="Customer printing journey stages">
          {STAGES.map((s, index) => {
            const isActive = activeStage === index;
            const Icon = s.icon;
            return (
              <button
                key={s.step}
                role="tab"
                id={`atelier-tab-${index}`}
                aria-controls="atelier-panel"
                aria-selected={isActive}
                className={`atelier-tab-card ${isActive ? 'tab-active' : ''}`}
                onClick={() => setActiveStage(index)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    setActiveStage((activeStage + 1) % 3);
                  } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    setActiveStage((activeStage + 2) % 3);
                  }
                }}
              >
                <div className="tab-card-header">
                  <span className="tab-card-step">STEP {s.step}</span>
                  <span className="tab-card-badge">{s.badge}</span>
                </div>
                <div className="tab-card-body">
                  <div className="tab-card-icon">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h4>{s.title}</h4>
                    <small>{s.tagline}</small>
                  </div>
                  <ChevronRight size={18} className="tab-card-arrow" />
                </div>
                {isActive && <div className="tab-active-bar" />}
              </button>
            );
          })}

          <div className="atelier-tab-footer">
            <span className="atelier-step-indicator">
              Stage <strong>0{activeStage + 1}</strong> of 03
            </span>
            <div className="atelier-nav-buttons">
              <button
                type="button"
                className="atelier-cycle-btn"
                onClick={() => setActiveStage((activeStage + 2) % 3)}
                aria-label="Previous step"
              >
                ←
              </button>
              <button
                type="button"
                className="atelier-cycle-btn"
                onClick={() => setActiveStage((activeStage + 1) % 3)}
                aria-label="Next step"
              >
                →
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: High-End Interactive Stage Canvas */}
        <div
          className="atelier-stage-canvas"
          role="tabpanel"
          id="atelier-panel"
          aria-labelledby={`atelier-tab-${activeStage}`}
        >
          {/* ============================================================== */}
          {/* STAGE 01: Instant QR Connect & Handshake                      */}
          {/* ============================================================== */}
          {activeStage === 0 && (
            <div className="stage-content slide-stage-enter" key="stage-0">
              <div className="stage-topbar">
                <div className="stage-topbar-left">
                  <span className="stage-pulse-dot" />
                  <strong>Counter 01 · Shop QR Active</strong>
                </div>
                <span className="stage-pill">Anna University Quick Xerox</span>
              </div>

              {/* Holographic QR Terminal Stage */}
              <div className="qr-hologram-stage">
                <div className="qr-laser-scanner">
                  <div className="qr-laser-beam" />
                  <div className="qr-visual-box">
                    <QrCode size={130} className="qr-svg" strokeWidth={1.4} />
                    <div className="qr-brand-overlay">
                      <PrintBotLogoMini />
                    </div>
                  </div>
                </div>

                <div className="qr-details-block">
                  <span className="qr-code-label">SCAN TO CONNECT · NO APP</span>
                  <h3>Hello, good print.</h3>
                  <p>Point any iPhone or Android camera at this shop QR code. A private, shop-bound guest session opens in 2 seconds.</p>

                  <div className="badge-row">
                    <span className="floating-pill">
                      <CheckCircle2 size={13} /> Zero App Install
                    </span>
                    <span className="floating-pill">
                      <ShieldCheck size={13} /> 1-Time Session
                    </span>
                    <span className="floating-pill">
                      <Sparkles size={13} /> Instant PWA
                    </span>
                  </div>

                  <button
                    type="button"
                    className="stage-cta-btn"
                    onClick={() => setActiveStage(1)}
                  >
                    Simulate Customer Upload <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STAGE 02: Intelligent Sheet Accounting & Live Preview          */}
          {/* ============================================================== */}
          {activeStage === 1 && (
            <div className="stage-content slide-stage-enter" key="stage-1">
              <div className="stage-topbar">
                <div className="stage-topbar-left">
                  <FileText size={16} className="stage-icon-gold" />
                  <strong>Document Preview & Page Accounting</strong>
                </div>
                <span className="stage-pill">14 Pages · Server Analyzed</span>
              </div>

              <div className="configurator-stage">
                {/* Document Preview Card */}
                <div className="doc-preview-card">
                  <div className="doc-sheet-visual">
                    <div className="sheet-corner-fold" />
                    <div className="sheet-content-preview">
                      <span className="sheet-title-mark">THESIS 2026</span>
                      <div className="sheet-lines">
                        <i />
                        <i />
                        <i style={{ width: '70%' }} />
                      </div>
                      <div className="sheet-diagram">
                        <div className="sheet-chart-bar" style={{ height: '60%' }} />
                        <div className="sheet-chart-bar" style={{ height: '90%' }} />
                        <div className="sheet-chart-bar" style={{ height: '40%' }} />
                      </div>
                    </div>
                    <span className="sheet-footer-badge">
                      {paperSize} · {colorMode.toUpperCase()} · {duplexMode.toUpperCase()}
                    </span>
                  </div>

                  <div className="doc-accounting-stats">
                    <div className="stat-row">
                      <span>Logical Pages</span>
                      <strong>{logicalPages} pages</strong>
                    </div>
                    <div className="stat-row">
                      <span>Physical Sheets</span>
                      <strong>{physicalSheets} sheets</strong>
                    </div>
                    <div className="stat-row stat-price-highlight">
                      <span>Live Accurate Quote</span>
                      <strong className="price-tag">₹{totalPrice}.00</strong>
                    </div>
                  </div>
                </div>

                {/* Interactive Options Selectors */}
                <div className="interactive-controls-panel">
                  <span className="controls-heading">CLICK TO TEST LIVE PRICE MATH:</span>

                  {/* Paper Size */}
                  <div className="control-group">
                    <label>Paper Size</label>
                    <div className="pill-toggle-group">
                      {(['A4', 'A3', 'Legal'] as const).map((size) => (
                        <button
                          key={size}
                          type="button"
                          className={`pill-btn ${paperSize === size ? 'pill-active' : ''}`}
                          onClick={() => setPaperSize(size)}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Mode */}
                  <div className="control-group">
                    <label>Color Mode</label>
                    <div className="pill-toggle-group">
                      <button
                        type="button"
                        className={`pill-btn ${colorMode === 'bw' ? 'pill-active' : ''}`}
                        onClick={() => setColorMode('bw')}
                      >
                        Black & White
                      </button>
                      <button
                        type="button"
                        className={`pill-btn ${colorMode === 'color' ? 'pill-active' : ''}`}
                        onClick={() => setColorMode('color')}
                      >
                        Full Color
                      </button>
                    </div>
                  </div>

                  {/* Duplex Mode */}
                  <div className="control-group">
                    <label>Duplex (Two-Sided)</label>
                    <div className="pill-toggle-group">
                      <button
                        type="button"
                        className={`pill-btn ${duplexMode === 'duplex' ? 'pill-active' : ''}`}
                        onClick={() => setDuplexMode('duplex')}
                      >
                        Duplex (Long Edge)
                      </button>
                      <button
                        type="button"
                        className={`pill-btn ${duplexMode === 'single' ? 'pill-active' : ''}`}
                        onClick={() => setDuplexMode('single')}
                      >
                        Single Sided
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="stage-cta-btn"
                    onClick={() => setActiveStage(2)}
                  >
                    Confirm & Send to Windows Spooler <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STAGE 03: Verified Dispatch & Windows Spooler Execution        */}
          {/* ============================================================== */}
          {activeStage === 2 && (
            <div className="stage-content slide-stage-enter" key="stage-2">
              <div className="stage-topbar">
                <div className="stage-topbar-left">
                  <span className="stage-pulse-dot" style={{ background: '#10b981' }} />
                  <strong>Windows Workstation · Native winspool.drv</strong>
                </div>
                <span className="stage-pill" style={{ color: '#10b981', borderColor: 'rgba(16,185,129,0.3)' }}>
                  ✓ Razorpay UPI Verified: ₹{totalPrice}.00
                </span>
              </div>

              <div className="spooler-execution-stage">
                {/* Physical Spooling Animation Machine */}
                <div className="spooler-visual-machine">
                  <div className="machine-top-bezel">
                    <div className="machine-leds">
                      <i className="led-green" />
                      <i className="led-blue" />
                    </div>
                    <span>EPSON ECOTANK L8050 · DISPATCH ACTIVE</span>
                  </div>

                  {/* Slit with animated emerging paper */}
                  <div className="machine-exit-slot">
                    <div className="emerging-printed-paper">
                      <div className="emerging-header">
                        <CheckCircle2 size={14} className="text-emerald" />
                        <span>VERIFIED PRINT BOT DISPATCH</span>
                      </div>
                      <p>14 Pages · Duplex Long-Edge · {colorMode === 'color' ? 'Full Color' : 'B&W'}</p>
                      <small>Job Hash: 7f93e82b... · No Reprint Allowed</small>
                    </div>
                  </div>

                  <div className="machine-output-tray">
                    <span>Physical Output Tray Ready</span>
                  </div>
                </div>

                {/* Queue Reconciliation Specs */}
                <div className="spooler-specs-card">
                  <div className="spool-item">
                    <span className="spool-label">Order Reference</span>
                    <strong>#PB-8921-XEROX</strong>
                  </div>
                  <div className="spool-item">
                    <span className="spool-label">Security & Isolation</span>
                    <strong>PostgreSQL Tenant RLS Enforced</strong>
                  </div>
                  <div className="spool-item">
                    <span className="spool-label">Hardware Queue</span>
                    <strong>Native Windows winspool.drv Buffer</strong>
                  </div>
                  <div className="spool-item">
                    <span className="spool-label">Execution Mode</span>
                    <strong>Full Automatic (Zero Staff Gate)</strong>
                  </div>

                  <div className="spooler-actions">
                    <button
                      type="button"
                      className="stage-restart-btn"
                      onClick={() => setActiveStage(0)}
                    >
                      <RotateCcw size={14} /> Restart Walkthrough
                    </button>
                    <a href="#control" className="stage-explore-link">
                      Inspect Workstation Queue <ArrowUpRight size={14} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function PrintBotLogoMini() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#e2c18b" />
      <path d="M6 9H18V15H6V9Z" fill="#211219" />
      <path d="M8 6H16V9H8V6Z" fill="#211219" opacity="0.6" />
      <circle cx="15" cy="12" r="1" fill="#e2c18b" />
    </svg>
  );
}
