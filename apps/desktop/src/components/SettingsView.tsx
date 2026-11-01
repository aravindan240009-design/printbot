import React from 'react';
import {
  Settings,
  Building,
  MapPin,
  Phone,
  Radio,
  Sparkles,
  ShieldCheck,
  Cpu,
  Save,
  ArrowRight,
} from 'lucide-react';
import { type ShopLicense } from '../App';

interface SettingsViewProps {
  currentShop?: ShopLicense;
  setupShopName: string;
  setupLocation: string;
  setupPhone: string;
  setupOrderMode: 'MANUAL_APPROVAL' | 'FULL_AUTOMATIC';
  setSetupOrderMode: (mode: 'MANUAL_APPROVAL' | 'FULL_AUTOMATIC') => void;
  onSaveSettings: (e: React.FormEvent) => void;
  onNavigateToServices: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentShop,
  setupShopName,
  setupLocation,
  setupPhone,
  setupOrderMode,
  setSetupOrderMode,
  onSaveSettings,
  onNavigateToServices,
}) => {
  return (
    <div className="pb-view">
      {/* Header */}
      <div className="pb-page-header">
        <div>
          <span className="pb-page-eyebrow">CONFIGURATION / PREFERENCES</span>
          <h1 className="pb-page-title">Workstation Settings</h1>
          <p className="pb-page-subtitle">
            Configure order dispatch automation, counter identity, and hardware binding preferences.
          </p>
        </div>
      </div>

      <div className="pb-settings-layout">
        {/* Settings Form */}
        <div className="pb-panel pb-settings-form-panel">
          <form onSubmit={onSaveSettings} className="pb-settings-form">
            <div className="pb-form-grid-2">
              <div className="pb-form-group">
                <label className="pb-form-label">
                  <Building size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  Shop Name
                </label>
                <input
                  type="text"
                  className="pb-input pb-input-readonly"
                  value={setupShopName}
                  readOnly
                  disabled
                  title="Provisioned from Station License"
                />
              </div>

              <div className="pb-form-group">
                <label className="pb-form-label">
                  <MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  Branch Location
                </label>
                <input
                  type="text"
                  className="pb-input pb-input-readonly"
                  value={setupLocation}
                  readOnly
                  disabled
                  title="Provisioned from Station License"
                />
              </div>
            </div>

            <div className="pb-form-group">
              <label className="pb-form-label">
                <Phone size={13} style={{ display: 'inline', marginRight: '4px' }} />
                Counter Contact Phone
              </label>
              <input
                type="text"
                className="pb-input pb-input-readonly"
                value={setupPhone}
                readOnly
                disabled
                title="Provisioned from Station License"
              />
              <span className="pb-form-hint">
                Shop identity attributes are cryptographically sealed to your Station License Key.
              </span>
            </div>

            {/* Order Dispatch Mode */}
            <div className="pb-form-group">
              <label className="pb-form-label">
                <Radio size={13} style={{ display: 'inline', marginRight: '4px' }} />
                Workstation Order Dispatch Mode
              </label>
              <select
                className="pb-select"
                value={setupOrderMode}
                onChange={(e) => setSetupOrderMode(e.target.value as 'MANUAL_APPROVAL' | 'FULL_AUTOMATIC')}
                style={{ width: '100%' }}
              >
                <option value="MANUAL_APPROVAL">
                  Manual Approval (Operator reviews &amp; approves before printing)
                </option>
                <option value="FULL_AUTOMATIC">
                  Full Automatic (Directly prints once customer UPI payment is verified)
                </option>
              </select>
              <span className="pb-form-hint">
                Switch anytime based on your counter rush. Manual approval allows previewing and approving each file.
              </span>
            </div>

            {/* Services Shortcut Box */}
            <div className="pb-settings-services-box">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div className="pb-badge-icon" style={{ background: 'var(--pb-desk-accent-subtle)', color: 'var(--pb-desk-accent)', width: '32px', height: '32px', borderRadius: '8px', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 750, color: 'var(--pb-desk-text)' }}>
                    Counter Services &amp; Custom Pricing
                  </h4>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--pb-desk-text-dim)', lineHeight: 1.4 }}>
                    Custom service catalog, pricing per page, and customer discount badges are managed in the dedicated Services section.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="pb-btn pb-btn-secondary pb-btn-sm"
                onClick={onNavigateToServices}
                style={{ flexShrink: 0 }}
              >
                <span>Open Services</span>
                <ArrowRight size={12} />
              </button>
            </div>

            <div style={{ marginTop: '12px' }}>
              <button type="submit" className="pb-btn pb-btn-primary">
                <Save size={14} /> Save Settings
              </button>
            </div>
          </form>
        </div>

        {/* Workstation Security & Hardware Details */}
        <div className="pb-panel pb-settings-info-panel">
          <div className="pb-card-header-icon-row" style={{ marginBottom: '16px' }}>
            <div className="pb-badge-icon" style={{ background: 'var(--pb-desk-success-subtle)', color: 'var(--pb-desk-success)', width: '36px', height: '36px', borderRadius: '8px', display: 'grid', placeItems: 'center' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="pb-panel-title">Hardware Station Identity</h3>
              <p className="pb-panel-subtitle">Windows Win32 Device Node</p>
            </div>
          </div>

          <div className="pb-settings-identity-rows">
            <div className="pb-identity-row">
              <span className="pb-identity-label">Hardware Device ID</span>
              <code className="pb-identity-code">{currentShop?.deviceId || 'Win32-SPOOLER-DEV01'}</code>
            </div>

            <div className="pb-identity-row">
              <span className="pb-identity-label">Station License Key</span>
              <code className="pb-identity-code">{currentShop?.licenseKey || 'PB-KEY-VERIFIED'}</code>
            </div>

            <div className="pb-identity-row">
              <span className="pb-identity-label">Plan Duration</span>
              <span className="pb-badge pb-badge-success">{currentShop?.duration || '1 Year'}</span>
            </div>

            <div className="pb-identity-row">
              <span className="pb-identity-label">Hardware Cryptographic Binding</span>
              <span className="pb-badge pb-badge-neutral">
                <Cpu size={11} /> SHA-256 Node Locked
              </span>
            </div>

            <div className="pb-identity-row">
              <span className="pb-identity-label">Spooler Architecture</span>
              <span className="pb-badge pb-badge-neutral">Tauri 2.0 Native x86_64</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

