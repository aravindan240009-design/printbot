import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Printer,
  Check,
  Copy,
  Clock,
  ShieldCheck,
  ArrowRight,
  User,
  Phone,
  MessageSquare,
  ExternalLink,
  MapPin,
} from 'lucide-react';
import { DocumentItem, ServerQuote, ShopSession } from '../../types';
import { TranslationKeys } from '../../locales';

interface CheckoutViewProps {
  files: DocumentItem[];
  quote: ServerQuote | null;
  session: ShopSession;
  onConfirmOrder: (orderDetails: {
    customerName: string;
    customerPhone: string;
    notes: string;
    paymentMethod: 'upi' | 'cash';
  }) => void;
  onBack: () => void;
  t: TranslationKeys;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  files,
  quote,
  session,
  onConfirmOrder,
  onBack,
  t,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash'>('upi');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 mins

  const amount = quote ? quote.total_rupees.toFixed(2) : '0.00';
  const vpa = 'quickxerox@okaxis';
  const upiIntentUrl = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(session.shop_name || 'PrintBot')}&am=${amount}&cu=INR&tn=${encodeURIComponent('Print order at ' + session.shop_name)}`;

  // Countdown timer for UPI session
  useEffect(() => {
    if (paymentMethod !== 'upi') return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [paymentMethod]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleCopyVpa = () => {
    navigator.clipboard?.writeText(vpa);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const handleSubmit = () => {
    onConfirmOrder({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      notes: notes.trim(),
      paymentMethod,
    });
  };

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '16px 0' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '6px' }}>
          {t.checkoutTitle}
        </h2>
        <p style={{ color: 'var(--pb-muted)', fontSize: '0.92rem' }}>
          Finalize your order for immediate dispatch to <strong>{session.shop_name}</strong>.
        </p>
      </div>

      {/* Destination & Order Summary Ribbon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderRadius: 'var(--pb-radius-lg)',
          background: 'var(--pb-surface-alt)',
          border: '1px solid var(--pb-border)',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MapPin size={18} color="var(--pb-brand)" />
          <div>
            <strong style={{ display: 'block', fontSize: '0.92rem' }}>{session.shop_name}</strong>
            <span style={{ fontSize: '0.78rem', color: 'var(--pb-muted)' }}>
              {session.shop_address || 'Main Stand, Chennai'}
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--pb-muted)', display: 'block' }}>Order Total</span>
          <strong style={{ fontSize: '1.4rem', color: 'var(--pb-brand)', fontFamily: 'Outfit, sans-serif' }}>
            ₹{amount}
          </strong>
        </div>
      </div>

      {/* Optional Contact Details */}
      <div
        style={{
          padding: '24px',
          borderRadius: 'var(--pb-radius-xl)',
          border: '1px solid var(--pb-border)',
          background: 'var(--pb-surface)',
          marginBottom: '20px',
          boxShadow: 'var(--pb-shadow-sm)',
        }}
      >
        <h3
          style={{
            fontSize: '1.1rem',
            fontWeight: 750,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <User size={18} color="var(--pb-brand)" />
          <span>{t.contactInfoOptional}</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div className="pb-form-group" style={{ marginBottom: 0 }}>
            <label className="pb-form-label" htmlFor="checkout-customer-name">
              {t.customerNamePlaceholder}
            </label>
            <input
              id="checkout-customer-name"
              type="text"
              className="pb-input-control"
              placeholder="e.g. Ramesh Kumar"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div className="pb-form-group" style={{ marginBottom: 0 }}>
            <label className="pb-form-label" htmlFor="checkout-customer-phone">
              {t.customerPhonePlaceholder}
            </label>
            <input
              id="checkout-customer-phone"
              type="tel"
              className="pb-input-control"
              placeholder="10-digit mobile number"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="pb-form-group" style={{ marginTop: '16px', marginBottom: 0 }}>
          <label className="pb-form-label" htmlFor="checkout-customer-notes">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={15} />
              Special Instructions for Counter Staff
            </span>
          </label>
          <input
            id="checkout-customer-notes"
            type="text"
            className="pb-input-control"
            placeholder={t.counterNotePlaceholder}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      {/* Payment Method Selector */}
      <div
        style={{
          padding: '24px',
          borderRadius: 'var(--pb-radius-xl)',
          border: '1px solid var(--pb-border)',
          background: 'var(--pb-surface)',
          marginBottom: '24px',
          boxShadow: 'var(--pb-shadow-sm)',
        }}
      >
        <h3 style={{ fontSize: '1.1rem', fontWeight: 750, marginBottom: '16px' }}>
          {t.paymentMethod}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          <button
            type="button"
            className={`pb-pill-choice ${paymentMethod === 'upi' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('upi')}
            style={{ textAlign: 'left', alignItems: 'flex-start', padding: '18px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 750 }}>
              <QrCode size={20} color="var(--pb-brand)" />
              <span>{t.payUpiTitle}</span>
            </div>
            <span className="pb-pill-subtext" style={{ textAlign: 'left', marginTop: '4px' }}>
              {t.payUpiSubtitle}
            </span>
          </button>

          <button
            type="button"
            className={`pb-pill-choice ${paymentMethod === 'cash' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('cash')}
            style={{ textAlign: 'left', alignItems: 'flex-start', padding: '18px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 750 }}>
              <Printer size={20} color="var(--pb-brand)" />
              <span>{t.payCashTitle}</span>
            </div>
            <span className="pb-pill-subtext" style={{ textAlign: 'left', marginTop: '4px' }}>
              {t.payCashSubtitle}
            </span>
          </button>
        </div>

        {/* UPI QR Display Container */}
        {paymentMethod === 'upi' && (
          <div style={{ marginTop: '28px', textAlign: 'center' }}>
            <div className="pb-upi-countdown-timer">
              <Clock size={14} />
              <span>
                {t.upiCountdown} {formatTimer(timeLeft)}
              </span>
            </div>

            {/* Simulated UPI QR Code SVG */}
            <div className="pb-qr-canvas-holder" style={{ display: 'inline-block', margin: '0 auto 16px' }}>
              <svg width="180" height="180" viewBox="0 0 180 180" style={{ display: 'block' }}>
                <rect width="180" height="180" fill="#ffffff" />
                {/* 3 Position Detection Patterns */}
                <rect x="15" y="15" width="45" height="45" fill="#0f172a" rx="4" />
                <rect x="23" y="23" width="29" height="29" fill="#ffffff" rx="2" />
                <rect x="29" y="29" width="17" height="17" fill="#2563eb" rx="2" />

                <rect x="120" y="15" width="45" height="45" fill="#0f172a" rx="4" />
                <rect x="128" y="23" width="29" height="29" fill="#ffffff" rx="2" />
                <rect x="134" y="29" width="17" height="17" fill="#2563eb" rx="2" />

                <rect x="15" y="120" width="45" height="45" fill="#0f172a" rx="4" />
                <rect x="23" y="128" width="29" height="29" fill="#ffffff" rx="2" />
                <rect x="29" y="134" width="17" height="17" fill="#2563eb" rx="2" />

                {/* Simulated Data Dots */}
                <circle cx="90" cy="90" r="14" fill="#2563eb" />
                <rect x="70" y="25" width="10" height="10" fill="#0f172a" />
                <rect x="85" y="35" width="10" height="10" fill="#0f172a" />
                <rect x="75" y="60" width="10" height="10" fill="#0f172a" />
                <rect x="95" y="65" width="10" height="10" fill="#0f172a" />
                <rect x="30" y="75" width="10" height="10" fill="#0f172a" />
                <rect x="50" y="85" width="10" height="10" fill="#0f172a" />
                <rect x="125" y="75" width="10" height="10" fill="#0f172a" />
                <rect x="140" y="90" width="10" height="10" fill="#0f172a" />
                <rect x="75" y="125" width="10" height="10" fill="#0f172a" />
                <rect x="90" y="140" width="10" height="10" fill="#0f172a" />
                <rect x="125" y="130" width="10" height="10" fill="#0f172a" />
                <rect x="145" y="145" width="10" height="10" fill="#0f172a" />
              </svg>
            </div>

            <div style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '6px', fontFamily: 'Outfit, sans-serif' }}>
              Pay ₹{amount} via UPI
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--pb-muted)', marginBottom: '16px' }}>
              {t.upiScanHeadline}
            </p>

            <div className="pb-upi-vpa-row" style={{ display: 'inline-flex' }}>
              <span>{vpa}</span>
              <button
                type="button"
                onClick={handleCopyVpa}
                style={{
                  border: 0,
                  background: 'transparent',
                  color: 'var(--pb-brand)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                }}
              >
                {copiedVpa ? <Check size={14} color="var(--pb-success)" /> : <Copy size={14} />}
                <span>{copiedVpa ? t.upiCopied : t.upiCopy}</span>
              </button>
            </div>

            <div style={{ margin: '14px 0' }}>
              <a
                href={upiIntentUrl}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 18px',
                  borderRadius: 'var(--pb-radius-full)',
                  background: 'var(--pb-brand-soft)',
                  color: 'var(--pb-brand)',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  border: '1px solid var(--pb-brand-border)',
                }}
              >
                <span>Open UPI App on Phone</span>
                <ExternalLink size={14} />
              </a>
            </div>

            <div className="pb-upi-apps-grid">
              <span className="pb-upi-app-pill">Google Pay</span>
              <span className="pb-upi-app-pill">PhonePe</span>
              <span className="pb-upi-app-pill">Paytm</span>
              <span className="pb-upi-app-pill">BHIM UPI</span>
            </div>
          </div>
        )}

        {/* Cash Notice */}
        {paymentMethod === 'cash' && (
          <div
            style={{
              padding: '18px 20px',
              borderRadius: 'var(--pb-radius-lg)',
              background: 'var(--pb-warning-soft)',
              border: '1px solid var(--pb-warning-border)',
              color: 'var(--pb-warning)',
              fontSize: '0.9rem',
              lineHeight: 1.55,
              marginTop: '18px',
            }}
          >
            <strong>Cash at Counter:</strong> Your files will be transmitted to the shop queue on hold.
            Simply proceed to the counter, show your 4-digit pickup PIN, and pay <strong>₹{amount}</strong> in cash to release your print.
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            minHeight: '52px',
            padding: '12px 24px',
            borderRadius: 'var(--pb-radius-md)',
            border: '1px solid var(--pb-border-strong)',
            background: 'var(--pb-surface)',
            color: 'var(--pb-text)',
            fontWeight: 650,
            cursor: 'pointer',
          }}
        >
          {t.backButton}
        </button>

        <button
          type="button"
          className="pb-btn-primary"
          style={{ flex: 1, minHeight: '52px', minWidth: '240px', fontSize: '1rem' }}
          onClick={handleSubmit}
        >
          <span>{paymentMethod === 'upi' ? t.upiVerifyButton : t.payCashButton}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

