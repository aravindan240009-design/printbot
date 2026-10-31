import { useState, useEffect, useRef } from 'react';
import {
  X,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  QrCode,
  Download,
  MessageCircle,
  Copy,
  Check
} from 'lucide-react';
import { PrintBotLogo } from '../../packages/ui/src/components/PrintBotLogo';
import { getInstallerConfig } from '../utils/installer';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlan?: 'monthly' | 'annual';
}

export function SubscriptionModal({
  isOpen,
  onClose,
  initialPlan = 'monthly',
}: SubscriptionModalProps) {
  const [billing, setBilling] = useState<'monthly' | 'annual'>(initialPlan);
  const [shopName, setShopName] = useState('');
  const [city, setCity] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [printerModel, setPrinterModel] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [pairingCode, setPairingCode] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [copied, setCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const installer = getInstallerConfig();

  useEffect(() => {
    setBilling(initialPlan);
  }, [initialPlan]);

  useEffect(() => {
    if (!isOpen) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim() || !whatsapp.trim()) return;

    // Generate unique pairing code and license identifier
    const randCode = `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;
    const randLicense = `PB-PILOT-${Math.floor(1000 + Math.random() * 9000)}-XEROX`;
    setPairingCode(randCode);
    setLicenseKey(randLicense);

    try {
      const records = JSON.parse(localStorage.getItem('printbot_shop_pilots') || '[]');
      records.push({
        shopName,
        city: city || 'Not specified',
        whatsapp,
        printerModel: printerModel || 'All Printers',
        billing,
        licenseKey: randLicense,
        pairingCode: randCode,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('printbot_shop_pilots', JSON.stringify(records));
    } catch {
      // Ignore localStorage restrictions
    }

    setSubmitted(true);
  };

  const copyLicense = () => {
    navigator.clipboard?.writeText(licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappMessage = encodeURIComponent(
    `Hi Print Bot Support Team!\n\nI just reserved my 14-Day Free Counter Pilot for:\nShop: ${shopName}\nCity: ${city || 'India'}\nPhone: ${whatsapp}\nPrinters: ${printerModel || 'Commercial Xerox / Digital'}\nPlan: ${billing === 'annual' ? 'Annual (₹1,999/yr)' : 'Monthly (₹199/mo)'}\nLicense: ${licenseKey}\n\nPlease confirm my pairing key and send my workstation setup guide!`
  );

  return (
    <div
      className="sub-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sub-modal-title"
    >
      <div className="sub-modal-card">
        {/* Close Button */}
        <button
          ref={closeRef}
          type="button"
          className="sub-modal-close"
          onClick={onClose}
          aria-label="Close subscription dialogue"
        >
          <X size={20} />
        </button>

        {!submitted ? (
          <>
            {/* Modal Header */}
            <div className="sub-modal-header">
              <div className="sub-modal-brand">
                <PrintBotLogo size={36} />
                <span className="sub-plan-badge">
                  <Sparkles size={13} /> ONE ALL-INCLUSIVE PLAN · UNLIMITED PRINTERS
                </span>
              </div>

              <h2 id="sub-modal-title" className="sub-modal-headline">
                The Counter Software<br />
                <span className="serif-note">That Pays For Itself On Day One.</span>
              </h2>

              <p className="sub-modal-subhead">
                Zero software commission on your pages. Unlimited printers per subscribed shop.
                Turn every customer smartphone into a self-service ordering counter.
              </p>
            </div>

            {/* Value Proposition Highlights Grid */}
            <div className="sub-benefits-grid">
              <div className="sub-benefit-item">
                <div className="sub-benefit-icon">
                  <Printer size={18} />
                </div>
                <div>
                  <strong>Unlimited Printers Included</strong>
                  <p>Connect 1, 5, or 20 Xerox, Canon, HP, or Konica Minolta machines without paying extra fees.</p>
                </div>
              </div>

              <div className="sub-benefit-item">
                <div className="sub-benefit-icon">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <strong>100% Revenue Retention</strong>
                  <p>Zero per-page cut. Keep every rupee paid by your customers directly to your counter.</p>
                </div>
              </div>

              <div className="sub-benefit-item">
                <div className="sub-benefit-icon">
                  <QrCode size={18} />
                </div>
                <div>
                  <strong>Stop Counter Crowds</strong>
                  <p>Customers scan your standee QR, upload PDFs, pick duplex/color, and pay upfront via UPI.</p>
                </div>
              </div>

              <div className="sub-benefit-item">
                <div className="sub-benefit-icon">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <strong>Save ₹4,500+/Mo in Waste</strong>
                  <p>Upfront payment and server previews eliminate unpaid print disputes and abandoned sheets.</p>
                </div>
              </div>
            </div>

            {/* Billing Switcher */}
            <div className="sub-pricing-block">
              <div className="sub-billing-toggle">
                <button
                  type="button"
                  className={billing === 'monthly' ? 'active' : ''}
                  onClick={() => setBilling('monthly')}
                >
                  Monthly Billing
                </button>
                <button
                  type="button"
                  className={billing === 'annual' ? 'active' : ''}
                  onClick={() => setBilling('annual')}
                >
                  Annual Billing <span className="sub-discount-pill">SAVE 17%</span>
                </button>
              </div>

              <div className="sub-price-display">
                <div className="sub-amount">
                  <span className="sub-currency">₹</span>
                  <span className="sub-val">
                    {billing === 'annual' ? '1,999' : '199'}
                  </span>
                  <span className="sub-period">
                    {billing === 'annual' ? '/year' : '/month'}
                  </span>
                </div>
                <div className="sub-price-meta">
                  {billing === 'annual' ? (
                    <span className="sub-deal-text">
                      ✨ 2 Months Free + 2 Laser-Engraved Counter Acrylic QR Standees included!
                    </span>
                  ) : (
                    <span className="sub-deal-text">
                      Flexible monthly subscription. Cancel or pause anytime.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 14-Day Free Pilot Form */}
            <form onSubmit={handleSubmit} className="sub-pilot-form">
              <div className="sub-form-header">
                <span className="sub-form-title">
                  <Clock size={15} /> Claim 14-Day Free Counter Pilot
                </span>
                <span className="sub-guarantee">No Credit Card Required · Instant Setup</span>
              </div>

              <div className="sub-form-row">
                <div className="sub-input-group">
                  <label htmlFor="sub-shop-name">Shop / Business Name *</label>
                  <input
                    id="sub-shop-name"
                    type="text"
                    required
                    placeholder="e.g. Anna Xerox & Digital Prints"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                  />
                </div>

                <div className="sub-input-group">
                  <label htmlFor="sub-city">City / Area *</label>
                  <input
                    id="sub-city"
                    type="text"
                    required
                    placeholder="e.g. Guindy, Chennai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>

              <div className="sub-form-row">
                <div className="sub-input-group">
                  <label htmlFor="sub-whatsapp">WhatsApp Mobile Number *</label>
                  <input
                    id="sub-whatsapp"
                    type="tel"
                    required
                    placeholder="e.g. 98400 12345"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                  />
                </div>

                <div className="sub-input-group">
                  <label htmlFor="sub-printer">Main Printer Models</label>
                  <input
                    id="sub-printer"
                    type="text"
                    placeholder="e.g. Canon iR-ADV, Xerox 5335, HP"
                    value={printerModel}
                    onChange={(e) => setPrinterModel(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="sub-submit-btn">
                <span>Start 14-Day Risk-Free Pilot</span>
                <ArrowRight size={18} />
              </button>

              <div className="sub-form-footer">
                <ShieldCheck size={14} />
                <span>
                  By claiming your pilot, you receive an authorized 14-day Windows pairing license.
                  Full hardware validation and local driver testing included.
                </span>
              </div>
            </form>
          </>
        ) : (
          /* ============================================================== */
          /* SUCCESS CONFIRMATION STATE                                     */
          /* ============================================================== */
          <div className="sub-success-view">
            <div className="sub-success-icon-wrap">
              <CheckCircle2 size={56} className="sub-success-icon" />
            </div>

            <span className="sub-success-badge">COUNTER PILOT CONFIRMED</span>
            <h3>Welcome to Print Bot, {shopName}!</h3>
            <p className="sub-success-desc">
              Your 14-day zero-risk workstation pilot has been reserved for your counter in {city || 'India'}.
              Below are your authorized pairing credentials:
            </p>

            <div className="sub-credentials-card">
              <div className="sub-cred-row">
                <span className="cred-label">WORKSTATION LICENSE KEY</span>
                <div className="cred-val-copy">
                  <code>{licenseKey}</code>
                  <button type="button" onClick={copyLicense} title="Copy license key">
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="sub-cred-row">
                <span className="cred-label">COUNTER PAIRING PIN</span>
                <span className="cred-pin">{pairingCode}</span>
              </div>

              <div className="sub-cred-row">
                <span className="cred-label">PLAN ENTITLEMENT</span>
                <span className="cred-plan">
                  {billing === 'annual' ? 'All-Inclusive Annual (14-Day Trial)' : 'All-Inclusive Monthly (14-Day Trial)'} · Unlimited Printers
                </span>
              </div>
            </div>

            <div className="sub-next-actions">
              <a
                href={`https://wa.me/919840012345?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="sub-action-btn whatsapp-btn"
              >
                <MessageCircle size={18} />
                <span>Activate On WhatsApp (Instant Support)</span>
              </a>

              {installer.url && (
                <a href={installer.url} className="sub-action-btn download-btn">
                  <Download size={18} />
                  <span>Download Windows Workstation Installer (.exe)</span>
                </a>
              )}

              <button
                type="button"
                className="sub-action-btn secondary-btn"
                onClick={onClose}
              >
                Return to Counter Overview
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
