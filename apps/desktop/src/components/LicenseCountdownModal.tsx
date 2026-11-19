import React from 'react';
import { Clock, AlertTriangle, ShieldAlert, X, RefreshCw, ArrowRight, Lock, Calendar } from 'lucide-react';
import type { LicenseExpiryInfo } from '../utils/licenseExpiry';

interface LicenseCountdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  expiryInfo: LicenseExpiryInfo;
  shopName: string;
  licenseKey: string;
  onOpenRenewalModal: () => void;
  onVerifyLicense: () => void;
  isVerifying?: boolean;
}

export const LicenseCountdownModal: React.FC<LicenseCountdownModalProps> = ({
  isOpen,
  onClose,
  expiryInfo,
  shopName,
  licenseKey,
  onOpenRenewalModal,
  onVerifyLicense,
  isVerifying = false,
}) => {
  if (!isOpen) return null;

  const isExpired = expiryInfo.status === 'EXPIRED';

  // Format hours, minutes, seconds for digital split display
  const totalSecs = Math.max(0, Math.floor(expiryInfo.remainingMs / 1000));
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  const hStr = String(hours).padStart(2, '0');
  const mStr = String(minutes).padStart(2, '0');
  const sStr = String(seconds).padStart(2, '0');

  return (
    <div
      className="pb-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
    >
      <div
        className="pb-modal-card"
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: isExpired
            ? '0 25px 50px -12px rgba(220, 38, 38, 0.35)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: isExpired ? '2px solid #ef4444' : '1px solid #e2e8f0',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            background: isExpired
              ? 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)'
              : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: isExpired ? '#ef4444' : '#f59e0b',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}
            >
              {isExpired ? <ShieldAlert size={24} /> : <Clock size={24} className="animate-pulse" />}
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
                {isExpired ? 'Print Bot License Expired' : 'License Expiration Countdown'}
              </h2>
              <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '2px' }}>
                {shopName} • Station License
              </div>
            </div>
          </div>

          {!isExpired && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title="Minimize to banner"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          {isExpired ? (
            /* Expired Content */
            <div>
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '20px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#fee2e2',
                    color: '#dc2626',
                    marginBottom: '10px',
                  }}
                >
                  <Lock size={26} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#991b1b', margin: '0 0 6px 0' }}>
                  License Has Expired
                </h3>
                <p style={{ fontSize: '13px', color: '#7f1d1d', margin: 0, lineHeight: 1.5 }}>
                  This counter workstation license expired on <strong>{expiryInfo.expiryDateDisplay}</strong>.
                  All incoming order processing, approval dispatch, and hardware printing have been immediately locked.
                </p>
              </div>

              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: '0 0 20px 0' }}>
                To continue using Print Bot, please renew your subscription. Upon renewal, your existing license expiry date will be extended and all features will be automatically restored without generating a new license key.
              </p>
            </div>
          ) : (
            /* 24-Hour Live Countdown Content */
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#dc2626',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  marginBottom: '14px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                <AlertTriangle size={15} />
                <span>Action Required: Less than 24 hours remaining</span>
              </div>

              {/* Digital Countdown Digits */}
              <div
                style={{
                  background: '#0f172a',
                  borderRadius: '12px',
                  padding: '20px 16px',
                  marginBottom: '20px',
                  boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.5)',
                  border: '1px solid #334155',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                  }}
                >
                  {/* Hours */}
                  <div style={{ textAlign: 'center', flex: '1 1 0' }}>
                    <div
                      style={{
                        background: '#1e293b',
                        borderRadius: '8px',
                        padding: '12px 6px',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        fontSize: '38px',
                        fontWeight: 900,
                        color: '#f87171',
                        letterSpacing: '0.02em',
                        border: '1px solid #334155',
                      }}
                    >
                      {hStr}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginTop: '6px', display: 'block' }}>
                      Hours
                    </span>
                  </div>

                  <span style={{ fontSize: '32px', fontWeight: 900, color: '#f87171', paddingBottom: '20px' }}>:</span>

                  {/* Minutes */}
                  <div style={{ textAlign: 'center', flex: '1 1 0' }}>
                    <div
                      style={{
                        background: '#1e293b',
                        borderRadius: '8px',
                        padding: '12px 6px',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        fontSize: '38px',
                        fontWeight: 900,
                        color: '#f87171',
                        letterSpacing: '0.02em',
                        border: '1px solid #334155',
                      }}
                    >
                      {mStr}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginTop: '6px', display: 'block' }}>
                      Minutes
                    </span>
                  </div>

                  <span style={{ fontSize: '32px', fontWeight: 900, color: '#f87171', paddingBottom: '20px' }}>:</span>

                  {/* Seconds */}
                  <div style={{ textAlign: 'center', flex: '1 1 0' }}>
                    <div
                      style={{
                        background: '#1e293b',
                        borderRadius: '8px',
                        padding: '12px 6px',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        fontSize: '38px',
                        fontWeight: 900,
                        color: '#f87171',
                        letterSpacing: '0.02em',
                        border: '1px solid #334155',
                      }}
                    >
                      {sStr}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginTop: '6px', display: 'block' }}>
                      Seconds
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', color: '#cbd5e1' }}>
                  Target Expiry: <strong>{expiryInfo.expiryDateDisplay}</strong>
                </div>
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  fontSize: '12.5px',
                  color: '#475569',
                  lineHeight: 1.5,
                }}
              >
                ⚠️ <strong>Notice:</strong> This live timer updates in real time and continues accurately even if the PrintBot application is closed and reopened. When the timer hits <strong>00:00:00</strong>, printing and order dispatching will halt immediately.
              </div>
            </div>
          )}

          {/* Current License Details Box */}
          <div
            style={{
              background: '#f1f5f9',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#334155',
            }}
          >
            <div>
              <span style={{ color: '#64748b' }}>License Key:</span>{' '}
              <strong style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>{licenseKey}</strong>
            </div>
            <div style={{ color: '#059669', fontWeight: 700 }}>
              Retained on Renewal
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onVerifyLicense}
              disabled={isVerifying}
              className="pb-btn pb-btn-secondary"
              style={{
                height: '40px',
                padding: '0 16px',
                fontSize: '12.5px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <RefreshCw size={14} className={isVerifying ? 'animate-spin' : ''} />
              {isVerifying ? 'Verifying with Cloud...' : 'Verify Cloud Renewal'}
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRenewalModal();
              }}
              className="pb-btn pb-btn-primary"
              style={{
                height: '40px',
                padding: '0 20px',
                fontSize: '13px',
                fontWeight: 800,
                background: isExpired ? '#dc2626' : '#2563eb',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>Renew License</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

