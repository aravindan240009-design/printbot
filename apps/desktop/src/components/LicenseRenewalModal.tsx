import React, { useState } from 'react';
import { KeyRound, Calendar, CheckCircle2, RefreshCw, X, ShieldCheck, Sparkles, Phone, CreditCard, ArrowRight } from 'lucide-react';
import type { LicenseExpiryInfo } from '../utils/licenseExpiry';

interface LicenseRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopName: string;
  username: string;
  licenseKey: string;
  currentExpiresAt: string;
  expiryInfo: LicenseExpiryInfo;
  onExtendLicense: (username: string, duration: '1 Month' | '1 Year') => Promise<void> | void;
  onVerifyLicense: () => Promise<void> | void;
  isVerifying?: boolean;
}

export const LicenseRenewalModal: React.FC<LicenseRenewalModalProps> = ({
  isOpen,
  onClose,
  shopName,
  username,
  licenseKey,
  currentExpiresAt,
  expiryInfo,
  onExtendLicense,
  onVerifyLicense,
  isVerifying = false,
}) => {
  const [selectedDuration, setSelectedDuration] = useState<'1 Month' | '1 Year'>('1 Year');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate prospective new expiry date based on selection
  const now = new Date();
  const baseDate = expiryInfo.expiryDate && expiryInfo.expiryDate > now
    ? new Date(expiryInfo.expiryDate)
    : new Date(now);

  const prospectiveDate = new Date(baseDate);
  if (selectedDuration === '1 Month') {
    prospectiveDate.setDate(prospectiveDate.getDate() + 30);
  } else {
    prospectiveDate.setFullYear(prospectiveDate.getFullYear() + 1);
  }
  const prospectiveStr = prospectiveDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handleConfirmRenewal = async () => {
    setIsSubmitting(true);
    try {
      await onExtendLicense(username, selectedDuration);
      setSuccessMessage(`License successfully extended by ${selectedDuration}! New expiry date: ${prospectiveStr}.`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      alert(`License renewal failed: ${err?.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        zIndex: 10000,
        padding: '20px',
      }}
    >
      <div
        className="pb-modal-card"
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '540px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#2563eb',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                Renew Station License
              </h2>
              <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '2px' }}>
                {shopName} • Existing License Key Retained
              </div>
            </div>
          </div>

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
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {successMessage ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                background: '#ecfdf5',
                borderRadius: '12px',
                border: '1px solid #a7f3d0',
                color: '#065f46',
              }}
            >
              <CheckCircle2 size={44} color="#059669" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 6px 0' }}>
                License Successfully Renewed!
              </h3>
              <p style={{ fontSize: '13.5px', margin: 0, lineHeight: 1.5 }}>
                {successMessage}
              </p>
            </div>
          ) : (
            <>
              {/* License Summary Card */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12.5px' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                      Shop Counter
                    </span>
                    <div style={{ fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>{shopName}</div>
                  </div>

                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                      Current Expiry Date
                    </span>
                    <div style={{ fontWeight: 700, color: expiryInfo.isExpired ? '#dc2626' : '#1e293b', marginTop: '2px' }}>
                      {expiryInfo.expiryDateDisplay}
                    </div>
                  </div>

                  <div style={{ gridColumn: 'span 2', marginTop: '4px' }}>
                    <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                      License Key (Preserved &amp; Extended)
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '4px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#0f172a',
                      }}
                    >
                      <span>{licenseKey}</span>
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#059669',
                          background: '#ecfdf5',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontWeight: 700,
                        }}
                      >
                        ✓ Same Key Extends
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Renewal Duration Selector */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Select Renewal Duration
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedDuration('1 Month')}
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      border: selectedDuration === '1 Month' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      background: selectedDuration === '1 Month' ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '14px', color: selectedDuration === '1 Month' ? '#1d4ed8' : '#1e293b' }}>
                      1 Month Extension
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px' }}>
                      +30 Days from {expiryInfo.isExpired ? 'Today' : 'Current Expiry'}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedDuration('1 Year')}
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      border: selectedDuration === '1 Year' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      background: selectedDuration === '1 Year' ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      position: 'relative',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '8px',
                        background: '#059669',
                        color: '#ffffff',
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      RECOMMENDED
                    </span>
                    <div style={{ fontWeight: 800, fontSize: '14px', color: selectedDuration === '1 Year' ? '#1d4ed8' : '#1e293b' }}>
                      1 Year Extension
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px' }}>
                      +365 Days from {expiryInfo.isExpired ? 'Today' : 'Current Expiry'}
                    </div>
                  </button>
                </div>

                <div
                  style={{
                    marginTop: '12px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#f1f5f9',
                    fontSize: '12.5px',
                    color: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>New Expiry After Renewal:</span>
                  <strong style={{ color: '#059669', fontSize: '13px' }}>{prospectiveStr}</strong>
                </div>
              </div>

              {/* Renewal Notice Note */}
              <div
                style={{
                  fontSize: '11.5px',
                  color: '#64748b',
                  lineHeight: 1.5,
                  marginBottom: '24px',
                  background: '#fafafa',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px dashed #cbd5e1',
                }}
              >
                💡 <strong>Continuous Operation:</strong> Extending your license updates the existing counter subscription date in both the local workstation and the central database. You do not need to reconfigure printers or change your license key.
              </div>

              {/* Action Buttons */}
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
                    gap: '6px',
                  }}
                  title="If your administrator already renewed your license, verify it now"
                >
                  <RefreshCw size={13} className={isVerifying ? 'animate-spin' : ''} />
                  {isVerifying ? 'Verifying...' : 'Verify Cloud Renewal'}
                </button>

                <button
                  type="button"
                  onClick={handleConfirmRenewal}
                  disabled={isSubmitting}
                  className="pb-btn pb-btn-primary"
                  style={{
                    height: '40px',
                    padding: '0 20px',
                    fontSize: '13px',
                    fontWeight: 800,
                    background: '#2563eb',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {isSubmitting ? (
                    'Extending License...'
                  ) : (
                    <>
                      <span>Extend License (+{selectedDuration})</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

