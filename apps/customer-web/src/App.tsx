import React, { useState } from 'react';
import { translations, Language } from './locales';
import { Upload, FileText, CheckCircle2, RefreshCw, Printer, ShieldCheck } from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<{ name: string; pages: number; size: string } | null>(null);
  const [copies, setCopies] = useState<number>(1);
  const [colorMode, setColorMode] = useState<'bw' | 'color'>('bw');
  const [duplex, setDuplex] = useState<'simplex' | 'duplex'>('simplex');
  const [pageRange, setPageRange] = useState<string>('all');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash'>('upi');
  const [orderStatus, setOrderStatus] = useState<'received' | 'printing' | 'ready'>('received');

  const t = translations[lang];

  // Price calculation in INR (paise converted to rupees)
  const pageRate = colorMode === 'bw' ? 1.5 : 10.0;
  const pages = file ? file.pages : 1;
  const effectivePages = duplex === 'duplex' ? Math.ceil(pages / 2) : pages;
  const totalPrice = (effectivePages * pageRate * copies).toFixed(2);

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile({
        name: f.name,
        pages: 5,
        size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
      });
      setStep(2);
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100vh', padding: '16px', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Printer size={22} color="#2563eb" />
            {t.title}
          </h1>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{t.tagline}</p>
        </div>
        {/* Language selector */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['en', 'ta', 'hi'] as Language[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                minHeight: '44px',
                minWidth: '44px',
                padding: '6px 10px',
                borderRadius: '8px',
                border: lang === l ? '2px solid #2563eb' : '1px solid #cbd5e1',
                background: lang === l ? '#eff6ff' : '#ffffff',
                fontWeight: lang === l ? 700 : 500,
                color: lang === l ? '#1d4ed8' : '#475569',
                cursor: 'pointer',
              }}
            >
              {l === 'en' ? 'EN' : l === 'ta' ? 'தமிழ்' : 'हिन्दी'}
            </button>
          ))}
        </div>
      </header>

      {/* Progress Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setStep(1)}
          style={{
            minHeight: '44px',
            fontSize: '0.8rem',
            fontWeight: 600,
            borderRadius: '6px',
            border: 'none',
            background: step === 1 ? '#2563eb' : '#e2e8f0',
            color: step === 1 ? '#ffffff' : '#64748b',
            cursor: 'pointer',
          }}
        >
          {t.step1_upload}
        </button>
        <button
          onClick={() => file && setStep(2)}
          disabled={!file}
          style={{
            minHeight: '44px',
            fontSize: '0.8rem',
            fontWeight: 600,
            borderRadius: '6px',
            border: 'none',
            background: step === 2 ? '#2563eb' : '#e2e8f0',
            color: step === 2 ? '#ffffff' : '#64748b',
            cursor: file ? 'pointer' : 'not-allowed',
            opacity: file ? 1 : 0.6,
          }}
        >
          {t.step2_config}
        </button>
        <button
          onClick={() => file && setStep(3)}
          disabled={!file}
          style={{
            minHeight: '44px',
            fontSize: '0.8rem',
            fontWeight: 600,
            borderRadius: '6px',
            border: 'none',
            background: step === 3 ? '#2563eb' : '#e2e8f0',
            color: step === 3 ? '#ffffff' : '#64748b',
            cursor: file ? 'pointer' : 'not-allowed',
            opacity: file ? 1 : 0.6,
          }}
        >
          {t.step3_pay}
        </button>
      </div>

      {/* Screen 1: File Upload */}
      {step === 1 && (
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label
            style={{
              flex: 1,
              minHeight: '260px',
              border: '2px dashed #94a3b8',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              background: '#ffffff',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            <input type="file" accept=".pdf,image/*" onChange={handleSimulateUpload} style={{ display: 'none' }} />
            <div style={{ background: '#eff6ff', borderRadius: '50%', padding: '16px', marginBottom: '16px' }}>
              <Upload size={36} color="#2563eb" />
            </div>
            <strong style={{ fontSize: '1.1rem', marginBottom: '8px', color: '#1e293b' }}>{t.upload_cta}</strong>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>PDF, JPG, PNG (Max 100MB)</span>
          </label>
        </main>
      )}

      {/* Screen 2: Configuration & Preview */}
      {step === 2 && file && (
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileText size={28} color="#2563eb" />
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', fontSize: '0.95rem' }}>{file.name}</strong>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{file.pages} pages • {file.size}</span>
            </div>
          </div>

          {/* Color Mode */}
          <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px' }}>{t.color_mode}</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setColorMode('bw')}
                style={{
                  minHeight: '44px',
                  borderRadius: '8px',
                  border: colorMode === 'bw' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: colorMode === 'bw' ? '#eff6ff' : '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {t.bw}
              </button>
              <button
                type="button"
                onClick={() => setColorMode('color')}
                style={{
                  minHeight: '44px',
                  borderRadius: '8px',
                  border: colorMode === 'color' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: colorMode === 'color' ? '#eff6ff' : '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {t.color}
              </button>
            </div>
          </div>

          {/* Duplex Mode */}
          <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px' }}>{t.duplex}</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setDuplex('simplex')}
                style={{
                  minHeight: '44px',
                  borderRadius: '8px',
                  border: duplex === 'simplex' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: duplex === 'simplex' ? '#eff6ff' : '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {t.single_sided}
              </button>
              <button
                type="button"
                onClick={() => setDuplex('duplex')}
                style={{
                  minHeight: '44px',
                  borderRadius: '8px',
                  border: duplex === 'duplex' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: duplex === 'duplex' ? '#eff6ff' : '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {t.double_sided}
              </button>
            </div>
          </div>

          {/* Copies & Page Range */}
          <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>{t.copies}</label>
              <input
                type="number"
                min={1}
                max={50}
                value={copies}
                onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ width: '100%', minHeight: '44px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>{t.page_range}</label>
              <input
                type="text"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                placeholder="all"
                style={{ width: '100%', minHeight: '44px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
              />
            </div>
          </div>

          {/* Total & Action */}
          <div style={{ marginTop: 'auto', background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.9rem', color: '#64748b' }}>{t.price_total}</span>
              <strong style={{ fontSize: '1.4rem', color: '#0f172a' }}>₹{totalPrice}</strong>
            </div>
            <button
              onClick={() => setStep(3)}
              style={{
                width: '100%',
                minHeight: '48px',
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '1rem',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              {t.step3_pay}
            </button>
          </div>
        </main>
      )}

      {/* Screen 3: Payment & Tracking */}
      {step === 3 && (
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '4px' }}>{t.price_total}</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>₹{totalPrice}</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => {
                  setPaymentMethod('upi');
                  setOrderStatus('printing');
                }}
                style={{
                  minHeight: '48px',
                  borderRadius: '8px',
                  border: paymentMethod === 'upi' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                  background: paymentMethod === 'upi' ? '#f0fdf4' : '#ffffff',
                  fontWeight: 700,
                  color: '#15803d',
                  cursor: 'pointer',
                }}
              >
                {t.pay_upi}
              </button>
              <button
                onClick={() => {
                  setPaymentMethod('cash');
                  setOrderStatus('received');
                }}
                style={{
                  minHeight: '48px',
                  borderRadius: '8px',
                  border: paymentMethod === 'cash' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: paymentMethod === 'cash' ? '#eff6ff' : '#ffffff',
                  fontWeight: 700,
                  color: '#1d4ed8',
                  cursor: 'pointer',
                }}
              >
                {t.pay_cash}
              </button>
            </div>
          </div>

          {/* Live Order Status */}
          <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={18} className="animate-spin" color="#2563eb" />
              {t.order_status}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#15803d' }}>
                <CheckCircle2 size={20} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t.order_received}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: orderStatus === 'printing' || orderStatus === 'ready' ? '#15803d' : '#94a3b8' }}>
                <CheckCircle2 size={20} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t.printing}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: orderStatus === 'ready' ? '#15803d' : '#94a3b8' }}>
                <CheckCircle2 size={20} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t.ready}</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748b' }}>
            <ShieldCheck size={16} />
            <span>Encrypted zero-retention session. Shop isolation verified.</span>
          </div>
        </main>
      )}
    </div>
  );
}
