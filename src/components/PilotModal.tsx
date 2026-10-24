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
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pilot-modal-title"
      onClick={onClose}
    >
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '620px' }}
      >
        <div className="modal-header">
          <div className="modal-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'request_pilot'}
              className={`modal-tab-btn ${activeTab === 'request_pilot' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('request_pilot')}
            >
              Request Shop Pilot Access
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'installer_info'}
              className={`modal-tab-btn ${activeTab === 'installer_info' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('installer_info')}
            >
              Windows Installer Status
            </button>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'request_pilot' && (
            <div>
              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="pilot-form">
                  <div className="pilot-intro">
                    <h3 id="pilot-modal-title" style={{ fontSize: 'var(--step-lead)', fontWeight: 700, margin: 0 }}>
                      Join the Print Bot Commercial Pilot
                    </h3>
                    <p className="small muted" style={{ marginTop: '4px' }}>
                      We are currently onboarding selected photocopy shops, Xerox centres, and digital print businesses into our closed pilot program across India.
                    </p>
                  </div>

                  {formError && (
                    <div className="pilot-form-alert error" role="alert">
                      {formError}
                    </div>
                  )}

                  <div className="pilot-field-group">
                    <label htmlFor="pilot-shop-name" className="pilot-label">
                      Shop / Business Name <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      id="pilot-shop-name"
                      type="text"
                      className="ui-input"
                      placeholder="e.g. Metro Xerox & Digital Prints"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="pilot-form-row">
                    <div className="pilot-field-group">
                      <label htmlFor="pilot-city" className="pilot-label">
                        City / Town <span style={{ color: '#dc2626' }}>*</span>
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
                        WhatsApp / Mobile No. <span style={{ color: '#dc2626' }}>*</span>
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
                        placeholder="e.g. Canon iR2525, HP M428, Epson L8050"
                        value={printerModel}
                        onChange={(e) => setPrinterModel(e.target.value)}
                      />
                    </div>

                    <div className="pilot-field-group">
                      <label htmlFor="pilot-plan" className="pilot-label">
                        Selected Plan Tier
                      </label>
                      <select
                        id="pilot-plan"
                        className="ui-select"
                        value={selectedPlan}
                        onChange={(e) => setSelectedPlan(e.target.value)}
                      >
                        <option value="Single Counter Shop">Single Counter Shop (1 PC, 2 Printers)</option>
                        <option value="Commercial Print Center">Commercial Print Center (Unlimited Printers)</option>
                        <option value="Campus / Multi-Branch Fleet">Campus / Multi-Branch Fleet</option>
                      </select>
                    </div>
                  </div>

                  <div className="pilot-actions">
                    <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                      Submit Pilot Application
                    </button>
                    <button type="button" className="btn-secondary" onClick={onClose}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="pilot-success-state">
                  <div className="pilot-success-icon" aria-hidden="true">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: 'var(--step-lead)', fontWeight: 700, margin: '0.5rem 0' }}>
                    Pilot Application Received
                  </h3>
                  <p className="small" style={{ lineHeight: 1.6, color: 'var(--ink-body)' }}>
                    Thank you, <strong>{shopName}</strong> ({city}). Your application for the <strong>{selectedPlan}</strong> pilot has been recorded.
                  </p>
                  <p className="small muted" style={{ lineHeight: 1.6, marginTop: '0.5rem' }}>
                    Our engineering and counter deployment specialist will reach out to your WhatsApp at <strong>+91 {contactNumber}</strong> to coordinate your remote workstation pairing and hardware configuration.
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'center' }}>
                    <button type="button" className="btn-secondary" onClick={resetForm}>
                      Submit Another Shop
                    </button>
                    <button type="button" className="btn-primary" onClick={onClose}>
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'installer_info' && (
            <div className="installer-tab-content">
              <h3 id="pilot-modal-title" style={{ fontSize: 'var(--step-lead)', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
                Windows Workstation Distribution
              </h3>

              {installerConfig.status === 'available' && installerConfig.url ? (
                <div>
                  <div className="pilot-form-alert success">
                    Official Windows Installer is configured and ready for download.
                  </div>
                  <p className="small muted" style={{ lineHeight: 1.6 }}>
                    Destination URL: <code style={{ wordBreak: 'break-all' }}>{installerConfig.url}</code>
                  </p>
                  <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
                    <a
                      href={installerConfig.url}
                      className="btn-primary"
                      style={{ textDecoration: 'none' }}
                      download
                    >
                      Download PrintBot-Setup-x64.exe
                    </a>
                    <button type="button" className="btn-secondary" onClick={onClose}>
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="small muted" style={{ lineHeight: 1.6 }}>
                    The Print Bot Windows desktop client and background Rust spooler service are currently being distributed via direct provisioning to partner print shops in our commercial pilot.
                  </p>

                  <div className="modal-code-block" style={{ marginTop: '0.75rem' }}>
                    # Set your verified release endpoint in .env:
                    <br />
                    VITE_WINDOWS_INSTALLER_URL=https://releases.printbot.app/v1.0.0/PrintBot-Setup-x64.exe
                  </div>

                  <p className="small muted" style={{ lineHeight: 1.6, marginTop: '0.75rem' }}>
                    Once configured, all "Download for Windows" actions across the website will directly initiate binary download of the authentic, verified executable.
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                    <button type="button" className="btn-secondary" onClick={onClose}>
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
