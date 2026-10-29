import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Printer,
  RotateCcw,
  Download,
  Sparkles,
  FileText,
  Copy,
  Check,
  MapPin,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { PlacedOrder } from '../../types';
import { TranslationKeys } from '../../locales';

interface OrderTrackerProps {
  order: PlacedOrder;
  onPrintAnother: () => void;
  t: TranslationKeys;
}

export const OrderTracker: React.FC<OrderTrackerProps> = ({ order, onPrintAnother, t }) => {
  const [copiedPin, setCopiedPin] = useState(false);

  const steps = [
    { key: 'received', label: t.statusReceived, icon: <CheckCircle2 size={16} /> },
    { key: 'spooled', label: t.statusSpooled, icon: <Printer size={16} /> },
    { key: 'printing', label: t.statusPrinting, icon: <Clock size={16} /> },
    { key: 'ready', label: t.statusReady, icon: <Sparkles size={16} /> },
  ];

  // Map order status to active step index
  const getActiveStepIndex = () => {
    switch (order.status) {
      case 'PENDING_PAYMENT':
      case 'ORDER_RECEIVED':
        return 0;
      case 'SPOOLING':
        return 1;
      case 'PRINTING':
        return 2;
      case 'READY_FOR_PICKUP':
      case 'COMPLETED':
        return 3;
      default:
        return 0;
    }
  };

  const currentStep = getActiveStepIndex();

  const handleCopyPin = () => {
    navigator.clipboard?.writeText(order.pickupPin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleDownloadReceipt = () => {
    const content = `
PRINT BOT - OFFICIAL RECEIPT
========================================
Order ID: ${order.orderId}
Pickup PIN: ${order.pickupPin}
Shop: ${order.shopName}
Address: ${order.shopAddress || 'Local Print Counter'}
Placed At: ${order.placedAt}
Payment: ${order.paymentMethod === 'upi' ? 'UPI Online' : 'Cash at Counter'} (${order.paymentStatus})
Total Paid: INR ${order.totalRupees.toFixed(2)}
Total Physical Sheets: ${order.totalSheets}
Total Logical Pages: ${order.totalLogicalPages}
========================================
Items:
${order.items.map((i) => `- ${i.name} (${i.copies} copies, ${i.colorMode}, ${i.sheets} sheets, ${i.paperSize})`).join('\n')}
========================================
Thank you for printing with Print Bot!
Your files are purged from server memory after printing.
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_${order.orderId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="pb-confirmation-panel" role="region" aria-label="Order Tracking Status">
      {/* Header Badge */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div
          style={{
            display: 'inline-grid',
            placeItems: 'center',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'var(--pb-success-soft)',
            color: 'var(--pb-success)',
            marginBottom: '14px',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
          }}
        >
          <Sparkles size={28} />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 850, letterSpacing: '-0.03em', marginBottom: '6px' }}>
          {t.orderPlacedTitle}
        </h2>
        <p style={{ color: 'var(--pb-muted)', fontSize: '0.92rem' }}>
          Transmitted to <strong>{order.shopName}</strong> counter spooler.
        </p>
      </div>

      {/* 4-Digit Pickup PIN Card */}
      <div className="pb-pin-display-card">
        <span
          style={{
            fontSize: '0.82rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--pb-brand)',
          }}
        >
          {t.pickupPinHeadline}
        </span>
        <div className="pb-giant-pin-number">{order.pickupPin}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--pb-muted)' }}>
            Order ID: <strong>{order.orderId}</strong> · {order.placedAt}
          </span>
          <button
            type="button"
            onClick={handleCopyPin}
            style={{
              background: 'var(--pb-surface)',
              border: '1px solid var(--pb-border)',
              borderRadius: 'var(--pb-radius-sm)',
              padding: '3px 8px',
              color: 'var(--pb-brand)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {copiedPin ? <Check size={12} color="var(--pb-success)" /> : <Copy size={12} />}
            <span>{copiedPin ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Live Vertical Status Stepper */}
      <div className="pb-status-stepper-vertical">
        <strong style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--pb-text)', marginBottom: '4px' }}>
          {t.liveStatusTitle}
        </strong>

        {steps.map((st, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div
              key={st.key}
              className={`pb-status-step-item ${isDone ? 'completed' : isCurrent ? 'active' : ''}`}
            >
              <div className="pb-status-step-icon">
                {isDone ? <CheckCircle2 size={16} /> : st.icon}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.92rem',
                    fontWeight: isCurrent || isDone ? 750 : 550,
                    color: isCurrent ? 'var(--pb-brand)' : isDone ? 'var(--pb-text)' : 'var(--pb-muted)',
                  }}
                >
                  {st.label}
                </span>
                {isCurrent && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--pb-brand)', fontWeight: 650 }}>
                    In progress on shop printer fleet...
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary of Files in this Job */}
      <div
        style={{
          margin: '20px 0',
          padding: '18px',
          borderRadius: 'var(--pb-radius-lg)',
          background: 'var(--pb-surface-alt)',
          border: '1px solid var(--pb-border)',
        }}
      >
        <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '12px' }}>
          Document Specifications ({order.totalSheets} physical sheets · {order.totalLogicalPages} pages):
        </strong>
        <div style={{ display: 'grid', gap: '10px' }}>
          {order.items.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '0.85rem',
                color: 'var(--pb-text-secondary)',
              }}
            >
              <FileText size={16} color="var(--pb-brand)" style={{ flexShrink: 0 }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <strong style={{ color: 'var(--pb-text)' }}>{item.name}</strong>
                <div style={{ fontSize: '0.78rem', color: 'var(--pb-muted)', marginTop: '2px' }}>
                  {item.copies} copies · {item.colorMode} · {item.sheets} sheets · {item.paperSize}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total Paid Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderRadius: 'var(--pb-radius-md)',
          background: 'var(--pb-surface)',
          border: '1px solid var(--pb-border)',
          marginBottom: '24px',
        }}
      >
        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--pb-muted)', display: 'block' }}>Payment Method</span>
          <strong style={{ fontSize: '0.92rem' }}>
            {order.paymentMethod === 'upi' ? 'Instant UPI QR (Paid)' : 'Pay Cash at Counter (Pending)'}
          </strong>
        </div>
        <strong
          style={{
            fontSize: '1.6rem',
            color: 'var(--pb-brand)',
            fontFamily: 'Outfit, JetBrains Mono, sans-serif',
          }}
        >
          ₹{order.totalRupees.toFixed(2)}
        </strong>
      </div>

      {/* Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <button
          type="button"
          onClick={handleDownloadReceipt}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            minHeight: '48px',
            borderRadius: 'var(--pb-radius-md)',
            border: '1px solid var(--pb-border-strong)',
            background: 'var(--pb-surface)',
            color: 'var(--pb-text)',
            fontWeight: 650,
            cursor: 'pointer',
          }}
        >
          <Download size={16} />
          <span>{t.downloadReceipt}</span>
        </button>

        <button
          type="button"
          className="pb-btn-primary"
          onClick={onPrintAnother}
          style={{ minHeight: '48px' }}
        >
          <RotateCcw size={16} />
          <span>{t.printAnotherCta}</span>
        </button>
      </div>
    </div>
  );
};

