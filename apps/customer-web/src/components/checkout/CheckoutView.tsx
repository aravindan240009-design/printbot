import React, { useState } from 'react';
import {
  CreditCard,
  Printer,
  ShieldCheck,
  ArrowRight,
  User,
  Phone,
  MessageSquare,
  MapPin,
  RefreshCw,
  Lock,
  Zap,
} from 'lucide-react';
import { DocumentItem, ServerQuote, ShopSession } from '../../types';
import { TranslationKeys } from '../../locales';
import type { PaymentIntent } from '../../api';

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

interface CheckoutViewProps {
  files: DocumentItem[];
  quote: ServerQuote | null;
  quoteStatus: 'idle' | 'loading' | 'ready' | 'error';
  quoteError: string;
  session: ShopSession;
  onPreparePaymentOrder: (customerDetails: {
    customerName: string;
    customerPhone: string;
    notes: string;
  }) => Promise<PaymentIntent>;
  onConfirmOrder: (orderDetails: {
    customerName: string;
    customerPhone: string;
    notes: string;
    paymentMethod: 'upi' | 'cash';
    paymentId?: string;
    orderId?: string;
  }) => void;
  onBack: () => void;
  t: TranslationKeys;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  files,
  quote,
  quoteStatus,
  quoteError,
  session,
  onPreparePaymentOrder,
  onConfirmOrder,
  onBack,
  t,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash'>('upi');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const amount = quote ? quote.total_rupees.toFixed(2) : '--';

  const handleRazorpayCheckout = async () => {
    if (files.length !== 1 || quoteStatus !== 'ready' || !quote) {
      alert('Wait for a server price and checkout one document at a time.');
      return;
    }
    setIsProcessingPayment(true);
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      alert('Unable to load Razorpay payment gateway. Please check your internet connection.');
      setIsProcessingPayment(false);
      return;
    }

    let paymentIntent: PaymentIntent;
    try {
      paymentIntent = await onPreparePaymentOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        notes: notes.trim(),
      });
    } catch (error) {
      console.error('Unable to prepare server-verified payment:', error);
      alert(error instanceof Error ? error.message : 'Unable to prepare secure payment. Please try again.');
      setIsProcessingPayment(false);
      return;
    }

    const options: any = {
      key: paymentIntent.client_secret,
      ...(paymentIntent.payment_intent_id ? { order_id: paymentIntent.payment_intent_id } : {}),
      amount: paymentIntent.amount_paise,
      currency: paymentIntent.currency,
      name: session.shop_name || 'Print Bot',
      description: `Print Order (${quote?.total_physical_sheets || 1} Sheets / ₹${amount})`,
      image: '/favicon.svg',
      handler: function (response: any) {
        setIsProcessingPayment(false);
        onConfirmOrder({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          notes: notes.trim(),
          paymentMethod: 'upi',
          paymentId: response.razorpay_payment_id,
          orderId: paymentIntent.order_id,
        });
      },
      prefill: {
        name: customerName.trim() || undefined,
        contact: customerPhone.trim() || undefined,
      },
      notes: {
        shop_id: session.shop_id,
        shop_slug: session.shop_slug,
        order_id: paymentIntent.order_id,
      },
      theme: {
        color: '#2563eb',
      },
      modal: {
        ondismiss: function () {
          setIsProcessingPayment(false);
        },
      },
    };

    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (errResp: any) {
        alert(`Payment Failed: ${errResp?.error?.description || 'Transaction declined'}`);
        setIsProcessingPayment(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Razorpay launch error:', err);
      alert('Unable to launch Razorpay gateway. Please try again.');
      setIsProcessingPayment(false);
    }
  };

  const handleSubmit = () => {
    if (files.length !== 1 || quoteStatus !== 'ready' || !quote) {
      alert('Wait for a server price and checkout one document at a time.');
      return;
    }
    if (paymentMethod === 'upi') {
      handleRazorpayCheckout();
    } else {
      onConfirmOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        notes: notes.trim(),
        paymentMethod,
      });
    }
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

      {quoteStatus === 'loading' && (
        <p role="status" style={{ color: 'var(--pb-muted)' }}>
          Getting the current price from the shop server...
        </p>
      )}
      {quoteStatus === 'error' && <p role="alert" style={{ color: 'var(--pb-danger)' }}>{quoteError}</p>}
      {files.length !== 1 && (
        <p role="alert" style={{ color: 'var(--pb-danger)' }}>
          Checkout currently accepts one document per order. Remove the other documents and checkout them separately.
        </p>
      )}

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
            style={{ textAlign: 'left', alignItems: 'flex-start', padding: '18px', position: 'relative' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 750 }}>
                <CreditCard size={20} color="var(--pb-brand)" />
                <span>UPI / Online Payment</span>
              </div>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#059669',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <Zap size={10} />
                Fastest
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#2563eb', fontSize: '0.82rem', fontWeight: 700, margin: '2px 0 4px' }}>
              <span>{t.instantAutoPrint || '⚡ Instant Auto-Print'}</span>
            </div>
            <span className="pb-pill-subtext" style={{ textAlign: 'left' }}>
              {t.fastestNoWaiting || 'Direct to printer • Zero waiting in counter queue'}
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
              <span>{t.payCashCounter || t.payCashTitle}</span>
            </div>
            <span className="pb-pill-subtext" style={{ textAlign: 'left', marginTop: '6px' }}>
              {t.payCashDesc || t.payCashSubtitle}
            </span>
          </button>
        </div>

        {/* Razorpay Online Gateway Card (QR Completely Removed) */}
        {paymentMethod === 'upi' && (
          <div
            style={{
              marginTop: '24px',
              padding: '28px 24px',
              borderRadius: 'var(--pb-radius-xl)',
              background: 'linear-gradient(180deg, rgba(2, 132, 199, 0.04) 0%, rgba(37, 99, 235, 0.08) 100%)',
              border: '1.5px solid rgba(37, 99, 235, 0.25)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '999px',
                background: 'rgba(37, 99, 235, 0.1)',
                color: '#2563eb',
                fontSize: '0.82rem',
                fontWeight: 750,
                marginBottom: '16px',
              }}
            >
              <ShieldCheck size={16} />
              <span>Razorpay Official Payment Gateway • 256-bit SSL Secured</span>
            </div>

            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                marginBottom: '8px',
                fontFamily: 'Outfit, sans-serif',
                color: 'var(--pb-text)',
              }}
            >
              Pay ₹{amount} Online
            </div>
            <p
              style={{
                fontSize: '0.92rem',
                color: 'var(--pb-muted)',
                marginBottom: '20px',
                maxWidth: '460px',
                margin: '0 auto 20px',
                lineHeight: 1.5,
              }}
            >
              Fast and automated verification. Instant dispatch to workstation queue with live progress tracking.
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                marginBottom: '24px',
              }}
            >
              <span className="pb-upi-app-pill">Google Pay</span>
              <span className="pb-upi-app-pill">PhonePe</span>
              <span className="pb-upi-app-pill">Paytm</span>
              <span className="pb-upi-app-pill">CRED / Any UPI</span>
              <span className="pb-upi-app-pill">Debit / Credit Card</span>
              <span className="pb-upi-app-pill">NetBanking</span>
            </div>

            <div>
              <button
                type="button"
                onClick={handleRazorpayCheckout}
                disabled={isProcessingPayment || quoteStatus !== 'ready' || !quote || files.length !== 1}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  width: '100%',
                  maxWidth: '380px',
                  padding: '16px 24px',
                  borderRadius: 'var(--pb-radius-lg)',
                  background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
                  boxShadow: '0 6px 20px rgba(37, 99, 235, 0.35)',
                }}
              >
                {isProcessingPayment ? (
                  <>
                    <RefreshCw size={20} className="pb-spin" />
                    <span>Opening Razorpay Secure Gateway...</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={20} />
                    <span>Pay ₹{amount} with Razorpay</span>
                  </>
                )}
              </button>
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
          disabled={isProcessingPayment || quoteStatus !== 'ready' || !quote || files.length !== 1}
        >
          {isProcessingPayment ? (
            <>
              <RefreshCw size={18} className="pb-spin" />
              <span>Processing Payment...</span>
            </>
          ) : (
            <>
              <span>{paymentMethod === 'upi' ? `Pay ₹${amount} with Razorpay` : t.payCashButton}</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

