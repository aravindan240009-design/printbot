import React from 'react';
import {
  Sparkles,
  Building,
  MapPin,
  Phone,
  CheckCircle2,
  Sliders,
  ArrowRight,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

interface SetupWizardProps {
  setupShopName: string;
  setSetupShopName: (val: string) => void;
  setupLocation: string;
  setSetupLocation: (val: string) => void;
  setupPhone: string;
  setSetupPhone: (val: string) => void;
  setupBwRate: number;
  setupColorRate: number;
  setupOrderMode: 'MANUAL_APPROVAL' | 'FULL_AUTOMATIC';
  onSaveSetup: (e: React.FormEvent) => void;
  onLogout: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({
  setupShopName,
  setSetupShopName,
  setupLocation,
  setSetupLocation,
  setupPhone,
  setSetupPhone,
  setupBwRate,
  setupColorRate,
  setupOrderMode,
  onSaveSetup,
  onLogout,
}) => {
  return (
    <div className="pb-lockscreen-root">
      <div className="pb-setup-card">
        {/* Header */}
        <div className="pb-setup-header">
          <div className="pb-setup-icon">
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="pb-setup-title">Station Onboarding Wizard</h1>
            <p className="pb-setup-subtitle">
              License verified! Finalize your shop counter details to initialize your workstation queue.
            </p>
          </div>
        </div>

        <form onSubmit={onSaveSetup} className="pb-setup-form">
          <div className="pb-form-grid-2">
            <div className="pb-form-group">
              <label className="pb-form-label">
                <Building size={13} style={{ display: 'inline', marginRight: '4px' }} />
                Shop / Commercial Name *
              </label>
              <input
                type="text"
                className="pb-input"
                placeholder="e.g. Metro Xerox & Digital Prints"
                value={setupShopName}
                onChange={(e) => setSetupShopName(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="pb-form-group">
              <label className="pb-form-label">
                <MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} />
                Branch / Counter Location *
              </label>
              <input
                type="text"
                className="pb-input"
                placeholder="e.g. Counter 01, Main Road Branch"
                value={setupLocation}
                onChange={(e) => setSetupLocation(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="pb-form-group">
            <label className="pb-form-label">
              <Phone size={13} style={{ display: 'inline', marginRight: '4px' }} />
              Customer Contact Phone *
            </label>
            <input
              type="text"
              className="pb-input"
              placeholder="+91 98401 23456"
              value={setupPhone}
              onChange={(e) => setSetupPhone(e.target.value)}
              required
            />
            <span className="pb-form-hint">
              Used on customer QR stand printout and receipt generation.
            </span>
          </div>

          {/* License Configuration Summary Banner */}
          <div className="pb-setup-rate-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <ShieldCheck size={16} color="var(--pb-desk-success)" />
              <strong style={{ fontSize: '12px', color: 'var(--pb-desk-text)' }}>
                Configured from License Key:
              </strong>
            </div>
            <div className="pb-setup-rate-chips">
              <span className="pb-chip">
                B&amp;W Base Rate: <strong>₹{setupBwRate} / page</strong>
              </span>
              <span className="pb-chip">
                Color Base Rate: <strong>₹{setupColorRate} / page</strong>
              </span>
              <span className="pb-chip">
                Dispatch Mode: <strong>{setupOrderMode === 'FULL_AUTOMATIC' ? 'Full Automatic' : 'Manual Approval'}</strong>
              </span>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: '11px', color: 'var(--pb-desk-text-dim)', lineHeight: 1.5 }}>
              All per-page rates and counter services can be customized at any time in the <strong>Services &amp; Rates</strong> and <strong>Configuration</strong> sections.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pb-setup-actions">
            <button
              type="button"
              className="pb-btn pb-btn-secondary"
              onClick={onLogout}
            >
              <LogOut size={14} /> Log Out
            </button>

            <button
              type="submit"
              className="pb-btn pb-btn-primary"
              style={{ minWidth: '180px' }}
            >
              <span>Initialize Workstation</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

