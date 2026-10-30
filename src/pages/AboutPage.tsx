import React from 'react';
import { 
  Printer, 
  Cpu, 
  ShieldCheck, 
  Laptop, 
  HeartHandshake, 
  Target, 
  Layers, 
  Sparkles,
  Terminal,
  Download
} from 'lucide-react';
import { DOWNLOAD_CONFIG } from '../config/download';

interface AboutPageProps {
  navigate: (path: string) => void;
  onOpenDownloadModal: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ navigate, onOpenDownloadModal }) => {
  return (
    <div className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 text-xs font-semibold uppercase tracking-wider">
          Our Purpose & Engineering Philosophy
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Modernizing the Everyday Print Shop
        </h1>
        <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
          Behind every bustling university, court, municipal office, and business hub lies a busy print shop. We build the precision software that powers them.
        </p>
      </div>

      {/* Story / Origin */}
      <div className="max-w-4xl mx-auto p-8 sm:p-10 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          The Reality of the Walk-In Xerox Counter
        </h2>
        <div className="space-y-4 text-sm sm:text-base text-slate-300 leading-relaxed">
          <p>
            For millions of people every day, printing an urgent ticket, legal affidavit, college assignment, or government document begins at a neighborhood print counter. Yet for over two decades, the software running behind the counter hasn't changed.
          </p>
          <p>
            Operators are forced to hand out their personal WhatsApp numbers to strangers, manually plug in untrusted USB flash drives crawling with viruses, or manually count pages on Adobe Acrobat while frustrated customers crowd the glass counter.
          </p>
          <p>
            We founded <strong>Print Bot</strong> with a singular engineering mission: build an autonomous, touchless, high-reliability software stack that treats the print counter as a critical piece of urban infrastructure.
          </p>
        </div>
      </div>

      {/* Engineering Principles */}
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white tracking-tight">
            Our Core Principles
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            How we make architectural decisions across our desktop and web products.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center text-brand-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">
              Local-First Performance
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              We compile directly to native Rust and Win32. No bloated Electron runtimes, no cloud delays. If the shop loses internet connectivity, the local queue, spooler, and thermal printers never skip a beat.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">
              Zero Customer Friction
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Never ask a customer in a rush to download an app from an app store, verify an OTP, or give away personal data. A smartphone camera scan of the counter QR code is all it takes.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">
              Fair & Transparent Economics
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              We never take a percentage of shop print revenue or charge per connected printer. One flat, all-inclusive software license with unlimited connected machines and zero surprise fees.
            </p>
          </div>

        </div>
      </div>

      {/* Technology Stack Grid */}
      <div className="max-w-4xl mx-auto p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-6">
        <h3 className="text-xl font-bold text-white tracking-tight">
          Built With Modern, High-Precision Technologies
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-slate-500 block text-[10px]">Desktop Core:</span>
            <span className="text-white font-semibold">Tauri 2 + Rust</span>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-slate-500 block text-[10px]">Spool Engine:</span>
            <span className="text-white font-semibold">Win32 Winspool.drv</span>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-slate-500 block text-[10px]">Audit Storage:</span>
            <span className="text-white font-semibold">SQLite WAL Journal</span>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-slate-500 block text-[10px]">API Architecture:</span>
            <span className="text-white font-semibold">FastAPI + Async Worker</span>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center space-y-4">
        <h3 className="text-2xl font-bold text-white">
          Join the Print Bot Commercial Pilot
        </h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Equip your shop counter with the official Windows Workstation and give your customers a modern experience.
        </p>
        <div className="pt-2 flex items-center justify-center gap-4">
          <button
            onClick={onOpenDownloadModal}
            className="px-6 py-3 text-sm font-semibold text-white bg-brand-blue hover:bg-blue-600 rounded-xl transition-all shadow-lg shadow-brand-blue/20 cursor-pointer"
          >
            Download v{DOWNLOAD_CONFIG.currentVersion} for Windows
          </button>
          <button
            onClick={() => navigate('/contact')}
            className="px-6 py-3 text-sm font-semibold text-slate-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.1] rounded-xl transition-all cursor-pointer"
          >
            Contact the Team
          </button>
        </div>
      </div>

    </div>
  );
};

