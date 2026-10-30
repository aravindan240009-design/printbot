import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Download, 
  Menu, 
  X, 
  ChevronRight, 
  ExternalLink, 
  Sliders, 
  ShieldCheck, 
  Sparkles,
  Smartphone
} from 'lucide-react';
import { DOWNLOAD_CONFIG, triggerInstallerDownload } from '../config/download';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
  onOpenDownloadModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate, onOpenDownloadModal }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Features', path: '/features' },
    { label: 'Download', path: '/download' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
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
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#090B0F]/85 backdrop-blur-md border-b border-white/[0.08] shadow-2xl py-3.5'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Brand Logo */}
          <button
            onClick={() => handleNavClick('/')}
            className="flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg group"
            aria-label="Print Bot Home"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-blue to-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-blue/25 group-hover:scale-105 transition-transform duration-200">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white group-hover:text-brand-300 transition-colors">
                  Print Bot
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-white/[0.08] text-slate-300 border border-white/[0.08]">
                  v{DOWNLOAD_CONFIG.currentVersion}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Autonomous Print Shop OS
              </p>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-full p-1.5 backdrop-blur-md">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => handleNavClick(link.path)}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-white/[0.12] text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Customer Counter Portal link */}
            <button
              onClick={() => handleNavClick('/customer')}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition-all duration-200 cursor-pointer"
              title="Launch walk-in customer mobile web upload preview"
            >
              <Smartphone className="w-3.5 h-3.5 text-brand-400" />
              <span>Customer Portal</span>
            </button>

            {/* Primary Download CTA */}
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-brand-blue to-brand-600 hover:from-blue-600 hover:to-brand-700 rounded-xl shadow-lg shadow-brand-blue/20 hover:shadow-brand-blue/35 transition-all duration-200 active:scale-[0.98] cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
              <span className="hidden lg:inline text-xs opacity-75 font-normal">
                (Windows)
              </span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-brand-blue hover:bg-blue-600 rounded-lg flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Get v1.0</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0D111A] border-b border-white/[0.1] px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="grid gap-1">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => handleNavClick(link.path)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                    isActive
                      ? 'bg-white/[0.1] text-white font-semibold'
                      : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <span>{link.label}</span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-white/[0.08] grid gap-2">
            <button
              onClick={() => handleNavClick('/customer')}
              className="w-full py-2.5 px-4 text-sm font-medium text-slate-300 bg-white/[0.05] hover:bg-white/[0.08] rounded-xl flex items-center justify-center gap-2"
            >
              <Smartphone className="w-4 h-4 text-brand-400" />
              <span>Launch Customer Upload Portal</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleDownload();
              }}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-brand-blue hover:bg-blue-600 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-blue/20"
            >
              <Download className="w-4 h-4" />
              <span>Download Print Bot for Windows (2.81 MB)</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

