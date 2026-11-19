import React, { useState } from 'react';
import { 
  Building2, 
  Send, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  MessageSquare, 
  Mail, 
  Printer, 
  Sparkles, 
  QrCode, 
  Headphones, 
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../customer-web/supabase';

interface BecomePartnerPageProps {
  navigate?: (path: string) => void;
  onOpenDownloadModal?: () => void;
}

export const BecomePartnerPage: React.FC<BecomePartnerPageProps> = ({ navigate }) => {
  const [formData, setFormData] = useState({
    shopName: '',
    contactName: '',
    email: '',
    phone: '',
    city: '',
    printerCount: '1-3 printers',
    subject: 'Commercial Pilot & Partner Onboarding',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const generatedId = `APP-PILOT-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const { error } = await supabase.from('pilot_applications').insert({
        id: generatedId,
        shop_name: formData.shopName || formData.contactName,
        city: formData.city || 'Commercial Counter',
        contact_number: formData.phone,
        plan: '1 Year Partner Pilot',
        status: 'PENDING',
        applied_at: new Date().toISOString(),
        notes: JSON.stringify({
          contactName: formData.contactName,
          email: formData.email,
          printerCount: formData.printerCount,
          subject: formData.subject,
          message: formData.message,
          appliedFrom: 'Become a Partner Page',
        }),
      });

      if (error) {
        console.error('Supabase pilot application error:', error.message);
      }
      setSubmittedId(generatedId);
    } catch (err) {
      console.error('Error submitting pilot application to Supabase:', err);
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  const partnerPerks = [
    {
      icon: Sparkles,
      title: 'Free Pilot Licensing',
      description: 'Zero software license fees during the commercial pilot phase for your shop counter PC.',
    },
    {
      icon: Headphones,
      title: 'Dedicated Engineering Support',
      description: 'Direct WhatsApp and phone assistance for printer drivers, queues, and network configuration.',
    },
    {
      icon: QrCode,
      title: 'Custom Branded Counter Kit',
      description: 'Receive custom QR counter standees and flyers to introduce touchless mobile uploads to your walk-in customers.',
    },
    {
      icon: Printer,
      title: 'Fleet & Brand Compatibility',
      description: 'Seamless integration with Canon, HP, Epson, Brother, Ricoh, and thermal slip printers.',
    },
  ];

  return (
    <div className="w-full bg-slate-50 pt-24 pb-20 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header / Hero */}
        <div className="page-heading text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 text-xs font-semibold uppercase tracking-wider shadow-xs">
            <Building2 className="w-3.5 h-3.5" />
            <span>Commercial Pilot & Partner Program</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Become a Print Bot Partner
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Equip your xerox & print counter with touchless customer uploads, eliminate WhatsApp chaos, and get dedicated onboarding support from our engineering team.
          </p>
        </div>

        {/* Value Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {partnerPerks.map((perk, idx) => {
            const Icon = perk.icon;
            return (
              <div 
                key={idx}
                className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow duration-200 space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  {perk.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {perk.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
          
          {/* Sidebar Information */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pilot Program Status
              </div>
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Accepting New Commercial Shops</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Approved pilot shops receive priority Windows installer setup, remote printer driver optimization, and free updates for your counter PC.
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-blue-600 font-semibold">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Verified Partner Certification</span>
              </div>
            </div>

            {/* How it works steps */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                How Onboarding Works
              </h3>
              <ol className="space-y-4 text-xs sm:text-sm text-slate-600">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-slate-900 block font-semibold">Submit Application</strong>
                    Provide your print shop details and printer setup below.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="text-slate-900 block font-semibold">Quick Discovery Call</strong>
                    Our tech specialist contacts you to confirm printer models & counter workflow.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong className="text-slate-900 block font-semibold">Remote Counter Setup</strong>
                    We help configure the Windows client & generate your counter QR standee.
                  </div>
                </li>
              </ol>
            </div>

            {/* Direct Support Desk */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Partner Desk Contact
              </h3>
              <div className="space-y-3.5 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs font-medium">Partner Relations</div>
                    <a href="mailto:support@printbot.dev" className="text-slate-900 font-semibold hover:text-blue-600 transition-colors">
                      support@printbot.dev
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs font-medium">Technical Desk</div>
                    <span className="text-slate-900 font-semibold">
                      Direct WhatsApp & Desk Support
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs font-medium">Operating Hours</div>
                    <span className="text-slate-800 font-medium">
                      Mon — Sat, 9:00 AM – 8:00 PM IST
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Partner Application Form Card */}
          <div className="lg:col-span-2">
            <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm">
              {submitted ? (
                <div className="py-12 text-center space-y-5 animate-in fade-in duration-300">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                      Partner Application Submitted!
                    </h3>
                    <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                      Thank you for applying to the Print Bot Commercial Pilot for <strong>{formData.shopName || 'your print shop'}</strong>.
                    </p>
                    {submittedId && (
                      <p className="text-xs text-slate-500 font-mono bg-slate-100 py-1.5 px-3 rounded-lg inline-block">
                        Reference ID: {submittedId}
                      </p>
                    )}
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-md mx-auto text-left text-xs sm:text-sm text-slate-600 space-y-2">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>Next Steps</span>
                    </div>
                    <p>
                      Our pilot onboarding specialist will contact you via WhatsApp / phone ({formData.phone || 'your phone number'}) within 24 hours to schedule your workstation setup.
                    </p>
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
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
                          subject: 'Commercial Pilot & Partner Onboarding',
                          message: '',
                        });
                      }}
                      className="px-5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                    >
                      Submit Another Application
                    </button>
                    {navigate && (
                      <button
                        onClick={() => navigate('/')}
                        className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer"
                      >
                        Return to Home
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                      Shop Pilot Application & Technical Support
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
                      Fill out the form below to register your counter for the commercial pilot. Our team will get in touch with you.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Shop / Business Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Metro Xerox & Digital Prints"
                        value={formData.shopName}
                        onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Operator / Owner Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Anand Kumar"
                        value={formData.contactName}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. anand@printshop.in"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Phone / Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        City / Location *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Chennai, Bangalore, Coimbatore"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Connected Printer Fleet Size
                      </label>
                      <select
                        value={formData.printerCount}
                        onChange={(e) => setFormData({ ...formData, printerCount: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors shadow-xs"
                      >
                        <option value="1-3 printers">1 - 3 Printers</option>
                        <option value="4-8 printers">4 - 8 Printers</option>
                        <option value="9+ printers">9+ Commercial Copiers & Printers</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      How can we help your print counter? *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Tell us about your existing printers (e.g. HP LaserJet, Canon imageRUNNER, Epson EcoTank) and any specific counter requirements..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors resize-none shadow-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
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
    </div>
  );
};

