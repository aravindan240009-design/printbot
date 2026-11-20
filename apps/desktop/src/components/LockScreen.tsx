import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  Eye,
  EyeOff,
  Clipboard,
  Cpu,
  Printer,
} from 'lucide-react';

interface LockScreenProps {
  loginUsername: string;
  setLoginUsername: (val: string) => void;
  loginKey: string;
  setLoginKey: (val: string) => void;
  handleKeyChange: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  isMfaRequired: boolean;
  adminMfaCode: string;
  setAdminMfaCode: (val: string) => void;
  loginError: string;
  lockoutUntil: Date | null;
  onUnifiedLogin: (e: React.FormEvent) => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  loginUsername,
  setLoginUsername,
  loginKey,
  setLoginKey,
  handleKeyChange,
  showPassword,
  setShowPassword,
  isMfaRequired,
  adminMfaCode,
  setAdminMfaCode,
  loginError,
  lockoutUntil,
  onUnifiedLogin,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLocked = Boolean(lockoutUntil && new Date() < lockoutUntil);
  const remainingSeconds = lockoutUntil ? Math.max(1, Math.ceil((lockoutUntil.getTime() - Date.now()) / 1000)) : 0;

  const handlePasteKey = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleKeyChange(text.trim());
      }
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    setIsSubmitting(true);
    try {
      await onUnifiedLogin(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-lockscreen-root">
      <div className="pb-lockscreen-card">
        {/* Workstation Header */}
        <div className="pb-lockscreen-header">
          <div className="pb-lockscreen-logo-badge">
            <Printer size={28} />
          </div>
          <h1 className="pb-lockscreen-title">Print Bot Workstation</h1>
          <p className="pb-lockscreen-subtitle">
            Counter Dispatch System · Windows Native Spooler
          </p>
        </div>

        {/* Error Alert */}
        {loginError && (
          <div className="pb-alert pb-alert-error" style={{ marginBottom: '16px' }}>
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span>{loginError}</span>
          </div>
        )}

        {/* Lockout Banner */}
        {isLocked && (
          <div className="pb-alert pb-alert-error" style={{ marginBottom: '16px' }}>
            <Lock size={15} style={{ flexShrink: 0 }} />
            <span>Too many failed attempts. Login locked for {remainingSeconds}s.</span>
          </div>
        )}

        {/* Unified Login Form */}
        <form onSubmit={handleSubmit} className="pb-lockscreen-form">
          <div className="pb-form-group">
            <label className="pb-form-label">
              Username or Account ID
            </label>
            <input
              type="text"
              className="pb-input"
              placeholder="e.g. shop-slug (Shop) or admin (Platform Admin)"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              disabled={isLocked}
              autoFocus
              required
            />
          </div>

          <div className="pb-form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="pb-form-label" style={{ margin: 0 }}>
                License Key or Admin Password
              </label>
              <button
                type="button"
                className="pb-btn-link"
                onClick={handlePasteKey}
                style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px', background: 'transparent', border: 0, color: 'var(--pb-desk-accent)', cursor: 'pointer', padding: 0 }}
              >
                <Clipboard size={11} /> Paste Key
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="pb-input"
                placeholder="Enter license key (PB-KEY-...) or admin password"
                value={loginKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                disabled={isLocked}
                style={{ paddingRight: '42px' }}
                required
              />
              <button
                type="button"
                className="pb-input-addon-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 0,
                  color: 'var(--pb-desk-text-dim)',
                  cursor: 'pointer',
                  padding: '6px',
                }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <span className="pb-form-hint">
              Shop Owners: Enter username &amp; key • Platform Admins: Enter admin username &amp; password
            </span>
          </div>

          {/* MFA TOTP code if required for admin */}
          {isMfaRequired && (
            <div className="pb-form-group">
              <label className="pb-form-label" style={{ color: 'var(--pb-desk-warning)' }}>
                Authenticator TOTP Code (6 Digits)
              </label>
              <input
                type="text"
                className="pb-input"
                maxLength={6}
                placeholder="000000"
                value={adminMfaCode}
                onChange={(e) => setAdminMfaCode(e.target.value.replace(/\D/g, ''))}
                style={{ letterSpacing: '4px', textAlign: 'center', fontWeight: 800, fontSize: '18px' }}
                autoFocus
                required
              />
            </div>
          )}

          {/* Hardware Binding Security Chip */}
          <div className="pb-lockscreen-info-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Cpu size={14} color="var(--pb-desk-accent)" />
              <strong style={{ fontSize: '11px', color: 'var(--pb-desk-text)' }}>
                Unified Hardware Node &amp; Cloud Security
              </strong>
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--pb-desk-text-dim)', lineHeight: 1.5 }}>
              Enter your Counter Station license or Super Administrator credentials. Authenticated sessions execute with local Win32 spooler privileges.
            </p>
          </div>

          {/* Unlock Submit Button */}
          <button
            type="submit"
            className="pb-btn pb-btn-primary pb-btn-lg"
            disabled={isLocked || isSubmitting}
            style={{ width: '100%', marginTop: '6px' }}
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <Unlock size={16} />
                <span>Sign In / Unlock Station</span>
              </>
            )}
          </button>
        </form>

        <div className="pb-lockscreen-footer">
          <span>Print Bot Commercial Suite</span>
          <span>•</span>
          <span>v2.4.0 Native</span>
        </div>
      </div>
    </div>
  );
};
