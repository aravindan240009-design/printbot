import React from 'react';
import { ArrowRight, ShieldCheck, Lock, Sparkles } from 'lucide-react';
import { ServerQuote } from '../../types';
import { TranslationKeys } from '../../locales';

interface LivePriceBreakdownProps {
  quote: ServerQuote | null;
  fileCount: number;
  onProceed: () => void;
  proceedLabel?: string;
  t: TranslationKeys;
}

export const LivePriceBreakdown: React.FC<LivePriceBreakdownProps> = ({
  quote,
  fileCount,
  onProceed,
  proceedLabel,
  t,
}) => {
  return (
    <div className="pb-price-quote-card">
      <div className="pb-quote-header">
        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--pb-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t.priceSummaryTitle}
          </span>
          <h3 style={{ fontSize: '1.25rem', marginTop: '2px' }}>Order Bill Summary</h3>
        </div>
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--pb-brand-soft)',
            color: 'var(--pb-brand)',
          }}
        >
          <Lock size={18} />
        </div>
      </div>

      <div style={{ display: 'grid', gap: '4px', margin: '14px 0' }}>
        <div className="pb-quote-metric-row">
          <span>{t.filesSelected}</span>
          <span className="pb-quote-metric-val">{fileCount}</span>
        </div>
        <div className="pb-quote-metric-row">
          <span>{t.logicalPages}</span>
          <span className="pb-quote-metric-val">{quote?.total_logical_pages ?? 0}</span>
        </div>
        <div className="pb-quote-metric-row">
          <span>{t.renderedSides}</span>
          <span className="pb-quote-metric-val">{quote?.total_rendered_sides ?? 0}</span>
        </div>
        <div className="pb-quote-metric-row">
          <span>{t.physicalSheets}</span>
          <span className="pb-quote-metric-val">{quote?.total_physical_sheets ?? 0}</span>
        </div>
      </div>

      <div className="pb-quote-total-row">
        <div>
          <span style={{ fontSize: '0.82rem', color: 'var(--pb-muted)', display: 'block' }}>
            {t.totalAmount}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--pb-success)', fontWeight: 600 }}>
            Includes Shop GST / Counter Rate
          </span>
        </div>
        <span className="pb-quote-total-val">
          ₹{quote ? quote.total_rupees.toFixed(2) : '0.00'}
        </span>
      </div>

      <button
        type="button"
        className="pb-btn-primary"
        style={{ width: '100%', marginTop: '20px', minHeight: '50px' }}
        disabled={!quote || fileCount === 0}
        onClick={onProceed}
      >
        <span>{proceedLabel || t.proceedToCheckout}</span>
        <ArrowRight size={18} />
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '16px',
          padding: '10px 12px',
          borderRadius: 'var(--pb-radius-sm)',
          background: 'var(--pb-surface-alt)',
          fontSize: '0.75rem',
          color: 'var(--pb-muted)',
        }}
      >
        <ShieldCheck size={16} color="var(--pb-success)" />
        <span>Price locked & verified against counter pricing table.</span>
      </div>
    </div>
  );
};
