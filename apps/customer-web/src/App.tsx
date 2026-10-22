import React, { useState, useEffect } from 'react';
import { translations, Language } from './locales';
import {
  Upload,
  Camera,
  FileText,
  CheckCircle2,
  RefreshCw,
  Printer,
  ShieldCheck,
  Trash2,
  Lock,
  ChevronRight,
  Clock,
  Layers,
  Sparkles,
  QrCode
} from 'lucide-react';

interface UploadedDoc {
  id: string;
  name: string;
  size: string;
  pages: number;
  format: string;
  isEncrypted?: boolean;
  options: {
    copies: number;
    colorMode: 'bw' | 'color';
    paperSize: 'A4' | 'A3' | 'Legal' | 'Letter';
    duplex: 'simplex' | 'duplex_long' | 'duplex_short';
    pageRange: string;
    nup: number;
    photoPreset: 'standard' | 'passport_8up' | 'id_front_back';
  };
}

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [files, setFiles] = useState<UploadedDoc[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [applyToAll, setApplyToAll] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash'>('upi');
  const [orderStatus, setOrderStatus] = useState<'received' | 'approved' | 'printing' | 'ready'>('received');
  const [quoteHash, setQuoteHash] = useState<string>('c83f9e12a4b7d081');
  const [quoteSecondsLeft, setQuoteSecondsLeft] = useState<number>(900); // 15 mins
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [enteredPassword, setEnteredPassword] = useState<string>('');
  const [previewPage, setPreviewPage] = useState<number>(1);
  const [trackingId] = useState<string>(() => `TRK-${Math.floor(100000 + Math.random() * 900000)}`);

  const t = translations[lang];

  // Load persisted session on initial mount
  useEffect(() => {
    const saved = localStorage.getItem('printbot_customer_session');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.files && data.files.length > 0) {
          setFiles(data.files);
          setStep(data.step || 1);
        }
      } catch (e) {
        // Ignore parse error
      }
    }
  }, []);

  // Save session to localStorage
  useEffect(() => {
    localStorage.setItem(
      'printbot_customer_session',
      JSON.stringify({ files, step, lang })
    );
  }, [files, step, lang]);

  // Quote timer countdown
  useEffect(() => {
    if (step === 3 && quoteSecondsLeft > 0) {
      const timer = setInterval(() => {
        setQuoteSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, quoteSecondsLeft]);

  // Compute exact deterministic price and physical sheets
  const computeAccounting = () => {
    let totalLogical = 0;
    let totalRendered = 0;
    let totalSheets = 0;
    let totalPaise = 0;

    files.forEach((f) => {
      const opts = applyToAll && files[0] ? files[0].options : f.options;
      const copies = opts.copies;
      const nup = opts.nup;
      const pages = f.pages;

      // Range resolution heuristic
      let logical = pages;
      if (opts.pageRange === 'odd') logical = Math.ceil(pages / 2);
      else if (opts.pageRange === 'even') logical = Math.floor(pages / 2);

      const renderedPerCopy = Math.ceil(logical / nup);
      const isDuplex = opts.duplex !== 'simplex';
      const sheetsPerCopy = isDuplex ? Math.ceil(renderedPerCopy / 2) : renderedPerCopy;
      const sheets = sheetsPerCopy * copies;

      const baseRatePaise = opts.colorMode === 'color' ? 1000 : 150;
      const discountFactor = isDuplex ? 0.85 : 1.0;
      const costPerCopyPaise = isDuplex
        ? (sheetsPerCopy * baseRatePaise) + ((renderedPerCopy - sheetsPerCopy) * baseRatePaise * discountFactor)
        : (renderedPerCopy * baseRatePaise);

      const sizeMultiplier = opts.paperSize === 'A3' ? 2.0 : 1.0;
      const filePaise = Math.round(costPerCopyPaise * sizeMultiplier * copies);

      totalLogical += logical * copies;
      totalRendered += renderedPerCopy * copies;
      totalSheets += sheets;
      totalPaise += filePaise;
    });

    return {
      totalLogical,
      totalRendered,
      totalSheets,
      totalPaise,
      totalRupees: (totalPaise / 100).toFixed(2),
    };
  };

  const accounting = computeAccounting();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newDocs: UploadedDoc[] = Array.from(e.target.files).map((file, idx) => ({
        id: `doc-${Date.now()}-${idx}`,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        pages: file.name.toLowerCase().endsWith('.pdf') ? 8 : 1,
        format: file.name.split('.').pop()?.toUpperCase() || 'PDF',
        isEncrypted: file.name.toLowerCase().includes('protected'),
        options: {
          copies: 1,
          colorMode: 'bw',
          paperSize: 'A4',
          duplex: 'simplex',
          pageRange: 'all',
          nup: 1,
          photoPreset: 'standard',
        },
      }));

      setFiles((prev) => [...prev, ...newDocs]);
      if (newDocs[0]?.isEncrypted) {
        setShowPasswordModal(true);
      } else {
        setStep(2);
      }
    }
  };

  const currentFile = files[activeFileIndex] || files[0];

  const updateCurrentOptions = (patch: Partial<UploadedDoc['options']>) => {
    setFiles((prev) =>
      prev.map((f, idx) => {
        if (applyToAll || idx === activeFileIndex) {
          return { ...f, options: { ...f.options, ...patch } };
        }
        return f;
      })
    );
  };

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', minHeight: '100vh', padding: '16px 16px 90px 16px', display: 'flex', flexDirection: 'column', background: '#F8FAFC', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header with Shop Details and Language Selector */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '12px 16px', background: '#FFFFFF', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Printer size={22} color="#2563EB" />
            {t.title}
          </h1>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> Anna Xerox Guindy • Open until 9:00 PM
          </p>
        </div>
        {/* Language buttons */}
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
                border: lang === l ? '2px solid #2563EB' : '1px solid #E2E8F0',
                background: lang === l ? '#EFF6FF' : '#FFFFFF',
                fontWeight: lang === l ? 700 : 500,
                color: lang === l ? '#1D4ED8' : '#64748B',
                cursor: 'pointer',
              }}
            >
              {l === 'en' ? 'EN' : l === 'ta' ? 'தமிழ்' : 'हिन्दी'}
            </button>
          ))}
        </div>
      </header>

      {/* 3-Step Navigation Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '16px' }}>
        {[
          { num: 1, label: t.step1_upload },
          { num: 2, label: t.step2_config },
          { num: 3, label: t.step3_pay },
        ].map((s) => (
          <button
            key={s.num}
            onClick={() => setStep(s.num as any)}
            disabled={s.num > 1 && files.length === 0}
            style={{
              minHeight: '44px',
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: '8px',
              border: 'none',
              background: step === s.num ? '#2563EB' : '#FFFFFF',
              color: step === s.num ? '#FFFFFF' : files.length > 0 ? '#334155' : '#94A3B8',
              cursor: files.length > 0 ? 'pointer' : 'not-allowed',
              boxShadow: step === s.num ? '0 2px 4px rgba(37,99,235,0.2)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px 4px',
              textAlign: 'center',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ================= SCREEN 1: UPLOAD & SHOP ================= */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Main Drag/Tap Upload Card */}
          <div
            style={{
              border: '2px dashed #93C5FD',
              borderRadius: '16px',
              padding: '32px 16px',
              textAlign: 'center',
              background: '#EFF6FF',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <input
              type="file"
              multiple
              accept="application/pdf,image/*,.docx,.xlsx,.pptx"
              onChange={handleFileUpload}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer',
              }}
            />
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
              <Upload size={28} color="#2563EB" />
            </div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1rem', color: '#1E293B' }}>{t.upload_cta}</h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>PDF, PNG, JPG, Word, Excel • Up to 100MB</p>
          </div>

          {/* Camera Capture Button */}
          <label
            style={{
              minHeight: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '12px',
              padding: '12px',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <Camera size={20} color="#2563EB" />
            {t.camera_cta}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>

          {/* Uploaded Files List */}
          {files.length > 0 && (
            <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#475569' }}>Uploaded Files ({files.length})</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {files.map((f, idx) => (
                  <div
                    key={f.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: '#F8FAFC',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText size={20} color="#2563EB" />
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}>{f.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                          {f.pages} pages • {f.size} • <span style={{ color: '#2563EB', fontWeight: 600 }}>{f.format}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                      style={{ minWidth: '44px', minHeight: '44px', background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= SCREEN 2: CONFIGURE & LIVE PREVIEW ================= */}
      {step === 2 && currentFile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Apply-to-all toggle */}
          {files.length > 1 && (
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1E40AF' }}>{t.apply_to_all}</span>
              <input
                type="checkbox"
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
                style={{ width: '20px', height: '20px', accentColor: '#2563EB' }}
              />
            </div>
          )}

          {/* Interactive Visual Preview Canvas */}
          <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>LIVE PREVIEW (300 DPI ENGINE)</span>
              <span style={{ fontSize: '0.75rem', background: '#F1F5F9', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                Page {previewPage} of {currentFile.pages}
              </span>
            </div>

            {/* Visual Page Representation */}
            <div
              style={{
                width: '180px',
                height: '240px',
                margin: '0 auto 12px auto',
                background: '#FFFFFF',
                border: '2px solid #CBD5E1',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ height: '14px', background: currentFile.options.colorMode === 'color' ? '#2563EB' : '#475569', borderRadius: '3px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '2px', width: '90%' }} />
                <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '2px', width: '75%' }} />
                <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '2px', width: '85%' }} />
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748B', borderTop: '1px solid #F1F5F9', paddingTop: '4px' }}>
                {currentFile.options.duplex === 'simplex' ? 'Single Side' : 'Double Side'} • {currentFile.options.paperSize}
              </div>
            </div>

            {/* Page navigation controls */}
            {currentFile.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <button
                  disabled={previewPage <= 1}
                  onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                  style={{ minHeight: '44px', minWidth: '44px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', cursor: 'pointer' }}
                >
                  ←
                </button>
                <button
                  disabled={previewPage >= currentFile.pages}
                  onClick={() => setPreviewPage((p) => Math.min(currentFile.pages, p + 1))}
                  style={{ minHeight: '44px', minWidth: '44px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', cursor: 'pointer' }}
                >
                  →
                </button>
              </div>
            )}
          </div>

          {/* Quick Preset: Photo / Passport Layout */}
          <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Sparkles size={16} color="#2563EB" />
              {t.photo_preset}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                onClick={() => updateCurrentOptions({ photoPreset: 'standard' })}
                style={{
                  minHeight: '44px',
                  padding: '8px',
                  borderRadius: '8px',
                  border: currentFile.options.photoPreset === 'standard' ? '2px solid #2563EB' : '1px solid #CBD5E1',
                  background: currentFile.options.photoPreset === 'standard' ? '#EFF6FF' : '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                {t.standard_layout}
              </button>
              <button
                onClick={() => updateCurrentOptions({ photoPreset: 'passport_8up' })}
                style={{
                  minHeight: '44px',
                  padding: '8px',
                  borderRadius: '8px',
                  border: currentFile.options.photoPreset === 'passport_8up' ? '2px solid #2563EB' : '1px solid #CBD5E1',
                  background: currentFile.options.photoPreset === 'passport_8up' ? '#EFF6FF' : '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                {t.passport_8up}
              </button>
            </div>
          </div>

          {/* Print Options Form */}
          <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            {/* Color Mode */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>{t.color_mode}</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  onClick={() => updateCurrentOptions({ colorMode: 'bw' })}
                  style={{
                    minHeight: '44px',
                    borderRadius: '8px',
                    border: currentFile.options.colorMode === 'bw' ? '2px solid #2563EB' : '1px solid #CBD5E1',
                    background: currentFile.options.colorMode === 'bw' ? '#EFF6FF' : '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  {t.bw}
                </button>
                <button
                  onClick={() => updateCurrentOptions({ colorMode: 'color' })}
                  style={{
                    minHeight: '44px',
                    borderRadius: '8px',
                    border: currentFile.options.colorMode === 'color' ? '2px solid #2563EB' : '1px solid #CBD5E1',
                    background: currentFile.options.colorMode === 'color' ? '#EFF6FF' : '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  {t.color}
                </button>
              </div>
            </div>

            {/* Duplex (Sides) */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>{t.duplex}</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  onClick={() => updateCurrentOptions({ duplex: 'simplex' })}
                  style={{
                    minHeight: '44px',
                    borderRadius: '8px',
                    border: currentFile.options.duplex === 'simplex' ? '2px solid #2563EB' : '1px solid #CBD5E1',
                    background: currentFile.options.duplex === 'simplex' ? '#EFF6FF' : '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  {t.single_sided}
                </button>
                <button
                  onClick={() => updateCurrentOptions({ duplex: 'duplex_long' })}
                  style={{
                    minHeight: '44px',
                    borderRadius: '8px',
                    border: currentFile.options.duplex === 'duplex_long' ? '2px solid #2563EB' : '1px solid #CBD5E1',
                    background: currentFile.options.duplex === 'duplex_long' ? '#EFF6FF' : '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  {t.double_sided_long}
                </button>
              </div>
            </div>

            {/* Copies */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>{t.copies}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => updateCurrentOptions({ copies: Math.max(1, currentFile.options.copies - 1) })}
                  style={{ minHeight: '44px', minWidth: '44px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F1F5F9', fontWeight: 700, cursor: 'pointer' }}
                >
                  -
                </button>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, minWidth: '32px', textAlign: 'center' }}>{currentFile.options.copies}</span>
                <button
                  onClick={() => updateCurrentOptions({ copies: currentFile.options.copies + 1 })}
                  style={{ minHeight: '44px', minWidth: '44px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F1F5F9', fontWeight: 700, cursor: 'pointer' }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Paper Size & N-up */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>{t.paper_size}</label>
                <select
                  value={currentFile.options.paperSize}
                  onChange={(e) => updateCurrentOptions({ paperSize: e.target.value as any })}
                  style={{ minHeight: '44px', width: '100%', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '0.85rem' }}
                >
                  <option value="A4">A4 (Standard)</option>
                  <option value="A3">A3 (Large)</option>
                  <option value="Legal">Legal</option>
                  <option value="Letter">Letter</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>{t.nup}</label>
                <select
                  value={currentFile.options.nup}
                  onChange={(e) => updateCurrentOptions({ nup: parseInt(e.target.value) })}
                  style={{ minHeight: '44px', width: '100%', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '0.85rem' }}
                >
                  <option value={1}>1 Page / Sheet</option>
                  <option value={2}>2 Pages / Sheet</option>
                  <option value={4}>4 Pages / Sheet</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SCREEN 3: PAY & TRACKING ================= */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Locked Quote Card with Hash and Expiration */}
          <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={16} /> Locked Quote ({quoteHash.slice(0, 8)})
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                {t.quote_expires}: <b>{Math.floor(quoteSecondsLeft / 60)}:{String(quoteSecondsLeft % 60).padStart(2, '0')}</b>
              </span>
            </div>

            {/* Breakdown table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: '#475569', paddingBottom: '12px', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{t.logical_pages}:</span>
                <b>{accounting.totalLogical}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{t.rendered_sides}:</span>
                <b>{accounting.totalRendered}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{t.physical_sheets}:</span>
                <b>{accounting.totalSheets} sheets</b>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>{t.price_total}</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#2563EB' }}>₹{accounting.totalRupees}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '10px' }}>Select Payment Choice</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                onClick={() => setPaymentMethod('upi')}
                style={{
                  minHeight: '48px',
                  borderRadius: '10px',
                  border: paymentMethod === 'upi' ? '2px solid #2563EB' : '1px solid #CBD5E1',
                  background: paymentMethod === 'upi' ? '#EFF6FF' : '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <QrCode size={18} color="#2563EB" />
                {t.pay_upi}
              </button>
              <button
                onClick={() => setPaymentMethod('cash')}
                style={{
                  minHeight: '48px',
                  borderRadius: '10px',
                  border: paymentMethod === 'cash' ? '2px solid #2563EB' : '1px solid #CBD5E1',
                  background: paymentMethod === 'cash' ? '#EFF6FF' : '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                {t.pay_cash}
              </button>
            </div>
          </div>

          {/* Live Order Tracking Stepper */}
          <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>{t.order_status}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#EFF6FF', color: '#2563EB', padding: '4px 8px', borderRadius: '6px' }}>
                {t.tracking_id}: {trackingId}
              </span>
            </div>

            {/* Stepper Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { key: 'received', label: t.order_received, done: true },
                { key: 'approved', label: t.order_approved, done: orderStatus !== 'received' },
                { key: 'printing', label: t.printing, done: orderStatus === 'printing' || orderStatus === 'ready' },
                { key: 'ready', label: t.ready, done: orderStatus === 'ready' },
              ].map((st, i) => (
                <div key={st.key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: st.done ? '#10B981' : '#E2E8F0',
                      color: st.done ? '#FFFFFF' : '#94A3B8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {st.done ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: st.done ? 600 : 400, color: st.done ? '#0F172A' : '#94A3B8' }}>{st.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Checkout Footer */}
      {files.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#FFFFFF',
            borderTop: '1px solid #E2E8F0',
            padding: '12px 16px',
            boxShadow: '0 -4px 6px -1px rgba(0,0,0,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            maxWidth: '520px',
            margin: '0 auto',
            zIndex: 50,
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{accounting.totalSheets} sheets ({accounting.totalLogical} pages)</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#2563EB' }}>₹{accounting.totalRupees}</div>
          </div>

          {step === 1 && (
            <button
              onClick={() => setStep(2)}
              style={{
                minHeight: '48px',
                padding: '0 24px',
                borderRadius: '10px',
                background: '#2563EB',
                color: '#FFFFFF',
                fontWeight: 700,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
              }}
            >
              Next: Configure <ChevronRight size={18} />
            </button>
          )}

          {step === 2 && (
            <button
              onClick={() => setStep(3)}
              style={{
                minHeight: '48px',
                padding: '0 24px',
                borderRadius: '10px',
                background: '#2563EB',
                color: '#FFFFFF',
                fontWeight: 700,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
              }}
            >
              Next: Pay & Confirm <ChevronRight size={18} />
            </button>
          )}

          {step === 3 && (
            <button
              onClick={() => setOrderStatus('printing')}
              style={{
                minHeight: '48px',
                padding: '0 24px',
                borderRadius: '10px',
                background: '#10B981',
                color: '#FFFFFF',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Confirm & Dispatch
            </button>
          )}
        </div>
      )}

      {/* Password Prompt Modal for Protected PDFs */}
      {showPasswordModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 100 }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
              <Lock size={24} color="#D97706" />
            </div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', textAlign: 'center', color: '#1E293B' }}>{t.unlock_title}</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.8rem', color: '#64748B', textAlign: 'center' }}>{t.unlock_desc}</p>
            <input
              type="password"
              placeholder="Enter document password"
              value={enteredPassword}
              onChange={(e) => setEnteredPassword(e.target.value)}
              style={{ minHeight: '44px', width: '100%', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '0.9rem', marginBottom: '14px' }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                onClick={() => setShowPasswordModal(false)}
                style={{ minHeight: '44px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setStep(2);
                }}
                style={{ minHeight: '44px', borderRadius: '8px', border: 'none', background: '#2563EB', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
              >
                {t.unlock_btn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
