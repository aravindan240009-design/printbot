import React, { useState, useEffect } from 'react';
import { InstallerConfig } from '../utils/installer';

interface PilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  installerConfig: InstallerConfig;
  initialTab?: 'request_pilot' | 'installer_info';
  preselectedPlan?: string;
}

export const PilotModal: React.FC<PilotModalProps> = ({
  isOpen,
  onClose,
  installerConfig,
  initialTab = 'request_pilot',
  preselectedPlan,
}) => {
  const [activeTab, setActiveTab] = useState<'request_pilot' | 'installer_info'>(initialTab);
  
  // Form fields
  const [shopName, setShopName] = useState('');
  const [city, setCity] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [printerModel, setPrinterModel] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(preselectedPlan || 'Commercial Print Center');
  
  // Status states
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
    if (preselectedPlan) {
      setSelectedPlan(preselectedPlan);
    }
  }, [initialTab, preselectedPlan, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!shopName.trim()) {
      setFormError('Please enter your shop or business name.');
      return;
    }
    if (!city.trim()) {
      setFormError('Please enter your city / location.');
      return;
    }
    const cleanPhone = contactNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setFormError('Please enter a valid 10-digit mobile or WhatsApp number.');
      return;
    }

    const applicationData = {
      shopName: shopName.trim(),
      city: city.trim(),
      contactNumber: cleanPhone,
      printerModel: printerModel.trim() || 'Unspecified',
      plan: selectedPlan,
      appliedAt: new Date().toISOString(),
    };

    try {
      const existing = JSON.parse(localStorage.getItem('printbot_pilot_requests') || '[]');
      existing.push(applicationData);
      localStorage.setItem('printbot_pilot_requests', JSON.stringify(existing));
    } catch {
      // Ignore localStorage errors in restricted contexts
    }

    setIsSubmitted(true);
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setShopName('');
    setCity('');
    setContactNumber('');
    setPrinterModel('');
    setFormError(null);
  };

  return (
    <div
      className="pilot-modal-backdrop modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pilot-modal-title"
      onClick={onClose}
    >
      <div
        className="pilot-card modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px' }}
      >
        <div className="pilot-header modal-header">
          <div className="pilot-tab-bar modal-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'request_pilot'}
              className={`pilot-tab-btn modal-tab-btn ${activeTab === 'request_pilot' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('request_pilot')}
            >
              Request Commercial Pilot
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'installer_info'}
              className={`pilot-tab-btn modal-tab-btn ${activeTab === 'installer_info' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('installer_info')}
            >
              Windows Spooler Binary
            </button>
          </div>
          <button
            type="button"
            className="pilot-close-btn modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'request_pilot' && (
            <div>
              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="pilot-form">
                  <div className="pilot-intro">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '999px', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', color: 'var(--accent)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '12px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }} />
                      Exclusive Indian Xerox Pilot
                    </div>
                    <h3 id="pilot-modal-title" style={{ fontSize: 'clamp(1.4rem, 2.2vw, 1.85rem)', fontWeight: 800, margin: 0, letterSpacing: '-0.03em', color: 'var(--ink)' }}>
                      Empower Your Print Counter
                    </h3>
                    <p style={{ marginTop: '8px', fontSize: '14px', color: 'var(--ink-body)', lineHeight: 1.6 }}>
                      We are onboarding independent photocopy shops, campus Xerox centres, and digital print studios across India for our zero-commission automation platform.
                    </p>
                  </div>

                  {formError && (
                    <div className="pilot-form-alert error" role="alert" style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', fontSize: '13px' }}>
                      {formError}
                    </div>
                  )}

                  <div className="pilot-field-group">
                    <label htmlFor="pilot-shop-name" className="pilot-label">
                      Shop / Business Name <span style={{ color: 'var(--accent)' }}>*</span>
                    </label>
                    <input
                      id="pilot-shop-name"
                      type="text"
                      className="ui-input"
                      placeholder="e.g. Sri Balaji Xerox & Digital Offset"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="pilot-form-row">
                    <div className="pilot-field-group">
                      <label htmlFor="pilot-city" className="pilot-label">
                        City / Location <span style={{ color: 'var(--accent)' }}>*</span>
                      </label>
                      <input
                        id="pilot-city"
                        type="text"
                        className="ui-input"
                        placeholder="e.g. Coimbatore, Tamil Nadu"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                      />
                    </div>

                    <div className="pilot-field-group">
                      <label htmlFor="pilot-phone" className="pilot-label">
                        WhatsApp / Mobile <span style={{ color: 'var(--accent)' }}>*</span>
                      </label>
                      <input
                        id="pilot-phone"
                        type="tel"
                        className="ui-input"
                        placeholder="10-digit mobile number"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="pilot-form-row">
                    <div className="pilot-field-group">
                      <label htmlFor="pilot-printer" className="pilot-label">
                        Connected Printer Model(s)
                      </label>
                      <input
                        id="pilot-printer"
                        type="text"
                        className="ui-input"
                        placeholder="e.g. Canon iR2525, HP LaserJet, Epson L8050"
                        value={printerModel}
                        onChange={(e) => setPrinterModel(e.target.value)}
                      />
                    </div>

                    <div className="pilot-field-group">
                      <label htmlFor="pilot-plan" className="pilot-label">
                        Plan Selection <span style={{ color: 'var(--accent)', fontSize: '11px', fontWeight: 600 }}>0% Commission</span>
                      </label>
                      <select
                        id="pilot-plan"
                        className="ui-select"
                        value={selectedPlan}
                        onChange={(e) => setSelectedPlan(e.target.value)}
                      >
                        <option value="Print Bot All-Inclusive Monthly">All-Inclusive Monthly (₹999/mo, Unlimited Printers)</option>
                        <option value="Print Bot All-Inclusive Annual">All-Inclusive Annual (₹9,990/yr, Save ₹1,998)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pilot-demo-notice">
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                      </svg>
                      <div>
                        <strong style={{ color: 'var(--ink)' }}>Direct Shop Onboarding:</strong> Submitting reserves your shop ID on our cloud router. You can also reach our Tamil / Hindi / English onboarding desk at <a href="mailto:pilot@printbot.in?subject=Print%20Bot%20Pilot%20Request" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'underline' }}>pilot@printbot.in</a>.
                      </div>
                    </div>
                  </div>

                  <div className="pilot-actions">
                    <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center', height: '52px', fontSize: '15px' }}>
                      Submit Pilot Application
                    </button>
                    <button type="button" className="btn-secondary" onClick={onClose} style={{ height: '52px', padding: '0 24px' }}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="pilot-success-state" style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: 'var(--accent)' }} aria-hidden="true">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 8px', color: 'var(--ink)' }}>
                    Pilot Application Staged
                  </h3>
                  <p style={{ lineHeight: 1.6, color: 'var(--ink-body)', maxWidth: '440px', margin: '0 auto 20px', fontSize: '15px' }}>
                    Welcome aboard, <strong style={{ color: 'var(--ink)' }}>{shopName}</strong> ({city}). Your application for the <strong style={{ color: 'var(--accent)' }}>{selectedPlan}</strong> has been registered with reference ID <code style={{ color: 'var(--cyan-laser)', background: 'rgba(0, 229, 255, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>PB-PILOT-{contactNumber.slice(-4) || '9999'}</code>.
                  </p>
                  <div style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border-card)', padding: '16px 20px', borderRadius: '16px', margin: '0 0 24px', textAlign: 'left', fontSize: '13px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>Next Step: Windows Workstation Pairing</div>
                    <div style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
                      Our deployment engineer will reach out via WhatsApp at +91 {contactNumber} to deliver your shop pairing QR code and authorized device key.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button type="button" className="btn-secondary" onClick={resetForm} style={{ height: '48px', padding: '0 20px' }}>
                      Register Another Shop
                    </button>
                    <button type="button" className="btn-primary" onClick={onClose} style={{ height: '48px', padding: '0 28px' }}>
                      Close Window
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'installer_info' && (
            <div className="installer-tab-content">
              <h3 id="pilot-modal-title" style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 8px', color: 'var(--ink)' }}>
                Windows Workstation Distribution
              </h3>

              {installerConfig.status === 'available' && installerConfig.url ? (
                <div>
                  <div className="pilot-form-alert success" style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#6ee7b7', fontSize: '13px', marginBottom: '16px' }}>
                    Official Windows Installer is configured and ready for download.
                  </div>
                  <p style={{ lineHeight: 1.6, color: 'var(--ink-body)', fontSize: '14px', marginBottom: '16px' }}>
                    Destination URL: <code style={{ wordBreak: 'break-all', color: 'var(--accent)', background: 'var(--accent-soft)', padding: '2px 8px', borderRadius: '6px' }}>{installerConfig.url}</code>
                  </p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <a
                      href={installerConfig.url}
                      className="btn-primary"
                      style={{ textDecoration: 'none', height: '48px', display: 'inline-flex', alignItems: 'center' }}
                      download
                    >
                      Download PrintBot-Setup-x64.exe
                    </a>
                    <button type="button" className="btn-secondary" onClick={onClose} style={{ height: '48px', padding: '0 20px' }}>
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ lineHeight: 1.6, color: 'var(--ink-body)', fontSize: '14px', margin: '0 0 16px' }}>
                    The Print Bot Windows desktop client and background Rust spooler service (<code style={{ color: 'var(--cyan-laser)' }}>winspool.drv</code>) are distributed via cryptographically paired workstation packages for authenticated shops.
                  </p>

                  <div style={{ background: '#07090e', border: '1px solid var(--border-gold)', padding: '16px 20px', borderRadius: '12px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink-body)', lineHeight: 1.7, margin: '0 0 16px' }}>
                    <span style={{ color: 'var(--muted)' }}># Pair workstation with shop device key:</span><br />
                    <span style={{ color: 'var(--accent)' }}>printbot-spooler.exe</span> --pair --shop-id <span style={{ color: 'var(--cyan-laser)' }}>shop-anna-univ-01</span> --tpm-bound
                  </div>

                  <p style={{ lineHeight: 1.6, color: 'var(--muted)', fontSize: '13px', margin: '0 0 20px' }}>
                    All connected USB, Ethernet and Wi-Fi printers (Canon, HP, Ricoh, Brother, Konica Minolta) are detected automatically without per-printer licenses.
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button type="button" className="btn-secondary" onClick={onClose} style={{ height: '44px', padding: '0 24px' }}>
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
