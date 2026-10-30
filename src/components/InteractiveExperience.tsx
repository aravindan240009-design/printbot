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
  Layers,
  Plus,
  Minus,
  Check,
  Smartphone,
  Cpu,
  HardDrive,
  FileCheck,
  Zap,
  Eye,
  BookOpen,
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
    text: 'Your customer scans your shop’s counter QR code. No app download, no account creation, no password. Just an instant, secure mobile session bound directly to your shop.',
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

interface DocPreset {
  id: string;
  name: string;
  badge: string;
  category: string;
  pages: number;
  defaultSize: 'A4' | 'A3' | 'Legal';
  defaultColor: 'bw' | 'color';
  defaultDuplex: 'duplex' | 'single';
  title: string;
  institution: string;
  meta: string;
  department: string;
}

const DOC_PRESETS: DocPreset[] = [
  {
    id: 'thesis',
    name: 'College Project Thesis',
    badge: 'Anna University Format',
    category: 'Academic Report',
    pages: 14,
    defaultSize: 'A4',
    defaultColor: 'bw',
    defaultDuplex: 'duplex',
    title: 'AUTONOMOUS DISTRIBUTED SPOOLING IN INDIAN PRINT ENCLAVES',
    institution: 'ANNA UNIVERSITY · CHENNAI',
    department: 'DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING',
    meta: 'BATCH 2026 · FINAL YEAR CAPSTONE PROJECT REPORT',
  },
  {
    id: 'cad',
    name: 'Architectural CAD Blueprint',
    badge: 'A3 Plotter Calibrated',
    category: 'Engineering Drawing',
    pages: 4,
    defaultSize: 'A3',
    defaultColor: 'color',
    defaultDuplex: 'single',
    title: 'STRUCTURAL FOUNDATION & ELECTRICAL SCHEMATICS · G+4 COMPLEX',
    institution: 'TAMIL NADU URBAN HOUSING DEVELOPMENT BOARD',
    department: 'DIRECTORATE OF STRUCTURAL & CIVIL ENGINEERING',
    meta: 'METRIC SCALE 1:100 · 1200 DPI VECTOR ELEVATION',
  },
  {
    id: 'legal',
    name: 'Commercial Stamp Paper Deed',
    badge: 'Legal 8.5" × 14" Proportions',
    category: 'Notarized Legal Deed',
    pages: 6,
    defaultSize: 'Legal',
    defaultColor: 'bw',
    defaultDuplex: 'single',
    title: 'COMMERCIAL LEASE & NOTARIZED INDEMNITY AGREEMENT',
    institution: 'GOVERNMENT OF TAMIL NADU · REGISTRATION DEPT',
    department: 'OFFICE OF THE SUB-REGISTRAR · CHENNAI SOUTH',
    meta: 'NON-JUDICIAL STAMP PAPER PROPORTION · WATERMARK BORDER',
  },
];

export function InteractiveExperience() {
  const [activeStage, setActiveStage] = useState(1); // default to Stage 02 as requested by user

  // Document preset state
  const [selectedDocId, setSelectedDocId] = useState<string>('thesis');
  const selectedDoc = DOC_PRESETS.find((d) => d.id === selectedDocId) || DOC_PRESETS[0];

  // Interactive controls state for Stage 02
  const [paperSize, setPaperSize] = useState<'A4' | 'A3' | 'Legal'>('A4');
  const [colorMode, setColorMode] = useState<'bw' | 'color'>('bw');
  const [duplexMode, setDuplexMode] = useState<'duplex' | 'single'>('duplex');
  const [copies, setCopies] = useState<number>(1);
  const [pageSide, setPageSide] = useState<'front' | 'back'>('front');

  // Dynamic price math per Indian Xerox standards
  const totalLogicalPages = selectedDoc.pages * copies;
  const physicalSheets = duplexMode === 'duplex' ? Math.ceil(selectedDoc.pages / 2) * copies : totalLogicalPages;

  // Rate calculations
  const baseRatePerSide = colorMode === 'color' ? (paperSize === 'A3' ? 20 : 8) : (paperSize === 'A3' ? 5 : 1.5);
  const baseTotal = totalLogicalPages * baseRatePerSide;
  const duplexDiscount = duplexMode === 'duplex' && colorMode === 'bw' ? Math.round(baseTotal * 0.1) : 0;
  const totalPrice = Math.max(baseTotal - duplexDiscount, 5);

  const handleSelectPreset = (doc: DocPreset) => {
    setSelectedDocId(doc.id);
    setPaperSize(doc.defaultSize);
    setColorMode(doc.defaultColor);
    setDuplexMode(doc.defaultDuplex);
    setPageSide('front');
  };

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
            const isCompleted = activeStage > index;
            const Icon = s.icon;
            return (
              <motion.button
                key={s.step}
                role="tab"
                id={`atelier-tab-${index}`}
                aria-controls="atelier-panel"
                aria-selected={isActive}
                className={`atelier-tab-card ${isActive ? 'tab-active' : ''} ${isCompleted ? 'tab-completed' : ''}`}
                onClick={() => setActiveStage(index)}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
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
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}

                <div className="tab-card-header">
                  <div className="tab-step-indicator-chip">
                    <span className="tab-card-step">STAGE {s.step}</span>
                    {isCompleted && (
                      <span className="tab-completed-check">
                        <Check size={11} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <span className="tab-card-badge">{s.badge}</span>
                </div>

                <div className="tab-card-body">
                  <motion.div
                    className="tab-card-icon"
                    animate={isActive ? { scale: [1, 1.08, 1], rotate: [0, -6, 6, 0] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon size={20} />
                  </motion.div>
                  <div className="tab-card-text-block">
                    <h4>{s.title}</h4>
                    <p className="tab-card-tagline">{s.tagline}</p>
                    <p className="tab-card-preview-text">{s.text}</p>
                  </div>
                  <ChevronRight size={18} className="tab-card-arrow" />
                </div>
              </motion.button>
            );
          })}

          <div className="atelier-tab-footer">
            <span className="atelier-step-indicator">
              Stage <strong>0{activeStage + 1}</strong> of 03 ·{' '}
              <span className="atelier-sub-note">
                {activeStage === 0 ? 'Customer Mobile Scan' : activeStage === 1 ? 'Server Pre-Flight Engine' : 'Hardware winspool.drv'}
              </span>
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
        >
          <AnimatePresence mode="wait">
            {/* ============================================================== */}
            {/* STAGE 01: Instant QR Connect & Customer Mobile Handshake      */}
            {/* ============================================================== */}
            {activeStage === 0 && (
              <motion.div
                key="stage-0"
                className="stage-content"
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -14, scale: 0.98 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="stage-topbar">
                  <div className="stage-topbar-left">
                    <span className="stage-pulse-dot" />
                    <strong>Counter QR Terminal · Session Active</strong>
                  </div>
                  <span className="stage-pill">Anna Xerox & Digital Prints · Shop #PB-4081</span>
                </div>

                <div className="qr-terminal-luxury-grid">
                  {/* Physical Acrylic Counter Standee */}
                  <div className="acrylic-standee-container">
                    <div className="acrylic-standee-frame">
                      {/* Standee Bevel Header */}
                      <div className="standee-header">
                        <div className="standee-shop-emblem">
                          <PrintBotLogoMini />
                        </div>
                        <div>
                          <div className="standee-shop-name">ANNA XEROX & DIGITAL</div>
                          <div className="standee-shop-sub">Counter #1 · Scan to Print</div>
                        </div>
                      </div>

                      {/* Standee QR Card with Laser Scanning Effect */}
                      <div className="standee-qr-card">
                        {/* High-Tech Animated Laser Line */}
                        <motion.div
                          className="standee-laser-beam"
                          animate={{ top: ['5%', '92%', '5%'] }}
                          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                        />

                        {/* Corner Target Markers */}
                        <div className="qr-corner-bracket top-left" />
                        <div className="qr-corner-bracket top-right" />
                        <div className="qr-corner-bracket bottom-left" />
                        <div className="qr-corner-bracket bottom-right" />

                        <QrCode size={148} className="standee-qr-svg" strokeWidth={1.5} />

                        <div className="standee-qr-center-pill">
                          <span>PRINT BOT</span>
                        </div>
                      </div>

                      <div className="standee-footer">
                        <span className="standee-upi-tags">UPI · GPay · PhonePe · No App Needed</span>
                      </div>
                    </div>
                    {/* Standee Acrylic Weighted Base */}
                    <div className="acrylic-standee-base" />
                  </div>

                  {/* Customer Handshake Simulation Telemetry */}
                  <div className="handshake-details-pane">
                    <span className="stage-section-tag">
                      <Sparkles size={12} /> ZERO-FRICTION ONBOARDING
                    </span>
                    <h3>Instant Mobile Handshake. Zero Counter Jam.</h3>
                    <p>
                      Customers point their default iPhone or Android camera at your counter QR standee. An encrypted guest session opens directly in their browser in under 2 seconds.
                    </p>

                    {/* Live Mobile Pairing Card */}
                    <div className="live-pairing-card">
                      <div className="pairing-header">
                        <div className="pairing-device-info">
                          <Smartphone size={16} className="text-gold" />
                          <span>Customer: iPhone 15 Pro (Safari PWA)</span>
                        </div>
                        <span className="pairing-status-badge">
                          <span className="dot-green" /> Paired 1.2s ago
                        </span>
                      </div>

                      <div className="pairing-file-row">
                        <FileText size={18} className="text-wine" />
                        <div className="file-info">
                          <strong>Thesis_Final_Project_Report.pdf</strong>
                          <small>14 Pages · 18.4 MB · Scanned for malware</small>
                        </div>
                        <span className="file-ready-tag">✓ Ready</span>
                      </div>

                      <div className="pairing-meter-track">
                        <motion.div
                          className="pairing-meter-fill"
                          initial={{ width: '15%' }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1.5 }}
                        />
                      </div>
                    </div>

                    <div className="badge-row">
                      <span className="floating-pill">
                        <CheckCircle2 size={13} /> Zero App Download
                      </span>
                      <span className="floating-pill">
                        <ShieldCheck size={13} /> PostgreSQL Tenant Isolation
                      </span>
                      <span className="floating-pill">
                        <Zap size={13} /> 2-Second Upload
                      </span>
                    </div>

                    <motion.button
                      type="button"
                      className="stage-cta-btn"
                      onClick={() => setActiveStage(1)}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span>Simulate Customer Configuration</span>
                      <ArrowRight size={16} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ============================================================== */}
            {/* STAGE 02: High-Fidelity Document Preview & Live Sheet Math    */}
            {/* ============================================================== */}
            {activeStage === 1 && (
              <motion.div
                key="stage-1"
                className="stage-content"
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -14, scale: 0.98 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Top Status Bar */}
                <div className="stage-topbar">
                  <div className="stage-topbar-left">
                    <FileCheck size={16} className="stage-icon-gold" />
                    <strong>Server Pre-Flight Engine · True-to-Print Render</strong>
                  </div>
                  <div className="stage-topbar-right">
                    <span className="stage-pill-highlight">
                      {totalLogicalPages} Logical Pages · Server Verified
                    </span>
                  </div>
                </div>

                {/* Document Preset Switcher Bar */}
                <div className="doc-preset-switcher-bar">
                  <span className="preset-switcher-label">TEST SAMPLE DOCUMENT:</span>
                  <div className="preset-pill-group">
                    {DOC_PRESETS.map((doc) => (
                      <button
                        key={doc.id}
                        type="button"
                        className={`preset-btn ${selectedDocId === doc.id ? 'preset-active' : ''}`}
                        onClick={() => handleSelectPreset(doc)}
                      >
                        <FileText size={13} />
                        <span>{doc.name}</span>
                        <span className="preset-count">({doc.pages}p)</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Configurator Stage: Document Preview vs Interactive Controls */}
                <div className="configurator-stage-upgraded">
                  {/* Left Column: Realistic True-to-Life Document Sheet */}
                  <div className="preview-canvas-column">
                    {/* Realistic 3D Paper Sheet with Duplex Shadow Stack */}
                    <div className="document-sheet-perspective-wrap">
                      {/* Underneath Paper Sheet Shadows (Indicating physical duplex sheet count) */}
                      <div
                        className={`paper-stack-underlay ${duplexMode === 'duplex' ? 'stack-duplex' : 'stack-single'}`}
                        aria-hidden="true"
                      >
                        <div className="stack-layer layer-3" />
                        <div className="stack-layer layer-2" />
                        <div className="stack-layer layer-1" />
                      </div>

                      {/* Main Printable Sheet with Aspect Ratio scaling */}
                      <motion.div
                        className={`document-sheet-main doc-size-${paperSize.toLowerCase()} ${colorMode === 'color' ? 'doc-mode-color' : 'doc-mode-bw'}`}
                        animate={{
                          rotateY: pageSide === 'back' ? 180 : 0,
                        }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {/* Front Face of Sheet */}
                        <div className="sheet-face sheet-face-front">
                          {/* Corner Paper Fold Accent */}
                          <div className="sheet-corner-fold-gold" />

                          {/* Official Top Guilloche / Security Header */}
                          <div className="sheet-formal-header">
                            <div className="sheet-crest-svg">
                              <UniversityCrestSVG colorMode={colorMode} />
                            </div>
                            <div className="sheet-header-text">
                              <span className="sheet-univ-title">{selectedDoc.institution}</span>
                              <span className="sheet-univ-dept">{selectedDoc.department}</span>
                              <span className="sheet-univ-meta">{selectedDoc.meta}</span>
                            </div>
                          </div>

                          {/* Gold / Maroon Accent Divider */}
                          <div className="sheet-accent-rule" />

                          {/* Document Main Title */}
                          <div className="sheet-body-content">
                            <h4 className="sheet-main-title">{selectedDoc.title}</h4>

                            <div className="sheet-text-skeleton-lines">
                              <span className="text-line full" />
                              <span className="text-line mid" />
                              <span className="text-line three-quarter" />
                            </div>

                            {/* Dynamic Visual Content Chart: Changes color realistically with colorMode */}
                            <div className="sheet-diagram-box">
                              <div className="diagram-header">
                                <span>FIGURE 1.1 · PERFORMANCE BENCHMARK (SECONDS PER SUBMISSION)</span>
                                <span className="diagram-dpi-tag">300 DPI EMF</span>
                              </div>

                              <div className="diagram-chart-bars">
                                <div className="chart-bar-col">
                                  <motion.div
                                    className="chart-bar bar-1"
                                    animate={{ height: ['40%', '65%'] }}
                                    transition={{ duration: 0.8 }}
                                  />
                                  <span>Manual Counter</span>
                                </div>
                                <div className="chart-bar-col">
                                  <motion.div
                                    className="chart-bar bar-2"
                                    animate={{ height: ['60%', '95%'] }}
                                    transition={{ duration: 0.8, delay: 0.1 }}
                                  />
                                  <span>Print Bot Automated</span>
                                </div>
                                <div className="chart-bar-col">
                                  <motion.div
                                    className="chart-bar bar-3"
                                    animate={{ height: ['20%', '42%'] }}
                                    transition={{ duration: 0.8, delay: 0.2 }}
                                  />
                                  <span>Native Spool</span>
                                </div>
                              </div>
                            </div>

                            {/* Signoff / Seal Footer */}
                            <div className="sheet-signoff-row">
                              <div className="sheet-stamp-seal">
                                <OfficialStampSVG colorMode={colorMode} />
                              </div>
                              <div className="sheet-guide-sign">
                                <div className="sign-line" />
                                <span>HEAD OF DEPARTMENT / VERIFIED GUIDE</span>
                              </div>
                            </div>
                          </div>

                          {/* Bottom Document Technical Trim Bar */}
                          <div className="sheet-technical-trim">
                            <span>{paperSize} · 80 GSM BOND</span>
                            <span>{colorMode === 'color' ? 'CMYK RICH GAMUT' : 'MONOCHROME LASER 1200 DPI'}</span>
                            <span>{duplexMode === 'duplex' ? 'DUPLEX LONG-EDGE' : 'SINGLE-SIDED'}</span>
                            <span className="barcode-inline">|||||||||||||||</span>
                          </div>
                        </div>

                        {/* Back Face of Sheet (for Duplex Flip Simulation) */}
                        <div className="sheet-face sheet-face-back">
                          <div className="sheet-formal-header back-header">
                            <span className="sheet-univ-title">{selectedDoc.institution}</span>
                            <span className="sheet-univ-meta">PAGE 2 · DUPLEX BACK FACE</span>
                          </div>
                          <div className="sheet-accent-rule" />
                          <div className="sheet-body-content back-body">
                            <h5>CHAPTER II · CONCLUSION & CITATIONS</h5>
                            <div className="sheet-text-skeleton-lines">
                              <span className="text-line full" />
                              <span className="text-line full" />
                              <span className="text-line mid" />
                              <span className="text-line three-quarter" />
                              <span className="text-line full" />
                            </div>
                            <div className="sheet-back-security-box">
                              <CheckCircle2 size={16} className="text-emerald" />
                              <span>CERTIFIED DUPLEX ZERO-MARGIN WIN-SPOOL VERIFIED</span>
                            </div>
                          </div>
                          <div className="sheet-technical-trim">
                            <span>BACK FACE · REVERSE ORIENTATION</span>
                            <span>100% REVERSIBLE</span>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Page Flip & View Controls */}
                    <div className="preview-action-subbar">
                      {duplexMode === 'duplex' ? (
                        <button
                          type="button"
                          className="flip-page-toggle-btn"
                          onClick={() => setPageSide(pageSide === 'front' ? 'back' : 'front')}
                          title="Flip page to test duplex alignment"
                        >
                          <BookOpen size={13} />
                          <span>Viewing: {pageSide === 'front' ? 'Page 1 (Front Side)' : 'Page 2 (Back Side)'} · Click to Flip</span>
                        </button>
                      ) : (
                        <span className="single-side-indicator">
                          <Eye size={13} /> Single-Sided Sheet Preview (Front Only)
                        </span>
                      )}
                    </div>

                    {/* Accurate Accounting & Price Math Card */}
                    <div className="accounting-ledger-card">
                      <div className="ledger-header">
                        <div className="ledger-title">
                          <Layers size={14} className="text-gold" />
                          <span>PAGE & SHEET ACCOUNTING</span>
                        </div>
                        <span className="ledger-status-pill">Locked at Checkout</span>
                      </div>

                      <div className="ledger-grid-rows">
                        <div className="ledger-row">
                          <span className="ledger-label">Logical Document Pages:</span>
                          <span className="ledger-value">{totalLogicalPages} pages</span>
                        </div>

                        <div className="ledger-row">
                          <span className="ledger-label">Physical Sheets Consumed:</span>
                          <span className="ledger-value">
                            <strong>{physicalSheets} sheets</strong>
                            {duplexMode === 'duplex' && (
                              <span className="sheet-savings-tag">50% Paper Saved</span>
                            )}
                          </span>
                        </div>

                        <div className="ledger-row">
                          <span className="ledger-label">Base Rate per Side:</span>
                          <span className="ledger-value">
                            ₹{baseRatePerSide.toFixed(2)} ({paperSize} {colorMode === 'color' ? 'Color' : 'B&W'})
                          </span>
                        </div>

                        {duplexDiscount > 0 && (
                          <div className="ledger-row ledger-discount">
                            <span className="ledger-label">Duplex Eco Discount (10%):</span>
                            <span className="ledger-value discount-text">-₹{duplexDiscount.toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      <div className="ledger-total-bar">
                        <div className="ledger-total-left">
                          <span className="total-lead">Live Accurate Customer Quote</span>
                          <span className="total-sub">100% Shop Revenue · ₹0 Commission</span>
                        </div>
                        <motion.div
                          key={`${totalPrice}-${copies}-${paperSize}-${colorMode}`}
                          className="ledger-price-badge"
                          initial={{ scale: 1.15, filter: 'brightness(1.2)' }}
                          animate={{ scale: 1, filter: 'brightness(1)' }}
                          transition={{ duration: 0.3 }}
                        >
                          <span className="currency-symbol">₹</span>
                          <span className="amount">{totalPrice}.00</span>
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: High-End Live Print Configurator Controls */}
                  <div className="configurator-controls-column">
                    <div className="controls-box-header">
                      <span className="controls-box-title">
                        <SlidersHorizontal size={14} /> LIVE PRINT SPECIFICATIONS
                      </span>
                      <span className="controls-calc-live">
                        <span className="dot-pulse" /> Real-time math
                      </span>
                    </div>

                    {/* Control 1: Paper Size */}
                    <div className="config-control-group">
                      <div className="config-label-row">
                        <label>Paper Size & Aspect</label>
                        <span className="label-meta">{paperSize === 'A4' ? '210 × 297 mm' : paperSize === 'A3' ? '297 × 420 mm' : '216 × 356 mm'}</span>
                      </div>
                      <div className="custom-segmented-control">
                        {(['A4', 'A3', 'Legal'] as const).map((size) => (
                          <button
                            key={size}
                            type="button"
                            className={`seg-btn ${paperSize === size ? 'seg-active' : ''}`}
                            onClick={() => setPaperSize(size)}
                          >
                            <span className="seg-main">{size}</span>
                            <span className="seg-sub">
                              {size === 'A4' ? 'Standard' : size === 'A3' ? '+₹3/pg' : '+₹1/pg'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Control 2: Color Palette Mode */}
                    <div className="config-control-group">
                      <div className="config-label-row">
                        <label>Color Gamut</label>
                        <span className="label-meta">{colorMode === 'bw' ? 'Laser Toner Grayscale' : 'CMYK High-Gloss Ink'}</span>
                      </div>
                      <div className="custom-segmented-control">
                        <button
                          type="button"
                          className={`seg-btn ${colorMode === 'bw' ? 'seg-active' : ''}`}
                          onClick={() => setColorMode('bw')}
                        >
                          <div className="color-swatch-circle bw-circle" />
                          <div className="seg-text">
                            <span className="seg-main">Black & White</span>
                            <span className="seg-sub">₹1.50 / page</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          className={`seg-btn ${colorMode === 'color' ? 'seg-active' : ''}`}
                          onClick={() => setColorMode('color')}
                        >
                          <div className="color-swatch-circle color-circle" />
                          <div className="seg-text">
                            <span className="seg-main">Full Color</span>
                            <span className="seg-sub">₹8.00 / page</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Control 3: Duplex Mode */}
                    <div className="config-control-group">
                      <div className="config-label-row">
                        <label>Duplex (Two-Sided)</label>
                        <span className="label-meta">{duplexMode === 'duplex' ? 'Saves 50% Paper' : '1 Sheet per Page'}</span>
                      </div>
                      <div className="custom-segmented-control">
                        <button
                          type="button"
                          className={`seg-btn ${duplexMode === 'duplex' ? 'seg-active' : ''}`}
                          onClick={() => {
                            setDuplexMode('duplex');
                            setPageSide('front');
                          }}
                        >
                          <BookOpen size={14} className="seg-icon" />
                          <div className="seg-text">
                            <span className="seg-main">Duplex (Long Edge)</span>
                            <span className="seg-sub">Save paper & fee</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          className={`seg-btn ${duplexMode === 'single' ? 'seg-active' : ''}`}
                          onClick={() => {
                            setDuplexMode('single');
                            setPageSide('front');
                          }}
                        >
                          <FileText size={14} className="seg-icon" />
                          <div className="seg-text">
                            <span className="seg-main">Single Sided</span>
                            <span className="seg-sub">1 sheet per page</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Control 4: Copies Stepper */}
                    <div className="config-control-group">
                      <div className="config-label-row">
                        <label>Print Quantity</label>
                        <span className="label-meta">{copies} set{copies > 1 ? 's' : ''} ({physicalSheets} total sheets)</span>
                      </div>
                      <div className="copies-stepper-row">
                        <div className="stepper-widget">
                          <button
                            type="button"
                            className="step-btn"
                            onClick={() => setCopies(Math.max(1, copies - 1))}
                            disabled={copies <= 1}
                            aria-label="Decrease copies"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="copies-display">{copies} {copies === 1 ? 'Copy' : 'Copies'}</span>
                          <button
                            type="button"
                            className="step-btn"
                            onClick={() => setCopies(Math.min(10, copies + 1))}
                            aria-label="Increase copies"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <div className="copies-note">
                          <span>Auto-collated for customer handoff</span>
                        </div>
                      </div>
                    </div>

                    {/* Primary Confirmation CTA Button */}
                    <div className="config-cta-wrapper">
                      <motion.button
                        type="button"
                        className="stage-cta-btn stage-cta-prominent"
                        onClick={() => setActiveStage(2)}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="cta-text-group">
                          <span className="cta-headline">Confirm & Send to Windows Spooler</span>
                          <span className="cta-subline">Razorpay UPI Checkout · Direct Driver Dispatch</span>
                        </div>
                        <ArrowRight size={18} className="cta-arrow" />
                      </motion.button>

                      <div className="config-security-note">
                        <ShieldCheck size={13} className="text-emerald" />
                        <span>Zero Commission · 100% UPI to shop bank account</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ============================================================== */}
            {/* STAGE 03: Native Windows Workstation Spooler & Fleet Dispatch */}
            {/* ============================================================== */}
            {activeStage === 2 && (
              <motion.div
                key="stage-2"
                className="stage-content"
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -14, scale: 0.98 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Top Status Bar */}
                <div className="stage-topbar">
                  <div className="stage-topbar-left">
                    <span className="stage-pulse-dot" style={{ background: '#10b981' }} />
                    <strong>Windows Workstation v2.4 · Native winspool.drv</strong>
                  </div>
                  <span className="stage-pill-success">
                    ✓ Verified Paid via UPI: ₹{totalPrice}.00 (0% Commission)
                  </span>
                </div>

                <div className="workstation-spooler-grid">
                  {/* Miniature Windows Workstation App Window */}
                  <div className="windows-app-window">
                    {/* Windows Titlebar */}
                    <div className="windows-titlebar">
                      <div className="titlebar-left">
                        <div className="windows-app-icon">
                          <PrintBotLogoMini />
                        </div>
                        <span>Print Bot Desktop OS — Hardware Queue Monitor</span>
                      </div>
                      <div className="windows-window-controls">
                        <span className="win-btn">─</span>
                        <span className="win-btn">□</span>
                        <span className="win-btn close">✕</span>
                      </div>
                    </div>

                    {/* Workstation Inner Panel */}
                    <div className="windows-body-content">
                      {/* Active Printer Header */}
                      <div className="workstation-printer-status">
                        <div className="printer-header-row">
                          <div className="printer-name-col">
                            <Printer size={18} className="text-gold" />
                            <div>
                              <strong>EPSON EcoTank L8050 (Heavy Duty Fleet)</strong>
                              <small>USB 3.0 High-Speed · Tray 1 (80 GSM A4) · Online</small>
                            </div>
                          </div>
                          <span className="printer-status-pill online">
                            <span className="dot-green" /> Spooling Active
                          </span>
                        </div>

                        {/* Animated Buffer Progress */}
                        <div className="spool-progress-container">
                          <div className="spool-progress-labels">
                            <span>RAW EMF Buffer (1200 DPI Native)</span>
                            <strong>100% Spooled (64 MB)</strong>
                          </div>
                          <div className="spool-progress-bar">
                            <motion.div
                              className="spool-progress-fill"
                              initial={{ width: '0%' }}
                              animate={{ width: '100%' }}
                              transition={{ duration: 1.2, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Live Job Ticket Receipt */}
                      <div className="spool-job-receipt">
                        <div className="receipt-row">
                          <span>Job Reference:</span>
                          <strong>#PB-8942-XEROX</strong>
                        </div>
                        <div className="receipt-row">
                          <span>Customer Session:</span>
                          <strong>Guest #4298 (iPhone 15 Pro)</strong>
                        </div>
                        <div className="receipt-row">
                          <span>Document:</span>
                          <strong>{selectedDoc.name} ({totalLogicalPages} pgs, {duplexMode})</strong>
                        </div>
                        <div className="receipt-row">
                          <span>Payment Settlement:</span>
                          <strong className="text-emerald">UPI ID: pay_9482103819 (Direct Shop Bank)</strong>
                        </div>
                        <div className="receipt-row">
                          <span>Security Policy:</span>
                          <strong>PostgreSQL Tenant RLS · Auto-purged from memory</strong>
                        </div>
                      </div>

                      {/* Live winspool.drv Log Stream */}
                      <div className="winspool-log-terminal">
                        <div className="log-line success">
                          <Check size={11} /> [winspool.drv] OpenPrinterW("EPSON L8050") - OK
                        </div>
                        <div className="log-line success">
                          <Check size={11} /> [winspool.drv] StartDocPrinterW(Job #PB-8942) - EMF RAW STREAM
                        </div>
                        <div className="log-line highlight">
                          <Sparkles size={11} /> [PrintBot] Physical paper delivery verified. Counter queue clear.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Workstation Queue Summary & Actions */}
                  <div className="workstation-summary-pane">
                    <span className="stage-section-tag">
                      <Cpu size={12} /> ENTERPRISE-GRADE DISPATCH
                    </span>
                    <h3>Zero Counter Chaos. 100% Revenue Retained.</h3>
                    <p>
                      The customer pays via PhonePe, GPay, or counter cash. Print Bot authenticates payment and immediately commands your physical printer via low-level Windows APIs.
                    </p>

                    <div className="audit-specs-list">
                      <div className="audit-spec-item">
                        <HardDrive size={16} className="text-wine" />
                        <div>
                          <strong>Zero Margin Loss</strong>
                          <small>100% true printable area without cloud PDF resizing artifacts.</small>
                        </div>
                      </div>
                      <div className="audit-spec-item">
                        <ShieldCheck size={16} className="text-gold" />
                        <div>
                          <strong>Anti-Reprint Lock</strong>
                          <small>Each job hash is tamper-proof and strictly printed once.</small>
                        </div>
                      </div>
                      <div className="audit-spec-item">
                        <Cpu size={16} className="text-emerald" />
                        <div>
                          <strong>Unlimited Fleet</strong>
                          <small>Add 1, 5, or 20 printers. Never pay per-device license fees.</small>
                        </div>
                      </div>
                    </div>

                    <div className="spooler-actions-row">
                      <motion.button
                        type="button"
                        className="stage-restart-btn"
                        onClick={() => setActiveStage(0)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <RotateCcw size={14} />
                        <span>Restart Experience</span>
                      </motion.button>

                      <motion.a
                        href="#plans"
                        className="stage-cta-btn"
                        whileHover={{ scale: 1.02, x: 3 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span>View All-Inclusive Plan</span>
                        <ArrowUpRight size={15} />
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

function UniversityCrestSVG({ colorMode }: { colorMode: 'bw' | 'color' }) {
  const strokeColor = colorMode === 'color' ? '#792d47' : '#222';
  const fillColor = colorMode === 'color' ? '#e2c18b' : '#999';

  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
      <circle cx="17" cy="17" r="15" stroke={strokeColor} strokeWidth="1.5" strokeDasharray="2 2" />
      <circle cx="17" cy="17" r="12" stroke={strokeColor} strokeWidth="1" />
      <path d="M17 7L21 15H13L17 7Z" fill={fillColor} opacity="0.8" />
      <circle cx="17" cy="19" r="3.5" fill={strokeColor} />
      <path d="M11 25C13 23 21 23 23 25" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function OfficialStampSVG({ colorMode }: { colorMode: 'bw' | 'color' }) {
  const color = colorMode === 'color' ? '#792d47' : '#333';
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" fill="none" style={{ opacity: 0.85, transform: 'rotate(-8deg)' }}>
      <circle cx="34" cy="34" r="30" stroke={color} strokeWidth="1.5" strokeDasharray="3 2" />
      <circle cx="34" cy="34" r="26" stroke={color} strokeWidth="1" />
      <path id="curve" d="M12 34 A22 22 0 0 1 56 34" fill="none" />
      <text fill={color} fontSize="6.5" fontWeight="bold" letterSpacing="0.8">
        <textPath href="#curve" startOffset="50%" textAnchor="middle">
          PRINT BOT VERIFIED
        </textPath>
      </text>
      <circle cx="34" cy="34" r="14" stroke={color} strokeWidth="0.8" />
      <text x="34" y="32" fill={color} fontSize="6" fontWeight="bold" textAnchor="middle">
        ★ 2026 ★
      </text>
      <text x="34" y="39" fill={color} fontSize="5" fontWeight="600" textAnchor="middle">
        1200 DPI
      </text>
    </svg>
  );
}
