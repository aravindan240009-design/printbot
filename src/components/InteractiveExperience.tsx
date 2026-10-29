import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  type LucideIcon,
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
      <motion.div
        className="section-heading"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
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
      </motion.div>

      {/* Main Grid: Left Tabs & Right Interactive Stage Canvas */}
      <div className="atelier-grid">
        {/* Left Column: Interactive Step Selector Tabs */}
        <div className="atelier-tabs" role="tablist" aria-label="Customer printing journey stages">
          {STAGES.map((s, index) => {
            const isActive = activeStage === index;
            const Icon = s.icon;
            return (
              <motion.button
                key={s.step}
                role="tab"
                id={`atelier-tab-${index}`}
                aria-controls="atelier-panel"
                aria-selected={isActive}
                className={`atelier-tab-card ${isActive ? 'tab-active' : ''}`}
                onClick={() => setActiveStage(index)}
                whileHover={{ x: 6 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                style={{ position: 'relative' }}
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
                {/* Active Indicator Glow Pill using Motion LayoutId */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabMarker"
                    className="tab-active-bar"
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      background: 'linear-gradient(180deg, #e2c18b, #792d47)',
                      borderRadius: '4px 0 0 4px',
                      boxShadow: '0 0 12px rgba(226, 193, 139, 0.6)',
                    }}
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}

                <div className="tab-card-header">
                  <span className="tab-card-step">STEP {s.step}</span>
                  <span className="tab-card-badge">{s.badge}</span>
                </div>
                <div className="tab-card-body">
                  <motion.div
                    className="tab-card-icon"
                    animate={isActive ? { rotate: [0, -10, 10, 0] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon size={20} />
                  </motion.div>
                  <div>
                    <h4>{s.title}</h4>
                    <small>{s.tagline}</small>
                  </div>
                  <ChevronRight size={18} className="tab-card-arrow" />
                </div>
              </motion.button>
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

        {/* Right Column: High-End Interactive Stage Canvas with AnimatePresence */}
        <div
          className="atelier-stage-canvas"
          role="tabpanel"
          id="atelier-panel"
          aria-labelledby={`atelier-tab-${activeStage}`}
          style={{ overflow: 'hidden', position: 'relative' }}
        >
          <AnimatePresence mode="wait">
            {/* ============================================================== */}
            {/* STAGE 01: Instant QR Connect & Handshake                      */}
            {/* ============================================================== */}
            {activeStage === 0 && (
              <motion.div
                key="stage-0"
                className="stage-content"
                initial={{ opacity: 0, x: 30, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -30, scale: 0.97 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="stage-topbar">
                  <div className="stage-topbar-left">
                    <span className="stage-pulse-dot" />
                    <strong>Counter 01 · Shop QR Active</strong>
                  </div>
                  <span className="stage-pill">Anna University Quick Xerox</span>
                </div>

                {/* Holographic QR Terminal Stage with High-Tech Laser Beam */}
                <div className="qr-hologram-stage">
                  <div className="qr-laser-scanner" style={{ position: 'relative', overflow: 'hidden' }}>
                    {/* Animated Laser Beam */}
                    <motion.div
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: 'linear-gradient(90deg, transparent, #e2c18b 20%, #ffffff 50%, #e2c18b 80%, transparent)',
                        boxShadow: '0 0 16px #e2c18b, 0 0 28px rgba(226, 193, 139, 0.7)',
                        zIndex: 10,
                      }}
                      animate={{ top: ['5%', '92%', '5%'] }}
                      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                    />

                    {/* Corner Target Brackets */}
                    <div className="qr-visual-box" style={{ position: 'relative' }}>
                      <QrCode size={130} className="qr-svg" strokeWidth={1.4} />
                      <div className="qr-brand-overlay">
                        <PrintBotLogoMini />
                      </div>
                    </div>
                  </div>

                  <div className="qr-details-block">
                    <span className="qr-code-label">SCAN TO CONNECT · NO APP</span>
                    <h3>Hello, good print.</h3>
                    <p>
                      Point any iPhone or Android camera at this shop QR code. A private, shop-bound guest session opens in 2 seconds.
                    </p>

                    <div className="badge-row">
                      <motion.span className="floating-pill" whileHover={{ y: -2, scale: 1.04 }}>
                        <CheckCircle2 size={13} /> Zero App Install
                      </motion.span>
                      <motion.span className="floating-pill" whileHover={{ y: -2, scale: 1.04 }}>
                        <ShieldCheck size={13} /> 1-Time Session
                      </motion.span>
                      <motion.span className="floating-pill" whileHover={{ y: -2, scale: 1.04 }}>
                        <Sparkles size={13} /> Instant PWA
                      </motion.span>
                    </div>

                    <motion.button
                      type="button"
                      className="stage-cta-btn"
                      onClick={() => setActiveStage(1)}
                      whileHover={{ scale: 1.03, x: 4 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                      <span>Simulate Customer Upload</span>
                      <ArrowRight size={16} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ============================================================== */}
            {/* STAGE 02: Intelligent Sheet Accounting & Live Preview          */}
            {/* ============================================================== */}
            {activeStage === 1 && (
              <motion.div
                key="stage-1"
                className="stage-content"
                initial={{ opacity: 0, x: 30, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -30, scale: 0.97 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="stage-topbar">
                  <div className="stage-topbar-left">
                    <FileText size={16} className="stage-icon-gold" />
                    <strong>Document Preview & Page Accounting</strong>
                  </div>
                  <span className="stage-pill">14 Pages · Server Analyzed</span>
                </div>

                <div className="configurator-stage">
                  {/* Interactive 3D Paper Sheet with Morphing Duplex Effect */}
                  <div className="doc-preview-card" style={{ perspective: 1000 }}>
                    <motion.div
                      className="doc-sheet-visual"
                      animate={{
                        rotateY: duplexMode === 'duplex' ? [0, 8, 0] : 0,
                        borderColor: colorMode === 'color' ? '#e2c18b' : 'rgba(226, 193, 139, 0.25)',
                      }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      style={{
                        background: colorMode === 'color' ? 'linear-gradient(135deg, #fffbf2 0%, #f7ecd7 100%)' : '#ffffff',
                        boxShadow: colorMode === 'color' ? '0 16px 40px rgba(226, 193, 139, 0.22)' : '0 10px 30px rgba(0,0,0,0.06)',
                        transition: 'background 0.3s ease',
                      }}
                    >
                      <div className="sheet-corner-fold" />
                      <div className="sheet-content-preview">
                        <span className="sheet-title-mark" style={{ color: colorMode === 'color' ? '#792d47' : '#555' }}>
                          THESIS 2026
                        </span>
                        <div className="sheet-lines">
                          <i />
                          <i />
                          <i style={{ width: '70%' }} />
                        </div>
                        <div className="sheet-diagram">
                          <motion.div
                            className="sheet-chart-bar"
                            animate={{ height: ['40%', '60%'] }}
                            transition={{ duration: 0.6 }}
                            style={{ background: colorMode === 'color' ? '#792d47' : '#999' }}
                          />
                          <motion.div
                            className="sheet-chart-bar"
                            animate={{ height: ['50%', '90%'] }}
                            transition={{ duration: 0.6 }}
                            style={{ background: colorMode === 'color' ? '#e2c18b' : '#666' }}
                          />
                          <motion.div
                            className="sheet-chart-bar"
                            animate={{ height: ['20%', '45%'] }}
                            transition={{ duration: 0.6 }}
                            style={{ background: colorMode === 'color' ? '#d97706' : '#bbb' }}
                          />
                        </div>
                      </div>
                      <span className="sheet-footer-badge">
                        {paperSize} · {colorMode.toUpperCase()} · {duplexMode.toUpperCase()}
                      </span>
                    </motion.div>

                    <div className="doc-accounting-stats">
                      <div className="stat-row">
                        <span>Logical Pages</span>
                        <strong>{logicalPages} pages</strong>
                      </div>
                      <div className="stat-row">
                        <span>Physical Sheets</span>
                        <motion.strong
                          key={physicalSheets}
                          initial={{ scale: 1.2, color: '#e2c18b' }}
                          animate={{ scale: 1, color: 'inherit' }}
                          transition={{ duration: 0.3 }}
                        >
                          {physicalSheets} sheets
                        </motion.strong>
                      </div>
                      <div className="stat-row stat-price-highlight">
                        <span>Live Accurate Quote</span>
                        <motion.strong
                          key={totalPrice}
                          className="price-tag"
                          initial={{ scale: 1.25, color: '#10b981' }}
                          animate={{ scale: 1, color: 'inherit' }}
                          transition={{ duration: 0.35, type: 'spring' }}
                        >
                          ₹{totalPrice}.00
                        </motion.strong>
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
                          <motion.button
                            key={size}
                            type="button"
                            className={`pill-btn ${paperSize === size ? 'pill-active' : ''}`}
                            onClick={() => setPaperSize(size)}
                            whileTap={{ scale: 0.95 }}
                          >
                            {size}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Color Mode */}
                    <div className="control-group">
                      <label>Color Mode</label>
                      <div className="pill-toggle-group">
                        <motion.button
                          type="button"
                          className={`pill-btn ${colorMode === 'bw' ? 'pill-active' : ''}`}
                          onClick={() => setColorMode('bw')}
                          whileTap={{ scale: 0.95 }}
                        >
                          Black & White
                        </motion.button>
                        <motion.button
                          type="button"
                          className={`pill-btn ${colorMode === 'color' ? 'pill-active' : ''}`}
                          onClick={() => setColorMode('color')}
                          whileTap={{ scale: 0.95 }}
                        >
                          Full Color
                        </motion.button>
                      </div>
                    </div>

                    {/* Duplex Mode */}
                    <div className="control-group">
                      <label>Duplex (Two-Sided)</label>
                      <div className="pill-toggle-group">
                        <motion.button
                          type="button"
                          className={`pill-btn ${duplexMode === 'duplex' ? 'pill-active' : ''}`}
                          onClick={() => setDuplexMode('duplex')}
                          whileTap={{ scale: 0.95 }}
                        >
                          Duplex (Long Edge)
                        </motion.button>
                        <motion.button
                          type="button"
                          className={`pill-btn ${duplexMode === 'single' ? 'pill-active' : ''}`}
                          onClick={() => setDuplexMode('single')}
                          whileTap={{ scale: 0.95 }}
                        >
                          Single Sided
                        </motion.button>
                      </div>
                    </div>

                    <motion.button
                      type="button"
                      className="stage-cta-btn"
                      onClick={() => setActiveStage(2)}
                      whileHover={{ scale: 1.03, x: 4 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                      <span>Confirm & Send to Windows Spooler</span>
                      <ArrowRight size={16} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ============================================================== */}
            {/* STAGE 03: Verified Dispatch & Windows Spooler Execution        */}
            {/* ============================================================== */}
            {activeStage === 2 && (
              <motion.div
                key="stage-2"
                className="stage-content"
                initial={{ opacity: 0, x: 30, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -30, scale: 0.97 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
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
                      <motion.div
                        className="emerging-printed-paper"
                        initial={{ y: -60, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <div className="emerging-header">
                          <CheckCircle2 size={14} className="text-emerald" />
                          <span>VERIFIED PRINT BOT DISPATCH</span>
                        </div>
                        <p>14 Pages · Duplex Long-Edge · {colorMode === 'color' ? 'Full Color' : 'B&W'}</p>
                        <small>Job Hash: 7f93e82b... · No Reprint Allowed</small>
                      </motion.div>
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
                      <motion.button
                        type="button"
                        className="stage-restart-btn"
                        onClick={() => setActiveStage(0)}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <RotateCcw size={14} /> Restart Walkthrough
                      </motion.button>
                      <motion.a
                        href="#control"
                        className="stage-explore-link"
                        whileHover={{ x: 4 }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <span>Inspect Workstation Queue</span>
                        <ArrowUpRight size={14} />
                      </motion.a>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
