import { useRef, useState, useEffect } from 'react';
import {
  Printer,
  LayoutDashboard,
  Settings,
  Laptop,
  FileText,
  Search,
  Shield,
  QrCode,
  Tag,
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  IndianRupee,
  Clock,
  Copy,
  Check,
  Download,
  ExternalLink,
  Sparkles,
  Layers,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  ThemeProvider,
  MotionSurface,
  PrinterScene,
  StudioHeader,
  useGsapStagger,
} from '@xerox/ui';
import '@xerox/ui/src/studio.css';

type Mode = 'FULL_AUTOMATIC' | 'MANUAL_APPROVAL';

interface Order {
  id: string;
  name: string;
  pages: number;
  copies: number;
  color: string;
  paise: number;
  status: 'Queued' | 'Needs approval' | 'Payment hold' | 'Printing' | 'Completed' | 'Rejected';
  payment: string;
  mode: Mode;
  paper: string;
  duplex: string;
  finishing: string;
  physicalSheets: number;
  customerPhone?: string;
  timestamp: string;
}

const initialOrders: Order[] = [
  {
    id: 'PB-101',
    name: 'Anna_Univ_Final_Project_Report.pdf',
    pages: 42,
    copies: 2,
    color: 'Black & white',
    paise: 6300,
    status: 'Queued',
    payment: 'Verified UPI (₹63.00)',
    mode: 'FULL_AUTOMATIC',
    paper: 'A4 (75 GSM)',
    duplex: '2-Sided (Duplex)',
    finishing: 'Corner Staple',
    physicalSheets: 42,
    customerPhone: '+91 98401 23456',
    timestamp: '10:42 AM',
  },
  {
    id: 'PB-102',
    name: 'Aadhar_ID_Card_Front_Back.pdf',
    pages: 2,
    copies: 1,
    color: 'Color',
    paise: 2000,
    status: 'Needs approval',
    payment: 'Cash at Counter (Unverified)',
    mode: 'MANUAL_APPROVAL',
    paper: 'A4 (100 GSM Photo)',
    duplex: '1-Sided (Simplex)',
    finishing: 'None',
    physicalSheets: 2,
    customerPhone: '+91 98765 43210',
    timestamp: '11:15 AM',
  },
  {
    id: 'PB-103',
    name: 'Engineering_Mechanics_Notes_Ch1-4.pdf',
    pages: 68,
    copies: 1,
    color: 'Black & white',
    paise: 5100,
    status: 'Printing',
    payment: 'Verified UPI (₹51.00)',
    mode: 'FULL_AUTOMATIC',
    paper: 'A4 (75 GSM)',
    duplex: '2-Sided (Duplex)',
    finishing: 'Spiral Coil Bound',
    physicalSheets: 34,
    customerPhone: '+91 94441 88888',
    timestamp: '11:28 AM',
  },
  {
    id: 'PB-104',
    name: 'Passport_Size_Photos_8UP.jpg',
    pages: 1,
    copies: 4,
    color: 'Color',
    paise: 6000,
    status: 'Completed',
    payment: 'Verified UPI (₹60.00)',
    mode: 'FULL_AUTOMATIC',
    paper: '4x6 Glossy Photo Paper',
    duplex: '1-Sided (Simplex)',
    finishing: 'Precision Cut',
    physicalSheets: 4,
    customerPhone: '+91 97900 11223',
    timestamp: '09:50 AM',
  },
];

interface FleetPrinter {
  name: string;
  model: string;
  type: string;
  status: 'Ready' | 'Paper low' | 'Printing' | 'Offline';
  queueCount: number;
  isDefault: boolean;
  ipAddress: string;
}

const initialPrinters: FleetPrinter[] = [
  {
    name: 'Canon imageRUNNER ADVANCE C3530i',
    model: 'Heavy Duty Multifunction Copier & Spooler',
    type: 'Color Laser · Duplex Unit',
    status: 'Ready',
    queueCount: 1,
    isDefault: true,
    ipAddress: '192.168.1.104',
  },
  {
    name: 'HP LaserJet Pro M404dn',
    model: 'High Speed Monochrome Workhorse',
    type: 'B&W Laser · 40 ppm',
    status: 'Printing',
    queueCount: 2,
    isDefault: false,
    ipAddress: '192.168.1.108',
  },
  {
    name: 'Epson EcoTank L3250',
    model: 'High Precision Photo & Color Inktank',
    type: 'Color Inktank · 5760 dpi',
    status: 'Paper low',
    queueCount: 0,
    isDefault: false,
    ipAddress: '192.168.1.112',
  },
];

const rateCard = [
  { service: 'A4 Black & White (Simplex)', rate: '₹1.50 / page', note: 'Standard 75 GSM paper' },
  { service: 'A4 Black & White (Duplex)', rate: '₹1.25 / side', note: '15% Duplex paper saving discount' },
  { service: 'A4 High-Quality Color', rate: '₹10.00 / page', note: 'Rich laser toner printing' },
  { service: 'A3 Document Xerox / Print', rate: '₹4.00 / page', note: 'Large engineering drawing / balance sheet' },
  { service: 'Spiral Coil Book Binding', rate: '₹35.00 / book', note: 'Clear PVC front cover + matte back' },
  { service: 'Hot Roll Pouch Lamination', rate: '₹25.00 / sheet', note: '250 micron heavy protection' },
];

function Console() {
  const [tab, setTab] = useState<'Queue' | 'Printers & devices' | 'Rate card' | 'Analytics' | 'Shop settings'>('Queue');
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedId, setSelectedId] = useState<string>('PB-102');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All orders');
  const [mode, setMode] = useState<Mode>('FULL_AUTOMATIC');
  const [pending, setPending] = useState<{ type: 'mode' | 'approve' | 'reject'; mode?: Mode } | null>(null);
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingTimer, setPairingTimer] = useState<number>(900); // 15 mins in sec
  const [copiedLink, setCopiedLink] = useState(false);

  const metricsRef = useGsapStagger<HTMLDivElement>({ stagger: 0.06, y: 12 });
  const recordListRef = useGsapStagger<HTMLDivElement>({ selector: '.record', stagger: 0.05, y: 10 });
  const dialog = useRef<HTMLDialogElement>(null);

  const selectedOrder = orders.find((o) => o.id === selectedId) || orders[0];

  const visibleOrders = orders.filter((o) => {
    const matchesQuery = `${o.name} ${o.id} ${o.customerPhone || ''}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === 'All orders' || o.status === filter;
    return matchesQuery && matchesFilter;
  });

  // Pairing code countdown
  useEffect(() => {
    if (!pairingCode) return;
    const interval = setInterval(() => {
      setPairingTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setPairingCode(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pairingCode]);

  function handleOpenConfirm(type: 'mode' | 'approve' | 'reject', nextMode?: Mode) {
    setPending({ type, mode: nextMode });
    setReason('');
    dialog.current?.showModal();
  }

  function handleApplyConfirm() {
    if (!pending || !reason.trim()) return;

    if (pending.type === 'mode') {
      setMode(pending.mode!);
      setNotice(`Shop Order Policy updated to ${pending.mode === 'FULL_AUTOMATIC' ? 'Full Automatic' : 'Manual Approval'}. Future submissions adhere to this setting.`);
    } else if (pending.type === 'approve') {
      setOrders((items) =>
        items.map((o) =>
          o.id === selectedId ? { ...o, status: 'Queued', payment: 'Staff Approved (Hold Released)' } : o
        )
      );
      setNotice(`Order ${selectedId} approved by operator. Dispatched to printer queue.`);
    } else if (pending.type === 'reject') {
      setOrders((items) =>
        items.map((o) =>
          o.id === selectedId ? { ...o, status: 'Rejected' } : o
        )
      );
      setNotice(`Order ${selectedId} rejected with audit note: "${reason.trim()}".`);
    }

    dialog.current?.close();
    setPending(null);
  }

  function handleGeneratePairingCode() {
    const code = 'TX-' + Math.floor(100000 + Math.random() * 900000);
    setPairingCode(code);
    setPairingTimer(900);
  }

  function handleCopyShopUrl() {
    navigator.clipboard.writeText(window.location.origin.replace(':3001', ':3000') + '?qr=anna-univ-xerox');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="console-shell">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      {/* Side Rail Navigation */}
      <aside className="console-rail">
        <div className="brand">
          <div className="brand-icon-box">
            <Printer size={22} />
          </div>
          <span>
            Print Bot
            <small>Shop Studio</small>
          </span>
        </div>

        <nav aria-label="Shop Navigation">
          {[
            { id: 'Queue', label: 'Order Queue', icon: LayoutDashboard },
            { id: 'Printers & devices', label: 'Printer Fleet', icon: Laptop },
            { id: 'Rate card', label: 'Rate Card', icon: Tag },
            { id: 'Analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'Shop settings', label: 'Shop Settings', icon: Settings },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={tab === id ? 'nav-active' : ''}
              aria-current={tab === id ? 'page' : undefined}
              onClick={() => setTab(id as any)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="rail-bottom">
          <div className="rail-plan-card">
            <span className="eyebrow">ACTIVE SUBSCRIPTION</span>
            <strong>All-Inclusive Plan</strong>
            <p>Unlimited printers connected. Billed annually.</p>
          </div>
        </div>
      </aside>

      {/* Main Console Body */}
      <div className="console-body">
        <StudioHeader title="Anna Xerox & Stationery" subtitle="Counter Console · Guindy Campus, Chennai" />

        <main id="main">
          {/* Top Banner Notice */}
          <div className="preview-notice">
            <Shield size={18} />
            <span>
              <strong>Production Console Sandbox</strong> · Real-time printer spooler synchronization is active. Tenant isolation: <code>shop_id: anna-univ-xerox</code>.
            </span>
          </div>

          {/* Page Heading */}
          <div className="page-heading">
            <div>
              <span className="eyebrow">COUNTER MANAGEMENT</span>
              <h1>
                {tab === 'Queue'
                  ? 'Live Order Spooler'
                  : tab === 'Printers & devices'
                  ? 'Hardware & Workstation Fleet'
                  : tab === 'Rate card'
                  ? 'Store Pricing & Margin Rules'
                  : tab === 'Analytics'
                  ? 'Daily Volume & Revenue'
                  : 'Counter Configuration'}
              </h1>
              <p>
                {tab === 'Queue'
                  ? 'Triage, approve, and route incoming customer print submissions.'
                  : tab === 'Printers & devices'
                  ? 'Monitor Windows spoolers, ink levels, paper trays, and paired PCs.'
                  : tab === 'Rate card'
                  ? 'Manage per-page rates, duplex discounts, and finishing charges.'
                  : tab === 'Analytics'
                  ? 'Track sheet consumption, UPI collections, and queue velocity.'
                  : 'Shop identity, QR codes, and automatic routing policies.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className="badge brand">Anna Xerox · Counter #1</span>
              <span className="badge success">
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--pb-success)' }} />
                Online
              </span>
            </div>
          </div>

          {notice && (
            <div
              style={{
                background: 'var(--pb-brand-soft)',
                borderLeft: '4px solid var(--pb-brand)',
                padding: '12px 18px',
                borderRadius: 'var(--pb-radius-sm)',
                marginBottom: '20px',
                fontSize: '0.88rem',
                color: 'var(--pb-text)',
              }}
              role="status"
            >
              {notice}
            </div>
          )}

          <MotionSurface transitionKey={tab}>
            {/* TAB: QUEUE */}
            {tab === 'Queue' && (
              <>
                {/* Metric Summary Cards */}
                <div ref={metricsRef} className="metrics">
                  <div>
                    <span>Total Orders Today</span>
                    <strong>{orders.length.toString().padStart(2, '0')}</strong>
                    <small>4 completed · 2 active</small>
                  </div>
                  <div>
                    <span>Needs Attention</span>
                    <strong style={{ color: 'var(--pb-warning)' }}>
                      {orders.filter((o) => ['Needs approval', 'Payment hold'].includes(o.status)).length.toString().padStart(2, '0')}
                    </strong>
                    <small>Manual approval or cash check</small>
                  </div>
                  <div>
                    <span>Active Order Policy</span>
                    <strong className="metric-word" style={{ color: 'var(--pb-brand)' }}>
                      {mode === 'FULL_AUTOMATIC' ? 'Full Automatic' : 'Manual Approval'}
                    </strong>
                    <small>Zero-staff approval on paid jobs</small>
                  </div>
                  <div>
                    <span>Today's Counter Revenue</span>
                    <strong style={{ fontFamily: 'var(--pb-font-mono)' }}>
                      ₹{(orders.reduce((sum, o) => sum + o.paise, 0) / 100).toFixed(2)}
                    </strong>
                    <small>100% shop settlement</small>
                  </div>
                </div>

                {/* 2-Column Order Workspace */}
                <div className="work-grid">
                  {/* Left: Orders List */}
                  <section className="panel">
                    <div className="section-title">
                      <h2>Submitted Jobs Queue</h2>
                      <span className="badge">{visibleOrders.length} shown</span>
                    </div>

                    <div className="filters">
                      <label className="search">
                        <Search size={16} />
                        <input
                          aria-label="Search orders"
                          placeholder="Search order ID, file name, customer phone…"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                        />
                      </label>
                      <select
                        aria-label="Filter order status"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={{ maxWidth: '180px' }}
                      >
                        {['All orders', 'Needs approval', 'Queued', 'Printing', 'Completed', 'Payment hold', 'Rejected'].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div ref={recordListRef} className="record-list">
                      {visibleOrders.map((o) => {
                        const isSelected = selectedId === o.id;
                        return (
                          <button
                            key={o.id}
                            type="button"
                            className={`record ${isSelected ? 'selected' : ''}`}
                            onClick={() => setSelectedId(o.id)}
                            aria-pressed={isSelected}
                          >
                            <span className="record-icon">
                              <FileText size={22} />
                            </span>
                            <span className="record-info">
                              <small>{o.id} · {o.timestamp}</small>
                              <strong>{o.name}</strong>
                              <span>
                                {o.pages} pages · {o.copies} {o.copies === 1 ? 'copy' : 'copies'} · {o.paper}
                              </span>
                            </span>
                            <span className="record-end">
                              <span
                                className={`badge ${
                                  o.status === 'Completed'
                                    ? 'success'
                                    : o.status === 'Needs approval' || o.status === 'Payment hold'
                                    ? 'warning'
                                    : o.status === 'Rejected'
                                    ? 'danger'
                                    : 'brand'
                                }`}
                              >
                                {o.status}
                              </span>
                              <strong>₹{(o.paise / 100).toFixed(2)}</strong>
                            </span>
                          </button>
                        );
                      })}

                      {visibleOrders.length === 0 && (
                        <div className="empty">
                          <Search size={32} />
                          <h3>No matching orders found</h3>
                          <p>Try searching for a different order ID or clear the status filter.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setQuery('');
                              setFilter('All orders');
                            }}
                          >
                            Clear Filters
                          </button>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Right: Selected Order Detail Panel */}
                  <section className="panel detail" aria-label="Selected order details">
                    <span className="eyebrow">ORDER DETAILS</span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                      <h2 style={{ margin: 0, fontFamily: 'var(--pb-font-mono)' }}>{selectedOrder.id}</h2>
                      <span
                        className={`badge ${
                          selectedOrder.status === 'Completed'
                            ? 'success'
                            : selectedOrder.status === 'Needs approval'
                            ? 'warning'
                            : 'brand'
                        }`}
                      >
                        {selectedOrder.status}
                      </span>
                    </div>

                    <p style={{ marginTop: '8px', fontSize: '0.9rem', color: 'var(--pb-text)', wordBreak: 'break-all' }}>
                      <strong>{selectedOrder.name}</strong>
                    </p>

                    <dl>
                      <div>
                        <dt>Color Mode</dt>
                        <dd>{selectedOrder.color}</dd>
                      </div>
                      <div>
                        <dt>Paper Specifications</dt>
                        <dd>{selectedOrder.paper}</dd>
                      </div>
                      <div>
                        <dt>Sides / Duplex</dt>
                        <dd>{selectedOrder.duplex}</dd>
                      </div>
                      <div>
                        <dt>Finishing / Binding</dt>
                        <dd>{selectedOrder.finishing}</dd>
                      </div>
                      <div>
                        <dt>Logical Pages / Copies</dt>
                        <dd>{selectedOrder.pages} pages / {selectedOrder.copies} {selectedOrder.copies === 1 ? 'copy' : 'copies'}</dd>
                      </div>
                      <div>
                        <dt>Calculated Physical Sheets</dt>
                        <dd style={{ color: 'var(--pb-brand)' }}>{selectedOrder.physicalSheets} sheets</dd>
                      </div>
                      <div>
                        <dt>Order Bill Amount</dt>
                        <dd style={{ fontFamily: 'var(--pb-font-mono)', fontSize: '1.05rem', color: 'var(--pb-brand)' }}>
                          ₹{(selectedOrder.paise / 100).toFixed(2)}
                        </dd>
                      </div>
                      <div>
                        <dt>Payment Status</dt>
                        <dd>{selectedOrder.payment}</dd>
                      </div>
                      {selectedOrder.customerPhone && (
                        <div>
                          <dt>Customer Contact</dt>
                          <dd>{selectedOrder.customerPhone}</dd>
                        </div>
                      )}
                    </dl>

                    <div className="note">
                      <strong>PrintPlan Verified</strong>: Exact sheets calculated via server-authoritative rule. No reprint without supervised operator reconciliation.
                    </div>

                    {selectedOrder.status === 'Needs approval' && (
                      <div className="actions" style={{ marginTop: '20px' }}>
                        <button
                          type="button"
                          className="primary"
                          style={{ flex: 1 }}
                          onClick={() => handleOpenConfirm('approve')}
                        >
                          <CheckCircle2 size={16} /> Approve & Dispatch
                        </button>
                        <button
                          type="button"
                          style={{ flex: 1, color: 'var(--pb-danger)' }}
                          onClick={() => handleOpenConfirm('reject')}
                        >
                          <XCircle size={16} /> Reject Job
                        </button>
                      </div>
                    )}

                    {selectedOrder.status === 'Queued' && (
                      <div style={{ marginTop: '20px' }}>
                        <button
                          type="button"
                          className="primary"
                          style={{ width: '100%' }}
                          onClick={() => {
                            setOrders((prev) =>
                              prev.map((o) => (o.id === selectedId ? { ...o, status: 'Printing' } : o))
                            );
                            setNotice(`Job ${selectedId} sent to Windows spooler.`);
                          }}
                        >
                          <Printer size={16} /> Spool to Default Printer
                        </button>
                      </div>
                    )}
                  </section>
                </div>
              </>
            )}

            {/* TAB: PRINTER FLEET */}
            {tab === 'Printers & devices' && (
              <div className="work-grid">
                {/* Fleet List */}
                <section className="panel">
                  <div className="section-title">
                    <h2>Connected Printer Fleet</h2>
                    <span className="badge brand">Unlimited Printers Active</span>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--pb-muted)', marginBottom: '20px' }}>
                    Zero per-printer licensing fees. Automatic failover and job routing enabled.
                  </p>

                  <div style={{ display: 'grid', gap: '16px' }}>
                    {initialPrinters.map((p) => (
                      <div
                        key={p.name}
                        style={{
                          padding: '18px',
                          borderRadius: 'var(--pb-radius-md)',
                          background: 'var(--pb-surface-alt)',
                          border: '1px solid var(--pb-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '16px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: 'var(--pb-radius-sm)',
                              background: 'var(--pb-surface)',
                              display: 'grid',
                              placeItems: 'center',
                              color: 'var(--pb-brand)',
                              border: '1px solid var(--pb-border)',
                            }}
                          >
                            <Printer size={22} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong style={{ fontSize: '0.98rem' }}>{p.name}</strong>
                              {p.isDefault && <span className="badge brand">Default</span>}
                            </div>
                            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--pb-muted)' }}>
                              {p.model} · <code>{p.ipAddress}</code>
                            </p>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span
                            className={`badge ${
                              p.status === 'Ready'
                                ? 'success'
                                : p.status === 'Printing'
                                ? 'brand'
                                : p.status === 'Paper low'
                                ? 'warning'
                                : 'danger'
                            }`}
                          >
                            {p.status}
                          </span>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--pb-muted)', marginTop: '4px' }}>
                            {p.queueCount} jobs queued
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Windows Desktop Agent Workstation */}
                <section className="panel">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <Laptop size={24} color="var(--pb-brand)" />
                    <h2 style={{ margin: 0 }}>Windows Workstation Pairing</h2>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--pb-muted)', marginBottom: '16px' }}>
                    Securely pair your shop counter PC running the Rust/Tauri 2 Windows background print service.
                  </p>

                  {pairingCode ? (
                    <div
                      style={{
                        padding: '20px',
                        borderRadius: 'var(--pb-radius-md)',
                        background: 'var(--pb-surface-alt)',
                        border: '2px dashed var(--pb-brand)',
                        textAlign: 'center',
                        marginBottom: '16px',
                      }}
                    >
                      <span style={{ fontSize: '0.78rem', color: 'var(--pb-muted)', textTransform: 'uppercase' }}>
                        Pairing Code (Expires in {formatTimer(pairingTimer)})
                      </span>
                      <div
                        style={{
                          fontSize: '2.5rem',
                          fontWeight: 900,
                          fontFamily: 'var(--pb-font-mono)',
                          color: 'var(--pb-brand)',
                          letterSpacing: '0.1em',
                          margin: '6px 0',
                        }}
                      >
                        {pairingCode}
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--pb-muted)', margin: 0 }}>
                        Enter this 6-digit code in the Print Bot Windows Desktop app to authorize this device.
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="primary"
                      style={{ width: '100%', marginBottom: '16px' }}
                      onClick={handleGeneratePairingCode}
                    >
                      Generate New Pairing Code
                    </button>
                  )}

                  <div className="note" style={{ marginBottom: '16px' }}>
                    <strong>Security Assurance</strong>: Device keys are bound to non-exportable hardware TPM where supported. Asymmetric credential handshakes ensure the installer can be shared freely without security leakage.
                  </div>

                  <PrinterScene compact />
                </section>
              </div>
            )}

            {/* TAB: RATE CARD */}
            {tab === 'Rate card' && (
              <section className="panel">
                <div className="section-title">
                  <h2>Counter Rate Card & Pricing Rules</h2>
                  <span className="badge brand">Indian Paise Currency Engine</span>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--pb-muted)', marginBottom: '24px' }}>
                  Rates are server-authoritative and locked at customer checkout. Duplex paper discount is computed per sheet.
                </p>

                <div className="rate-card-grid">
                  {rateCard.map((item) => (
                    <div key={item.service} className="rate-item-card">
                      <h4>{item.service}</h4>
                      <div className="rate-val">{item.rate}</div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--pb-muted)', margin: '6px 0 0' }}>
                        {item.note}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* TAB: ANALYTICS */}
            {tab === 'Analytics' && (
              <div>
                <div className="metrics">
                  <div>
                    <span>Physical Sheets Printed</span>
                    <strong>412</strong>
                    <small>Today across all 3 printers</small>
                  </div>
                  <div>
                    <span>Gross Counter Collections</span>
                    <strong style={{ fontFamily: 'var(--pb-font-mono)', color: 'var(--pb-success)' }}>
                      ₹1,840.00
                    </strong>
                    <small>Zero software commissions taken</small>
                  </div>
                  <div>
                    <span>Automatic Order Ratio</span>
                    <strong style={{ color: 'var(--pb-brand)' }}>83%</strong>
                    <small>Zero-touch auto dispatched</small>
                  </div>
                  <div>
                    <span>Average Pickup Time</span>
                    <strong>4.2 min</strong>
                    <small>From upload to customer counter</small>
                  </div>
                </div>

                <section className="panel" style={{ marginTop: '20px' }}>
                  <div className="section-title">
                    <h2>Peak Hourly Traffic Distribution</h2>
                    <span className="badge">Guindy Campus Peak: 11:00 AM – 1:30 PM</span>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--pb-muted)' }}>
                    Traffic peaks coincide with college lecture breaks. High-capacity auto-routing keeps the line moving with zero counter congestion.
                  </p>
                </section>
              </div>
            )}

            {/* TAB: SHOP SETTINGS */}
            {tab === 'Shop settings' && (
              <div className="work-grid">
                {/* Order Policy */}
                <section className="panel">
                  <span className="eyebrow">ORDER INGESTION POLICY</span>
                  <h2>Queue Automation Mode</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--pb-muted)' }}>
                    Choose how new walk-in orders are accepted. Already accepted jobs retain their locked policy.
                  </p>

                  <div className="mode-options">
                    {(['FULL_AUTOMATIC', 'MANUAL_APPROVAL'] as Mode[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        aria-pressed={mode === m}
                        className={mode === m ? 'selected' : ''}
                        onClick={() => {
                          if (m !== mode) handleOpenConfirm('mode', m);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <strong style={{ fontSize: '1rem' }}>
                            {m === 'FULL_AUTOMATIC' ? 'Full Automatic' : 'Manual Approval'}
                          </strong>
                          {mode === m && <span className="badge brand">Active in shop</span>}
                        </div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--pb-muted)' }}>
                          {m === 'FULL_AUTOMATIC'
                            ? 'Zero staff approval for eligible, verified-paid, compatible jobs. Instant spool to printer.'
                            : 'Staff must review and click approve/reject for every submitted customer job.'}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="note">
                    <strong>Audited Action</strong>: Any change to shop mode writes a cryptographic audit log record with the operator reason and timestamp.
                  </div>
                </section>

                {/* Counter QR Code Front Door */}
                <section className="panel">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <QrCode size={26} color="var(--pb-brand)" />
                    <h2 style={{ margin: 0 }}>Shop Front Door QR</h2>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--pb-muted)', marginBottom: '16px' }}>
                    Customers scan this counter stand QR on their mobile browser to upload files with zero login.
                  </p>

                  <div
                    style={{
                      padding: '24px',
                      borderRadius: 'var(--pb-radius-md)',
                      background: 'var(--pb-surface-alt)',
                      border: '1px solid var(--pb-border)',
                      textAlign: 'center',
                      marginBottom: '16px',
                    }}
                  >
                    <div
                      style={{
                        width: '140px',
                        height: '140px',
                        margin: '0 auto 12px',
                        background: '#ffffff',
                        padding: '10px',
                        borderRadius: '8px',
                        boxShadow: 'var(--pb-shadow)',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <QrCode size={110} color="#000000" />
                    </div>
                    <strong style={{ display: 'block', fontSize: '0.95rem' }}>Anna Xerox & Stationery</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--pb-muted)', fontFamily: 'var(--pb-font-mono)' }}>
                      shop_id: anna-univ-xerox
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      className="primary"
                      style={{ flex: 1 }}
                      onClick={handleCopyShopUrl}
                    >
                      {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                      <span>{copiedLink ? 'Link Copied' : 'Copy Shop URL'}</span>
                    </button>
                  </div>
                </section>
              </div>
            )}
          </MotionSurface>
        </main>

        <footer>
          <span>Print Bot SaaS · Shop Studio v1.0.0</span>
          <span>Tenant: Anna University Print & Xerox Stand (Guindy) · Multi-Tenant RLS Enabled</span>
        </footer>
      </div>

      {/* Confirmation Audit Modal */}
      <dialog ref={dialog} aria-labelledby="confirm-title" onCancel={() => setPending(null)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleApplyConfirm();
          }}
        >
          <span className="eyebrow">OPERATOR AUDIT CONFIRMATION</span>
          <h2 id="confirm-title">
            {pending?.type === 'mode'
              ? `Switch Order Policy to ${pending.mode === 'FULL_AUTOMATIC' ? 'Full Automatic' : 'Manual Approval'}?`
              : pending?.type === 'reject'
              ? `Reject Order ${selectedId}?`
              : `Approve Order ${selectedId} for Dispatch?`}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--pb-muted)', margin: '8px 0 16px' }}>
            {pending?.type === 'mode'
              ? 'Future orders will follow this policy. Previously submitted orders retain their accepted mode.'
              : 'This action is logged to the server audit ledger. Please provide an operator reason.'}
          </p>

          <label htmlFor="action-reason">
            Operator Reason <span style={{ color: 'var(--pb-danger)' }}>*</span>
          </label>
          <textarea
            id="action-reason"
            required
            maxLength={500}
            rows={3}
            placeholder="e.g. Verified payment at counter / customer requested duplex revision"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <div className="actions">
            <button
              type="button"
              onClick={() => {
                dialog.current?.close();
                setPending(null);
              }}
            >
              Cancel
            </button>
            <button className="primary" disabled={!reason.trim()}>
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
