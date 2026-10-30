import React, { useState } from 'react';
import { 
  Printer, 
  Download, 
  Zap, 
  ShieldCheck, 
  Database, 
  Smartphone, 
  Cpu, 
  Check, 
  ChevronDown, 
  ChevronRight, 
  ArrowRight, 
  Sparkles, 
  FileText, 
  Laptop, 
  Layers, 
  Sliders,
  DollarSign,
  QrCode,
  HardDrive,
  RefreshCw,
  Clock
} from 'lucide-react';
import { DOWNLOAD_CONFIG, triggerInstallerDownload } from '../config/download';
import { InteractiveWorkstationDemo } from '../components/InteractiveWorkstationDemo';

interface HomePageProps {
  navigate: (path: string) => void;
  onOpenDownloadModal: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate, onOpenDownloadModal }) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const primaryArtifact = DOWNLOAD_CONFIG.artifacts.find((a) => a.recommended) || DOWNLOAD_CONFIG.artifacts[0];

  const handleDownload = () => {
    onOpenDownloadModal();
  };

  const faqs = [
    {
      question: 'Do customers need to install an app to print at the counter?',
      answer: 'No. Customers simply scan the shop QR code using their standard smartphone camera. The Print Bot customer upload interface runs instantly in any mobile browser (iOS Safari, Android Chrome). No downloads, no account registrations, and no Bluetooth pairing required.',
    },
    {
      question: 'How does Print Bot interface with physical printers on Windows?',
      answer: 'Print Bot utilizes a native Rust driver boundary built with Tauri 2 that communicates directly with the Windows Print Spooler (Winspool.drv API). It discovers all local USB, Ethernet, Wi-Fi, and virtual printers automatically, validating spool paths and paper sizes without relying on slow cloud connectors.',
    },
    {
      question: 'How does the SQLite Journal prevent accidental double-printing?',
      answer: 'Before any document job is handed to the Windows spooler, Print Bot records the print intent and document checksum in a local write-ahead SQLite journal. If the printer jams, runs out of paper, or the counter PC loses power, Print Bot isolates the job state as COMPLETION_UNKNOWN and suppresses duplicate re-spooling.',
    },
    {
      question: 'Can I connect multiple printers with different paper types and rates?',
      answer: 'Yes. Print Bot supports unlimited printers per shop. You can configure high-speed B&W laser printers for bulk jobs, color inkjet printers for presentations, and thermal receipt printers for tokens, each with custom pricing rules and duplex discounts.',
    },
    {
      question: 'What are the system requirements for the Windows desktop workstation?',
      answer: 'Print Bot runs on Windows 10 (Build 1809 or higher) and Windows 11 (64-bit). It requires just 2 GB RAM and 100 MB disk space. The native Rust executable has a minimal memory footprint (~38 MB RAM idle), keeping counter PCs fast and responsive.',
    },
    {
      question: 'How are documents and customer privacy handled?',
      answer: 'Privacy is paramount. Uploaded documents are processed in memory and transient local storage. Once physical printing completes or the counter session ends, documents are automatically purged. Documents are strictly bound to validated shop guest sessions.',
    },
  ];

  return (
    <div className="relative pt-24 pb-20 overflow-hidden">
      
      {/* Ambient background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[550px] bg-radial-hero pointer-events-none -z-10" />

      {/* ---------------- 1. HERO SECTION ---------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 lg:pt-16 lg:pb-24 text-center">
        
        {/* Release Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] text-xs font-medium text-slate-300 mb-8 backdrop-blur-md shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Print Bot v{DOWNLOAD_CONFIG.currentVersion} for Windows is Live</span>
          <span className="text-slate-500">•</span>
          <button
            onClick={() => navigate('/download')}
            className="text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Release Notes</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.12]">
          The Operating System for Modern Print Shops
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
          Connect walk-in customers directly to your physical Windows print spooler.
          Zero customer app downloads, instant live quotes, and tamper-proof SQLite queue reliability.
        </p>

        {/* Primary & Secondary CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          {/* Download for Windows */}
          <button
            onClick={handleDownload}
            className="w-full sm:w-auto px-7 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-brand-blue to-brand-600 hover:from-blue-600 hover:to-brand-700 rounded-xl shadow-xl shadow-brand-blue/25 hover:shadow-brand-blue/40 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer group"
          >
            <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
            <div className="text-left">
              <span className="block leading-none">Download for Windows</span>
              <span className="block text-[11px] opacity-75 font-normal mt-0.5">
                v{DOWNLOAD_CONFIG.currentVersion} • x64 ({primaryArtifact.filesize})
              </span>
            </div>
          </button>

          {/* Secondary CTA: Explore Features */}
          <button
            onClick={() => navigate('/features')}
            className="w-full sm:w-auto px-6 py-3.5 text-base font-semibold text-slate-200 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Explore Architecture</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Windows 10 / 11 Native</span>
          </div>
          <span className="hidden sm:inline text-slate-700">•</span>
          <div className="flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-brand-400" />
            <span>Rust & Tauri 2 Engine</span>
          </div>
          <span className="hidden sm:inline text-slate-700">•</span>
          <div className="flex items-center gap-1.5">
            <Database className="w-4 h-4 text-amber-400" />
            <span>Write-Ahead SQLite Journal</span>
          </div>
        </div>

        {/* ---------------- 2. INTERACTIVE PRODUCT WORKSTATION PREVIEW ---------------- */}
        <div className="mt-14 lg:mt-20 max-w-6xl mx-auto">
          <div className="relative">
            {/* Glow under preview */}
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue/30 via-brand-500/20 to-purple-600/30 rounded-3xl blur-2xl opacity-60 pointer-events-none" />
            <InteractiveWorkstationDemo />
          </div>
          <p className="mt-3 text-xs text-slate-500 font-mono">
            * Interactive simulation of the live Print Bot Windows Workstation and Winspool driver boundary.
          </p>
        </div>

      </section>

      {/* ---------------- 3. METRICS / PROOF BANNER ---------------- */}
      <section className="border-y border-white/[0.08] bg-[#0A0D15] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                0
              </div>
              <div className="text-xs sm:text-sm text-slate-400 font-medium">
                Customer Apps Needed
              </div>
              <div className="text-[11px] text-slate-500">
                Instant QR mobile upload
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-brand-400 font-mono tracking-tight">
                &lt; 200ms
              </div>
              <div className="text-xs sm:text-sm text-slate-400 font-medium">
                Spooler Dispatch Latency
              </div>
              <div className="text-[11px] text-slate-500">
                Direct Win32 API execution
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono tracking-tight">
                100%
              </div>
              <div className="text-xs sm:text-sm text-slate-400 font-medium">
                Duplicate Job Protection
              </div>
              <div className="text-[11px] text-slate-500">
                SQLite write-ahead journal
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                &infin;
              </div>
              <div className="text-xs sm:text-sm text-slate-400 font-medium">
                Connected Printers
              </div>
              <div className="text-[11px] text-slate-500">
                Laser, thermal, inkjet & copiers
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ---------------- 4. CORE FEATURES & CAPABILITIES ---------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 text-xs font-semibold uppercase tracking-wider mb-3">
            Core Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Built for Counter Speed, Spooler Stability & Zero Revenue Leakage
          </h2>
          <p className="mt-4 text-base text-slate-400 leading-relaxed">
            Every layer of Print Bot is designed around the real-world chaos of walk-in copy centers: long queues, fragile Wi-Fi, paper jams, and multiple physical printers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Native Windows Spooler */}
          <div className="p-7 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-brand-500/40 transition-all duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center text-brand-400 group-hover:scale-105 transition-transform">
              <Printer className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Native Windows Spooler Engine
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Direct Winspool.drv API integration bypassing fragile third-party cloud print drivers. Discovers local USB, thermal, Ethernet, and multi-tray office copiers automatically.
            </p>
            <ul className="text-xs text-slate-400 space-y-2 pt-2 border-t border-white/[0.04]">
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Auto-detects paper trays & duplex units</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Zero cloud print lag or external dependencies</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Touchless QR Upload */}
          <div className="p-7 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-brand-500/40 transition-all duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Touchless QR Customer Upload
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Customers scan a counter QR code with their mobile phone. They upload PDFs, images, or documents, choose page ranges, color mode, and collect their prints in seconds.
            </p>
            <ul className="text-xs text-slate-400 space-y-2 pt-2 border-t border-white/[0.04]">
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>No WhatsApp, email or flash drive sharing</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Works on iOS, Android, and tablets</span>
              </li>
            </ul>
          </div>

          {/* Card 3: Cryptographic SQLite Journal */}
          <div className="p-7 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-brand-500/40 transition-all duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Cryptographic SQLite Journal
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every job intent is stored in a local SQLite write-ahead journal before spooling. Prevents duplicate charges, tracks hardware status, and records an unalterable counter audit log.
            </p>
            <ul className="text-xs text-slate-400 space-y-2 pt-2 border-t border-white/[0.04]">
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Guaranteed zero automatic double-prints</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Auditable accounting & shift reconciliation</span>
              </li>
            </ul>
          </div>

          {/* Card 4: Live Price Calculator */}
          <div className="p-7 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-brand-500/40 transition-all duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Real-time Transparent Pricing
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Customers see an exact rupee quote before submitting. Configurable per-side rates for B&W, color, duplex discounts, and custom service fees like spiral binding or lamination.
            </p>
            <ul className="text-xs text-slate-400 space-y-2 pt-2 border-t border-white/[0.04]">
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Zero counter payment disputes</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Supports UPI QR payments & Cash-at-Counter</span>
              </li>
            </ul>
          </div>

          {/* Card 5: Fleet & Hardware Discovery */}
          <div className="p-7 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-brand-500/40 transition-all duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Intelligent Multi-Printer Routing
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Route heavy monochrome document batches to laser workhorses, photo prints to high-resolution inkjets, and print order slips on 80mm thermal receipt machines simultaneously.
            </p>
            <ul className="text-xs text-slate-400 space-y-2 pt-2 border-t border-white/[0.04]">
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Unlimited physical printers per counter</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Thermal token printing for busy queues</span>
              </li>
            </ul>
          </div>

          {/* Card 6: Multi-Tenant Cloud Architecture */}
          <div className="p-7 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-brand-500/40 transition-all duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Strict Tenant Isolation & Security
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Built on PostgreSQL Row-Level Security (RLS) and cryptographically signed shop tokens. No cross-shop contamination, no unauthenticated uploads, and transient document storage.
            </p>
            <ul className="text-xs text-slate-400 space-y-2 pt-2 border-t border-white/[0.04]">
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Automatic document destruction post-spool</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>No permanent customer data harvesting</span>
              </li>
            </ul>
          </div>

        </div>

      </section>

      {/* ---------------- 5. PRODUCT WORKFLOW (HOW IT WORKS) ---------------- */}
      <section className="border-t border-white/[0.08] bg-[#070A10] py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 text-xs font-semibold uppercase tracking-wider mb-3">
              Frictionless Workflow
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              How Print Bot Replaces Counter Chaos
            </h2>
            <p className="mt-4 text-base text-slate-400">
              From walk-in customer smartphone to warm paper in the collection tray in 4 streamlined steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] relative space-y-3">
              <div className="w-8 h-8 rounded-full bg-brand-blue/20 text-brand-400 border border-brand-blue/30 flex items-center justify-center font-mono font-bold text-sm">
                01
              </div>
              <h4 className="text-lg font-bold text-white">
                Customer Scans QR
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                The walk-in customer points their camera at your counter QR stand. The mobile web application opens instantly without app installation.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] relative space-y-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-mono font-bold text-sm">
                02
              </div>
              <h4 className="text-lg font-bold text-white">
                Upload & Configure
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                The customer picks files, selects page ranges, picks Color or B&W, and toggles Duplex. They see an instant page count and price quote.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] relative space-y-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-mono font-bold text-sm">
                03
              </div>
              <h4 className="text-lg font-bold text-white">
                Operator Approval
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                The job appears on the counter Windows Workstation with an audio chime. The operator inspects page counts and accepts payment.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] relative space-y-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-sm">
                04
              </div>
              <h4 className="text-lg font-bold text-white">
                Native Spool & Collect
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                One click sends the verified PDF directly to the Windows print spooler. The customer receives their order token and collects prints.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ---------------- 6. HARDWARE & FLEET REAL-WORLD SHOWCASE ---------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-semibold uppercase tracking-wider">
              Real-World Hardware Proven
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
              Engineered for Real Print Shop Fleets & Busy Xerox Counters
            </h2>
            <p className="text-base text-slate-400 leading-relaxed">
              Print Bot was not built in a vacuum. It was engineered directly against real multi-brand print fleets: Canon, HP, Epson, Konica Minolta, and Brother machines running through standard Windows Print Spooler drivers.
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    No Special Hardware Dongles Required
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Works with any existing Windows 10/11 desktop PC or counter laptop already hooked to your printers via USB, Wi-Fi or LAN.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    Simultaneous Multi-Operator Workstations
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Run multiple workstations across counter stations. The shared SQLite & cloud state ensures zero duplicate print submissions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Real hardware imagery showcase */}
          <div className="relative rounded-2xl overflow-hidden border border-white/[0.12] shadow-2xl group">
            <img 
              src="/assets/print_shop_counter.jpg" 
              alt="Print Bot running at an active print shop counter" 
              className="w-full h-[400px] object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] via-[#0A0D14]/40 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-black/60 backdrop-blur-md border border-white/[0.1] text-xs">
              <div className="flex items-center justify-between text-white font-semibold">
                <span>Production Counter Deployment</span>
                <span className="text-emerald-400 font-mono text-[11px]">Winspool Active</span>
              </div>
              <p className="text-slate-300 mt-1 text-[11px]">
                High-throughput walk-in document counter with zero app downloads and automated queue review.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ---------------- 7. WHY CHOOSE PRINT BOT (COMPARISON) ---------------- */}
      <section className="border-t border-white/[0.08] bg-[#0A0D15] py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 text-xs font-semibold uppercase tracking-wider mb-3">
              Why Print Bot
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Compare the Counter Experience
            </h2>
            <p className="mt-4 text-base text-slate-400">
              Why forward-thinking print shops are abandoning WhatsApp and pendrives for Print Bot.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/[0.1] text-xs text-slate-400">
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider">Feature / Capability</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-slate-400">Traditional WhatsApp / USB Chaos</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-brand-400 bg-brand-blue/[0.06] rounded-t-xl">Print Bot Workstation OS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-xs sm:text-sm">
                <tr>
                  <td className="py-4 px-6 font-medium text-white">Customer App Requirement</td>
                  <td className="py-4 px-6 text-slate-400">Forced app install or saving counter phone numbers</td>
                  <td className="py-4 px-6 text-emerald-400 font-semibold bg-brand-blue/[0.06]">
                    Zero app installs (Instant mobile QR scan)
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-white">Price Transparency</td>
                  <td className="py-4 px-6 text-slate-400">Operator manually counts pages on screen & argues prices</td>
                  <td className="py-4 px-6 text-emerald-400 font-semibold bg-brand-blue/[0.06]">
                    Instant server-verified quote with duplex discount
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-white">Duplicate Print Prevention</td>
                  <td className="py-4 px-6 text-slate-400">Zero safeguard. Accidental double clicks waste ink & paper</td>
                  <td className="py-4 px-6 text-emerald-400 font-semibold bg-brand-blue/[0.06]">
                    100% protected by write-ahead SQLite journal
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-white">Windows Spooler Latency</td>
                  <td className="py-4 px-6 text-slate-400">Manual download &gt; Open Acrobat &gt; File &gt; Print</td>
                  <td className="py-4 px-6 text-emerald-400 font-semibold bg-brand-blue/[0.06]">
                    Sub-200ms one-click native spool dispatch
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-white">Customer Document Privacy</td>
                  <td className="py-4 px-6 text-slate-400">Files left in Downloads folder and chat history indefinitely</td>
                  <td className="py-4 px-6 text-emerald-400 font-semibold bg-brand-blue/[0.06]">
                    Automatic file purge immediately post-spool
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-white">Printer Software Fees</td>
                  <td className="py-4 px-6 text-slate-400">Expensive enterprise software with per-seat or per-printer fees</td>
                  <td className="py-4 px-6 text-emerald-400 font-semibold bg-brand-blue/[0.06]">
                    Unlimited printers per shop, zero per-print commissions
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </section>

      {/* ---------------- 8. FAQ SECTION ---------------- */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 text-xs font-semibold uppercase tracking-wider mb-3">
            Got Questions?
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-base text-slate-400">
            Everything you need to know about setting up Print Bot on your counter PC.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 text-white font-semibold text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                      isOpen ? 'rotate-180 text-brand-400' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed border-t border-white/[0.04] pt-4 animate-in fade-in duration-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </section>

      {/* ---------------- 9. BOTTOM CONVERSION CTA ---------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="relative rounded-3xl bg-gradient-to-br from-brand-blue/20 via-[#0E1424] to-[#0A0D15] border border-brand-blue/30 p-8 sm:p-14 text-center overflow-hidden shadow-2xl">
          
          {/* Ambient lighting */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Ready to Upgrade Your Print Shop?
            </h2>
            <p className="text-base text-slate-300 leading-relaxed">
              Download the official Print Bot Windows Workstation setup. It installs in less than 30 seconds and connects immediately to your existing printers.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleDownload}
                className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-brand-blue to-brand-600 hover:from-blue-600 hover:to-brand-700 rounded-xl shadow-xl shadow-brand-blue/30 hover:shadow-brand-blue/45 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer"
              >
                <Download className="w-5 h-5" />
                <span>Download for Windows (2.81 MB)</span>
              </button>

              <button
                onClick={() => navigate('/download')}
                className="w-full sm:w-auto px-6 py-4 text-sm font-semibold text-slate-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] rounded-xl transition-all cursor-pointer"
              >
                View System Specs & MSI
              </button>
            </div>

            <div className="text-xs text-slate-400 font-mono pt-2">
              Print-Bot-1.0.0-x64-Setup.exe • Windows 10 & 11 (64-bit) • SHA-256 Verified
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};

