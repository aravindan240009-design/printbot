import React from 'react';
import { AlertTriangle, Clock, RefreshCw, Sparkles, X, ShieldAlert } from 'lucide-react';
import type { LicenseExpiryInfo } from '../utils/licenseExpiry';

interface LicenseExpiryBannerProps {
  expiryInfo: LicenseExpiryInfo;
  onOpenRenewalModal: () => void;
  onVerifyLicense: () => void;
  isVerifying?: boolean;
  onOpenCountdownModal?: () => void;
}

export const LicenseExpiryBanner: React.FC<LicenseExpiryBannerProps> = ({
  expiryInfo,
  onOpenRenewalModal,
  onVerifyLicense,
  isVerifying = false,
  onOpenCountdownModal,
}) => {
  // If lifetime or normal active (> 72 hours), do not show any banner
  if (expiryInfo.status === 'LIFETIME' || expiryInfo.status === 'ACTIVE') {
    return null;
  }

  // 1. Expired State Banner
  if (expiryInfo.status === 'EXPIRED') {
    return (
      <div
        className="pb-license-banner-expired"
        style={{
          padding: '12px 20px',
          background: 'linear-gradient(90deg, #7f1d1d 0%, #991b1b 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          fontSize: '13px',
          fontWeight: 600,
          borderBottom: '2px solid #b91c1c',
          boxShadow: '0 4px 12px rgba(185, 28, 28, 0.25)',
          zIndex: 40,
        }}
        role="alert"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.2)',
              flexShrink: 0,
            }}
          >
            <ShieldAlert size={20} color="#fecaca" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '13.5px', letterSpacing: '0.01em', color: '#fef2f2' }}>
              LICENSE EXPIRED — ORDER PROCESSING &amp; PRINTING DISABLED
            </div>
            <div style={{ fontSize: '12px', color: '#fca5a5', marginTop: '1px' }}>
              Your Print Bot license expired on {expiryInfo.expiryDateDisplay}. License renewal is required to resume counter operations.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={onVerifyLicense}
            disabled={isVerifying}
            className="pb-btn pb-btn-secondary pb-btn-sm"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              fontSize: '11.5px',
              height: '30px',
              gap: '6px',
            }}
            title="Check if an administrator has renewed your license in the cloud"
          >
            <RefreshCw size={13} className={isVerifying ? 'animate-spin' : ''} />
            {isVerifying ? 'Verifying...' : 'Verify Renewal'}
          </button>

          <button
            type="button"
            onClick={onOpenRenewalModal}
            className="pb-btn pb-btn-primary pb-btn-sm"
            style={{
              background: '#ffffff',
              color: '#991b1b',
              fontWeight: 800,
              fontSize: '12px',
              height: '30px',
              padding: '0 14px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}
          >
            Renew License Now →
          </button>
        </div>
      </div>
    );
  }

  // 2. Final 24 Hours Countdown Banner (Urgent Red/Orange with Live Ticking Timer)
  if (expiryInfo.status === 'COUNTDOWN_24H') {
    return (
      <div
        className="pb-license-banner-countdown"
        style={{
          padding: '11px 20px',
          background: 'linear-gradient(90deg, #450a0a 0%, #7f1d1d 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          fontSize: '13px',
          fontWeight: 600,
          borderBottom: '2px solid #ef4444',
          boxShadow: '0 3px 10px rgba(239, 68, 68, 0.2)',
          zIndex: 40,
        }}
        role="alert"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#ef4444',
              color: '#ffffff',
              flexShrink: 0,
            }}
          >
            <Clock size={19} className="animate-pulse" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontWeight: 800, color: '#fca5a5', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>
                Final 24 Hours Notice
              </span>
              <div style={{ color: '#ffffff', fontSize: '12.5px' }}>
                License expires on <strong>{expiryInfo.expiryDateDisplay}</strong>. Printing will lock upon expiry.
              </div>
            </div>

            {/* Live Ticking Countdown Box */}
            <div
              onClick={onOpenCountdownModal}
              title="Click to view full countdown popup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(239, 68, 68, 0.6)',
                borderRadius: '6px',
                padding: '4px 12px',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '11px', color: '#fca5a5', textTransform: 'uppercase', fontWeight: 700 }}>
                Remaining:
              </span>
              <span
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontSize: '16px',
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                  color: '#ffffff',
                  textShadow: '0 0 10px rgba(239, 68, 68, 0.7)',
                }}
              >
                {expiryInfo.formattedCountdown}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={onVerifyLicense}
            disabled={isVerifying}
            className="pb-btn pb-btn-secondary pb-btn-sm"
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              borderColor: 'rgba(255, 255, 255, 0.25)',
              fontSize: '11.5px',
              height: '30px',
              gap: '6px',
            }}
            title="Refresh license status from server"
          >
            <RefreshCw size={13} className={isVerifying ? 'animate-spin' : ''} />
            {isVerifying ? 'Checking...' : 'Verify'}
          </button>

          <button
            type="button"
            onClick={onOpenRenewalModal}
            className="pb-btn pb-btn-primary pb-btn-sm"
            style={{
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              fontSize: '12px',
              height: '30px',
              padding: '0 14px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            }}
          >
            Renew License →
          </button>
        </div>
      </div>
    );
  }

  // 3. Exactly 3 Days (72 Hours) Warning Banner (Amber Warning Notice)
  // Displayed between 72 hours and 24 hours before license expires
  return (
    <div
      className="pb-license-banner-warning"
      style={{
        padding: '10px 20px',
        background: '#fffbeb',
        color: '#92400e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px',
        fontSize: '13px',
        fontWeight: 600,
        borderBottom: '1px solid #fde68a',
        boxShadow: '0 2px 6px rgba(245, 158, 11, 0.08)',
        zIndex: 40,
      }}
      role="alert"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: '#fef3c7',
            color: '#d97706',
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={17} />
        </span>
        <div>
          <span>
            <strong>License Expiring Soon:</strong> Your Print Bot workstation license expires in{' '}
            <strong>{expiryInfo.daysRemaining === 1 ? '1 day' : `${expiryInfo.daysRemaining} days`} ({expiryInfo.hoursRemaining} hours)</strong> on{' '}
            <strong>{expiryInfo.expiryDateDisplay}</strong>. Please renew your license to ensure continuous service.
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={onVerifyLicense}
          disabled={isVerifying}
          className="pb-btn pb-btn-secondary pb-btn-sm"
          style={{
            background: '#ffffff',
            borderColor: '#fcd34d',
            color: '#92400e',
            fontSize: '11.5px',
            height: '28px',
            gap: '5px',
          }}
          title="Verify if renewal was recently applied"
        >
          <RefreshCw size={12} className={isVerifying ? 'animate-spin' : ''} />
          {isVerifying ? 'Verifying...' : 'Verify'}
        </button>

        <button
          type="button"
          onClick={onOpenRenewalModal}
          className="pb-btn pb-btn-sm"
          style={{
            background: '#d97706',
            color: '#ffffff',
            border: 'none',
            fontSize: '11.5px',
            fontWeight: 750,
            height: '28px',
            padding: '0 12px',
          }}
        >
          Renew License →
        </button>
      </div>
    </div>
  );
};

