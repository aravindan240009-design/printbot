import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  CheckCircle2, 
  MessageSquare, 
  Building2, 
  Laptop, 
  HelpCircle,
  Clock
} from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    shopName: '',
    contactName: '',
    email: '',
    phone: '',
    city: '',
    printerCount: '1-3 printers',
    subject: 'Commercial Pilot Onboarding',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate real submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 text-xs font-semibold uppercase tracking-wider">
          Support & Commercial Inquiries
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Connect with the Print Bot Team
        </h1>
        <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
          Looking to join the commercial pilot for your print shop, request custom hardware driver integration, or need technical workstation assistance? We're here to help.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
        
        {/* Contact Info Sidebar */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-6">
            <h3 className="text-lg font-bold text-white tracking-tight">
              Direct Contact Channels
            </h3>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center text-brand-400 flex-shrink-0 mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-slate-400 text-xs">Direct Support Email</div>
                  <a href="mailto:support@printbot.dev" className="text-white font-medium hover:text-brand-300 transition-colors">
                    support@printbot.dev
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-slate-400 text-xs">Counter Support Desk</div>
                  <div className="text-white font-medium font-mono">
                    +91 98400 12345
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-slate-400 text-xs">Pilot Onboarding Hours</div>
                  <div className="text-slate-200">
                    Mon — Sat, 9:00 AM – 8:00 PM IST
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pilot Program Status
            </div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Accepting New Commercial Shops</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Approved pilot shops receive priority Windows installer distribution, direct WhatsApp hotline support, and free lifetime updates for the initial counter PC.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="p-8 sm:p-10 rounded-3xl bg-white/[0.02] border border-white/[0.08] shadow-xl">
            {submitted ? (
              <div className="py-12 text-center space-y-4 animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  Thank You! Inquiry Received
                </h3>
                <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                  We've received your inquiry regarding <strong>{formData.shopName || 'your print shop'}</strong>. A technical engineer will get in touch with you shortly.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        shopName: '',
                        contactName: '',
                        email: '',
                        phone: '',
                        city: '',
                        printerCount: '1-3 printers',
                        subject: 'Commercial Pilot Onboarding',
                        message: '',
                      });
                    }}
                    className="px-5 py-2 text-xs font-semibold text-slate-300 bg-white/[0.06] hover:bg-white/[0.1] rounded-lg transition-colors cursor-pointer"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Shop Pilot Application & Technical Support
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Fill out the form below and we will respond within 4 business hours.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Print Shop / Business Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Modern Xerox & Digital Prints"
                      value={formData.shopName}
                      onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Contact Person Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Anand Kumar"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. anand@printshop.in"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Phone / Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      City / Location *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chennai, Bangalore, Delhi"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Connected Printer Fleet Size
                    </label>
                    <select
                      value={formData.printerCount}
                      onChange={(e) => setFormData({ ...formData, printerCount: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                    >
                      <option value="1-3 printers">1 - 3 Printers</option>
                      <option value="4-8 printers">4 - 8 Printers</option>
                      <option value="9+ printers">9+ Commercial Copiers & Printers</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    How can we help your print counter? *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us about your existing printers (e.g. HP LaserJet, Canon imageRUNNER, Epson EcoTank) and any specific counter workflow requirements..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white text-sm focus:outline-none focus:border-brand-500 transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-blue to-brand-600 hover:from-blue-600 hover:to-brand-700 transition-all shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Submitting Application...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Pilot Application</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

