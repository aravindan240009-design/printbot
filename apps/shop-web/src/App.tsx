import React, { useState } from 'react';
import { 
  Printer, 
  Settings, 
  QrCode, 
  Check, 
  X, 
  Key, 
  Laptop, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';

interface Order {
  id: string;
  fileName: string;
  pages: number;
  copies: number;
  colorMode: 'bw' | 'color';
  totalPaise: number;
  status: 'PENDING_APPROVAL' | 'QUEUED' | 'PRINTING' | 'REJECTED';
  customer: string;
  createdAt: string;
}

export default function ShopApp() {
  const [orderMode, setOrderMode] = useState<'FULL_AUTOMATIC' | 'MANUAL_APPROVAL'>('FULL_AUTOMATIC');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [codeTtl, setCodeTtl] = useState<number>(600);
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'ord-101',
      fileName: 'Anna_Univ_Project_Report.pdf',
      pages: 42,
      copies: 2,
      colorMode: 'bw',
      totalPaise: 6300,
      status: 'QUEUED',
      customer: '+91 98765 43210',
      createdAt: '2 mins ago',
    },
    {
      id: 'ord-102',
      fileName: 'Aadhar_Card_Front_Back.pdf',
      pages: 2,
      copies: 1,
      colorMode: 'color',
      totalPaise: 2000,
      status: 'PENDING_APPROVAL',
      customer: '+91 94440 12345',
      createdAt: 'Just now',
    },
  ]);

  const [printers] = useState([
    { id: 'pr-1', name: 'Canon imageRUNNER ADVANCE C3530i', status: 'Online', default: true },
    { id: 'pr-2', name: 'HP LaserJet Pro M404dn', status: 'Online', default: false },
    { id: 'pr-3', name: 'Epson EcoTank L3250', status: 'Online', default: false },
  ]);

  const handleApprove = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: 'QUEUED' } : o))
    );
  };

  const handleReject = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: 'REJECTED' } : o))
    );
  };

  const generatePairingCode = () => {
    // 6-character random uppercase alphanumeric
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setPairingCode(code);
    setCodeTtl(600);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <nav style={{ background: '#0f172a', color: '#ffffff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Printer size={28} color="#38bdf8" />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Anna Xerox & Stationery</h1>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Shop ID: shop-anna-chennai • Chennai Guindy</span>
          </div>
        </div>

        {/* Subscription Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="#38bdf8" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>All-Inclusive Plan: Active</span>
            <span style={{ background: '#0284c7', color: '#ffffff', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>UNLIMITED PRINTERS</span>
          </div>

          {/* Mode Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#1e293b', borderRadius: '8px', padding: '4px' }}>
            <button
              onClick={() => setOrderMode('FULL_AUTOMATIC')}
              style={{
                border: 'none',
                background: orderMode === 'FULL_AUTOMATIC' ? '#16a34a' : 'transparent',
                color: '#ffffff',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Full Automatic
            </button>
            <button
              onClick={() => setOrderMode('MANUAL_APPROVAL')}
              style={{
                border: 'none',
                background: orderMode === 'MANUAL_APPROVAL' ? '#d97706' : 'transparent',
                color: '#ffffff',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Manual Approval
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div style={{ flex: 1, padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left Column: Live Queue */}
        <section style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Live Print Queue</h2>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Mode: {orderMode === 'FULL_AUTOMATIC' ? 'Full Auto (Paid jobs auto-dispatch)' : 'Manual Approval Required'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {orders.map((o) => (
              <div
                key={o.id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{o.fileName}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                    {o.pages} pages • {o.copies} copies • {o.colorMode.toUpperCase()} • ₹{(o.totalPaise / 100).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                    Customer: {o.customer} • {o.createdAt}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      background:
                        o.status === 'QUEUED'
                          ? '#dcfce7'
                          : o.status === 'PENDING_APPROVAL'
                          ? '#fef3c7'
                          : '#fee2e2',
                      color:
                        o.status === 'QUEUED'
                          ? '#15803d'
                          : o.status === 'PENDING_APPROVAL'
                          ? '#b45309'
                          : '#b91c1c',
                    }}
                  >
                    {o.status}
                  </span>

                  {o.status === 'PENDING_APPROVAL' && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleApprove(o.id)}
                        style={{
                          background: '#16a34a',
                          color: '#ffffff',
                          border: 'none',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(o.id)}
                        style={{
                          background: '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Column: Devices, Printers, QR Stand */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Windows Device Pairing */}
          <section style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Laptop size={18} color="#2563eb" />
              Windows Workstation Pairing
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 16px 0' }}>
              Connect counter Windows PC print service using cryptographically signed asymmetric keys.
            </p>

            {pairingCode ? (
              <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>ONE-TIME PAIRING CODE (TTL: 10 MIN)</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '4px', color: '#1e293b', margin: '8px 0' }}>
                  {pairingCode}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.75rem', color: '#16a34a' }}>
                  <ShieldCheck size={14} />
                  <span>Ed25519 asymmetric challenge ready</span>
                </div>
              </div>
            ) : (
              <button
                onClick={generatePairingCode}
                style={{
                  width: '100%',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Key size={16} /> Generate Device Pairing Code
              </button>
            )}
          </section>

          {/* Unlimited Printers */}
          <section style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Printer size={18} color="#16a34a" />
                Connected Printers ({printers.length})
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 700 }}>UNLIMITED TIER</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {printers.map((p) => (
                <div key={p.id} style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.85rem' }}>{p.name}</strong>
                    {p.default && <span style={{ marginLeft: '6px', fontSize: '0.65rem', background: '#e2e8f0', padding: '2px 4px', borderRadius: '4px' }}>Default</span>}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>{p.status}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Shop QR Stand */}
          <section style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', textAlign: 'center' }}>
            <QrCode size={36} color="#0f172a" style={{ margin: '0 auto 8px auto' }} />
            <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>Shop Counter QR Stand</h4>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>printbot.in/qr/anna-chennai</span>
          </section>
        </div>
      </div>
    </div>
  );
}
