import React from 'react';
import { ShoppingBag, FileText, Trash2, ArrowRight, Plus, ArrowLeft, ShieldCheck, Check } from 'lucide-react';
import { DocumentItem, ServerQuote } from '../../types';
import { TranslationKeys } from '../../locales';

interface CartViewProps {
  files: DocumentItem[];
  quote: ServerQuote | null;
  onRemoveFile: (id: string) => void;
  onClearCart: () => void;
  onAddMoreFiles: () => void;
  onProceedToCheckout: () => void;
  t: TranslationKeys;
}

export const CartView: React.FC<CartViewProps> = ({
  files,
  quote,
  onRemoveFile,
  onClearCart,
  onAddMoreFiles,
  onProceedToCheckout,
  t,
}) => {
  if (files.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '440px', margin: '0 auto' }}>
        <div
          style={{
            width: '76px',
            height: '76px',
            borderRadius: '50%',
            background: 'var(--pb-surface-alt)',
            color: 'var(--pb-muted)',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 18px',
            border: '1px solid var(--pb-border)',
          }}
        >
          <ShoppingBag size={34} />
        </div>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>{t.cartEmpty}</h3>
        <p style={{ color: 'var(--pb-muted)', fontSize: '0.92rem', marginBottom: '24px', lineHeight: 1.5 }}>
          Upload your PDF, images, or documents to configure printing specifications and calculate instant counter rates.
        </p>
        <button
          type="button"
          className="pb-btn-primary"
          onClick={onAddMoreFiles}
          style={{ width: '100%', minHeight: '50px' }}
        >
          <Plus size={18} />
          <span>{t.startPrintingCta}</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '16px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.025em' }}>{t.cartTitle}</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--pb-muted)' }}>
            {files.length} {files.length === 1 ? 'document' : 'documents'} ready for printer queue
          </span>
        </div>
        <button
          type="button"
          onClick={onClearCart}
          style={{
            background: 'transparent',
            border: 0,
            color: 'var(--pb-danger)',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '6px 10px',
            borderRadius: 'var(--pb-radius-sm)',
          }}
        >
          {t.clearAll}
        </button>
      </div>

      <div style={{ display: 'grid', gap: '14px', marginBottom: '24px' }}>
        {files.map((file) => {
          const opts = file.options;
          const isDuplex = opts.duplex !== 'simplex';
          const pages = file.pageCount || 1;
          const sheetsPerCopy = isDuplex ? Math.ceil(pages / 2) : pages;
          const totalFileSheets = sheetsPerCopy * opts.copies;

          return (
            <div
              key={file.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                padding: '18px 22px',
                borderRadius: 'var(--pb-radius-lg)',
                border: '1px solid var(--pb-border)',
                background: 'var(--pb-surface)',
                boxShadow: 'var(--pb-shadow-sm)',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    width: '46px',
                    height: '46px',
                    borderRadius: 'var(--pb-radius-md)',
                    background: 'var(--pb-brand-soft)',
                    color: 'var(--pb-brand)',
                    flexShrink: 0,
                    border: '1px solid var(--pb-brand-border)',
                  }}
                >
                  <FileText size={22} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <strong
                    style={{
                      display: 'block',
                      fontSize: '1rem',
                      fontWeight: 750,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '320px',
                    }}
                    title={file.name}
                  >
                    {file.name}
                  </strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '4px' }}>
                    <span
                      style={{
                        padding: '2px 7px',
                        borderRadius: 'var(--pb-radius-sm)',
                        background: 'var(--pb-surface-alt)',
                        color: 'var(--pb-text-secondary)',
                        fontSize: '0.75rem',
                        fontWeight: 650,
                      }}
                    >
                      {opts.paperSize}
                    </span>
                    <span
                      style={{
                        padding: '2px 7px',
                        borderRadius: 'var(--pb-radius-sm)',
                        background: opts.colorMode === 'color' ? 'var(--pb-brand-soft)' : 'var(--pb-surface-alt)',
                        color: opts.colorMode === 'color' ? 'var(--pb-brand)' : 'var(--pb-text-secondary)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      {opts.colorMode === 'color' ? 'Color' : opts.colorMode === 'grayscale' ? 'Grayscale' : 'B&W'}
                    </span>
                    <span
                      style={{
                        padding: '2px 7px',
                        borderRadius: 'var(--pb-radius-sm)',
                        background: 'var(--pb-surface-alt)',
                        color: 'var(--pb-text-secondary)',
                        fontSize: '0.75rem',
                        fontWeight: 650,
                      }}
                    >
                      {isDuplex ? '2-Sided' : '1-Sided'}
                    </span>
                    <span
                      style={{
                        padding: '2px 7px',
                        borderRadius: 'var(--pb-radius-sm)',
                        background: 'var(--pb-success-soft)',
                        color: 'var(--pb-success)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      {totalFileSheets} {totalFileSheets === 1 ? 'sheet' : 'sheets'}
                    </span>
                    {opts.finishing !== 'none' && (
                      <span
                        style={{
                          padding: '2px 7px',
                          borderRadius: 'var(--pb-radius-sm)',
                          background: 'var(--pb-warning-soft)',
                          color: 'var(--pb-warning)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {opts.finishing.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--pb-text-secondary)' }}>
                  {opts.copies} {opts.copies === 1 ? 'copy' : 'copies'}
                </span>
                <button
                  type="button"
                  className="pb-icon-btn delete"
                  onClick={() => onRemoveFile(file.id)}
                  aria-label={`Remove ${file.name}`}
                  title={t.removeJob}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '24px' }}>
        <button
          type="button"
          onClick={onAddMoreFiles}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px dashed var(--pb-border-strong)',
            background: 'var(--pb-surface)',
            color: 'var(--pb-brand)',
            padding: '11px 20px',
            borderRadius: 'var(--pb-radius-md)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          <span>{t.addMore}</span>
        </button>
      </div>

      {/* Bill Overview in Cart */}
      <div
        style={{
          padding: '28px',
          borderRadius: 'var(--pb-radius-xl)',
          border: '1px solid var(--pb-border)',
          background: 'var(--pb-surface)',
          boxShadow: 'var(--pb-shadow-card)',
        }}
      >
        <div style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--pb-text-secondary)', fontSize: '0.92rem' }}>
            <span>{t.logicalPages}</span>
            <strong style={{ color: 'var(--pb-text)', fontFamily: 'JetBrains Mono, monospace' }}>
              {quote?.total_logical_pages || 0}
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--pb-text-secondary)', fontSize: '0.92rem' }}>
            <span>{t.physicalSheets}</span>
            <strong style={{ color: 'var(--pb-text)', fontFamily: 'JetBrains Mono, monospace' }}>
              {quote?.total_physical_sheets || 0}
            </strong>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '18px',
            borderTop: '2px dashed var(--pb-border)',
            marginBottom: '22px',
          }}
        >
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--pb-muted)', display: 'block' }}>{t.totalAmount}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--pb-success)', fontWeight: 600 }}>
              Live counter rate guaranteed
            </span>
          </div>
          <strong
            style={{
              fontSize: '2rem',
              color: 'var(--pb-brand)',
              fontFamily: 'Outfit, JetBrains Mono, sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            ₹{quote ? quote.total_rupees.toFixed(2) : '0.00'}
          </strong>
        </div>

        <button
          type="button"
          className="pb-btn-primary"
          style={{ width: '100%', minHeight: '52px', fontSize: '1rem' }}
          onClick={onProceedToCheckout}
        >
          <span>{t.proceedToCheckout}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

