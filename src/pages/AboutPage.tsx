import React from 'react';
import { 
  Cpu, 
  ShieldCheck, 
  HeartHandshake, 
  Printer,
  Zap,
  Lock,
  HardDrive,
  Users
} from 'lucide-react';
import { DOWNLOAD_CONFIG } from '../config/download';

interface AboutPageProps {
  navigate: (path: string) => void;
  onOpenDownloadModal: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ navigate, onOpenDownloadModal }) => {
  return (
    <div className="w-full bg-slate-50 pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 text-slate-900">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold uppercase tracking-wider">
            Our Purpose & Mission
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Modernizing the Everyday Print Shop
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Behind every bustling college campus, court, municipal office, and commercial hub lies a busy Xerox counter. We build the precision software that powers them.
          </p>
        </div>

        {/* Story / Origin */}
        <div className="max-w-4xl mx-auto p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            The Reality of the Walk-In Xerox Counter
          </h2>
          <div className="space-y-4 text-sm sm:text-base text-slate-600 leading-relaxed">
            <p>
              For millions of people every day, printing an urgent exam hall ticket, legal affidavit, college thesis, or government form begins at a neighborhood print counter. Yet for over two decades, the counter workflow hasn't changed.
            </p>
            <p>
              Shop operators are forced to share their personal WhatsApp numbers with strangers, plug in untrusted USB flash drives that spread computer viruses, or manually count pages while crowds wait impatiently.
            </p>
            <p>
              We founded <strong>Print Bot</strong> with a clear mission: build an autonomous, touchless, high-reliability software stack that transforms the print counter into an efficient, professional service hub.
            </p>
          </div>
        </div>

        {/* Engineering Principles */}
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              Our Core Principles
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              How we design every aspect of our desktop and mobile web experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Cpu className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                Local-First Speed
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                We compile natively for Windows. No slow cloud print delays. If your internet connection flickers, your local printers, queues, and order approvals continue without interruption.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                Zero Customer Friction
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Never ask a customer in a rush to download an app from an app store, register an account, or enter an OTP. A quick smartphone camera scan of your counter QR code is all it takes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                Fair & Transparent Pricing
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                We never take a percentage cut of your shop's printing revenue or charge per printed page. One straightforward flat software plan with unlimited printers and zero hidden fees.
              </p>
            </div>

          </div>
        </div>

        {/* Why Print Shops Choose Print Bot */}
        <div className="max-w-4xl mx-auto p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            Engineered for Continuous Daily Operations
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Zap className="w-4 h-4 text-blue-600" />
                <span>Direct Spooler Performance</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Communicates straight with the Windows print spooler with sub-200ms dispatch latency.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Strict Customer Privacy</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                All uploaded files are transiently spooled and auto-purged from temporary caches.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <HardDrive className="w-4 h-4 text-indigo-600" />
                <span>Guaranteed Duplicate Protection</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Local checksum journal protects your expensive paper and toner from accidental double-prints.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Printer className="w-4 h-4 text-purple-600" />
                <span>All Major Printer Brands</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Works effortlessly with HP, Canon, Epson, Brother, Konica Minolta, and thermal POS printers.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold text-slate-900">
            Get Started with Print Bot Today
          </h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Equip your counter PC with the official workstation app and delight your customers with touchless printing.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onOpenDownloadModal}
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer active:scale-95"
            >
              Download v{DOWNLOAD_CONFIG.currentVersion} for Windows
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
            >
              Contact the Team
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
