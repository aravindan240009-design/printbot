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
  Sparkles,
} from 'lucide-react';

interface LockScreenProps {
  loginUsername: string;
  setLoginUsername: (val: string) => void;
  loginKey: string;
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
  const [activeMode, setActiveMode] = useState<'OPERATOR' | 'ADMIN'>(
    loginUsername.trim().toLowerCase() === 'admin' ? 'ADMIN' : 'OPERATOR'
  );

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

  const switchMode = (mode: 'OPERATOR' | 'ADMIN') => {
    setActiveMode(mode);
    if (mode === 'ADMIN') {
      setLoginUsername('admin');
    } else {
      if (loginUsername.trim().toLowerCase() === 'admin') {
        setLoginUsername('');
      }
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

        {/* Role Selector Tabs */}
        <div className="pb-lockscreen-tabs">
          <button
            type="button"
            className={`pb-lockscreen-tab ${activeMode === 'OPERATOR' ? 'active' : ''}`}
            onClick={() => switchMode('OPERATOR')}
          >
            <KeyRound size={14} />
            <span>Shop Operator</span>
          </button>
          <button
            type="button"
            className={`pb-lockscreen-tab ${activeMode === 'ADMIN' ? 'active' : ''}`}
            onClick={() => switchMode('ADMIN')}
          >
            <ShieldCheck size={14} />
            <span>Platform Admin</span>
          </button>
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

        {/* Login Form */}
        <form onSubmit={onUnifiedLogin} className="pb-lockscreen-form">
          <div className="pb-form-group">
            <label className="pb-form-label">
              {activeMode === 'ADMIN' ? 'Administrator Account' : 'Counter Station Username'}
            </label>
            <input
              type="text"
              className="pb-input"
              placeholder={activeMode === 'ADMIN' ? 'admin' : 'e.g. ashwin, metro-xerox'}
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              disabled={activeMode === 'ADMIN'}
              autoFocus={activeMode === 'OPERATOR'}
              required
            />
          </div>

          <div className="pb-form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="pb-form-label" style={{ margin: 0 }}>
                {activeMode === 'ADMIN' ? 'Admin Master Password' : 'Station License Key'}
              </label>
              {activeMode === 'OPERATOR' && (
                <button
                  type="button"
                  className="pb-btn-link"
                  onClick={handlePasteKey}
                  style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px', background: 'transparent', border: 0, color: 'var(--pb-desk-accent)', cursor: 'pointer', padding: 0 }}
                >
                  <Clipboard size={11} /> Paste Key
                </button>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="pb-input"
                placeholder={activeMode === 'ADMIN' ? 'Enter admin password' : 'PB-KEY-2026-XXXX'}
                value={loginKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                disabled={isLocked}
                style={{ paddingRight: '42px', fontFamily: activeMode === 'OPERATOR' ? 'var(--pb-font-mono)' : 'inherit' }}
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
            {activeMode === 'OPERATOR' && (
              <span className="pb-form-hint">
                Format: <code>PB-KEY-YEAR-TOKEN</code> (auto-capitalized on typing)
              </span>
            )}
          </div>

          {/* MFA TOTP code if required for admin */}
          {isMfaRequired && activeMode === 'ADMIN' && (
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
                Hardware Node Protection
              </strong>
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--pb-desk-text-dim)', lineHeight: 1.5 }}>
              {activeMode === 'OPERATOR'
                ? 'Your license key is cryptographically bound to this physical workstation. Spooler commands execute with local Win32 privileges.'
                : 'Super administrative access with cloud management, licensing control, and platform configuration.'}
            </p>
          </div>

          {/* Unlock Submit Button */}
          <button
            type="submit"
            className="pb-btn pb-btn-primary pb-btn-lg"
            disabled={isLocked}
            style={{ width: '100%', marginTop: '6px' }}
          >
            <Unlock size={16} />
            <span>{activeMode === 'OPERATOR' ? 'Unlock Counter Station' : 'Authenticate Admin Session'}</span>
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

