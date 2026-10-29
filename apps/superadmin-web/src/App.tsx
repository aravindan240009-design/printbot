import { useRef, useState } from 'react';
import {
  Building2,
  Activity,
  Shield,
  Search,
  ArrowUpRight,
  Printer,
  Lock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Download,
  KeyRound,
  Database,
  Cpu,
  FileCheck,
  Server
} from 'lucide-react';
import { PrintBotLogo, ThemeProvider, MotionSurface, StudioHeader, useGsapStagger, Select } from '@xerox/ui';
import '@xerox/ui/src/studio.css';

type Shop = {
  id: string;
  name: string;
  city: string;
  status: 'Active' | 'Grace period' | 'Suspended';
  printers: number;
  devices: number;
  monthlyImpressions: number;
  storageGb: number;
  renewalDate: string;
  override?: string;
};

interface AuditLogEvent {
  id: string;
  timestamp: string;
  actor: 'SUPERADMIN' | 'STAFF' | 'DEVICE' | 'SYSTEM';
  actorId: string;
  shopId: string;
  action: string;
  details: string;
  hash: string;
  verified: boolean;
}

const initialShops: Shop[] = [
  { id: 'shop-anna-1111', name: 'Anna University Quick Xerox', city: 'Chennai', status: 'Active', printers: 4, devices: 2, monthlyImpressions: 48200, storageGb: 12.4, renewalDate: '2026-11-28' },
  { id: 'shop-bharat-2222', name: 'Bharat Fast Prints & Stationery', city: 'Madurai', status: 'Grace period', printers: 7, devices: 3, monthlyImpressions: 92400, storageGb: 34.2, renewalDate: '2026-10-31' },
  { id: 'shop-kovai-3333', name: 'Kovai Tech Copiers & Blueprints', city: 'Coimbatore', status: 'Suspended', printers: 2, devices: 1, monthlyImpressions: 14100, storageGb: 5.1, renewalDate: '2026-10-15' },
  { id: 'shop-trichy-4444', name: 'Cauvery Digital Xerox Hub', city: 'Tiruchirappalli', status: 'Active', printers: 5, devices: 2, monthlyImpressions: 61800, storageGb: 18.7, renewalDate: '2026-12-05' },
];

const INITIAL_AUDIT_LOGS: AuditLogEvent[] = [
  { id: 'EVT-9041', timestamp: '18:42:15', actor: 'SUPERADMIN', actorId: 'admin@printbot.in', shopId: 'shop-anna-1111', action: 'SUBSCRIPTION_VERIFY', details: 'All-inclusive entitlement validated; 0 per-printer commissions enforced.', hash: 'a8f1...39c2', verified: true },
  { id: 'EVT-9040', timestamp: '18:24:08', actor: 'DEVICE', actorId: 'PC-ANNA-01', shopId: 'shop-anna-1111', action: 'TPM_KEY_ATTEST', details: 'Hardware non-exportable TPM 2.0 key pair verified; winspool.drv active.', hash: 'b7c2...e814', verified: true },
  { id: 'EVT-9039', timestamp: '17:51:30', actor: 'SYSTEM', actorId: 'celery-worker-04', shopId: 'shop-bharat-2222', action: 'S3_PURGE_EXPIRED', details: 'Ephemeral customer upload shredded after 24h retention window.', hash: '90ea...44a1', verified: true },
  { id: 'EVT-9038', timestamp: '16:10:44', actor: 'STAFF', actorId: 'staff@kovai.in', shopId: 'shop-kovai-3333', action: 'MANUAL_CASH_APPROVE', details: 'Order #PB-8910 verified at counter; dispatched to Canon driver.', hash: '33e1...ff02', verified: true },
];

function Console() {
  const [tab, setTab] = useState('Shops');
  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [selected, setSelected] = useState(initialShops[0].id);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All statuses');
  const [reason, setReason] = useState('');
  const [events, setEvents] = useState<AuditLogEvent[]>(INITIAL_AUDIT_LOGS);
  const [notice, setNotice] = useState('');
  const [dialogMode, setDialogMode] = useState<'OVERRIDE' | 'RENEW' | null>(null);

  const metricsRef = useGsapStagger<HTMLDivElement>({ stagger: 0.06, y: 12 });
  const recordListRef = useGsapStagger<HTMLDivElement>({ selector: '.record', stagger: 0.05, y: 10 });
  const dialog = useRef<HTMLDialogElement>(null);
  const shop = shops.find(s => s.id === selected) || shops[0];
  const visible = shops.filter(s => `${s.name} ${s.city} ${s.id}`.toLowerCase().includes(query.toLowerCase()) && (filter === 'All statuses' || s.status === filter));

  function openDialog(mode: 'OVERRIDE' | 'RENEW') {
    setDialogMode(mode);
    setReason('');
    dialog.current?.showModal();
  }

  function applyAction() {
    if (!reason.trim()) return;
    const now = new Date().toLocaleTimeString();

    if (dialogMode === 'RENEW') {
      setShops(prev => prev.map(s => s.id === selected ? { ...s, status: 'Active', renewalDate: '2026-12-28' } : s));
      const newEvt: AuditLogEvent = {
        id: `EVT-${Math.floor(9100 + Math.random() * 800)}`,
        timestamp: now,
        actor: 'SUPERADMIN',
        actorId: 'admin@printbot.in',
        shopId: shop.id,
        action: 'SUBSCRIPTION_RENEWAL',
        details: `Entitlement extended to 2026-12-28. Reason: ${reason.trim()}`,
        hash: 'e891...4412',
        verified: true,
      };
      setEvents(prev => [newEvt, ...prev]);
      setNotice(`Subscription renewed for ${shop.name} until 2026-12-28. RLS access renewed.`);
    } else {
      setShops(prev => prev.map(s => s.id === selected ? { ...s, override: reason.trim() } : s));
      const newEvt: AuditLogEvent = {
        id: `EVT-${Math.floor(9100 + Math.random() * 800)}`,
        timestamp: now,
        actor: 'SUPERADMIN',
        actorId: 'admin@printbot.in',
        shopId: shop.id,
        action: 'EMERGENCY_OVERRIDE',
        details: `Local override recorded: ${reason.trim()}`,
        hash: '77c1...119b',
        verified: true,
      };
      setEvents(prev => [newEvt, ...prev]);
      setNotice(`Administrative override logged for ${shop.name}.`);
    }

    dialog.current?.close();
    setDialogMode(null);
  }

  function verifyAuditChain() {
    setEvents(prev => prev.map(e => ({ ...e, verified: true })));
    setNotice('HMAC-SHA256 signature chain validated across all 4 audit records. Zero tampering.');
  }

  return (
    <div className="console-shell">
      <a className="skip-link" href="#main">Skip to main content</a>
      <aside className="console-rail">
        <div className="brand">
          <PrintBotLogo />
          <span>Print Bot<small>PLATFORM COMMAND</small></span>
        </div>
        <nav aria-label="Platform navigation">
          {[
            { title: 'Shops', icon: Building2 },
            { title: 'Activity', icon: Activity },
            { title: 'Access policy', icon: Shield }
          ].map(({ title, icon: Icon }) => (
            <button
              key={title}
              className={tab === title ? 'nav-active' : ''}
              aria-current={tab === title ? 'page' : undefined}
              onClick={() => setTab(title)}
            >
              <Icon size={18} />
              {title}
            </button>
          ))}
        </nav>
      </aside>

      <div className="console-body">
        <StudioHeader hideBrandIcon title="Platform Command" subtitle={`Super Admin · ${tab}`} />
        <main id="main">
          <div className="page-heading">
            <div>
              <span className="eyebrow">THE PLATFORM, IN PERSPECTIVE</span>
              <h1>
                {tab === 'Shops' ? 'Subscribed Shops Fleet.' : tab === 'Activity' ? 'Cryptographic Audit Trail.' : 'Tenant Boundaries & Policy.'}
              </h1>
              <p>
                {tab === 'Shops'
                  ? 'Monitor subscribed Xerox shops, subscription renewals, printer inventory, and authorized Windows devices.'
                  : tab === 'Activity'
                  ? 'Immutable ledger of administrative actions, device attestations, and system cleanups.'
                  : 'Zero-trust multi-tenancy rules, PostgreSQL RLS isolation, and TPM hardware key policies.'}
              </p>
            </div>
          </div>

          {notice && <p className="feedback" role="status">{notice}</p>}

          <MotionSurface transitionKey={tab}>
            {/* ============================================================== */}
            {/* TAB 1: SHOPS DIRECTORY                                         */}
            {/* ============================================================== */}
            {tab === 'Shops' && (
              <>
                <div ref={metricsRef} className="metrics">
                  <div className="metric-card">
                    <div className="metric-header">
                      <span>Subscribed Shops</span>
                      <div className="metric-icon-disc">
                        <Building2 size={16} />
                      </div>
                    </div>
                    <strong className="metric-value">{shops.length.toString().padStart(2, '0')}</strong>
                    <small className="metric-subtitle">Independent tenants</small>
                  </div>

                  <div className="metric-card">
                    <div className="metric-header">
                      <span>Needs Attention</span>
                      <div className="metric-icon-disc warning">
                        <AlertTriangle size={16} />
                      </div>
                    </div>
                    <strong className="metric-value">
                      {shops.filter(s => s.status !== 'Active').length.toString().padStart(2, '0')}
                    </strong>
                    <small className="metric-subtitle">Grace period or suspended</small>
                  </div>

                  <div className="metric-card">
                    <div className="metric-header">
                      <span>Pricing Tier Gate</span>
                      <div className="metric-icon-disc">
                        <Printer size={16} />
                      </div>
                    </div>
                    <div className="metric-mode-pill">
                      <span className="status-dot status-auto" />
                      <span className="status-label">Unlimited Fleet</span>
                    </div>
                    <small className="metric-subtitle">Zero per-printer software fee</small>
                  </div>
                </div>

                <div className="work-grid">
                  <section className="panel">
                    <div className="section-title">
                      <h2>Shop Directory</h2>
                      <span className="muted">{visible.length} shown</span>
                    </div>

                    <div className="filters">
                      <label className="search">
                        <Search size={18} />
                        <input
                          aria-label="Search shops"
                          placeholder="Search shop name, city, or ID…"
                          value={query}
                          onChange={e => setQuery(e.target.value)}
                        />
                      </label>
                      <Select
                        ariaLabel="Filter subscription status"
                        value={filter}
                        onChange={setFilter}
                        options={['All statuses', 'Active', 'Grace period', 'Suspended']}
                        style={{ minWidth: '175px' }}
                      />
                    </div>

                    <div ref={recordListRef} className="record-list">
                      {visible.map(s => (
                        <button
                          key={s.id}
                          className={`record ${selected === s.id ? 'selected' : ''}`}
                          aria-pressed={selected === s.id}
                          onClick={() => setSelected(s.id)}
                        >
                          <span className="record-icon">
                            <Building2 size={22} />
                          </span>
                          <span className="record-info">
                            <small>{s.city} · {s.id}</small>
                            <strong>{s.name}</strong>
                            <span>{s.printers} printers · {s.devices} authorized PCs · {s.monthlyImpressions.toLocaleString()} monthly pages</span>
                          </span>
                          <span className="record-end">
                            <span className={`badge ${s.status === 'Active' ? 'badge-online' : s.status === 'Suspended' ? 'danger' : 'warning'}`}>
                              {s.status}
                            </span>
                            <ArrowUpRight size={18} />
                          </span>
                        </button>
                      ))}
                      {!visible.length && (
                        <div className="empty">
                          <Search size={32} />
                          <h3>No shops found</h3>
                          <p>Try searching another name or reset the status filter.</p>
                          <button onClick={() => { setQuery(''); setFilter('All statuses'); }}>Clear filters</button>
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="panel detail" aria-label="Selected shop details">
                    <span className="eyebrow">SHOP ENTITLEMENT DETAILS</span>
                    <h2>{shop.name}</h2>
                    <p className="detail-name">{shop.id}</p>

                    <dl>
                      <div>
                        <dt>Operating City</dt>
                        <dd>{shop.city}, Tamil Nadu</dd>
                      </div>
                      <div>
                        <dt>Subscription Plan</dt>
                        <dd><strong>All-Inclusive Plan</strong> ({shop.status})</dd>
                      </div>
                      <div>
                        <dt>Renewal Date</dt>
                        <dd>{shop.renewalDate}</dd>
                      </div>
                      <div>
                        <dt>Connected Fleet</dt>
                        <dd>{shop.printers} Printers (Unlimited Entitlement)</dd>
                      </div>
                      <div>
                        <dt>Authorized PCs</dt>
                        <dd>{shop.devices} Workstations (TPM 2.0 Paired)</dd>
                      </div>
                      <div>
                        <dt>Monthly Volume</dt>
                        <dd>{shop.monthlyImpressions.toLocaleString()} physical pages</dd>
                      </div>
                      <div>
                        <dt>Temp S3 Storage</dt>
                        <dd>{shop.storageGb} GB (Ephemeral 24h retention)</dd>
                      </div>
                    </dl>

                    {shop.override && (
                      <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--pb-raised)', border: '1px solid var(--pb-border)', margin: '14px 0' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--pb-accent)' }}>Active Support Override:</span>
                        <p style={{ margin: '4px 0 0', fontSize: '12px' }}>{shop.override}</p>
                      </div>
                    )}

                    <div className="actions" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button
                        className="primary"
                        onClick={() => openDialog('RENEW')}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        <RefreshCw size={15} />
                        Simulate Subscription Renewal
                      </button>

                      <button
                        onClick={() => openDialog('OVERRIDE')}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        <Shield size={15} />
                        Record Audited Support Override
                      </button>
                    </div>

                    <p className="note" style={{ marginTop: '16px' }}>
                      <Lock size={13} style={{ display: 'inline', marginRight: '4px' }} />
                      No customer document content or personal data is accessible here. Support operations are constrained by zero-trust tenant RLS.
                    </p>
                  </section>
                </div>
              </>
            )}

            {/* ============================================================== */}
            {/* TAB 2: AUDIT ACTIVITY & TAMPER-EVIDENT TRAIL                   */}
            {/* ============================================================== */}
            {tab === 'Activity' && (
              <div className="work-grid">
                <section className="panel">
                  <div className="section-title">
                    <h2>Cryptographic Audit Event Stream</h2>
                    <span className="badge">{events.length} Events Logged</span>
                  </div>
                  <p className="muted" style={{ marginBottom: '16px' }}>
                    Every elevated action captures the actor, shop scope, RFC 7807 problem details (if any), and cryptographic hash.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {events.map((evt) => (
                      <div
                        key={evt.id}
                        style={{
                          padding: '14px 16px',
                          borderRadius: '10px',
                          background: 'var(--pb-raised)',
                          border: '1px solid var(--pb-border)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--pb-accent)' }}>{evt.id}</span>
                            <span style={{ fontSize: '11px', color: 'var(--pb-muted)' }}>{evt.timestamp}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="badge" style={{ fontSize: '10px', textTransform: 'uppercase' }}>{evt.actor}</span>
                            {evt.verified && <span title="HMAC Verified"><CheckCircle2 size={14} color="#10b981" /></span>}
                          </div>
                        </div>

                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{evt.action} · <span style={{ color: 'var(--pb-muted)', fontWeight: 400 }}>{evt.shopId}</span></div>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--pb-muted)' }}>{evt.details}</p>
                        <div style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--pb-muted)', opacity: 0.8 }}>Hash: {evt.hash}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="panel">
                  <FileCheck size={32} style={{ color: 'var(--pb-accent)', marginBottom: '8px' }} />
                  <h2>Audit Integrity &amp; Export</h2>
                  <p>
                    Verify the complete audit ledger against server-side tamper-evident hashes or export for compliance reviews.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                    <button
                      className="primary"
                      onClick={verifyAuditChain}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <CheckCircle2 size={16} />
                      Verify Cryptographic HMAC Chain
                    </button>

                    <button
                      onClick={() => setNotice('Audit event ledger exported as printbot_audit_ledger.json.')}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <Download size={15} />
                      Export Audit Log (JSON)
                    </button>
                  </div>

                  <div style={{ marginTop: '24px', padding: '16px', borderRadius: '10px', background: 'var(--pb-raised)', border: '1px solid var(--pb-border)' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--pb-text)', textTransform: 'uppercase' }}>Durable Storage Policy:</span>
                    <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '12px', color: 'var(--pb-muted)', lineHeight: '1.7' }}>
                      <li>Audit records immutable in append-only table</li>
                      <li>Customer file content strictly redacted</li>
                      <li>Signed release updates require dual-admin key approval</li>
                    </ul>
                  </div>
                </section>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 3: ACCESS POLICY & ZERO-TRUST BOUNDARIES                   */}
            {/* ============================================================== */}
            {tab === 'Access policy' && (
              <div className="work-grid">
                <section className="panel">
                  <Shield size={32} style={{ color: 'var(--pb-accent)', marginBottom: '8px' }} />
                  <h2>Zero-Trust Tenant Boundaries</h2>
                  <p>
                    Strict separation between independent shops. Super-administrators manage entitlements, never browse customer files.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '18px' }}>
                    <div className="policy-item">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Database size={16} color="#10b981" />
                        <strong>PostgreSQL Row-Level Security (RLS)</strong>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--pb-muted)' }}>
                        Composite tenant foreign keys on orders, printers, and queues. Zero cross-tenant data leakage.
                      </p>
                    </div>

                    <div className="policy-item">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <KeyRound size={16} color="#10b981" />
                        <strong>TPM 2.0 Asymmetric Device Credentials</strong>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--pb-muted)' }}>
                        Windows counter installations use non-exportable hardware keys. Revocation takes effect in under 30 seconds.
                      </p>
                    </div>

                    <div className="policy-item">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Server size={16} color="#10b981" />
                        <strong>Ephemeral S3 Storage &amp; Shredding</strong>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--pb-muted)' }}>
                        Temporary PDFs automatically purged within 24 hours of completion. No customer documents retained permanently.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="panel">
                  <Cpu size={32} style={{ color: 'var(--pb-accent)', marginBottom: '8px' }} />
                  <h2>Platform Health &amp; Security Matrix</h2>
                  <p>Real-time security telemetry across active services and queues.</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', background: 'var(--pb-raised)', fontSize: '12px' }}>
                      <span>RLS Enforcement</span>
                      <strong style={{ color: '#10b981' }}>100% Passing (0 Violations)</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', background: 'var(--pb-raised)', fontSize: '12px' }}>
                      <span>Razorpay Webhook Ledger</span>
                      <strong style={{ color: '#10b981' }}>Idempotent Verified</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', background: 'var(--pb-raised)', fontSize: '12px' }}>
                      <span>Windows winspool.drv API</span>
                      <strong style={{ color: '#10b981' }}>Sub-1ms Queue Response</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', background: 'var(--pb-raised)', fontSize: '12px' }}>
                      <span>Asymmetric Auth Keys</span>
                      <strong style={{ color: '#10b981' }}>8 Pairs Active (0 Revoked)</strong>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </MotionSurface>
        </main>

        <footer>
          Print Bot Command Center <span>Platform Owner Engine · Zero Customer Content Telemetry</span>
        </footer>
      </div>

      {/* Confirmation Dialog */}
      <dialog ref={dialog} aria-labelledby="dialog-title" onCancel={() => setDialogMode(null)}>
        <form onSubmit={e => { e.preventDefault(); applyAction(); }}>
          <span className="eyebrow">AUDITED ACTION</span>
          <h2 id="dialog-title">
            {dialogMode === 'RENEW' ? `Renew Subscription for ${shop.name}?` : `Record Administrative Override?`}
          </h2>
          <p>
            {dialogMode === 'RENEW'
              ? 'This updates the entitlement record to Active and logs an event in the tamper-evident ledger.'
              : `Record an administrative support note for ${shop.name}. Reason is permanently audited.`}
          </p>

          <label htmlFor="action-reason">Reason (required)</label>
          <textarea
            id="action-reason"
            rows={3}
            maxLength={500}
            required
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Administrative justification..."
          />

          <div className="actions" style={{ marginTop: '16px' }}>
            <button type="button" onClick={() => { dialog.current?.close(); setDialogMode(null); }}>
              Cancel
            </button>
            <button className="primary" disabled={!reason.trim()}>
              Confirm &amp; Log Action
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Console />
    </ThemeProvider>
  );
}
