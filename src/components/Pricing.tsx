import React, { useState } from 'react';
import { Check, Shield, Zap, Printer, ArrowRight } from 'lucide-react';

interface PricingProps {
  onRequestPilot: (planName?: string) => void;
}

export const Pricing: React.FC<PricingProps> = ({ onRequestPilot }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  return (
    <section id="pricing" className="section" aria-labelledby="pricing-heading">
      <div className="wrap">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 48px' }}>
          <span className="eyebrow">TRANSPARENT SUBSCRIPTION · NO COMMISSIONS</span>
          <h2 id="pricing-heading" className="head" style={{ fontSize: 'clamp(2.2rem, 3.5vw, 3.2rem)', margin: '12px 0 16px' }}>
            One simple plan. Unlimited printers.
          </h2>
          <p className="lead" style={{ fontSize: '17px', color: 'var(--ink-body)', maxWidth: '640px', margin: '0 auto' }}>
            Every Canon, HP, Epson, Ricoh, and Xerox printer in your shop connected under a single subscription.
            No per-page cuts, no tiered feature gates, and zero hidden add-ons.
          </p>

          {/* Billing Cycle Toggle */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '28px',
              padding: '5px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '999px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              style={{
                padding: '10px 22px',
                borderRadius: '999px',
                border: 'none',
                background: billingCycle === 'monthly' ? 'var(--accent-gradient)' : 'transparent',
                color: billingCycle === 'monthly' ? '#07090e' : 'var(--ink-body)',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
              }}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                borderRadius: '999px',
                border: 'none',
                background: billingCycle === 'annual' ? 'var(--accent-gradient)' : 'transparent',
                color: billingCycle === 'annual' ? '#07090e' : 'var(--ink-body)',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
              }}
            >
              <span>Annual Billing</span>
              <span
                style={{
                  fontSize: '11px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontWeight: 800,
                }}
              >
                SAVE 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '32px',
            maxWidth: '1160px',
            margin: '0 auto',
            alignItems: 'stretch',
          }}
        >
          {/* Main Canonical Subscription Card */}
          <div
            style={{
              padding: '42px 36px',
              borderRadius: '24px',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              background: 'linear-gradient(180deg, rgba(22, 28, 42, 0.85) 0%, rgba(13, 17, 26, 0.95) 100%)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Subtle top ambient glow */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '20%',
                right: '20%',
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.6), transparent)',
              }}
            />

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    background: 'rgba(212, 175, 55, 0.12)',
                    color: '#e5c158',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  <Zap size={13} /> All-Inclusive Subscription
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#10b981',
                    background: 'rgba(16, 185, 129, 0.12)',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                  }}
                >
                  0% Commission
                </span>
              </div>

              <h3 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 8px' }}>
                Print Bot All-Access
              </h3>
              <p style={{ color: 'var(--ink-body)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                For independent Xerox counters, campus photocopying kiosks, and commercial reprography centres.
              </p>

              {/* Price Display */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '28px 0 12px' }}>
                <span
                  style={{
                    fontSize: '52px',
                    fontWeight: 850,
                    letterSpacing: '-0.03em',
                    color: '#f8fafc',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  {billingCycle === 'monthly' ? '₹199' : '₹1,999'}
                </span>
                <span style={{ color: 'var(--muted)', fontSize: '15px' }}>
                  {billingCycle === 'monthly' ? '/ month' : '/ year (₹166/mo)'}
                </span>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 24px', paddingBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                GST invoice provided. Unlimited customer QR uploads &amp; unlimited connected printers.
              </p>

              {/* Features List */}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '14px' }}>
                {[
                  'UNLIMITED connected printers per shop (Canon, HP, Epson, Ricoh, Brother)',
                  'Windows Workstation App (.exe/.msi) with Win32 spooler hardware integration',
                  'Zero-app customer mobile QR upload portal (English, தமிழ், हिन्दी)',
                  'Dual operating modes: FULL AUTOMATIC (instant spool) & MANUAL APPROVAL',
                  'Direct UPI payments to your shop ID with zero software commission',
                  'Native Indian Xerox math: A4/A3, 2-Up, 4-Up, Duplex long/short, Booklet',
                  '100% ephemeral privacy: documents auto-purged from server & PC memory',
                  'Dedicated WhatsApp priority support during exam and peak admission rush',
                ].map((feat, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '14px', color: 'var(--ink)' }}>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '6px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        color: '#10b981',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                        marginTop: '1px',
                      }}
                    >
                      <Check size={13} strokeWidth={3} />
                    </div>
                    <span style={{ lineHeight: 1.5 }}>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ marginTop: '36px' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => onRequestPilot('all-inclusive')}
                style={{
                  width: '100%',
                  minHeight: '52px',
                  fontSize: '15px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span>Request Shop Pilot Access</span>
                <ArrowRight size={18} />
              </button>
              <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--muted)', marginTop: '12px' }}>
                Includes 30-Day Closed Pilot Trial. Setup assistance included.
              </p>
            </div>
          </div>

          {/* Real Counter Comparison & Architecture Card */}
          <div
            style={{
              padding: '42px 36px',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'linear-gradient(180deg, rgba(16, 21, 31, 0.75) 0%, rgba(10, 13, 20, 0.9) 100%)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: 'var(--ink-body)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  marginBottom: '20px',
                }}
              >
                <Printer size={13} /> The Real Counter Transformation
              </span>

              <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 12px' }}>
                Why Indian Print Counters Choose Print Bot
              </h3>
              <p style={{ color: 'var(--ink-body)', fontSize: '14px', lineHeight: 1.6, margin: '0 0 28px' }}>
                Traditional photocopy shops lose 4–6 minutes per walk-in customer dealing with personal WhatsApp numbers,
                corrupted USB drives, and manual PDF print dialogs.
              </p>

              {/* Comparison Rows */}
              <div style={{ display: 'grid', gap: '18px' }}>
                <div
                  style={{
                    padding: '18px',
                    borderRadius: '16px',
                    background: 'rgba(239, 68, 68, 0.06)',
                    border: '1px solid rgba(239, 68, 68, 0.18)',
                  }}
                >
                  <strong style={{ display: 'block', fontSize: '13px', color: '#f87171', marginBottom: '4px' }}>
                    Traditional Counter Friction
                  </strong>
                  <p style={{ fontSize: '13px', color: 'var(--ink-body)', margin: 0, lineHeight: 1.5 }}>
                    Customers crowd counter to share WhatsApp messages or plug in infected pen drives.
                    Staff must open Acrobat, calculate sides manually, change printer properties, and count change.
                  </p>
                </div>

                <div
                  style={{
                    padding: '18px',
                    borderRadius: '16px',
                    background: 'rgba(16, 185, 129, 0.06)',
                    border: '1px solid rgba(16, 185, 129, 0.22)',
                  }}
                >
                  <strong style={{ display: 'block', fontSize: '13px', color: '#34d399', marginBottom: '4px' }}>
                    With Print Bot Counter OS
                  </strong>
                  <p style={{ fontSize: '13px', color: 'var(--ink-body)', margin: 0, lineHeight: 1.5 }}>
                    Customers scan the desk standee QR while standing in line. They select B&amp;W or color, duplex,
                    pay via instant UPI, and the verified job immediately injects into your Windows spooler in seconds.
                  </p>
                </div>
              </div>

              {/* Counter Metrics */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  marginTop: '28px',
                  paddingTop: '24px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Turnaround
                  </span>
                  <strong style={{ display: 'block', fontSize: '20px', color: 'var(--ink)', fontFamily: 'JetBrains Mono, monospace', marginTop: '4px' }}>
                    &lt; 15 sec
                  </strong>
                  <small style={{ color: '#10b981', fontSize: '11px' }}>Per walk-in order</small>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Privacy
                  </span>
                  <strong style={{ display: 'block', fontSize: '20px', color: 'var(--ink)', fontFamily: 'JetBrains Mono, monospace', marginTop: '4px' }}>
                    Zero Leak
                  </strong>
                  <small style={{ color: '#10b981', fontSize: '11px' }}>Auto-purged</small>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Printers
                  </span>
                  <strong style={{ display: 'block', fontSize: '20px', color: 'var(--ink)', fontFamily: 'JetBrains Mono, monospace', marginTop: '4px' }}>
                    Unlimited
                  </strong>
                  <small style={{ color: '#10b981', fontSize: '11px' }}>Canon, HP, Epson</small>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '32px' }}>
              <div
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <Shield size={22} color="#e5c158" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: 'var(--ink-body)', lineHeight: 1.4 }}>
                  Engineered with native Windows Win32 API spooler integration, TPM-backed asymmetric attestation, and isolated local memory streaming.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
