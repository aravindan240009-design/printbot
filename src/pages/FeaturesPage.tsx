import React from 'react';
import { 
  Printer, 
  Cpu, 
  Database, 
  QrCode, 
  ShieldCheck, 
  Layers, 
  Download, 
  Check, 
  FileText, 
  Zap, 
  Lock,
} from 'lucide-react';
import { DOWNLOAD_CONFIG } from '../config/download';

interface FeaturesPageProps {
  navigate: (path: string) => void;
  onOpenDownloadModal: () => void;
}

export const FeaturesPage: React.FC<FeaturesPageProps> = ({ navigate, onOpenDownloadModal }) => {
  return (
    <div className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24 bg-slate-50 text-slate-900">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold uppercase tracking-wider">
          Architecture & Capabilities
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Engineered for Modern Print Shops
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          Explore how Print Bot combines low-level Windows spooler APIs, local audit protection, and frictionless mobile browser uploads.
        </p>
      </div>

      {/* Feature Section 1: Native Workstation Architecture */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Cpu className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            1. Native High-Speed Workstation Engine
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Unlike legacy software that consumes gigabytes of memory and lags, Print Bot is compiled natively with an idle memory footprint under <strong>40 MB</strong>. It ensures budget counter PCs with modest hardware run smoothly without freezing.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-900">Under 40 MB RAM</div>
              <div className="text-xs text-slate-600 mt-1">
                Runs effortlessly on budget counter PCs, Intel Celerons, and refurbished laptops.
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-900">Offline Resilience</div>
              <div className="text-xs text-slate-600 mt-1">
                Local printer discovery and queue display operate smoothly even during network blips.
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 space-y-3 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400">
            <span>Windows Spooler Native Interface</span>
            <span className="text-emerald-400 font-semibold">Memory: 38.4 MB</span>
          </div>
          <div className="space-y-1 text-slate-400">
            <div className="text-blue-400 font-semibold">// Direct Windows Winspool API communication</div>
            <div>pub fn discover_printers() -&gt; Result&lt;Vec&lt;NativePrinterInfo&gt;, String&gt; &#123;</div>
            <div className="pl-4 text-slate-300">let spooler = WinSpoolerContext::new()?;</div>
            <div className="pl-4 text-slate-300">let printers = spooler.enum_printers(PRINTER_ENUM_LOCAL | PRINTER_ENUM_CONNECTIONS)?;</div>
            <div className="pl-4 text-emerald-400">Ok(printers.into_iter().map(NativePrinterInfo::from).collect())</div>
            <div>&#125;</div>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500">
            Direct binary compilation without Node.js runtime overhead.
          </div>
        </div>
      </section>

      {/* Feature Section 2: Windows Print Spooler Integration */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="order-2 lg:order-1 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs font-mono text-slate-500">
            <span>Hardware Capability Detection</span>
            <span className="text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Win32 Level</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-slate-500 block text-[10px] font-medium">Paper Sizes:</span>
              <span className="text-slate-900 font-bold">A4, A3, Legal, Letter, Envelope</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-slate-500 block text-[10px] font-medium">Duplex Modes:</span>
              <span className="text-slate-900 font-bold">Simplex, Long-Edge, Short-Edge</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-slate-500 block text-[10px] font-medium">Color Formats:</span>
              <span className="text-slate-900 font-bold">Monochrome 1-Bit, CMYK, RGB 24-Bit</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-slate-500 block text-[10px] font-medium">Driver Protocols:</span>
              <span className="text-slate-900 font-bold">PCL5, PCL6, PostScript, ESC/P</span>
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
            2. Universal Windows Spooler Engine
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Print Bot sits directly atop the standard Windows Print Spooler. It talks to all your physical printers—high-speed monochrome lasers, color photo inkjets, large-format plotters, and thermal receipt machines—without proprietary software.
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Auto-detects paper trays, duplexers, and online status</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Sub-200ms spool execution with zero cloud delays</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Full support for USB, LAN, and Wi-Fi printer connections</span>
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
            3. Guaranteed Duplicate-Print Protection
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            In busy copy shops, accidental double-clicks or browser refreshes waste costly toner and paper. Print Bot logs every job checksum locally before printing, rejecting identical submissions and keeping your counts accurate.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-900">Zero Paper Waste</div>
              <div className="text-xs text-slate-600 mt-1">
                Eliminates accidental double-spooling of large document sets.
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-900">Shift Reconciliation</div>
              <div className="text-xs text-slate-600 mt-1">
                Exact sheet counts and revenue totals at the end of every work shift.
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 space-y-3 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400">
            <span>Audit Journal Schema</span>
            <span className="text-amber-400 font-semibold">Atomic Guard</span>
          </div>
          <div className="space-y-1 text-slate-400">
            <div>CREATE TABLE print_jobs (</div>
            <div className="pl-4 text-slate-300">id TEXT PRIMARY KEY,</div>
            <div className="pl-4 text-slate-300">document_hash TEXT NOT NULL,</div>
            <div className="pl-4 text-slate-300">page_count INTEGER NOT NULL,</div>
            <div className="pl-4 text-slate-300">spool_status TEXT CHECK(spool_status IN (</div>
            <div className="pl-8 text-amber-400">'PENDING', 'COMMITTED', 'COMPLETED', 'UNKNOWN'</div>
            <div className="pl-4 text-slate-300">)),</div>
            <div className="pl-4 text-slate-300">created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP</div>
            <div>);</div>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500">
            Reliable local storage ensures zero duplicate sheet waste.
          </div>
        </div>
      </section>

      {/* Feature Section 4: Mobile QR Upload Experience */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="order-2 lg:order-1 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs font-mono text-slate-500">
            <span>Customer Mobile Web Flow</span>
            <span className="text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">Zero App</span>
          </div>
          <div className="space-y-3 text-xs text-slate-700">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <span>Client-side PDF page counting:</span>
              <span className="font-bold text-emerald-700">Instant</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <span>Supported formats:</span>
              <span className="font-bold text-slate-900">PDF, JPG, PNG, DOCX, TXT</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <span>Payment Options:</span>
              <span className="font-bold text-blue-700">Dynamic UPI QR / Cash at Counter</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <span>Multilingual Support:</span>
              <span className="font-bold text-slate-900">English, Hindi (हिंदी), Tamil (தமிழ்)</span>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2 space-y-6">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <QrCode className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            4. Touchless Mobile Phone-to-Counter QR
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Eliminate the frustrating ritual of customers saving your personal WhatsApp number, sending files to your personal email, or passing malware-infected USB flash drives.
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
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
          className="px-6 py-3 text-sm font-bold text-blue-700 bg-white hover:bg-blue-50 rounded-xl transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4 text-blue-600" />
          <span>Download Print Bot for Windows (2.83 MB)</span>
        </button>
      </div>

    </div>
  );
};
