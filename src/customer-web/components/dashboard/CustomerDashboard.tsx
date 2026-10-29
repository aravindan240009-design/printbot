import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  RotateCcw,
  Search,
  Phone,
  MapPin,
  Printer,
  ShieldCheck,
  FileText,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { PlacedOrder, ShopSession } from '../../types';
import { TranslationKeys } from '../../locales';

interface CustomerDashboardProps {
  orders: PlacedOrder[];
  session: ShopSession;
  onSelectOrder: (order: PlacedOrder) => void;
  onStartNewPrint: () => void;
  t: TranslationKeys;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  orders,
  session,
  onSelectOrder,
  onStartNewPrint,
  t,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [lookupMessage, setLookupMessage] = useState('');

  const activeOrders = orders.filter((o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
  const pastOrders = orders.filter((o) => o.status === 'COMPLETED' || o.status === 'CANCELLED');

  const handlePhoneLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.replace(/\D/g, '').length < 10) {
      setLookupMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    setLookupMessage(`Showing ${orders.length} order(s) associated with this device.`);
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', padding: '16px 0' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '4px' }}>
          {t.dashboardTitle}
        </h2>
        <p style={{ color: 'var(--pb-muted)', fontSize: '0.92rem' }}>
          {t.dashboardSubtitle}
        </p>
      </div>

      {/* Shop Information Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '18px',
          padding: '24px',
          borderRadius: 'var(--pb-radius-xl)',
          border: '1px solid var(--pb-border)',
          background: 'var(--pb-surface)',
          boxShadow: 'var(--pb-shadow-sm)',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              width: '44px',
              height: '44px',
              borderRadius: 'var(--pb-radius-md)',
              background: 'var(--pb-brand-soft)',
              color: 'var(--pb-brand)',
              flexShrink: 0,
              border: '1px solid var(--pb-brand-border)',
            }}
          >
            <Printer size={22} />
          </div>
          <div>
            <strong style={{ display: 'block', fontSize: '1.02rem', fontWeight: 750 }}>
              {session.shop_name}
            </strong>
            <span style={{ fontSize: '0.78rem', color: 'var(--pb-success)', fontWeight: 700 }}>
              • {t.counterOnline}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <MapPin size={20} color="var(--pb-brand)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--pb-muted)', display: 'block', fontWeight: 650 }}>
              Counter Location
            </span>
            <span style={{ fontSize: '0.88rem', color: 'var(--pb-text-secondary)', lineHeight: 1.4 }}>
              {session.shop_address || 'Main Stand, Near University Gate, Chennai'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <Clock size={20} color="var(--pb-brand)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--pb-muted)', display: 'block', fontWeight: 650 }}>
              Operating Hours
            </span>
            <span style={{ fontSize: '0.88rem', color: 'var(--pb-text-secondary)' }}>
              {session.operating_hours || '08:00 AM – 09:30 PM (Mon–Sat)'}
            </span>
            {session.shop_phone && (
              <a
                href={`tel:${session.shop_phone}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.78rem',
                  color: 'var(--pb-brand)',
                  fontWeight: 700,
                  marginTop: '4px',
                  textDecoration: 'none',
                }}
              >
                <Phone size={12} />
                <span>{session.shop_phone}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Lookup by Phone */}
      <div
        style={{
          padding: '24px',
          borderRadius: 'var(--pb-radius-xl)',
          border: '1px solid var(--pb-border)',
          background: 'var(--pb-surface)',
          marginBottom: '28px',
          boxShadow: 'var(--pb-shadow-sm)',
        }}
      >
        <h3 style={{ fontSize: '1.1rem', fontWeight: 750, marginBottom: '6px' }}>
          {t.lookupOrdersTitle}
        </h3>
        <p style={{ color: 'var(--pb-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
          Access your print receipts from another phone or browser using your 10-digit mobile number.
        </p>

        <form onSubmit={handlePhoneLookup} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="tel"
            className="pb-input-control"
            style={{ flex: 1, minWidth: '240px' }}
            placeholder={t.phoneSearchPlaceholder}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <button type="submit" className="pb-btn-primary" style={{ padding: '0 24px' }}>
            <Search size={16} />
            <span>{t.searchButton}</span>
          </button>
        </form>
        {lookupMessage && (
          <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--pb-brand)', fontWeight: 600 }}>
            {lookupMessage}
          </p>
        )}
      </div>

      {/* Active Orders Section */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
            {t.activeOrdersHeading} ({activeOrders.length})
          </h3>
          {activeOrders.length > 0 && (
            <button
              type="button"
              className="pb-btn-secondary"
              onClick={onStartNewPrint}
              style={{ minHeight: '38px', padding: '6px 14px', fontSize: '0.82rem' }}
            >
              + Print Another
            </button>
          )}
        </div>

        {activeOrders.length === 0 ? (
          <div
            style={{
              padding: '40px 24px',
              textAlign: 'center',
              borderRadius: 'var(--pb-radius-lg)',
              border: '2px dashed var(--pb-border)',
              background: 'var(--pb-surface)',
            }}
          >
            <Clock size={32} color="var(--pb-muted)" style={{ margin: '0 auto 10px', display: 'block' }} />
            <p style={{ color: 'var(--pb-muted)', fontSize: '0.92rem', marginBottom: '16px' }}>
              No active print orders running right now.
            </p>
            <button type="button" className="pb-btn-primary" onClick={onStartNewPrint}>
              {t.startPrintingCta}
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '14px' }}>
            {activeOrders.map((order) => (
              <div
                key={order.orderId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '20px 24px',
                  borderRadius: 'var(--pb-radius-lg)',
                  border: '1px solid var(--pb-border)',
                  background: 'var(--pb-surface)',
                  boxShadow: 'var(--pb-shadow-sm)',
                  cursor: 'pointer',
                  flexWrap: 'wrap',
                  gap: '14px',
                }}
                onClick={() => onSelectOrder(order)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSelectOrder(order);
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '1.15rem', fontWeight: 800 }}>{order.orderId}</strong>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: 'var(--pb-radius-full)',
                        background: 'var(--pb-brand-soft)',
                        color: 'var(--pb-brand)',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                      }}
                    >
                      PIN: {order.pickupPin}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--pb-muted)' }}>
                    {order.placedAt} · {order.totalSheets} sheets · ₹{order.totalRupees.toFixed(2)}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      padding: '5px 12px',
                      borderRadius: 'var(--pb-radius-full)',
                      background: order.status === 'READY_FOR_PICKUP' ? 'var(--pb-success-soft)' : 'var(--pb-warning-soft)',
                      color: order.status === 'READY_FOR_PICKUP' ? 'var(--pb-success)' : 'var(--pb-warning)',
                      fontSize: '0.8rem',
                      fontWeight: 750,
                      border: order.status === 'READY_FOR_PICKUP' ? '1px solid var(--pb-success-border)' : '1px solid var(--pb-warning-border)',
                    }}
                  >
                    {order.status === 'READY_FOR_PICKUP'
                      ? 'Ready for Counter Pickup'
                      : order.status === 'PRINTING'
                      ? 'Printing on Fleet'
                      : order.status === 'SPOOLING'
                      ? 'Spooled to Workstation'
                      : 'Order Received'}
                  </span>
                  <div className="pb-service-arrow-btn">
                    <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Completed Orders */}
      {pastOrders.length > 0 && (
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px' }}>
            {t.pastOrdersHeading} ({pastOrders.length})
          </h3>

          <div style={{ display: 'grid', gap: '12px' }}>
            {pastOrders.map((order) => (
              <div
                key={order.orderId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '18px 22px',
                  borderRadius: 'var(--pb-radius-lg)',
                  border: '1px solid var(--pb-border)',
                  background: 'var(--pb-surface)',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <strong style={{ display: 'block', fontSize: '1rem', fontWeight: 750 }}>
                    {order.orderId}
                  </strong>
                  <span style={{ fontSize: '0.82rem', color: 'var(--pb-muted)' }}>
                    {order.placedAt} · {order.items.length} file(s) · ₹{order.totalRupees.toFixed(2)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onStartNewPrint}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: '1px solid var(--pb-border-strong)',
                    background: 'var(--pb-surface-alt)',
                    color: 'var(--pb-text)',
                    padding: '8px 16px',
                    borderRadius: 'var(--pb-radius-md)',
                    fontSize: '0.85rem',
                    fontWeight: 650,
                    cursor: 'pointer',
                  }}
                >
                  <RotateCcw size={14} />
                  <span>{t.reorderCta}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

