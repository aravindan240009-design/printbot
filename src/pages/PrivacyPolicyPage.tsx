import React from 'react';
import { ShieldCheck, Lock, FileText, Trash2, EyeOff } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="pt-28 pb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      
      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-semibold uppercase tracking-wider">
          Legal & Privacy
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Print Bot Privacy Policy
        </h1>
        <p className="text-xs text-slate-400 font-mono">
          Last Updated: October 31, 2026 • Effective Immediately
        </p>
      </div>

      {/* Intro card */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-3">
        <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
          <ShieldCheck className="w-5 h-5" />
          <span>Our Core Privacy Guarantee</span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          At <strong>Print Bot</strong> ("we", "our", or "the Platform"), we respect the absolute confidentiality of every customer document. Walk-in customers frequently print sensitive personal records: national IDs, medical histories, academic certificates, court pleadings, and tax filings. We design our software so that your files are transiently processed and permanently erased once physical printing finishes.
        </p>
      </div>

      {/* Detailed sections */}
      <div className="space-y-8 text-sm text-slate-300 leading-relaxed divide-y divide-white/[0.06]">
        
        {/* Section 1 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-brand-blue/20 text-brand-400 flex items-center justify-center text-xs">1</span>
            <span>Document Uploads & Transient Lifecycle</span>
          </h2>
          <p>
            When a customer uploads a document via the counter QR code link:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-400 text-xs sm:text-sm">
            <li>
              Files are transmitted via encrypted TLS 1.3 connections directly to the isolated shop session endpoint.
            </li>
            <li>
              Page counts, color distribution analysis, and thumbnail generation are executed in bounded ephemeral memory buffers.
            </li>
            <li>
              <strong>Automatic Document Purge:</strong> Once the document is submitted to the Windows Print Spooler or the counter session expires, the physical payload is securely deleted from temporary disk caches.
            </li>
            <li>
              We never perform machine learning training, optical character recognition (OCR) harvesting, or data aggregation on your files.
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-brand-blue/20 text-brand-400 flex items-center justify-center text-xs">2</span>
            <span>Shop Guest Session Boundaries</span>
          </h2>
          <p>
            Customers do not need to register, create accounts, or verify email addresses to print. Guest sessions are strictly cryptographically bound to the specific shop QR token:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-400 text-xs sm:text-sm">
            <li>
              Cross-shop access is physically impossible under our PostgreSQL Row-Level Security (RLS) tenant architecture.
            </li>
            <li>
              The customer's mobile browser only retains temporary session tokens in sessionStorage, which self-destruct upon closing the browser tab.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-brand-blue/20 text-brand-400 flex items-center justify-center text-xs">3</span>
            <span>Windows Desktop Workstation & Local Journal</span>
          </h2>
          <p>
            The Print Bot Windows Desktop Workstation runs locally on the shop operator's computer:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-400 text-xs sm:text-sm">
            <li>
              The SQLite audit journal records metadata (order sequence, page count, price, and job SHA-256 hash) strictly for accounting and duplicate prevention.
            </li>
            <li>
              Document contents are not stored in the journal database.
            </li>
            <li>
              Spool files handed to `Winspool.drv` are handled according to Microsoft Windows standard operating system print spooler lifecycle.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-brand-blue/20 text-brand-400 flex items-center justify-center text-xs">4</span>
            <span>Payment Information</span>
          </h2>
          <p>
            When customers choose online payment (such as UPI QR or Razorpay), payment processing is performed directly through bank-grade regulated payment gateways. Print Bot does not collect, log, or store credit card numbers, CVVs, or bank credentials.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-brand-blue/20 text-brand-400 flex items-center justify-center text-xs">5</span>
            <span>Contact & Inquiries</span>
          </h2>
          <p>
            If you have questions regarding this Privacy Policy or wish to request data deletion records, contact our Data Protection Officer at:
          </p>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] text-xs font-mono text-slate-300">
            Email: privacy@printbot.dev<br />
            Attention: Data Protection Officer, Print Bot Platform Inc.
          </div>
        </section>

      </div>

    </div>
  );
};

