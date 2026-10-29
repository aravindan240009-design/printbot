import { useEffect, useRef, useState } from 'react';
import {
  Printer,
  LayoutDashboard,
  Settings,
  Laptop,
  FileText,
  Search,
  QrCode,
  AlertTriangle,
  Cpu,
  CheckCircle2,
  Sparkles,
  Zap,
  Play,
  RotateCcw,
  ShieldCheck,
  Download,
  IndianRupee,
  Layers,
  ChevronRight,
  Clock
} from 'lucide-react';
import { PrintBotLogo, ThemeProvider, MotionSurface, StudioHeader, useGsapStagger } from '@xerox/ui';
import '@xerox/ui/src/studio.css';

type Mode = 'FULL_AUTOMATIC' | 'MANUAL_APPROVAL';
type Order = {
  id: string;
  name: string;
  pages: number;
  copies: number;
  color: string;
  paise: number;
  status: string;
  payment: string;
  mode: Mode;
  paperSize?: string;
  duplex?: boolean;
};

interface FleetPrinter {
  id: string;
  name: string;
  model: string;
  status: 'ONLINE' | 'PRINTING' | 'IDLE';
  connection: string;
  duplex: boolean;
  color: boolean;
  maxDpi: number;
  queueLength: number;
  paperTrays: string[];
}

const initialOrders: Order[] = [
  { id: 'PB-101', name: 'Project report.pdf', pages: 42, copies: 2, color: 'Black & white', paise: 6300, status: 'Queued', payment: 'Verified Razorpay UPI (sample)', mode: 'FULL_AUTOMATIC', paperSize: 'A4', duplex: true },
  { id: 'PB-102', name: 'ID front and back.pdf', pages: 2, copies: 1, color: 'Color', paise: 2000, status: 'Needs approval', payment: 'Cash at counter hold', mode: 'MANUAL_APPROVAL', paperSize: 'A4', duplex: false },
  { id: 'PB-103', name: 'Engineering Circuit Schematics.pdf', pages: 6, copies: 3, color: 'Color', paise: 4500, status: 'Queued', payment: 'Verified UPI (sample)', mode: 'FULL_AUTOMATIC', paperSize: 'A3', duplex: false },
  { id: 'PB-104', name: 'College Notes Odd-Even.pdf', pages: 80, copies: 1, color: 'Black & white', paise: 8000, status: 'Payment hold', payment: 'Unverified — awaiting counter check', mode: 'MANUAL_APPROVAL', paperSize: 'A4', duplex: true },
];

const INITIAL_FLEET: FleetPrinter[] = [
  { id: 'p1', name: 'Counter Canon iR-ADV C3530i', model: 'Canon imageRUNNER ADVANCE C3530i', status: 'ONLINE', connection: 'USB 3.0 winspool.drv', duplex: true, color: true, maxDpi: 1200, queueLength: 2, paperTrays: ['Tray 1: A4 80GSM (340 sheets)', 'Tray 2: A3 Executive (120 sheets)'] },
  { id: 'p2', name: 'High-Speed HP LaserJet M404dn', model: 'HP LaserJet Pro M404dn Duplex', status: 'IDLE', connection: 'LAN 1Gbps · 192.168.1.140', duplex: true, color: false, maxDpi: 1200, queueLength: 0, paperTrays: ['Tray 1: A4 Legal Ledger (450 sheets)'] },
  { id: 'p3', name: 'Photo Lab Epson EcoTank L8050', model: 'Epson EcoTank L8050 6-Color InkTank', status: 'ONLINE', connection: 'USB 2.0 winspool.drv', duplex: false, color: true, maxDpi: 5760, queueLength: 1, paperTrays: ['Top Feed: 260GSM Glossy Photo'] },
];

function Console() {
  const [tab, setTab] = useState('Queue');
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selected, setSelected] = useState('PB-102');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All orders');
  const [mode, setMode] = useState<Mode>('FULL_AUTOMATIC');
  const [pending, setPending] = useState<{ type: 'mode' | 'approve' | 'reject' | 'cash_paid'; mode?: Mode } | null>(null);
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState('');

  // Fleet simulator state
  const [fleet, setFleet] = useState<FleetPrinter[]>(INITIAL_FLEET);
  const [simulatingPrinter, setSimulatingPrinter] = useState<string | null>(null);

  // Pairing simulator state
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingCountdown, setPairingCountdown] = useState<number>(180);

  // Rate card in Paise
  const [bwPaise, setBwPaise] = useState<number>(150); // ₹1.50
  const [colorPaise, setColorPaise] = useState<number>(700); // ₹7.00
  const [duplexDiscountPercent, setDuplexDiscountPercent] = useState<number>(10); // 10%
  const [a3Multiplier, setA3Multiplier] = useState<number>(2.5);

  // QR standee modal
  const [qrModal, setQrModal] = useState<boolean>(false);

  const metricsRef = useGsapStagger<HTMLDivElement>({ stagger: 0.06, y: 12 });
  const recordListRef = useGsapStagger<HTMLDivElement>({ selector: '.record', stagger: 0.05, y: 10 });
  const dialog = useRef<HTMLDialogElement>(null);
  const order = orders.find(o => o.id === selected) || orders[0];
  const visible = orders.filter(o => `${o.name} ${o.id}`.toLowerCase().includes(query.toLowerCase()) && (filter === 'All orders' || o.status === filter));

  // Pairing timer countdown
  useEffect(() => {
    if (!pairingCode) return;
    const timer = setInterval(() => {
      setPairingCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setPairingCode(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pairingCode]);

  function generatePairingCode() {
    const code = `PB-${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;
    setPairingCode(code);
    setPairingCountdown(180);
    setNotice(`New pairing code ${code} issued. Enter into Windows Workstation within 3 minutes.`);
  }

  function simulatePrinterTest(printerId: string) {
    setSimulatingPrinter(printerId);
    setFleet(prev => prev.map(p => p.id === printerId ? { ...p, status: 'PRINTING' } : p));
    setTimeout(() => {
      setFleet(prev => prev.map(p => p.id === printerId ? { ...p, status: 'ONLINE' } : p));
      setSimulatingPrinter(null);
      setNotice('Test alignment sheet dispatched to Windows driver. WinSpool spooler verified 200 OK.');
    }, 2800);
  }

  function confirm(type: 'mode' | 'approve' | 'reject' | 'cash_paid', nextMode?: Mode) {
    setPending({ type, mode: nextMode });
    setReason('');
    dialog.current?.showModal();
  }

  function apply() {
    if (!pending) return;
    if (pending.type === 'mode') {
      if (!reason.trim()) return;
      setMode(pending.mode!);
      setNotice('Order mode updated. Accepted orders retain their original policy.');
    } else if (pending.type === 'cash_paid') {
      setOrders(items => items.map(o => o.id === selected ? { ...o, status: 'Queued', payment: 'Cash collected at counter (verified by staff)' } : o));
      setNotice(`Order ${selected}: Cash payment verified at counter. Dispatched to fleet queue.`);
    } else {
      if (!reason.trim()) return;
      setOrders(items => items.map(o => o.id === selected ? { ...o, status: pending.type === 'reject' ? 'Rejected' : 'Payment hold' } : o));
      setNotice(`${selected}: local ${pending.type === 'reject' ? 'rejection' : 'approval'} recorded.`);
    }
    dialog.current?.close();
    setPending(null);
  }

  return (
    <div className="console-shell">
      <a className="skip-link" href="#main">Skip to main content</a>
      <aside className="console-rail">
        <div className="brand">
          <PrintBotLogo />
          <span>Print Bot<small>SHOP STUDIO</small></span>
        </div>
        <nav aria-label="Shop navigation">
          {[
            { title: 'Queue', icon: LayoutDashboard },
            { title: 'Printers & devices', icon: Laptop },
            { title: 'Shop settings', icon: Settings }
          ].map(({ title, icon: Icon }) => (
            <button
              key={title}
              className={tab === title ? 'nav-active' : ''}
              aria-current={tab === title ? 'page' : undefined}
              onClick={() => setTab(title)}
            >
              <Icon size={19} />
              {title}
            </button>
          ))}
        </nav>
      </aside>

      <div className="console-body">
        <StudioHeader hideBrandIcon title="Anna Xerox & Stationery" subtitle={`Chennai, Guindy · ${tab}`} />
        <main id="main">
          <div className="workspace-context">
            <span className="context-line" />
            <span>LOCAL INTERACTIVE PREVIEW</span>
            <span>Shop ID: 11111111-1111-1111-1111-111111111111</span>
          </div>

          <div className="page-heading">
            <div>
              <span className="eyebrow">YOUR COUNTER, IN CONTROL</span>
              <h1>
                {tab === 'Queue' ? 'Live Counter Queue.' : tab === 'Printers & devices' ? 'Hardware Fleet & Pairing.' : 'Counter Rates & Policy.'}
              </h1>
              <p>
                {tab === 'Queue'
                  ? 'Review submitted jobs, verify counter cash payments, and route directly to your Windows printers.'
                  : tab === 'Printers & devices'
                  ? 'Manage unlimited connected printers and pair your Windows workstation with short-lived TPM keys.'
                  : 'Configure Indian paise rates, download counter QR standees, and set automatic approval boundaries.'}
              </p>
            </div>
          </div>

          {notice && <p className="feedback" role="status">{notice}</p>}

          <MotionSurface transitionKey={tab}>
            {/* ============================================================== */}
            {/* TAB 1: LIVE QUEUE WORKSPACE                                    */}
            {/* ============================================================== */}
            {tab === 'Queue' && (
              <>
                <div ref={metricsRef} className="metrics">
                  <div className="metric-card">
                    <div className="metric-header">
                      <span>Active Orders</span>
                      <div className="metric-icon-disc">
                        <FileText size={16} />
                      </div>
                    </div>
                    <strong className="metric-value">{orders.length.toString().padStart(2, '0')}</strong>
                    <small className="metric-subtitle">Live in queue</small>
                  </div>

                  <div className="metric-card">
                    <div className="metric-header">
                      <span>Needs Action</span>
                      <div className="metric-icon-disc warning">
                        <AlertTriangle size={16} />
                      </div>
                    </div>
                    <strong className="metric-value">
                      {orders.filter(o => ['Needs approval', 'Payment hold'].includes(o.status)).length.toString().padStart(2, '0')}
                    </strong>
                    <small className="metric-subtitle">Cash hold or manual check</small>
                  </div>

                  <div className="metric-card">
                    <div className="metric-header">
                      <span>Active Policy</span>
                      <div className="metric-icon-disc">
                        <Cpu size={16} />
                      </div>
                    </div>
                    <div className="metric-mode-pill">
                      <span className={`status-dot ${mode === 'FULL_AUTOMATIC' ? 'status-auto' : 'status-manual'}`} />
                      <span className="status-label">{mode === 'FULL_AUTOMATIC' ? 'Full automatic' : 'Manual approval'}</span>
                    </div>
                    <small className="metric-subtitle">Applies to eligible paid jobs</small>
                  </div>
                </div>

                <div className="work-grid">
                  <section className="panel">
                    <div className="section-title">
                      <h2>Order workspace</h2>
                      <span className="muted">{visible.length} shown</span>
                    </div>

                    <div className="filters">
                      <label className="search">
                        <Search size={18} />
                        <input
                          aria-label="Search orders"
                          placeholder="Search order ID or file name…"
                          value={query}
                          onChange={e => setQuery(e.target.value)}
                        />
                      </label>
                      <select
                        aria-label="Filter order status"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                      >
                        {['All orders', 'Needs approval', 'Queued', 'Payment hold', 'Rejected'].map(s => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div ref={recordListRef} className="record-list">
                      {visible.map(o => (
                        <button
                          key={o.id}
                          className={`record ${selected === o.id ? 'selected' : ''}`}
                          onClick={() => setSelected(o.id)}
                          aria-pressed={selected === o.id}
                        >
                          <span className="record-icon">
                            <FileText size={22} />
                          </span>
                          <span className="record-info">
                            <small>{o.id} · {o.paperSize || 'A4'} {o.duplex ? '· Duplex' : '· 1-Sided'}</small>
                            <strong>{o.name}</strong>
                            <span>{o.pages} pages · {o.copies} {o.copies === 1 ? 'copy' : 'copies'} · {o.color}</span>
                          </span>
                          <span className="record-end">
                            <span className={`badge ${o.status === 'Needs approval' || o.status === 'Payment hold' ? 'warning' : o.status === 'Queued' ? 'badge-online' : ''}`}>
                              {o.status}
                            </span>
                            <strong>₹{(o.paise / 100).toFixed(2)}</strong>
                          </span>
                        </button>
                      ))}
                      {!visible.length && (
                        <div className="empty">
                          <Search size={32} />
                          <h3>No matching orders</h3>
                          <p>Try a different keyword or status filter.</p>
                          <button onClick={() => { setQuery(''); setFilter('All orders'); }}>Reset filters</button>
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="panel detail" aria-label="Selected order details">
                    <span className="eyebrow">ORDER DETAILS</span>
                    <h2>{order.id}</h2>
                    <p className="detail-name">{order.name}</p>

                    <dl>
                      <div>
                        <dt>Color &amp; Paper</dt>
                        <dd>{order.color} · {order.paperSize || 'A4'} {order.duplex ? '(Duplex)' : '(Simplex)'}</dd>
                      </div>
                      <div>
                        <dt>Logical Pages / Copies</dt>
                        <dd>{order.pages} pages · {order.copies} {order.copies === 1 ? 'copy' : 'copies'}</dd>
                      </div>
                      <div>
                        <dt>Quote (Paise / INR)</dt>
                        <dd><strong>₹{(order.paise / 100).toFixed(2)}</strong> ({order.paise} paise)</dd>
                      </div>
                      <div>
                        <dt>Dispatch Mode</dt>
                        <dd>{order.mode === 'FULL_AUTOMATIC' ? 'Full automatic' : 'Manual approval'}</dd>
                      </div>
                      <div>
                        <dt>Payment Ledger</dt>
                        <dd>{order.payment}</dd>
                      </div>
                    </dl>

                    <div className="actions" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {order.status !== 'Queued' && (
                        <button
                          className="primary"
                          onClick={() => confirm('cash_paid')}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                          <CheckCircle2 size={16} />
                          Verify Counter Cash &amp; Dispatch to Spooler
                        </button>
                      )}

                      {order.status === 'Needs approval' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => confirm('approve')}
                            style={{ flex: 1 }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => confirm('reject')}
                            style={{ flex: 1, borderColor: '#ef4444', color: '#ef4444' }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="note" style={{ marginTop: '16px' }}>
                      <ShieldCheck size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      Shop-scoped isolation active. Zero automatic reprints on ambiguous physical outcomes.
                    </p>
                  </section>
                </div>
              </>
            )}

            {/* ============================================================== */}
            {/* TAB 2: PRINTER FLEET & DEVICE PAIRING                          */}
            {/* ============================================================== */}
            {tab === 'Printers & devices' && (
              <div className="work-grid">
                <section className="panel">
                  <div className="section-title">
                    <h2>Your Connected Printer Fleet</h2>
                    <span className="badge">Unlimited printers per shop</span>
                  </div>
                  <p className="muted" style={{ marginBottom: '20px' }}>
                    Zero per-printer licenses. All compatible Windows drivers are accessible simultaneously.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {fleet.map((printer) => (
                      <div
                        key={printer.id}
                        className="inventory"
                        style={{
                          padding: '16px',
                          borderRadius: '12px',
                          border: '1.5px solid var(--pb-border)',
                          background: 'var(--pb-surface)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'var(--pb-raised)', display: 'grid', placeItems: 'center', color: 'var(--pb-accent)' }}>
                              <Printer size={20} />
                            </div>
                            <div>
                              <strong style={{ fontSize: '14px' }}>{printer.name}</strong>
                              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--pb-muted)' }}>{printer.model}</p>
                            </div>
                          </div>

                          <span className={`badge ${printer.status === 'PRINTING' ? 'warning' : 'badge-online'}`}>
                            {printer.status === 'PRINTING' ? 'Simulating Print...' : 'Online · Ready'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '11px', color: 'var(--pb-muted)' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--pb-raised)' }}>{printer.connection}</span>
                          <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--pb-raised)' }}>{printer.maxDpi} DPI</span>
                          {printer.duplex && <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--pb-raised)' }}>Auto-Duplex</span>}
                          {printer.color && <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--pb-raised)' }}>Color Ready</span>}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--pb-border)' }}>
                          <small style={{ fontSize: '11px', color: 'var(--pb-muted)' }}>{printer.paperTrays.join(' · ')}</small>
                          <button
                            type="button"
                            disabled={simulatingPrinter === printer.id}
                            onClick={() => simulatePrinterTest(printer.id)}
                            style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 600, borderRadius: '6px', border: '1px solid var(--pb-accent)', color: 'var(--pb-accent)', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Play size={12} />
                            {simulatingPrinter === printer.id ? 'Spooling...' : 'Simulate Test Page'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="panel">
                  <Laptop size={32} style={{ color: 'var(--pb-accent)', marginBottom: '8px' }} />
                  <h2>Windows Workstation Device Pairing</h2>
                  <p>
                    Each physical PC at your counter authenticates using an asymmetric key pair. Shop ID and device ID are public identifiers; TPM non-exportable private keys remain local.
                  </p>

                  <div style={{ marginTop: '20px', padding: '16px', borderRadius: '12px', background: 'var(--pb-raised)', border: '1px solid var(--pb-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--pb-text)' }}>Counter PC Status</span>
                      <span className="badge badge-online">Authorized Pairing Active</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--pb-muted)', margin: '0 0 12px' }}>
                      Workstation PC #1 · Windows 11 Pro 64-bit · winspool.drv v10.0.26100.1
                    </p>

                    {pairingCode ? (
                      <div style={{ textAlign: 'center', padding: '16px', borderRadius: '10px', background: 'var(--pb-surface)', border: '1.5px dashed var(--pb-accent)' }}>
                        <span style={{ fontSize: '11px', color: 'var(--pb-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>One-Time Pairing Code</span>
                        <h3 style={{ fontSize: '28px', letterSpacing: '4px', margin: '6px 0', color: 'var(--pb-accent)', fontFamily: 'monospace' }}>{pairingCode}</h3>
                        <small style={{ color: 'var(--pb-muted)', fontSize: '12px' }}>
                          <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                          Expires in <strong>{pairingCountdown}s</strong>. Enter in Desktop App.
                        </small>
                      </div>
                    ) : (
                      <button
                        className="primary"
                        onClick={generatePairingCode}
                        style={{ width: '100%', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        <Zap size={16} />
                        Generate Short-Lived Pairing Code
                      </button>
                    )}
                  </div>

                  <div className="workstation-status-panel" style={{ marginTop: '20px' }}>
                    <div className="ws-status-chip">
                      <span className="status-dot status-auto" />
                      <span>TPM 2.0 HARDWARE ASSURANCE · VERIFIED</span>
                    </div>
                    <p style={{ margin: '10px 0 0', fontSize: '12px', color: 'var(--pb-muted)' }}>
                      Non-exportable device key verified. Super-admin may audit device pairing policies independently without gating printer counts.
                    </p>
                  </div>
                </section>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 3: SHOP SETTINGS & COUNTER RATE CARD                       */}
            {/* ============================================================== */}
            {tab === 'Shop settings' && (
              <div className="work-grid">
                {/* Rate Card Panel */}
                <section className="panel">
                  <span className="eyebrow">COUNTER RATES IN PAISE</span>
                  <h2>Interactive Rate Card Editor</h2>
                  <p>All pricing is server-authoritative and calculated down to single paise at checkout.</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                    {/* B&W Price */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '8px', background: 'var(--pb-raised)' }}>
                      <div>
                        <strong>Black &amp; White (per side)</strong>
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--pb-muted)' }}>Standard 75/80 GSM Paper</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700 }}>₹{(bwPaise / 100).toFixed(2)}</span>
                        <input
                          type="number"
                          step="25"
                          min="50"
                          max="1000"
                          value={bwPaise}
                          onChange={(e) => setBwPaise(Number(e.target.value))}
                          style={{ width: '80px', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--pb-border)', background: 'var(--pb-surface)', color: 'var(--pb-text)', fontSize: '13px', textAlign: 'right' }}
                        />
                        <span style={{ fontSize: '11px', color: 'var(--pb-muted)' }}>paise</span>
                      </div>
                    </div>

                    {/* Color Price */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '8px', background: 'var(--pb-raised)' }}>
                      <div>
                        <strong>Full Color (per side)</strong>
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--pb-muted)' }}>Vibrant InkTank/Laser print</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--pb-accent)' }}>₹{(colorPaise / 100).toFixed(2)}</span>
                        <input
                          type="number"
                          step="50"
                          min="200"
                          max="2500"
                          value={colorPaise}
                          onChange={(e) => setColorPaise(Number(e.target.value))}
                          style={{ width: '80px', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--pb-border)', background: 'var(--pb-surface)', color: 'var(--pb-text)', fontSize: '13px', textAlign: 'right' }}
                        />
                        <span style={{ fontSize: '11px', color: 'var(--pb-muted)' }}>paise</span>
                      </div>
                    </div>

                    {/* Duplex Discount */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '8px', background: 'var(--pb-raised)' }}>
                      <div>
                        <strong>Duplex (Two-Sided) Discount</strong>
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--pb-muted)' }}>Customer incentive to save sheets</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          step="5"
                          min="0"
                          max="40"
                          value={duplexDiscountPercent}
                          onChange={(e) => setDuplexDiscountPercent(Number(e.target.value))}
                          style={{ width: '60px', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--pb-border)', background: 'var(--pb-surface)', color: 'var(--pb-text)', fontSize: '13px', textAlign: 'right' }}
                        />
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>% off</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="primary"
                      onClick={() => setNotice('Rate card successfully updated in shop database (version v2026.1).')}
                      style={{ marginTop: '8px' }}
                    >
                      Save Active Rate Card
                    </button>
                  </div>
                </section>

                {/* Counter QR Standee Panel */}
                <section className="panel">
                  <QrCode size={32} style={{ color: 'var(--pb-accent)', marginBottom: '8px' }} />
                  <h2>Customer Mobile Intake Standee</h2>
                  <p>
                    Place this QR on your physical counter or entrance. Customers scan, upload files instantly from their phones, and receive transparent pricing.
                  </p>

                  <div style={{ textAlign: 'center', padding: '24px', borderRadius: '14px', background: 'var(--pb-raised)', border: '1px solid var(--pb-border)', margin: '16px 0' }}>
                    <div style={{ width: '140px', height: '140px', margin: '0 auto 12px', background: '#fff', borderRadius: '12px', padding: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
                      <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none">
                        <rect width="100" height="100" fill="#fff" />
                        <rect x="10" y="10" width="30" height="30" fill="#211219" rx="4" />
                        <rect x="16" y="16" width="18" height="18" fill="#fff" rx="2" />
                        <rect x="20" y="20" width="10" height="10" fill="#211219" rx="1" />
                        <rect x="60" y="10" width="30" height="30" fill="#211219" rx="4" />
                        <rect x="66" y="16" width="18" height="18" fill="#fff" rx="2" />
                        <rect x="70" y="20" width="10" height="10" fill="#211219" rx="1" />
                        <rect x="10" y="60" width="30" height="30" fill="#211219" rx="4" />
                        <rect x="16" y="66" width="18" height="18" fill="#fff" rx="2" />
                        <rect x="20" y="70" width="10" height="10" fill="#211219" rx="1" />
                        <circle cx="50" cy="50" r="8" fill="#792d47" />
                        <rect x="45" y="65" width="25" height="6" fill="#211219" />
                        <rect x="65" y="45" width="6" height="25" fill="#211219" />
                      </svg>
                    </div>
                    <strong style={{ fontSize: '15px', display: 'block' }}>Anna Xerox &amp; Stationery</strong>
                    <small style={{ color: 'var(--pb-muted)', fontSize: '12px' }}>Guindy, Chennai · Counter 01</small>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <a
                      href="http://localhost:3000/?shop_id=11111111-1111-1111-1111-111111111111"
                      target="_blank"
                      rel="noreferrer"
                      className="primary"
                      style={{ flex: 1, textDecoration: 'none', textAlign: 'center', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}
                    >
                      Test Customer View
                    </a>
                    <button
                      type="button"
                      onClick={() => setNotice('Counter QR Standee SVG exported to downloads.')}
                      style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--pb-border)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Download size={14} />
                      Export Standee
                    </button>
                  </div>
                </section>
              </div>
            )}
          </MotionSurface>
        </main>

        <footer>
          Print Bot / Shop Studio <span>Connected: Anna Xerox Guindy · Subscription Active</span>
        </footer>
      </div>

      {/* Confirmation Dialog */}
      <dialog ref={dialog} aria-labelledby="confirm-title" onCancel={() => setPending(null)}>
        <form onSubmit={e => { e.preventDefault(); apply(); }}>
          <span className="eyebrow">ACTION CONFIRMATION</span>
          <h2 id="confirm-title">
            {pending?.type === 'mode'
              ? 'Update Shop Order Mode?'
              : pending?.type === 'cash_paid'
              ? `Confirm Counter Cash for ${selected}?`
              : pending?.type === 'reject'
              ? `Reject ${selected}?`
              : `Approve ${selected}?`}
          </h2>
          <p>
            {pending?.type === 'cash_paid'
              ? 'Marking as paid verifies cash collection at the counter and dispatches the document directly to the printer.'
              : pending?.type === 'mode'
              ? 'Only future submitted orders use this mode. Accepted orders retain their original policy.'
              : 'Record this staff action with an audited reason.'}
          </p>

          {pending?.type !== 'cash_paid' && (
            <>
              <label htmlFor="action-reason">Reason (required)</label>
              <textarea
                id="action-reason"
                required
                maxLength={500}
                rows={3}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Reason for audit ledger..."
              />
            </>
          )}

          <div className="actions" style={{ marginTop: '16px' }}>
            <button type="button" onClick={() => { dialog.current?.close(); setPending(null); }}>
              Cancel
            </button>
            <button className="primary" disabled={pending?.type !== 'cash_paid' && !reason.trim()}>
              Confirm Action
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
