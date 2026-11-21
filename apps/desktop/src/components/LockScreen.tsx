import React, { useState } from 'react';
import {
  Printer,
  Lock,
  AlertTriangle,
  Eye,
  EyeOff,
  LogIn,
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

        {/* Simplified Login Form */}
        <form onSubmit={handleSubmit} className="pb-lockscreen-form">
          <div className="pb-form-group">
            <label className="pb-form-label">User Name</label>
            <input
              type="text"
              className="pb-input"
              placeholder="Enter user name"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              disabled={isLocked}
              autoFocus
              required
            />
          </div>

          <div className="pb-form-group">
            <label className="pb-form-label">License Key</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="pb-input"
                placeholder="Enter license key"
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
                aria-label={showPassword ? 'Hide license key' : 'Show license key'}
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
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
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

          {/* Sign In Button */}
          <button
            type="submit"
            className="pb-btn pb-btn-primary pb-btn-lg"
            disabled={isLocked || isSubmitting}
            style={{ width: '100%', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {isSubmitting ? (
              <span>Signing In...</span>
            ) : (
              <>
                <LogIn size={16} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
