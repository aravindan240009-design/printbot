import React from 'react';
import { Printer } from 'lucide-react';

interface FooterProps {
  navigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  const handleNav = (path: string) => {
    navigate(path);
  };

  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 mb-16">
          
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <button
              onClick={() => handleNav('/')}
              className="flex items-center gap-3 text-left focus:outline-none group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white shadow-md shadow-slate-900/15">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  Print Bot
                </span>
                <p className="text-xs text-slate-500 font-medium">
                  Autonomous Print Shop Workstation & Customer Platform
                </p>
              </div>
            </button>

            <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
              Print shop software for Windows.
            </p>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-4">
              Product
            </h4>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => handleNav('/features')}
                  className="text-slate-600 hover:text-blue-600 transition-colors cursor-pointer text-left"
                >
                  Features & Workflow
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/download')}
                  className="text-slate-600 hover:text-blue-600 transition-colors cursor-pointer text-left"
                >
                  Download for Windows
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/partner')}
                  className="text-slate-600 hover:text-blue-600 transition-colors cursor-pointer text-left"
                >
                  Become a Partner
                </button>
              </li>
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-4">
              Company
            </h4>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => handleNav('/about')}
                  className="text-slate-600 hover:text-blue-600 transition-colors cursor-pointer text-left"
                >
                  About Print Bot
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/partner')}
                  className="text-slate-600 hover:text-blue-600 transition-colors cursor-pointer text-left"
                >
                  Shop Pilot Program
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/contact')}
                  className="text-slate-600 hover:text-blue-600 transition-colors cursor-pointer text-left"
                >
                  Contact & Support
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} Print Bot. All rights reserved. Built for professional print operators.
          </p>
          <div className="flex items-center gap-6">
            <button
              onClick={() => handleNav('/privacy')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Privacy
            </button>
            <button
              onClick={() => handleNav('/terms')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Terms
            </button>
            <button
              onClick={() => handleNav('/contact')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Help Center
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
