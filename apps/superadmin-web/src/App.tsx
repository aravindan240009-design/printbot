import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Sliders, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  FileText,
  Search
} from 'lucide-react';

interface ShopEntry {
  id: string;
  name: string;
  city: string;
  subscriptionStatus: 'active' | 'trial' | 'past_due' | 'grace' | 'suspended' | 'canceled';
  printersCount: number;
  bandwidthUsageGb: number;
  bandwidthCeilingGb: number;
  adminOverride: boolean;
  adminOverrideReason?: string;
}

export default function SuperadminApp() {
  const [shops, setShops] = useState<ShopEntry[]>([
    {
      id: 'shop-anna-1111',
      name: 'Anna University Quick Xerox',
      city: 'Chennai',
      subscriptionStatus: 'active',
      printersCount: 4,
      bandwidthUsageGb: 12.4,
      bandwidthCeilingGb: 100,
      adminOverride: false,
    },
    {
      id: 'shop-bharat-2222',
      name: 'Bharat Fast Prints',
      city: 'Madurai',
      subscriptionStatus: 'grace',
      printersCount: 7,
      bandwidthUsageGb: 34.2,
      bandwidthCeilingGb: 100,
      adminOverride: false,
    },
    {
      id: 'shop-kovai-3333',
      name: 'Kovai Tech Copiers',
      city: 'Coimbatore',
      subscriptionStatus: 'suspended',
      printersCount: 2,
      bandwidthUsageGb: 5.1,
      bandwidthCeilingGb: 100,
      adminOverride: false,
    },
  ]);

  const [selectedShop, setSelectedShop] = useState<ShopEntry | null>(null);
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [auditLogs, setAuditLogs] = useState<string[]>([
    '2026-10-22 14:30:00 — [AUTH] Superadmin MFA session established (TOTP)',
    '2026-10-22 14:28:12 — [SUBSCRIPTION] shop-bharat-2222 entered grace period (7 days remaining)',
    '2026-10-22 14:15:00 — [DEVICE] shop-anna-1111 paired Windows device ws-chennai-1 (Ed25519)',
  ]);

  const handleApplyOverride = () => {
    if (!selectedShop || !overrideReason.trim()) return;

    setShops((prev) =>
      prev.map((s) =>
        s.id === selectedShop.id
          ? {
              ...s,
              adminOverride: true,
              adminOverrideReason: overrideReason,
              subscriptionStatus: 'active',
            }
          : s
      )
    );

    const logEntry = `${new Date().toISOString()} — [OVERRIDE] Superadmin granted administrative override for ${selectedShop.name} (${selectedShop.id}). Reason: "${overrideReason}"`;
    setAuditLogs((prev) => [logEntry, ...prev]);

    setSelectedShop(null);
    setOverrideReason('');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#090d16' }}>
      {/* Superadmin Header */}
      <header style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Building2 size={28} color="#38bdf8" />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
              Print Bot — Superadmin Platform Operations
            </h1>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Multi-Tenant SaaS Control Plane • Single All-Inclusive Plan</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#14532d', color: '#4ade80', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
            <ShieldCheck size={16} />
            <span>MFA Active (TOTP RFC 6238)</span>
          </div>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>superadmin@printbot.in</span>
        </div>
      </header>

      {/* Main Grid */}
      <main style={{ flex: 1, padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Shops Table */}
        <section style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
              Subscribed Printing Shops ({shops.length})
            </h2>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Plan: <strong style={{ color: '#38bdf8' }}>All-Inclusive (₹999/mo)</strong> • Unlimited Printers
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {shops.map((s) => (
              <div
                key={s.id}
                style={{
                  background: '#1e293b',
                  border: s.adminOverride ? '1px solid #0284c7' : '1px solid #334155',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '1rem', color: '#f8fafc' }}>{s.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>({s.city})</span>
                    {s.adminOverride && (
                      <span style={{ background: '#0369a1', color: '#ffffff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        AUDITED OVERRIDE
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                    Printers: {s.printersCount} (Unlimited) • Quota: {s.bandwidthUsageGb} / {s.bandwidthCeilingGb} GB
                  </div>
                  {s.adminOverrideReason && (
                    <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '2px' }}>
                      Override note: "{s.adminOverrideReason}"
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background:
                        s.subscriptionStatus === 'active'
                          ? '#14532d'
                          : s.subscriptionStatus === 'grace'
                          ? '#78350f'
                          : '#7f1d1d',
                      color:
                        s.subscriptionStatus === 'active'
                          ? '#4ade80'
                          : s.subscriptionStatus === 'grace'
                          ? '#fbbf24'
                          : '#f87171',
                    }}
                  >
                    {s.subscriptionStatus.toUpperCase()}
                  </span>

                  <button
                    onClick={() => setSelectedShop(s)}
                    style={{
                      background: '#334155',
                      color: '#f8fafc',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Override
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Column: Audit Log & Impersonation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Audit Event Stream */}
          <section style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px', flex: 1 }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="#38bdf8" />
              Platform Audit Events
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto' }}>
              {auditLogs.map((log, idx) => (
                <div key={idx} style={{ fontSize: '0.75rem', color: '#cbd5e1', padding: '8px', background: '#1e293b', borderRadius: '6px', borderLeft: '3px solid #38bdf8' }}>
                  {log}
                </div>
              ))}
            </div>
          </section>

          {/* Support Impersonation Policy Notice */}
          <section style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Lock size={18} color="#eab308" />
              <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>Tenant Isolation Policy</strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
              PostgreSQL RLS is forced on all tenant tables. Support impersonation sessions require explicit justification and strictly block customer document downloads by default.
            </p>
          </section>
        </div>
      </main>

      {/* Override Modal */}
      {selectedShop && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '24px', maxWidth: '480px', width: '100%' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#f8fafc' }}>
              Administrative Override: {selectedShop.name}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '16px' }}>
              This action overrides subscription suspension or grace state, allowing all print operations to continue. A formal audit justification is mandatory.
            </p>

            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>
              Mandatory Audit Reason:
            </label>
            <textarea
              rows={3}
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g., Bank NEFT settlement verification pending; approved by platform lead."
              style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#1e293b', border: '1px solid #475569', color: '#f8fafc', marginBottom: '16px' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setSelectedShop(null)}
                style={{ background: 'transparent', border: '1px solid #475569', color: '#94a3b8', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleApplyOverride}
                disabled={!overrideReason.trim()}
                style={{
                  background: overrideReason.trim() ? '#0284c7' : '#334155',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: overrideReason.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Apply Audited Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
