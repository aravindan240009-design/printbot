import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  UserCheck,
  Cpu,
  Zap,
  ArrowRight,
  Copy,
  Check,
  MapPin,
  Sparkles,
  Ticket,
} from 'lucide-react';
import { ShopSession, TimedBooking } from '../../types';
import { TranslationKeys } from '../../locales';

interface TimedBookingViewProps {
  session: ShopSession;
  onBookingConfirmed: (booking: TimedBooking) => void;
  t: TranslationKeys;
}

export const TimedBookingView: React.FC<TimedBookingViewProps> = ({
  session,
  onBookingConfirmed,
  t,
}) => {
  const [serviceType, setServiceType] = useState<'assisted_xerox' | 'self_service_copier' | 'priority_rush'>('assisted_xerox');
  const [slotDate, setSlotDate] = useState('Today');
  const [slotTime, setSlotTime] = useState('11:00 AM');
  const [pages, setPages] = useState('20');
  const [notes, setNotes] = useState('');
  const [booked, setBooked] = useState<TimedBooking | null>(null);
  const [copied, setCopied] = useState(false);

  const dates = ['Today', 'Tomorrow', 'Day After Tomorrow'];
  const times = ['09:30 AM', '11:00 AM', '01:30 PM', '03:45 PM', '05:30 PM', '07:15 PM'];

  const handleConfirm = () => {
    const booking: TimedBooking = {
      id: crypto.randomUUID(),
      serviceType,
      slotDate,
      slotTime,
      estimatedPages: parseInt(pages, 10) || 10,
      counterNotes: notes.trim(),
      bookingCode: 'TX-' + Math.floor(10000 + Math.random() * 90000),
    };
    setBooked(booking);
    onBookingConfirmed(booking);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (booked) {
    return (
      <div style={{ maxWidth: '580px', margin: '32px auto', padding: '0 16px' }}>
        <div
          style={{
            background: 'var(--pb-surface)',
            borderRadius: 'var(--pb-radius-xl)',
            border: '1px solid var(--pb-border)',
            boxShadow: 'var(--pb-shadow-floating)',
            overflow: 'hidden',
          }}
        >
          {/* Ticket Header */}
          <div
            style={{
              padding: '24px 28px',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(16, 185, 129, 0.08))',
              borderBottom: '1px solid var(--pb-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'var(--pb-success-soft)',
                  color: 'var(--pb-success)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <CheckCircle2 size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--pb-success)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Confirmed Reservation
                </span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>{t.slotBookedSuccess}</h2>
              </div>
            </div>
            <Ticket size={24} color="var(--pb-muted)" />
          </div>

          {/* Ticket Body */}
          <div style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--pb-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              <MapPin size={15} color="var(--pb-brand)" />
              <strong>{session.shop_name}</strong>
            </div>

            {/* Giant Voucher Pass */}
            <div
              style={{
                background: 'var(--pb-surface-alt)',
                border: '2px dashed var(--pb-border-focus)',
                borderRadius: 'var(--pb-radius-lg)',
                padding: '24px',
                textAlign: 'center',
                marginBottom: '24px',
                position: 'relative',
              }}
            >
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--pb-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {t.slotCodeLabel}
              </span>
              <div
                style={{
                  fontSize: '2.75rem',
                  fontWeight: 900,
                  fontFamily: 'var(--pb-font-mono)',
                  color: 'var(--pb-brand)',
                  letterSpacing: '0.08em',
                  margin: '8px 0',
                }}
              >
                {booked.bookingCode}
              </div>

              <button
                type="button"
                onClick={() => handleCopyCode(booked.bookingCode)}
                className="pb-icon-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  width: 'auto',
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  margin: '0 auto',
                }}
              >
                {copied ? <Check size={14} color="var(--pb-success)" /> : <Copy size={14} />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy Voucher Code'}</span>
              </button>
            </div>

            {/* Booking Details Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '12px',
                marginBottom: '24px',
                padding: '16px',
                borderRadius: 'var(--pb-radius-md)',
                background: 'var(--pb-surface-alt)',
                border: '1px solid var(--pb-border)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--pb-muted)', display: 'block' }}>Date</span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--pb-text)' }}>{booked.slotDate}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--pb-muted)', display: 'block' }}>Time</span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--pb-text)' }}>{booked.slotTime}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--pb-muted)', display: 'block' }}>Est. Volume</span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--pb-text)' }}>~{booked.estimatedPages} pages</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--pb-muted)', display: 'block' }}>Service</span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--pb-text)' }}>
                  {booked.serviceType === 'assisted_xerox' ? 'Assisted' : booked.serviceType === 'self_service_copier' ? 'Self-Service' : 'Priority'}
                </strong>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: 'var(--pb-radius-md)',
                background: 'var(--pb-brand-soft)',
                fontSize: '0.82rem',
                color: 'var(--pb-text)',
                marginBottom: '24px',
              }}
            >
              <Sparkles size={16} color="var(--pb-brand)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                Show this voucher code at the counter on arrival. Your queue slot will be prioritized immediately.
              </span>
            </div>

            <button
              type="button"
              className="pb-btn-primary"
              onClick={() => setBooked(null)}
              style={{ width: '100%', minHeight: '48px' }}
            >
              Book Another Slot
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '16px 0' }}>
      <div className="pb-section-header">
        <h2 className="pb-section-title">{t.timedTitle}</h2>
        <p className="pb-section-subtitle">{t.timedSubtitle}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Service Type Selection */}
        <div className="pb-form-group">
          <label className="pb-form-label">{t.serviceType}</label>
          <div style={{ display: 'grid', gap: '12px' }}>
            <button
              type="button"
              className={`pb-pill-choice ${serviceType === 'assisted_xerox' ? 'active' : ''}`}
              onClick={() => setServiceType('assisted_xerox')}
              style={{ textAlign: 'left', alignItems: 'flex-start', padding: '18px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700, fontSize: '0.95rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--pb-brand-soft)', display: 'grid', placeItems: 'center', color: 'var(--pb-brand)' }}>
                  <UserCheck size={18} />
                </div>
                <span>{t.serviceAssisted}</span>
              </div>
              <span className="pb-pill-subtext" style={{ textAlign: 'left', marginTop: '6px' }}>
                Counter operator copies original physical books/documents for you with staple or spiral finish.
              </span>
            </button>

            <button
              type="button"
              className={`pb-pill-choice ${serviceType === 'self_service_copier' ? 'active' : ''}`}
              onClick={() => setServiceType('self_service_copier')}
              style={{ textAlign: 'left', alignItems: 'flex-start', padding: '18px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700, fontSize: '0.95rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--pb-brand-soft)', display: 'grid', placeItems: 'center', color: 'var(--pb-brand)' }}>
                  <Cpu size={18} />
                </div>
                <span>{t.serviceSelf}</span>
              </div>
              <span className="pb-pill-subtext" style={{ textAlign: 'left', marginTop: '6px' }}>
                Direct machine kiosk access slot for high-speed self-scanning and printing.
              </span>
            </button>

            <button
              type="button"
              className={`pb-pill-choice ${serviceType === 'priority_rush' ? 'active' : ''}`}
              onClick={() => setServiceType('priority_rush')}
              style={{ textAlign: 'left', alignItems: 'flex-start', padding: '18px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700, fontSize: '0.95rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--pb-warning-soft)', display: 'grid', placeItems: 'center', color: 'var(--pb-warning)' }}>
                  <Zap size={18} />
                </div>
                <span>{t.serviceRush}</span>
              </div>
              <span className="pb-pill-subtext" style={{ textAlign: 'left', marginTop: '6px' }}>
                Urgent immediate spooling queue jump for emergency exam/legal submissions.
              </span>
            </button>
          </div>
        </div>

        {/* Date Selector */}
        <div className="pb-form-group">
          <label className="pb-form-label">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={15} color="var(--pb-brand)" /> {t.selectDate}
            </span>
          </label>
          <div className="pb-pill-grid">
            {dates.map((d) => (
              <button
                key={d}
                type="button"
                className={`pb-pill-choice ${slotDate === d ? 'active' : ''}`}
                onClick={() => setSlotDate(d)}
                style={{ padding: '12px' }}
              >
                <span style={{ fontWeight: 600 }}>{d}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Time Selector */}
        <div className="pb-form-group">
          <label className="pb-form-label">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={15} color="var(--pb-brand)" /> {t.selectTime}
            </span>
          </label>
          <div className="pb-pill-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))' }}>
            {times.map((tm) => (
              <button
                key={tm}
                type="button"
                className={`pb-pill-choice ${slotTime === tm ? 'active' : ''}`}
                onClick={() => setSlotTime(tm)}
                style={{ padding: '12px 8px' }}
              >
                <span style={{ fontFamily: 'var(--pb-font-mono)', fontSize: '0.85rem' }}>{tm}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Estimated Pages & Notes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
          <div className="pb-form-group">
            <label className="pb-form-label">{t.estimatedPagesLabel}</label>
            <input
              type="number"
              className="pb-input-control"
              min={1}
              value={pages}
              onChange={(e) => setPages(e.target.value)}
            />
          </div>
          <div className="pb-form-group">
            <label className="pb-form-label">Special Notes (Optional)</label>
            <input
              type="text"
              className="pb-input-control"
              placeholder="e.g. 2 spiral books, legal size"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <button
          type="button"
          className="pb-btn-primary"
          style={{ minHeight: '52px', marginTop: '12px' }}
          onClick={handleConfirm}
        >
          <span>{t.bookSlotCta}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

