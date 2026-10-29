import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kiseniigikzncpzczurp.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpc2VuaWlnaWt6bmNwemN6dXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyNjAwMjQsImV4cCI6MjEwODgzNjAyNH0.QeezKAySr31yrvGgXs9OO8Tj-nX0vdV275RGpfBp-H4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface CustomerShopPortalProps {
  shopId: string;
  onBackToHome?: () => void;
}

interface UploadedDoc {
  id: string;
  name: string;
  size: string;
  pageCount: number;
  copies: number;
  colorMode: 'bw' | 'color' | 'grayscale';
  duplex: 'simplex' | 'duplex_long' | 'duplex_short';
  paperSize: string;
  pageRange: string;
  finishing: 'none' | 'staple' | 'spiral' | 'hard_bind';
}

export const CustomerShopPortal: React.FC<CustomerShopPortalProps> = ({ shopId, onBackToHome }) => {
  const [lang, setLang] = useState<'en' | 'ta' | 'hi'>('en');
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [shopDetails, setShopDetails] = useState<{
    name: string;
    city: string;
    phone: string;
    plan: string;
  }>({
    name: shopId.toUpperCase(),
    city: 'Local Counter',
    phone: '',
    plan: 'Active Shop',
  });

  const [files, setFiles] = useState<UploadedDoc[]>([]);
  const [activeFileId, setActiveFileId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash'>('upi');
  const [placedOrder, setPlacedOrder] = useState<{
    orderId: string;
    pin: string;
    totalRupees: number;
    sheets: number;
  } | null>(null);

  // Fetch registered shop details from Supabase
  useEffect(() => {
    async function loadShop() {
      try {
        const { data, error } = await supabase
          .from('pilot_applications')
          .select('shop_name, city, contact_number, plan')
          .eq('generated_username', shopId.toLowerCase())
          .maybeSingle();

        if (!error && data) {
          setShopDetails({
            name: data.shop_name || shopId.toUpperCase(),
            city: data.city || 'Counter Station',
            phone: data.contact_number || '',
            plan: data.plan || 'Commercial Plan',
          });
        }
      } catch {
        // Fallback to defaults
      }
    }
    loadShop();
  }, [shopId]);

  const activeDoc = files.find((f) => f.id === activeFileId) || files[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newDocs: UploadedDoc[] = Array.from(e.target.files).map((file) => ({
      id: crypto.randomUUID ? crypto.randomUUID() : 'f_' + Math.random().toString(36).slice(2, 9),
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      pageCount: file.name.toLowerCase().endsWith('.pdf') ? 4 : 1,
      copies: 1,
      colorMode: 'bw',
      duplex: 'simplex',
      paperSize: 'A4',
      pageRange: 'all',
      finishing: 'none',
    }));

    setFiles((prev) => [...prev, ...newDocs]);
    if (!activeFileId && newDocs.length > 0) {
      setActiveFileId(newDocs[0].id);
    }
    e.target.value = '';
  };

  const updateActiveDoc = (patch: Partial<UploadedDoc>) => {
    if (!activeDoc) return;
    setFiles((prev) =>
      prev.map((f) => (f.id === activeDoc.id ? { ...f, ...patch } : f))
    );
  };

  // Pricing calculation
  const quote = useMemo(() => {
    let totalRupees = 0;
    let totalSheets = 0;
    let totalLogical = 0;

    files.forEach((f) => {
      let pages = f.pageCount;
      if (f.pageRange === 'odd' || f.pageRange === 'even') {
        pages = Math.ceil(pages / 2);
      }
      const copies = Math.max(1, f.copies);
      totalLogical += pages * copies;

      const isDuplex = f.duplex !== 'simplex';
      const sheetsPerCopy = isDuplex ? Math.ceil(pages / 2) : pages;
      totalSheets += sheetsPerCopy * copies;

      const ratePerSide = f.colorMode === 'color' ? 10.0 : f.colorMode === 'grayscale' ? 2.0 : 1.5;

      let docCost = 0;
      if (isDuplex) {
        const fullSheets = Math.floor(pages / 2);
        const oddSide = pages % 2 !== 0;
        docCost = (fullSheets * (ratePerSide + ratePerSide * 0.85) + (oddSide ? ratePerSide : 0)) * copies;
      } else {
        docCost = pages * ratePerSide * copies;
      }

      if (f.finishing === 'staple') docCost += 5 * copies;
      if (f.finishing === 'spiral') docCost += 40 * copies;
      if (f.finishing === 'hard_bind') docCost += 150 * copies;

      totalRupees += docCost;
    });

    return {
      rupees: Number(totalRupees.toFixed(2)),
      sheets: totalSheets,
      logical: totalLogical,
    };
  }, [files]);

  const handlePlaceOrder = () => {
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    const orderId = 'PB-' + Math.floor(10000 + Math.random() * 90000);

    setPlacedOrder({
      orderId,
      pin,
      totalRupees: quote.rupees,
      sheets: quote.sheets,
    });
    setStep(4);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#090a0f', color: '#f3f4f6', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top Header */}
      <header style={{ borderBottom: '1px solid #1f2937', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111827' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>
            PB
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ margin: 0, fontSize: '17px', fontWeight: 750, color: '#fff' }}>{shopDetails.name}</h1>
              <span style={{ fontSize: '10px', background: '#1e3a8a', color: '#93c5fd', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                🔒 {shopId.toLowerCase()}.printbotak.vercel.app
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>{shopDetails.city} • Touchless Print Counter</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as any)}
            style={{ background: '#1f2937', color: '#f3f4f6', border: '1px solid #374151', padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}
          >
            <option value="en">English</option>
            <option value="ta">தமிழ்</option>
            <option value="hi">हिन्दी</option>
          </select>

          {onBackToHome && (
            <button
              onClick={onBackToHome}
              style={{ background: 'transparent', border: '1px solid #374151', color: '#9ca3af', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
            >
              Main Site
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Step Indicator */}
        {step < 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '24px' }}>
            {[
              { num: 1, title: lang === 'ta' ? '1. கோப்புகள்' : lang === 'hi' ? '1. फाइलें' : '1. Upload' },
              { num: 2, title: lang === 'ta' ? '2. விருப்பங்கள்' : lang === 'hi' ? '2. विकल्प' : '2. Options' },
              { num: 3, title: lang === 'ta' ? '3. உறுதிசெய்க' : lang === 'hi' ? '3. पुष्टि' : '3. Confirm & Pay' },
            ].map((s) => (
              <button
                key={s.num}
                disabled={s.num > 1 && files.length === 0}
                onClick={() => setStep(s.num as any)}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: step === s.num ? '1px solid #3b82f6' : '1px solid #1f2937',
                  background: step === s.num ? '#1e3a8a22' : '#111827',
                  color: step === s.num ? '#60a5fa' : '#6b7280',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: files.length > 0 ? 'pointer' : 'default',
                }}
              >
                {s.title}
              </button>
            ))}
          </div>
        )}

        {/* STEP 1: UPLOAD */}
        {step === 1 && (
          <div>
            <div style={{ border: '2px dashed #374151', borderRadius: '16px', padding: '40px 20px', textAlign: 'center', background: '#111827', marginBottom: '20px' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📄</div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px', color: '#fff' }}>
                {lang === 'ta' ? 'அச்சிட வேண்டிய ஆவணங்களை பதிவேற்றவும்' : lang === 'hi' ? 'प्रिंट करने के लिए दस्तावेज अपलोड करें' : 'Upload Documents to Print'}
              </h2>
              <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 16px' }}>
                Supports PDF, Images (JPG, PNG), Word &amp; Office documents.
              </p>

              <label style={{ display: 'inline-block', background: '#2563eb', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                {lang === 'ta' ? 'கோப்புகளைத் தேர்ந்தெடுக்கவும்' : lang === 'hi' ? 'दस्तावेज चुनें' : 'Choose Documents'}
                <input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.pptx"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Uploaded Files List */}
            {files.length > 0 && (
              <div style={{ background: '#111827', borderRadius: '12px', border: '1px solid #1f2937', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <strong style={{ fontSize: '14px', color: '#fff' }}>Selected Documents ({files.length})</strong>
                  <button onClick={() => setFiles([])} style={{ background: 'transparent', border: 0, color: '#ef4444', fontSize: '12px', cursor: 'pointer' }}>
                    Clear all
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {files.map((file) => (
                    <div
                      key={file.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: '#1f2937',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 650, color: '#fff' }}>{file.name}</div>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>{file.size} • {file.pageCount} pages</div>
                      </div>
                      <button
                        onClick={() => setFiles((prev) => prev.filter((f) => f.id !== file.id))}
                        style={{ background: 'transparent', border: 0, color: '#9ca3af', cursor: 'pointer', fontSize: '16px' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setStep(2)}
                  style={{ width: '100%', marginTop: '16px', background: '#2563eb', color: '#fff', border: 0, padding: '12px', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                >
                  Continue to Print Options →
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: CONFIGURE OPTIONS */}
        {step === 2 && activeDoc && (
          <div style={{ background: '#111827', borderRadius: '16px', border: '1px solid #1f2937', padding: '24px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 750, margin: '0 0 16px', color: '#fff' }}>Configure Print Settings</h2>

            {/* Color Mode */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#9ca3af', marginBottom: '8px' }}>COLOR MODE</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => updateActiveDoc({ colorMode: 'bw' })}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: activeDoc.colorMode === 'bw' ? '2px solid #3b82f6' : '1px solid #374151',
                    background: activeDoc.colorMode === 'bw' ? '#1e3a8a33' : '#1f2937',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div>Black &amp; White</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>₹1.50 per side</div>
                </button>

                <button
                  type="button"
                  onClick={() => updateActiveDoc({ colorMode: 'color' })}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: activeDoc.colorMode === 'color' ? '2px solid #3b82f6' : '1px solid #374151',
                    background: activeDoc.colorMode === 'color' ? '#1e3a8a33' : '#1f2937',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ color: '#ec4899' }}>Full Color</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>₹10.00 per side</div>
                </button>
              </div>
            </div>

            {/* Sides / Duplex */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#9ca3af', marginBottom: '8px' }}>PRINTED SIDES</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => updateActiveDoc({ duplex: 'simplex' })}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: activeDoc.duplex === 'simplex' ? '2px solid #3b82f6' : '1px solid #374151',
                    background: activeDoc.duplex === 'simplex' ? '#1e3a8a33' : '#1f2937',
                    color: '#fff',
                    fontWeight: 650,
                    cursor: 'pointer',
                  }}
                >
                  Single-sided (1 Side)
                </button>

                <button
                  type="button"
                  onClick={() => updateActiveDoc({ duplex: 'duplex_long' })}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: activeDoc.duplex === 'duplex_long' ? '2px solid #3b82f6' : '1px solid #374151',
                    background: activeDoc.duplex === 'duplex_long' ? '#1e3a8a33' : '#1f2937',
                    color: '#fff',
                    fontWeight: 650,
                    cursor: 'pointer',
                  }}
                >
                  Double-sided (Save 15%)
                </button>
              </div>
            </div>

            {/* Copies & Paper Size */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#9ca3af', marginBottom: '6px' }}>COPIES</label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={activeDoc.copies}
                  onChange={(e) => updateActiveDoc({ copies: Math.max(1, parseInt(e.target.value) || 1) })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#1f2937', border: '1px solid #374151', color: '#fff', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#9ca3af', marginBottom: '6px' }}>PAPER SIZE</label>
                <select
                  value={activeDoc.paperSize}
                  onChange={(e) => updateActiveDoc({ paperSize: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#1f2937', border: '1px solid #374151', color: '#fff', fontSize: '14px' }}
                >
                  <option value="A4">A4 Standard</option>
                  <option value="A3">A3 Large Format</option>
                  <option value="Legal">Legal Document</option>
                </select>
              </div>
            </div>

            {/* Live Pricing Summary Box */}
            <div style={{ background: '#1f2937', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>Estimated Total ({quote.sheets} physical sheets)</span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981' }}>₹{quote.rupees.toFixed(2)}</div>
              </div>
              <button
                onClick={() => setStep(3)}
                style={{ background: '#2563eb', color: '#fff', border: 0, padding: '10px 20px', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
              >
                Proceed to Checkout →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CONFIRM & PAY */}
        {step === 3 && (
          <div style={{ background: '#111827', borderRadius: '16px', border: '1px solid #1f2937', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 750, margin: '0 0 16px', color: '#fff' }}>Review &amp; Confirm Print Order</h2>

            <div style={{ background: '#1f2937', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: '#9ca3af' }}>Shop Destination:</span>
                <strong style={{ color: '#fff' }}>{shopDetails.name} ({shopId})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: '#9ca3af' }}>Documents:</span>
                <strong style={{ color: '#fff' }}>{files.length} file(s)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: '#9ca3af' }}>Physical Paper Sheets:</span>
                <strong style={{ color: '#fff' }}>{quote.sheets} sheets</strong>
              </div>
              <div style={{ borderTop: '1px solid #374151', paddingTop: '10px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Total Amount to Pay:</span>
                <span style={{ fontSize: '22px', fontWeight: 800, color: '#10b981' }}>₹{quote.rupees.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Choice */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#9ca3af', marginBottom: '8px' }}>PAYMENT METHOD</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: paymentMethod === 'upi' ? '2px solid #3b82f6' : '1px solid #374151',
                    background: paymentMethod === 'upi' ? '#1e3a8a33' : '#1f2937',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Instant UPI QR
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: paymentMethod === 'cash' ? '2px solid #3b82f6' : '1px solid #374151',
                    background: paymentMethod === 'cash' ? '#1e3a8a33' : '#1f2937',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Pay Cash at Counter
                </button>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              style={{ width: '100%', background: '#059669', color: '#fff', border: 0, padding: '14px', borderRadius: '10px', fontWeight: 800, fontSize: '15px', cursor: 'pointer' }}
            >
              ✓ Send Order to Shop Workstation
            </button>
          </div>
        )}

        {/* STEP 4: ORDER SUCCESS */}
        {step === 4 && placedOrder && (
          <div style={{ background: '#111827', borderRadius: '16px', border: '1px solid #059669', padding: '36px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#05966922', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px' }}>
              ✓
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px', color: '#fff' }}>Order Dispatched!</h2>
            <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 24px' }}>
              Your files have been securely transmitted to {shopDetails.name}'s Windows print spooler.
            </p>

            <div style={{ background: '#1f2937', borderRadius: '12px', padding: '20px', maxWidth: '320px', margin: '0 auto 24px', border: '1px solid #374151' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>COUNTER PICKUP PIN</div>
              <div style={{ fontSize: '36px', fontWeight: 900, color: '#60a5fa', letterSpacing: '4px', margin: '6px 0' }}>{placedOrder.pin}</div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>Order Ref: {placedOrder.orderId}</div>
            </div>

            <button
              onClick={() => {
                setFiles([]);
                setPlacedOrder(null);
                setStep(1);
              }}
              style={{ background: '#2563eb', color: '#fff', border: 0, padding: '12px 24px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
            >
              + Print Another Document
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
