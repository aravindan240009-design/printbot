import {
  FileText,
  Printer,
  ShieldCheck,
  Zap,
  SlidersHorizontal,
  Layers,
  Sparkles,
  Cpu,
  Compass,
  CheckCircle2,
  ScanLine
} from 'lucide-react';

const PRINT_CAPABILITIES = [
  { icon: Layers, title: 'AutoCAD Architectural Blueprints', meta: 'A0 / A1 / A2 Monochrome & Color' },
  { icon: FileText, title: 'University Thesis & Project Reports', meta: '100 GSM Executive Bond · Hardbound' },
  { icon: ScanLine, title: 'Government ID Cards & Passports', meta: 'Instant Auto-Crop · Front & Back Pairing' },
  { icon: ShieldCheck, title: 'Stamp Papers & Legal Agreements', meta: 'Green Ledger Stock · Zero Shrinkage' },
  { icon: Sparkles, title: 'High-Gloss Photo Studio Prints', meta: '260 GSM Ultra-Chrome · True RGB' },
  { icon: SlidersHorizontal, title: 'Full-Duplex Examination Booklets', meta: 'Automatic Odd/Even Long-Edge Collation' },
  { icon: Zap, title: 'Die-Cut Visiting Cards & Stationery', meta: '350 GSM Matte · Thermal Lamination' },
  { icon: Compass, title: 'Engineering & Circuit Schematics', meta: 'High-Density 1200 DPI Vector Linework' },
];

const PLATFORM_TECHNOLOGY = [
  { icon: Cpu, title: 'Direct Windows winspool.drv API', meta: 'Sub-millisecond Hardware Spooling' },
  { icon: Printer, title: 'Unlimited Printers Per Shop', meta: 'No Per-Printer Tier or Gate' },
  { icon: ShieldCheck, title: 'PostgreSQL Tenant Row-Level Security', meta: 'Guaranteed Shop-to-Shop Isolation' },
  { icon: Zap, title: 'Sub-12ms Price Calculation Engine', meta: 'Server-Authoritative in Paise' },
  { icon: CheckCircle2, title: 'TPM Key Hardware Pairing', meta: 'Non-Exportable Device Cryptography' },
  { icon: Sparkles, title: 'Instant Mobile Web PWA', meta: 'Zero App Download · No Forced Login' },
  { icon: Layers, title: 'Dual Dispatch Modes', meta: 'Full Automatic or Manual Staff Approval' },
  { icon: FileText, title: 'Razorpay Verified Webhook Ledger', meta: 'Idempotent Financial Event Stream' },
];

export function MarqueeShowcase() {
  return (
    <section className="marquee-section" aria-label="Print Bot verified fleet capabilities">
      <div className="marquee-header shell">
        <span className="marquee-eyebrow">
          <Sparkles size={13} /> VERIFIED AT THE COUNTER
        </span>
        <h2 className="marquee-title">
          Every document. Every driver.<br />
          <span className="marquee-accent">Engineered for Indian Xerox shops.</span>
        </h2>
      </div>

      {/* Row 1: Right-to-Left (Print Products & Formats) */}
      <div className="marquee-track-wrapper track-rtl">
        <div className="marquee-track track-left">
          {[...PRINT_CAPABILITIES, ...PRINT_CAPABILITIES].map((item, i) => (
            <div className="marquee-chip" key={'cap-' + i}>
              <div className="marquee-chip-icon">
                <item.icon size={16} />
              </div>
              <div className="marquee-chip-body">
                <strong>{item.title}</strong>
                <small>{item.meta}</small>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 2: Left-to-Right (Platform & Spooler Technology) */}
      <div className="marquee-track-wrapper track-ltr">
        <div className="marquee-track track-right">
          {[...PLATFORM_TECHNOLOGY, ...PLATFORM_TECHNOLOGY].map((item, i) => (
            <div className="marquee-chip chip-tech" key={'tech-' + i}>
              <div className="marquee-chip-icon">
                <item.icon size={16} />
              </div>
              <div className="marquee-chip-body">
                <strong>{item.title}</strong>
                <small>{item.meta}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
