import React from 'react';
import { 
  Printer, 
  Cpu, 
  Database, 
  QrCode, 
  Download, 
  Check, 
  ShieldCheck,
  Zap,
  HardDrive,
  Activity,
  Layers,
  FileCheck
} from 'lucide-react';
import { DOWNLOAD_CONFIG } from '../config/download';

interface FeaturesPageProps {
  navigate: (path: string) => void;
  onOpenDownloadModal: () => void;
}

export const FeaturesPage: React.FC<FeaturesPageProps> = ({ navigate, onOpenDownloadModal }) => {
  return (
    <div className="w-full bg-slate-50 pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24 text-slate-900">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold uppercase tracking-wider">
            Architecture & Capabilities
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Engineered for Modern Print Shops
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Discover how Print Bot combines native Windows spooler performance, local audit protection, and effortless smartphone customer uploads.
          </p>
        </div>

        {/* Feature Section 1: Native Workstation Architecture */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Cpu className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Native High-Speed Workstation Engine
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Unlike legacy software that consumes gigabytes of memory and causes workstation lag, Print Bot is compiled natively with an idle memory footprint under <strong>40 MB</strong>. Even budget counter PCs and older laptops run smoothly without freezing.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>Sub-40 MB RAM Footprint</span>
                </div>
                <div className="text-xs text-slate-600 mt-1.5">
                  Runs effortlessly on budget counter PCs, Intel Celerons, and refurbished counter machines.
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span>Instant 0.8s Launch</span>
                </div>
                <div className="text-xs text-slate-600 mt-1.5">
                  Starts immediately with zero heavy browser runtime overhead or slow background dependencies.
                </div>
              </div>
            </div>
          </div>

          {/* Workstation Engine Performance Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="font-bold text-sm text-slate-900">Workstation Engine Performance</span>
              </div>
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Optimized
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px]">Runtime Architecture:</span>
                  <span className="text-slate-900 font-bold">Native Windows Win32 / x64</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200 text-[10px]">
                  Zero Node.js Overhead
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px]">Idle Memory Usage:</span>
                  <span className="text-slate-900 font-bold">38.4 MB (vs. 1.2 GB Legacy Apps)</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 text-[10px]">
                  96% Less RAM
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px]">Spool Dispatch Latency:</span>
                  <span className="text-slate-900 font-bold">Direct Windows Winspool (&lt; 15ms)</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 text-[10px]">
                  Real-time
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px]">Offline Capability:</span>
                  <span className="text-slate-900 font-bold">Full Local Spooling & Queuing</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 text-[10px]">
                  100% Offline
                </span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Built specifically for continuous all-day commercial counter operations.</span>
            </div>
          </div>
        </section>

        {/* Feature Section 2: Windows Print Spooler Integration */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs font-mono text-slate-500">
              <span className="font-sans font-bold text-slate-800 text-sm">Printer Hardware Support</span>
              <span className="text-blue-700 font-semibold bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200 font-sans">
                Universal Win32
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 block text-[10px] font-medium">Supported Paper:</span>
                <span className="text-slate-900 font-bold">A4, A3, Legal, Letter, Photo</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 block text-[10px] font-medium">Duplex Handling:</span>
                <span className="text-slate-900 font-bold">Auto Duplex & Long/Short Edge</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 block text-[10px] font-medium">Color Modes:</span>
                <span className="text-slate-900 font-bold">Monochrome B&W, CMYK, Photo</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 block text-[10px] font-medium">Connection Types:</span>
                <span className="text-slate-900 font-bold">USB, Wi-Fi, Ethernet & Virtual</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Zero vendor driver modifications or registry hacks required.</span>
            </div>
          </div>

          <div className="order-1 lg:order-2 space-y-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Printer className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Universal Windows Spooler Engine
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Print Bot sits directly atop the standard Windows Print Spooler. It talks seamlessly to all your physical printers—high-speed monochrome lasers, color photo inkjets, large-format copiers, and thermal receipt machines—without any proprietary dongles or cloud gateways.
            </p>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Auto-detects paper trays, duplexers, and online printer health</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Sub-200ms spool execution with zero cloud delays</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Full support for HP, Canon, Epson, Brother, and Konica Minolta</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Feature Section 3: Duplicate Print Prevention */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Database className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Guaranteed Duplicate-Print Protection
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              In busy copy shops, accidental double-clicks or customer browser refreshes waste costly toner and paper. Print Bot's local audit journal cryptographically verifies every job before sending to the spooler, automatically rejecting duplicate submissions.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Zero Paper Waste</span>
                </div>
                <div className="text-xs text-slate-600 mt-1.5">
                  Eliminates accidental double-spooling of large document sets and theses.
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-amber-600" />
                  <span>Shift Reconciliation</span>
                </div>
                <div className="text-xs text-slate-600 mt-1.5">
                  Exact sheet counts and revenue totals at the end of every work shift.
                </div>
              </div>
            </div>
          </div>

          {/* Audit Protection Visual Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-sm text-slate-900">Audit Journal & Safeguards</span>
              </div>
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Active Guard
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px]">Checksum Verification:</span>
                  <span className="text-slate-900 font-bold">SHA-256 Per-Job Document Hash</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 text-[10px]">
                  Verified
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-emerald-800 block text-[11px] font-semibold">Accidental Double-Click Protection:</span>
                  <span className="text-emerald-950 font-bold">Replay submissions auto-suppressed</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-white text-emerald-700 font-bold border border-emerald-200 text-[10px]">
                  100% Protected
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px]">Daily Audit Ledger:</span>
                  <span className="text-slate-900 font-bold">Local tamper-proof transaction log</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200 text-[10px]">
                  Zero Cloud Reliance
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px]">Operator Accountability:</span>
                  <span className="text-slate-900 font-bold">Shift-by-shift sheet & cash reconciliation</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-semibold text-[10px]">
                  Balanced Daily
                </span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Protects paper inventory and eliminates cashier discrepancies automatically.</span>
            </div>
          </div>
        </section>

        {/* Feature Section 4: Mobile QR Upload Experience */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs text-slate-500">
              <span className="font-bold text-slate-800 text-sm">Customer Mobile Web Flow</span>
              <span className="text-purple-700 font-semibold bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
                Zero App Downloads
              </span>
            </div>
            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Client-side PDF page counting:</span>
                <span className="font-bold text-emerald-700">Instant</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Supported formats:</span>
                <span className="font-bold text-slate-900">PDF, JPG, PNG, DOCX, TXT</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Payment Options:</span>
                <span className="font-bold text-blue-700">Dynamic UPI QR / Cash at Counter</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Multilingual Support:</span>
                <span className="font-bold text-slate-900">English, Hindi (हिंदी), Tamil (தமிழ்)</span>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 space-y-6">
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <QrCode className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Touchless Mobile Phone-to-Counter QR
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Eliminate the frustrating ritual of customers saving your personal WhatsApp number, sending files to your personal email, or passing malware-infected USB flash drives.
            </p>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Customers scan your shop counter QR code with their default camera app</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Interactive visual page range picker (e.g. print pages 1-5, 8, 12-20)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Real-time price recalculation with automatic duplex discounting</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Call to action banner */}
        <div className="p-10 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-center space-y-4 shadow-xl">
          <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Experience Modern Walk-In Document Printing
          </h3>
          <p className="text-sm text-blue-100 max-w-xl mx-auto">
            Download the production installer for Windows. Sets up in under 30 seconds.
          </p>
          <button
            onClick={onOpenDownloadModal}
            className="px-6 py-3.5 text-sm font-bold text-blue-700 bg-white hover:bg-blue-50 rounded-xl transition-all shadow-md inline-flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Download Print Bot for Windows (2.83 MB)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
