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
  HardDrive, 
  Zap, 
  Lock,
  ArrowRight
} from 'lucide-react';
import { DOWNLOAD_CONFIG } from '../config/download';

interface FeaturesPageProps {
  navigate: (path: string) => void;
  onOpenDownloadModal: () => void;
}

export const FeaturesPage: React.FC<FeaturesPageProps> = ({ navigate, onOpenDownloadModal }) => {
  return (
    <div className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 text-xs font-semibold uppercase tracking-wider">
          Deep Dive Architecture
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Engineering the Autonomous Print Shop
        </h1>
        <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
          Explore how Print Bot combines low-level Windows APIs, local SQLite journaling, and frictionless mobile web architecture.
        </p>
      </div>

      {/* Feature Section 1: The Native Workstation Engine */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="w-12 h-12 rounded-xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center text-brand-400">
            <Cpu className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            1. Tauri 2 + Rust Workstation Architecture
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Unlike legacy electron-based software that consumes gigabytes of memory, the Print Bot workstation is built with <strong>Tauri 2 and native Rust</strong>. It maintains an idle memory footprint under 40 MB, ensuring counter PCs with modest hardware run smoothly without freezing or slowing down other applications.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
              <div className="text-xs font-semibold text-white">Under 40 MB RAM</div>
              <div className="text-xs text-slate-400 mt-1">
                Runs effortlessly on budget counter PCs, Intel Celerons, and refurbished laptops.
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
              <div className="text-xs font-semibold text-white">Zero Cloud Reliance</div>
              <div className="text-xs text-slate-400 mt-1">
                Local printer discovery and queue display operate even during internet blips.
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0C101A] border border-white/[0.1] font-mono text-xs text-slate-300 space-y-3 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] text-slate-400">
            <span>Tauri 2 Rust IPC Interface</span>
            <span className="text-emerald-400">Memory: 38.4 MB</span>
          </div>
          <div className="space-y-1 text-slate-400">
            <div className="text-brand-300 font-semibold">// Native typed command invoking Windows Winspool API</div>
            <div>#[tauri::command]</div>
            <div>pub fn discover_printers() -&gt; Result&lt;Vec&lt;NativePrinterInfo&gt;, String&gt; &#123;</div>
            <div className="pl-4 text-slate-300">let spooler = WinSpoolerContext::new()?;</div>
            <div className="pl-4 text-slate-300">let printers = spooler.enum_printers(PRINTER_ENUM_LOCAL | PRINTER_ENUM_CONNECTIONS)?;</div>
            <div className="pl-4 text-emerald-400">Ok(printers.into_iter().map(NativePrinterInfo::from).collect())</div>
            <div>&#125;</div>
          </div>
          <div className="pt-2 border-t border-white/[0.06] text-[11px] text-slate-500">
            Direct binary compilation without Node.js runtime overhead.
          </div>
        </div>
      </section>

      {/* Feature Section 2: Windows Print Spooler Integration */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="order-2 lg:order-1 p-6 rounded-2xl bg-[#0C101A] border border-white/[0.1] space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] text-xs font-mono text-slate-400">
            <span>Winspool.drv Hardware Capabilities</span>
            <span className="text-brand-400">Win32 Level</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <span className="text-slate-500 block text-[10px]">Paper Sizes:</span>
              <span className="text-white font-semibold">A4, A3, Legal, Letter, Envelope</span>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <span className="text-slate-500 block text-[10px]">Duplex Modes:</span>
              <span className="text-white font-semibold">Simplex, Long-Edge, Short-Edge</span>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <span className="text-slate-500 block text-[10px]">Color Formats:</span>
              <span className="text-white font-semibold">Monochrome 1-Bit, CMYK, RGB 24-Bit</span>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <span className="text-slate-500 block text-[10px]">Driver Protocol:</span>
              <span className="text-white font-semibold">PCL5, PCL6, PostScript, ESC/P</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>Automatic discovery of USB, LAN, Wi-Fi, and Virtual Spoolers</span>
          </div>
        </div>

        <div className="order-1 lg:order-2 space-y-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Printer className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            2. Direct Windows Print Spooler Integration
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Print Bot interfaces directly with the native <strong>Windows Print Spooler (`Winspool.drv`)</strong> API. It queries physical device DEVMODE structures to read tray capacities, toner levels, duplex unit status, and page resolution without needing third-party drivers or proprietary printer manufacturer software.
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Full support for multi-tray office copiers and thermal receipt printers</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Rejects corrupted or un-spoolable print jobs before hardware locks up</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Zero phantom print jobs or stalled spooler queues</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Feature Section 3: SQLite Journal & Idempotency */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Database className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            3. Cryptographic SQLite Spool Journal
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            In busy copy shops, accidental double-clicks or browser refreshes can cause identical files to be printed multiple times, wasting paper and causing counter friction. Print Bot utilizes a <strong>local write-ahead SQLite journal</strong> with SHA-256 document fingerprinting.
          </p>
          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Atomic State Transition Guarantee
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Jobs transition cleanly: PENDING &gt; COMMITTED_TO_JOURNAL &gt; DISPATCHED &gt; COMPLETED. If an operator reboots the counter PC, duplicate submissions are immediately detected and rejected.
                </p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Audit Reconciliation
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Print volumes, paper counts, and rupee revenues are recorded with exact timestamps for daily closing reconciliation.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0C101A] border border-white/[0.1] font-mono text-xs text-slate-300 space-y-3 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] text-slate-400">
            <span>SQLite Journal Schema (JournalRules.rs)</span>
            <span className="text-amber-400">WAL Mode</span>
          </div>
          <div className="space-y-1 text-slate-400">
            <div>CREATE TABLE print_journal (</div>
            <div className="pl-4 text-slate-300">sequence_id INTEGER PRIMARY KEY AUTOINCREMENT,</div>
            <div className="pl-4 text-slate-300">job_id TEXT NOT NULL UNIQUE,</div>
            <div className="pl-4 text-slate-300">document_sha256 TEXT NOT NULL,</div>
            <div className="pl-4 text-slate-300">page_count INTEGER NOT NULL,</div>
            <div className="pl-4 text-slate-300">spool_status TEXT CHECK(spool_status IN (</div>
            <div className="pl-8 text-amber-300">'PENDING', 'COMMITTED', 'COMPLETED', 'UNKNOWN'</div>
            <div className="pl-4 text-slate-300">)),</div>
            <div className="pl-4 text-slate-300">created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP</div>
            <div>);</div>
          </div>
          <div className="pt-2 border-t border-white/[0.06] text-[11px] text-slate-500">
            Transactions committed with synchronous = NORMAL for maximum durability.
          </div>
        </div>
      </section>

      {/* Feature Section 4: Mobile QR Upload Experience */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="order-2 lg:order-1 p-6 rounded-2xl bg-[#0C101A] border border-white/[0.1] space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] text-xs font-mono text-slate-400">
            <span>Customer Mobile Web Flow</span>
            <span className="text-purple-400">Zero App</span>
          </div>
          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
              <span>Client-side PDF page counting:</span>
              <span className="font-semibold text-emerald-400">Instant (pdf-lib)</span>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
              <span>Supported formats:</span>
              <span className="font-semibold text-white">PDF, JPG, PNG, DOCX, TXT</span>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
              <span>Payment Options:</span>
              <span className="font-semibold text-brand-300">Dynamic UPI QR / Cash at Counter</span>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
              <span>Multilingual Support:</span>
              <span className="font-semibold text-white">English, Hindi (हिंदी), Tamil (தமிழ்)</span>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2 space-y-6">
          <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <QrCode className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            4. Touchless Mobile Phone-to-Counter QR
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Eliminate the frustrating ritual of customers saving your personal WhatsApp number, sending files to your personal email, or passing USB drives loaded with malware.
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Customers scan your shop counter QR code with standard camera app</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Interactive visual page range picker (e.g. print pages 1-5, 8, 12-20)</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Real-time price recalculation with automatic duplex discounting</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Call to action banner */}
      <div className="p-10 rounded-3xl bg-gradient-to-r from-brand-blue/20 via-[#0E1424] to-brand-500/20 border border-brand-blue/30 text-center space-y-4">
        <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Experience the Future of Walk-In Document Printing
        </h3>
        <p className="text-sm text-slate-300 max-w-xl mx-auto">
          Download the production installer for Windows. No credit card required.
        </p>
        <button
          onClick={onOpenDownloadModal}
          className="px-6 py-3 text-sm font-semibold text-white bg-brand-blue hover:bg-blue-600 rounded-xl transition-all shadow-lg shadow-brand-blue/25 inline-flex items-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download Print Bot for Windows (2.81 MB)</span>
        </button>
      </div>

    </div>
  );
};

