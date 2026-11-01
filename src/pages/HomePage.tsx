import React, { useState } from 'react';
import { 
  Printer, 
  Download, 
  ShieldCheck, 
  Database, 
  Smartphone, 
  Check, 
  ChevronDown, 
  ChevronRight, 
  DollarSign,
  QrCode,
  Layers,
} from 'lucide-react';
import { DOWNLOAD_CONFIG } from '../config/download';
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
      answer: 'No. Customers simply scan your counter QR stand using their standard smartphone camera. The Print Bot customer upload interface opens instantly in any mobile browser (iOS Safari, Android Chrome). No downloads, no account registrations, and no Bluetooth pairing required.',
    },
    {
      question: 'How does Print Bot interface with physical printers on Windows?',
      answer: 'Print Bot utilizes a native Windows driver interface that communicates directly with the Windows Print Spooler. It discovers all local USB, Ethernet, Wi-Fi, and virtual printers automatically, validating spool paths and paper sizes without relying on slow cloud connectors.',
    },
    {
      question: 'How does Print Bot prevent accidental double-printing?',
      answer: 'Before any document job is handed to the Windows spooler, Print Bot records the print intent and document checksum in a local audit journal. If an operator accidentally double-clicks or an order is replayed, duplicate submissions are automatically blocked.',
    },
    {
      question: 'Can I set my own custom rates for B&W, Color, and Binding?',
      answer: 'Yes! You have 100% control over your shop pricing. You can set individual rates for Black & White, Color, Duplex discounts, photo prints, ID card prints, spiral binding, and project binding right from your workstation settings.',
    },
    {
      question: 'Can multiple computers in my shop run Print Bot at the same time?',
      answer: 'Yes. Each workstation can connect to your shop counter profile. Orders are synchronized across stations in real time so your operators can approve and spool from whichever PC is closest to the printer.',
    },
    {
      question: 'What are the system requirements for the Windows PC?',
      answer: 'Print Bot runs smoothly on any desktop or laptop with 64-bit Windows 10 or Windows 11. It uses less than 40 MB of RAM, starts in under a second, and works with all major printer brands including HP, Canon, Epson, Brother, and Konica Minolta.',
    },
  ];

  return (
    <div className="relative overflow-hidden bg-slate-50 text-slate-900 pt-24 pb-16">
      
      {/* Gentle ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-radial-hero pointer-events-none -z-10" />

      {/* ---------------- 1. HERO SECTION ---------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 lg:pt-12 lg:pb-24 text-center">
        
        {/* Release Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-xs font-semibold text-blue-700 mb-8 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          <span>Print Bot v{DOWNLOAD_CONFIG.currentVersion} for Windows is Live</span>
          <span className="text-blue-300">•</span>
          <button
            onClick={() => navigate('/download')}
            className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Release Notes</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.15]">
          The Complete Software Suite for Modern Print Shops
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
          Connect walk-in customers directly to your counter printers.
          Zero customer app downloads, instant live price quotes, and one-click Windows spooler execution.
        </p>

        {/* Primary & Secondary CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          {/* Download for Windows */}
          <button
            onClick={handleDownload}
            className="w-full sm:w-auto px-7 py-3.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer group"
          >
            <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
            <div className="text-left">
              <span className="block leading-none">Download for Windows</span>
              <span className="block text-[11px] opacity-80 font-normal mt-0.5">
                v{DOWNLOAD_CONFIG.currentVersion} • x64 ({primaryArtifact.filesize})
              </span>
            </div>
          </button>

          {/* Secondary CTA: Explore Features */}
          <button
            onClick={() => navigate('/features')}
            className="w-full sm:w-auto px-6 py-3.5 text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Explore Features</span>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Value Highlights */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Windows 10 / 11 Native</span>
          </div>
          <span className="hidden sm:inline text-slate-300">•</span>
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-blue-600" />
            <span>Zero Customer App Installation</span>
          </div>
          <span className="hidden sm:inline text-slate-300">•</span>
          <div className="flex items-center gap-1.5">
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>Works with All Windows Printers</span>
          </div>
        </div>

        {/* ---------------- 2. INTERACTIVE PRODUCT WORKSTATION PREVIEW ---------------- */}
        <div className="mt-12 lg:mt-18 max-w-6xl mx-auto">
          <div className="relative">
            <InteractiveWorkstationDemo />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            * Interactive preview of the live Print Bot Windows Workstation interface.
          </p>
        </div>

      </section>

      {/* ---------------- 3. METRICS / PROOF BANNER ---------------- */}
      <section className="border-y border-slate-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tracking-tight">
                0
              </div>
              <div className="text-xs sm:text-sm text-slate-700 font-semibold">
                Customer Apps Needed
              </div>
              <div className="text-[11px] text-slate-500">
                Instant QR mobile browser upload
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-blue-600 font-mono tracking-tight">
                &lt; 200ms
              </div>
              <div className="text-xs sm:text-sm text-slate-700 font-semibold">
                Spooler Dispatch Latency
              </div>
              <div className="text-[11px] text-slate-500">
                Direct Windows spooler execution
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 font-mono tracking-tight">
                100%
              </div>
              <div className="text-xs sm:text-sm text-slate-700 font-semibold">
                Duplicate Job Protection
              </div>
              <div className="text-[11px] text-slate-500">
                Verified counter audit journal
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-indigo-600 font-mono tracking-tight">
                &infin;
              </div>
              <div className="text-xs sm:text-sm text-slate-700 font-semibold">
                Connected Printers
              </div>
              <div className="text-[11px] text-slate-500">
                Laser, thermal, inkjet & Xerox copiers
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ---------------- 4. CORE FEATURES & CAPABILITIES ---------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold uppercase tracking-wider mb-3">
            Core Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Built for Counter Speed, Printer Stability & Zero Revenue Loss
          </h2>
          <p className="mt-4 text-base text-slate-600 leading-relaxed">
            Engineered specifically for busy walk-in Xerox centers, college printing counters, and high-volume commercial copy shops.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Native Windows Spooler */}
          <div className="p-7 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
              <Printer className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Native Windows Spooler Engine
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Direct Windows Print Spooler integration that works with your existing printer drivers. Auto-detects USB, thermal, Ethernet, and Wi-Fi copiers seamlessly.
            </p>
            <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Auto-detects paper sizes & duplex trays</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>No slow cloud print lag or third-party drivers</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Touchless QR Upload */}
          <div className="p-7 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Touchless QR Customer Upload
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Customers scan your counter QR code from any smartphone. They upload PDFs or photos, select page ranges, choose color or B&W, and collect prints in seconds.
            </p>
            <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>No WhatsApp, email or flash drive sharing</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Runs in mobile browser on iPhone & Android</span>
              </li>
            </ul>
          </div>

          {/* Card 3: Duplicate Print Prevention */}
          <div className="p-7 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Duplicate Print Protection
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every job is cryptographically verified before sending to the printer. Prevents accidental duplicate print jobs, saves expensive toner and paper, and provides an unalterable shift log.
            </p>
            <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Guaranteed zero duplicate paper waste</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Daily shift reconciliation & page counts</span>
              </li>
            </ul>
          </div>

          {/* Card 4: Live Price Calculator */}
          <div className="p-7 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Real-time Transparent Pricing
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Customers see an exact rupee quote before submitting. Customize your own rates for B&W, color, duplex discounts, spiral binding, and project hard bounds.
            </p>
            <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Eliminates counter price arguments</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Supports UPI QR payments & Cash-at-Counter</span>
              </li>
            </ul>
          </div>

          {/* Card 5: Fleet & Hardware Discovery */}
          <div className="p-7 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Multi-Printer Routing
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Route high-volume document batches to heavy laser workhorses, color certificates to photo inkjets, and print order receipts on thermal machines simultaneously.
            </p>
            <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Unlimited physical printers per counter</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Thermal token printing for crowd management</span>
              </li>
            </ul>
          </div>

          {/* Card 6: Privacy & Security */}
          <div className="p-7 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Customer Document Privacy
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Customer files are processed in transient memory and purged immediately after printing. No personal files cluttering your operator desktop or public folders.
            </p>
            <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Automatic file purge post-printing</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Zero customer data harvesting or spam</span>
              </li>
            </ul>
          </div>

        </div>

      </section>

      {/* ---------------- 5. PRODUCT WORKFLOW (HOW IT WORKS) ---------------- */}
      <section className="border-t border-slate-200 bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold uppercase tracking-wider mb-3">
              Frictionless Workflow
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              How Print Bot Replaces Counter Chaos
            </h2>
            <p className="mt-4 text-base text-slate-600">
              From walk-in customer smartphone to warm paper in the collection tray in 4 streamlined steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 relative space-y-3 shadow-xs">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-mono font-bold text-sm shadow-sm">
                01
              </div>
              <h4 className="text-lg font-bold text-slate-900">
                Customer Scans QR
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                The walk-in customer points their camera at your counter QR stand. The mobile upload portal opens instantly in their browser.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 relative space-y-3 shadow-xs">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-mono font-bold text-sm shadow-sm">
                02
              </div>
              <h4 className="text-lg font-bold text-slate-900">
                Upload & Configure
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                The customer picks files, selects page ranges, picks Color or B&W, and toggles Duplex. They see an instant page count and price quote.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 relative space-y-3 shadow-xs">
              <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-mono font-bold text-sm shadow-sm">
                03
              </div>
              <h4 className="text-lg font-bold text-slate-900">
                Operator Approval
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                The job appears on the counter Windows Workstation with a clear chime. The operator inspects page counts and accepts payment.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 relative space-y-3 shadow-xs">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-mono font-bold text-sm shadow-sm">
                04
              </div>
              <h4 className="text-lg font-bold text-slate-900">
                One-Click Spool & Collect
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                One click sends the verified PDF directly to your printer spooler. The customer receives their token and collects printed pages.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ---------------- 6. HARDWARE FLEET SHOWCASE ---------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold uppercase tracking-wider">
              Works with Your Existing Printers
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
              Engineered for Real Print Shop Fleets & Busy Xerox Counters
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Print Bot was built directly for standard print fleets: Canon, HP, Epson, Konica Minolta, and Brother machines running through standard Windows drivers.
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    No Proprietary Hardware Required
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Works on any Windows 10/11 desktop PC or counter laptop already connected to your printers via USB, Wi-Fi or LAN cable.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Simultaneous Multi-Counter Workstations
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Run multiple workstations across your shop counters. Synchronized queue state ensures zero duplicate print orders.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Hardware imagery showcase */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-lg group">
            <img 
              src="/assets/print_shop_counter.jpg" 
              alt="Print Bot running at an active print shop counter" 
              className="w-full h-[400px] object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-md text-xs">
              <div className="flex items-center justify-between text-slate-900 font-bold">
                <span>Production Counter Deployment</span>
                <span className="text-emerald-700 font-mono text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Spooler Active</span>
              </div>
              <p className="text-slate-600 mt-1 text-[11px]">
                High-throughput walk-in document counter with zero app downloads and automated queue review.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ---------------- 7. WHY CHOOSE PRINT BOT (COMPARISON) ---------------- */}
      <section className="border-t border-slate-200 bg-slate-50 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold uppercase tracking-wider mb-3">
              Why Print Bot
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Compare the Counter Experience
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Why forward-thinking print shops are abandoning WhatsApp and pendrives for Print Bot.
            </p>
          </div>

          <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-600 bg-slate-50/80">
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Feature / Capability</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider text-slate-500">Traditional WhatsApp / USB Chaos</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider text-blue-700 bg-blue-50/60">Print Bot Workstation OS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                <tr>
                  <td className="py-4 px-6 font-semibold text-slate-900">Customer App Requirement</td>
                  <td className="py-4 px-6 text-slate-600">Forced app install or saving counter phone numbers</td>
                  <td className="py-4 px-6 text-emerald-700 font-semibold bg-blue-50/30">
                    Zero app installs (Instant mobile QR scan)
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-slate-900">Price Transparency</td>
                  <td className="py-4 px-6 text-slate-600">Operator manually counts pages on screen & argues prices</td>
                  <td className="py-4 px-6 text-emerald-700 font-semibold bg-blue-50/30">
                    Instant automated price quote with duplex discount
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-slate-900">Duplicate Print Prevention</td>
                  <td className="py-4 px-6 text-slate-600">Zero safeguard. Accidental double clicks waste ink & paper</td>
                  <td className="py-4 px-6 text-emerald-700 font-semibold bg-blue-50/30">
                    100% protected by verified local audit journal
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-slate-900">Printing Latency</td>
                  <td className="py-4 px-6 text-slate-600">Manual download &gt; Open Acrobat &gt; File &gt; Print</td>
                  <td className="py-4 px-6 text-emerald-700 font-semibold bg-blue-50/30">
                    One-click direct spool dispatch
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-slate-900">Customer Document Privacy</td>
                  <td className="py-4 px-6 text-slate-600">Files left in Downloads folder and chat history indefinitely</td>
                  <td className="py-4 px-6 text-emerald-700 font-semibold bg-blue-50/30">
                    Automatic file purge immediately post-printing
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-slate-900">Printer Software Fees</td>
                  <td className="py-4 px-6 text-slate-600">Expensive software with per-printer fees & subscriptions</td>
                  <td className="py-4 px-6 text-emerald-700 font-semibold bg-blue-50/30">
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold uppercase tracking-wider mb-3">
            Got Questions?
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-base text-slate-600">
            Everything you need to know about setting up Print Bot on your counter PC.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs transition-all duration-200"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 text-slate-900 font-bold text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-500 transition-transform duration-200 flex-shrink-0 ${
                      isOpen ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4 animate-in fade-in duration-200">
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
        <div className="relative rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 sm:p-14 text-center overflow-hidden shadow-xl text-white">
          
          <div className="relative max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Ready to Upgrade Your Print Shop?
            </h2>
            <p className="text-base text-blue-100 leading-relaxed">
              Download the official Print Bot Windows Workstation setup. It installs in less than 30 seconds and connects immediately to your printers.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleDownload}
                className="w-full sm:w-auto px-8 py-4 text-base font-bold text-blue-700 bg-white hover:bg-blue-50 rounded-xl shadow-lg transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer"
              >
                <Download className="w-5 h-5 text-blue-600" />
                <span>Download for Windows (2.83 MB)</span>
              </button>

              <button
                onClick={() => navigate('/download')}
                className="w-full sm:w-auto px-6 py-4 text-sm font-semibold text-white hover:bg-white/10 border border-white/30 rounded-xl transition-all cursor-pointer"
              >
                View System Specs & MSI
              </button>
            </div>

            <div className="text-xs text-blue-200 font-mono pt-2">
              Print-Bot-1.0.0-x64-Setup.exe • Windows 10 & 11 (64-bit) • Verified
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
