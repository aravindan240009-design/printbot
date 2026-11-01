import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="w-full bg-slate-50 pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 text-slate-900">
      
      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold uppercase tracking-wider">
          Legal & Privacy
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Print Bot Privacy Policy
        </h1>
        <p className="text-xs text-slate-500 font-mono">
          Last Updated: November 02, 2026 • Effective Immediately
        </p>
      </div>

      {/* Intro card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-emerald-700 text-sm font-bold">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>Our Core Privacy Guarantee</span>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          At <strong>Print Bot</strong> ("we", "our", or "the Platform"), we respect the absolute confidentiality of every customer document. Walk-in customers frequently print sensitive personal records: national IDs, medical histories, academic certificates, court affidavits, and tax filings. We design our software so that your files are transiently processed and permanently erased once physical printing finishes.
        </p>
      </div>

      {/* Detailed sections */}
      <div className="space-y-8 text-sm text-slate-700 leading-relaxed divide-y divide-slate-200">
        
        {/* Section 1 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center text-xs font-bold">1</span>
            <span>Document Uploads & Transient Lifecycle</span>
          </h2>
          <p>
            When a customer uploads a document via the counter QR code link:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600 text-xs sm:text-sm">
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
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center text-xs font-bold">2</span>
            <span>Shop Guest Session Boundaries</span>
          </h2>
          <p>
            Customers do not need to register, create accounts, or verify email addresses to print. Guest sessions are strictly cryptographically bound to the specific shop QR token:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600 text-xs sm:text-sm">
            <li>
              Cross-shop access is physically impossible under our strict multi-tenant database isolation.
            </li>
            <li>
              The customer's mobile browser only retains temporary session tokens in sessionStorage, which self-destruct upon closing the browser tab.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center text-xs font-bold">3</span>
            <span>Windows Desktop Workstation & Local Journal</span>
          </h2>
          <p>
            The Print Bot Windows Desktop Workstation runs locally on the shop operator's computer:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600 text-xs sm:text-sm">
            <li>
              The SQLite audit journal records metadata (order sequence, page count, price, and job SHA-256 hash) strictly for accounting and duplicate prevention.
            </li>
            <li>
              Document contents are not stored in the journal database.
            </li>
            <li>
              Spool files handed to the native Windows spooler are handled according to Microsoft Windows standard operating system print spooler lifecycle.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center text-xs font-bold">4</span>
            <span>Payment Information</span>
          </h2>
          <p>
            When customers choose online payment (such as UPI QR or Razorpay), payment processing is performed directly through bank-grade regulated payment gateways. Print Bot does not collect, log, or store credit card numbers, CVVs, or bank credentials.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 pt-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center text-xs font-bold">5</span>
            <span>Contact & Inquiries</span>
          </h2>
          <p>
            If you have questions regarding this Privacy Policy or wish to request data deletion records, contact our team at:
          </p>
          <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-800 shadow-xs">
            Email: privacy@printbot.dev<br />
            Attention: Data Protection Officer, Print Bot
          </div>
        </section>

      </div>

      </div>
    </div>
  );
};
