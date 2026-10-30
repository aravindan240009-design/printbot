import React from 'react';
import { FileCheck, ShieldAlert, Award, RefreshCw } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="pt-28 pb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      
      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 text-xs font-semibold uppercase tracking-wider">
          Legal Agreement
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Terms and Conditions of Service
        </h1>
        <p className="text-xs text-slate-400 font-mono">
          Last Updated: October 31, 2026 • Version 1.0 Commercial Agreement
        </p>
      </div>

      {/* Intro */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-3">
        <div className="flex items-center gap-2 text-brand-400 text-sm font-semibold">
          <FileCheck className="w-5 h-5" />
          <span>Agreement Between Shop Operator and Print Bot</span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          These Terms and Conditions govern your access to and use of the <strong>Print Bot Windows Workstation Software</strong>, the Print Bot cloud coordination API, and the customer QR mobile upload interface (collectively, the "Service"). By downloading our executable or deploying our QR counter system, you agree to be bound by these terms.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-8 text-sm text-slate-300 leading-relaxed divide-y divide-white/[0.06]">
        
        {/* Section 1 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-brand-blue/20 text-brand-400 flex items-center justify-center text-xs">1</span>
            <span>Commercial Software License</span>
          </h2>
          <p>
            Print Bot grants you a non-exclusive, non-transferable commercial license to install and execute the Windows Workstation binary on counter computers located within your authorized physical shop premises:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-400 text-xs sm:text-sm">
            <li>
              <strong>Unlimited Hardware:</strong> You may connect an unlimited number of physical printers, copiers, and thermal machines to each licensed counter workstation.
            </li>
            <li>
              <strong>Zero Software Royalties:</strong> We do not charge per-page printing commissions or deduct percentages from your cash or counter UPI transactions.
            </li>
            <li>
              <strong>Restrictions:</strong> You may not reverse engineer, decompile, or tamper with the Rust binary, licensing validation tokens, or SQLite journaling mechanisms.
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-brand-blue/20 text-brand-400 flex items-center justify-center text-xs">2</span>
            <span>Hardware & Spooler Compatibility</span>
          </h2>
          <p>
            Print Bot interfaces with physical hardware via the standard Microsoft Windows Print Spooler (`Winspool.drv`). While Print Bot is compatible with major printer manufacturers (HP, Canon, Epson, Brother, Konica Minolta, Ricoh):
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-400 text-xs sm:text-sm">
            <li>
              The shop is responsible for maintaining working Windows OEM printer drivers, physical paper supplies, and toner levels.
            </li>
            <li>
              Print Bot is not liable for paper jams, mechanical printer defects, physical toner exhaustion, or hardware power outages.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-brand-blue/20 text-brand-400 flex items-center justify-center text-xs">3</span>
            <span>Lawful Use & Content Policy</span>
          </h2>
          <p>
            You agree not to use Print Bot to facilitate the unauthorized reproduction of currency, counterfeit identification, defamatory documents, or materials violating applicable local penal laws. The shop operator retains final discretion over approving or rejecting any incoming customer job before dispatching to the physical printer.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-brand-blue/20 text-brand-400 flex items-center justify-center text-xs">4</span>
            <span>Uptime & Service Commitments</span>
          </h2>
          <p>
            The desktop workstation operates locally and does not depend on cloud uptime for physical printing. For cloud QR coordination and mobile upload services, Print Bot targets a 99.9% uptime SLA hosted across distributed edge networks.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-brand-blue/20 text-brand-400 flex items-center justify-center text-xs">5</span>
            <span>Governing Law & Disputes</span>
          </h2>
          <p>
            These terms shall be governed by and construed in accordance with the commercial laws of India and applicable international software licensing treaties. For formal legal notices:
          </p>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] text-xs font-mono text-slate-300">
            Email: legal@printbot.dev<br />
            Subject: Legal Notice — Commercial License Operations
          </div>
        </section>

      </div>

    </div>
  );
};

