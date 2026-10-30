import React from 'react';
import { 
  Printer, 
  Download, 
  ShieldCheck, 
  ExternalLink, 
  Laptop, 
  FileText, 
  Activity, 
  Sparkles,
  Github
} from 'lucide-react';
import { DOWNLOAD_CONFIG, triggerInstallerDownload } from '../config/download';

interface FooterProps {
  navigate: (path: string) => void;
  onOpenDownloadModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate, onOpenDownloadModal }) => {
  const handleNav = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownload = () => {
    if (onOpenDownloadModal) {
      onOpenDownloadModal();
    } else {
      triggerInstallerDownload();
    }
  };

  return (
    <footer className="border-t border-white/[0.08] bg-[#07090E] text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-16">
          
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <button
              onClick={() => handleNav('/')}
              className="flex items-center gap-3 text-left focus:outline-none group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-blue to-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-blue/20">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white group-hover:text-brand-300 transition-colors">
                  Print Bot
                </span>
                <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.08] text-slate-300 border border-white/[0.08]">
                  v{DOWNLOAD_CONFIG.currentVersion}
                </span>
              </div>
            </button>

            <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
              The high-performance autonomous operating system for modern Xerox and print shops.
              Connecting walk-in customer phones to physical Windows print spoolers with zero app friction.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Windows Spooler Online
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/[0.04] text-slate-300 border border-white/[0.08]">
                <Laptop className="w-3.5 h-3.5 text-brand-400" />
                x86_64 Architecture
              </span>
            </div>
          </div>

          {/* Product links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Product
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => handleNav('/features')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Workstation Architecture
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/features')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Win32 Spooler Engine
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/customer')}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Customer QR Portal</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-brand-500/20 text-brand-300 rounded">Live</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/download')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  System Requirements
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/download')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Release Notes & Changelog
                </button>
              </li>
            </ul>
          </div>

          {/* Technical Resources */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Technology
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-slate-400">Tauri 2 + Rust Core</span>
              </li>
              <li>
                <span className="text-slate-400">SQLite Journal Protocol</span>
              </li>
              <li>
                <span className="text-slate-400">PostgreSQL Tenant Isolation</span>
              </li>
              <li>
                <span className="text-slate-400">FastAPI Async Pipeline</span>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/download')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Verified SHA-256 Hashes
                </button>
              </li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Company & Legal
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => handleNav('/about')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  About Print Bot
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/contact')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Commercial Pilot Program
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/contact')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Technical Support
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/privacy')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/terms')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Terms and Conditions
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Download Highlight Box */}
        <div className="mb-12 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.07] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 flex-shrink-0">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h5 className="text-white font-semibold text-base">
                Ready to automate your print counter?
              </h5>
              <p className="text-xs text-slate-400 mt-0.5">
                Download Print Bot v{DOWNLOAD_CONFIG.currentVersion} for Windows 10 & 11 (2.81 MB setup).
              </p>
            </div>
          </div>
          <button
            onClick={handleDownload}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-white bg-brand-blue hover:bg-blue-600 rounded-xl transition-all shadow-md shadow-brand-blue/20 hover:shadow-brand-blue/35 active:scale-95 flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Download for Windows</span>
          </button>
        </div>

        {/* Bottom Credits & Copyright */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} Print Bot Platform Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Production Authenticode Target</span>
            </span>
            <span className="hidden sm:inline">&bull;</span>
            <span>Deployed on Vercel Edge</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

