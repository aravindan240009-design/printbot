import React from 'react';
import { FileCheck } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="w-full bg-slate-50 pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 text-slate-900">
      
      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold uppercase tracking-wider">
          Legal Agreement
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Terms and Conditions of Service
        </h1>
        <p className="text-xs text-slate-500 font-mono">
          Last Updated: November 02, 2026 • Version 1.0 Commercial Agreement
        </p>
      </div>

      {/* Intro */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-blue-700 text-sm font-bold">
          <FileCheck className="w-5 h-5 text-blue-600" />
          <span>Agreement Between Shop Operator and Print Bot</span>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          These Terms and Conditions govern your access to and use of the <strong>Print Bot Windows Workstation Software</strong>, the Print Bot cloud coordination API, and the customer QR mobile upload interface (collectively, the "Service"). By downloading our executable or deploying our QR counter system, you agree to be bound by these terms.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-8 text-sm text-slate-700 leading-relaxed divide-y divide-slate-200">
        
        {/* Section 1 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center text-xs font-bold">1</span>
            <span>Commercial Software License</span>
          </h2>
          <p>
            Print Bot grants you a non-exclusive, non-transferable commercial license to install and execute the Windows Workstation binary on counter computers located within your authorized physical shop premises:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600 text-xs sm:text-sm">
            <li>
              <strong>Unlimited Hardware:</strong> You may connect an unlimited number of physical printers, copiers, and thermal machines to each licensed counter workstation.
            </li>
            <li>
              <strong>Zero Software Royalties:</strong> We do not charge per-page printing commissions or deduct percentages from your cash or counter UPI transactions.
            </li>
            <li>
              <strong>Restrictions:</strong> You may not reverse engineer, decompile, or tamper with the binary, licensing validation tokens, or local journaling mechanisms.
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center text-xs font-bold">2</span>
            <span>Hardware & Spooler Compatibility</span>
          </h2>
          <p>
            Print Bot interfaces with physical hardware via the standard Microsoft Windows Print Spooler. While Print Bot is compatible with major printer manufacturers (HP, Canon, Epson, Brother, Konica Minolta, Ricoh):
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600 text-xs sm:text-sm">
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
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center text-xs font-bold">3</span>
            <span>Lawful Use & Content Policy</span>
          </h2>
          <p>
            You agree not to use Print Bot to facilitate the unauthorized reproduction of currency, counterfeit identification, defamatory documents, or materials violating applicable local laws. The shop operator retains final discretion over approving or rejecting any incoming customer job before dispatching to the physical printer.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center text-xs font-bold">4</span>
            <span>Uptime & Reliability Commitments</span>
          </h2>
          <p>
            The desktop workstation operates locally and does not depend on cloud uptime for physical printing. For cloud QR coordination and mobile upload services, Print Bot targets high availability across distributed edge networks.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center text-xs font-bold">5</span>
            <span>Governing Law & Inquiries</span>
          </h2>
          <p>
            These terms shall be governed by and construed in accordance with applicable commercial and software licensing laws. For formal legal notices:
          </p>
          <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-800 shadow-xs">
            Email: legal@printbot.dev<br />
            Subject: Legal Notice — Commercial Operations
          </div>
        </section>

      </div>

      </div>
    </div>
  );
};
