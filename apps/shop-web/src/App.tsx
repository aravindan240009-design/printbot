import { useRef, useState } from 'react';
import { Printer, LayoutDashboard, Settings, Laptop, ArrowUpRight, FileText, Search, Shield, QrCode } from 'lucide-react';
import { ThemeProvider, MotionSurface, PrinterScene, StudioHeader, useGsapStagger } from '@xerox/ui';
import '@xerox/ui/src/studio.css';

type Mode = 'FULL_AUTOMATIC' | 'MANUAL_APPROVAL';
type Order = { id: string; name: string; pages: number; copies: number; color: string; paise: number; status: string; payment: string; mode: Mode };
const initialOrders: Order[] = [
  { id: 'PB-101', name: 'Project report.pdf', pages: 42, copies: 2, color: 'Black & white', paise: 6300, status: 'Queued', payment: 'Verified payment (sample)', mode: 'FULL_AUTOMATIC' },
  { id: 'PB-102', name: 'ID front and back.pdf', pages: 2, copies: 1, color: 'Color', paise: 2000, status: 'Needs approval', payment: 'Unverified — payment hold', mode: 'MANUAL_APPROVAL' },
];
const printers = ['Canon imageRUNNER ADVANCE C3530i', 'HP LaserJet Pro M404dn', 'Epson EcoTank L3250'];
function Console() {
  const [tab, setTab] = useState('Queue');
  const [orders, setOrders] = useState(initialOrders);
  const [selected, setSelected] = useState('PB-102');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All orders');
  const [mode, setMode] = useState<Mode>('FULL_AUTOMATIC');
  const [pending, setPending] = useState<{ type: 'mode' | 'approve' | 'reject'; mode?: Mode } | null>(null);
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState('');
  const metricsRef = useGsapStagger<HTMLDivElement>({ stagger: 0.06, y: 12 });
  const recordListRef = useGsapStagger<HTMLDivElement>({ selector: '.record', stagger: 0.05, y: 10 });
  const dialog = useRef<HTMLDialogElement>(null);
  const order = orders.find(o => o.id === selected)!;
  const visible = orders.filter(o => `${o.name} ${o.id}`.toLowerCase().includes(query.toLowerCase()) && (filter === 'All orders' || o.status === filter));
  function confirm(type: 'mode' | 'approve' | 'reject', nextMode?: Mode) { setPending({ type, mode: nextMode }); setReason(''); dialog.current?.showModal(); }
  function apply() {
    if (!pending || !reason.trim()) return;
    if (pending.type === 'mode') { setMode(pending.mode!); setNotice('Preview mode updated. Existing sample orders retain their accepted mode.'); }
    else { setOrders(items => items.map(o => o.id === selected ? { ...o, status: pending.type === 'reject' ? 'Rejected' : 'Payment hold' } : o)); setNotice(`${selected}: local ${pending.type === 'reject' ? 'rejection' : 'approval'} recorded. No payment or print dispatch occurred.`); }
    dialog.current?.close(); setPending(null);
  }
  return <div className="console-shell">
    <a className="skip-link" href="#main">Skip to main content</a>
    <aside className="console-rail"><div className="brand"><Printer size={26}/><span>Print Bot<small>SHOP STUDIO</small></span></div>
      <nav aria-label="Shop navigation">{[{ title: 'Queue', icon: LayoutDashboard }, { title: 'Printers & devices', icon: Laptop }, { title: 'Shop settings', icon: Settings }].map(({ title, icon: Icon }) => <button key={title} className={tab === title ? 'nav-active' : ''} aria-current={tab === title ? 'page' : undefined} onClick={() => setTab(title)}><Icon size={19}/>{title}</button>)}</nav>
      <div className="rail-bottom"><span className="eyebrow">ONE PLAN. EVERY PRINTER.</span><strong>All-inclusive</strong><p>Unlimited printers.<br/>Monthly or annual billing.</p></div>
    </aside>
    <div className="console-body"><StudioHeader title="Anna Xerox & Stationery" subtitle="Shop studio · Chennai, Guindy"/>
      <main id="main"><div className="preview-notice"><Shield size={18}/><span><strong>Interactive preview</strong> · Sample data and local actions only. Live account, payment and device connections are unavailable.</span></div>
        <div className="page-heading"><div><span className="eyebrow">YOUR COUNTER, CONNECTED</span><h1>{tab === 'Queue' ? 'A little order. A lot of possibility.' : tab}</h1><p>{tab === 'Queue' ? 'Keep the next job in focus, from approval to collection.' : 'A clear view of the tools behind your counter.'}</p></div><span className="badge">Anna · sample workspace</span></div>
        {notice && <p className="feedback" role="status">{notice}</p>}
        <MotionSurface transitionKey={tab}>
        {tab === 'Queue' && <><div ref={metricsRef} className="metrics"><div><span>Sample orders</span><strong>{orders.length.toString().padStart(2, '0')}</strong><small>In this preview</small></div><div><span>Needs attention</span><strong>{orders.filter(o => ['Needs approval', 'Payment hold'].includes(o.status)).length.toString().padStart(2, '0')}</strong><small>Approval or payment hold</small></div><div><span>Order mode</span><strong className="metric-word">{mode === 'FULL_AUTOMATIC' ? 'Full automatic' : 'Manual approval'}</strong><small>Applies to new sample orders</small></div></div>
          <div className="work-grid"><section className="panel"><div className="section-title"><h2>Order workspace</h2><span className="muted">{visible.length} shown</span></div><div className="filters"><label className="search"><Search size={18}/><input aria-label="Search orders" placeholder="Search order or file…" value={query} onChange={e => setQuery(e.target.value)}/></label><select aria-label="Filter order status" value={filter} onChange={e => setFilter(e.target.value)}>{['All orders', 'Needs approval', 'Queued', 'Payment hold', 'Rejected'].map(s => <option key={s}>{s}</option>)}</select></div><div ref={recordListRef} className="record-list">{visible.map(o => <button key={o.id} className={`record ${selected === o.id ? 'selected' : ''}`} onClick={() => setSelected(o.id)} aria-pressed={selected === o.id}><span className="record-icon"><FileText size={23}/></span><span className="record-info"><small>{o.id} · Sample order</small><strong>{o.name}</strong><span>{o.pages} logical pages · {o.copies} {o.copies === 1 ? 'copy' : 'copies'}</span></span><span className="record-end"><span className={`badge ${o.status === 'Needs approval' || o.status === 'Payment hold' ? 'warning' : ''}`}>{o.status}</span><strong>₹{(o.paise / 100).toFixed(2)}</strong></span></button>)}{!visible.length && <div className="empty"><Search/><h3>No matching orders</h3><p>Try a different file name or status.</p><button onClick={() => { setQuery(''); setFilter('All orders'); }}>Clear filters</button></div>}</div></section>
          <section className="panel detail" aria-label="Selected order details"><span className="eyebrow">SELECTED ORDER</span><h2>{order.id}</h2><p className="detail-name">{order.name}</p><dl><div><dt>Print style</dt><dd>{order.color}</dd></div><div><dt>Logical pages / copies</dt><dd>{order.pages} / {order.copies}</dd></div><div><dt>Sample price</dt><dd>₹{(order.paise / 100).toFixed(2)}</dd></div><div><dt>Accepted mode</dt><dd>{order.mode === 'FULL_AUTOMATIC' ? 'Full automatic' : 'Manual approval'}</dd></div><div><dt>Payment</dt><dd>{order.payment}</dd></div></dl><p className="note">Physical sheets and rendered sides require the server PrintPlan. No document is loaded in this preview.</p>{order.status === 'Needs approval' && <div className="actions"><button className="primary" onClick={() => confirm('approve')}>Preview approval</button><button onClick={() => confirm('reject')}>Preview rejection</button></div>}<p className="muted">Cash and unverified payments remain on hold. No automatic reprint after an uncertain outcome.</p></section></div></>}
        {tab === 'Printers & devices' && <div className="work-grid"><section className="panel"><div className="section-title"><h2>Your printer fleet</h2><span className="badge">Unlimited printers</span></div><p className="muted">Sample inventory · connectivity has not been checked.</p>{printers.map((name, i) => <div className="inventory" key={name}><Printer/><div><strong>{name}</strong><p>{i === 0 ? 'Sample default printer' : 'Sample printer'} · Status unverified</p></div></div>)}</section><section className="panel"><Laptop size={28}/><h2>Windows workstation</h2><p>Pair an authorized installation with a short-lived server-issued code and revocable device credentials.</p><button disabled>Generate pairing code</button><p className="note">Unavailable in this preview. Connect authenticated shop and device services to issue a real code.</p><PrinterScene compact/></section></div>}
        {tab === 'Shop settings' && <div className="work-grid"><section className="panel"><span className="eyebrow">ORDER POLICY</span><h2>Choose how work enters your queue</h2><p>These controls simulate the policy for new orders. Accepted orders keep their original policy.</p><div className="mode-options">{(['FULL_AUTOMATIC', 'MANUAL_APPROVAL'] as Mode[]).map(m => <button key={m} aria-pressed={mode === m} className={mode === m ? 'selected' : ''} onClick={() => { if (m !== mode) confirm('mode', m); }}><strong>{m === 'FULL_AUTOMATIC' ? 'Full automatic' : 'Manual approval'}</strong><span>{m === 'FULL_AUTOMATIC' ? 'Eligible, verified-paid and compatible jobs only.' : 'Staff approve or reject every submitted job.'}</span>{mode === m && <span className="badge">Selected in preview</span>}</button>)}</div><p className="note">Live mode changes require authorization and durable audit logging. Browser state is not an audit record.</p></section><section className="panel"><QrCode size={30}/><h2>A front door for your shop</h2><p>Your shop-specific QR will open the mobile upload, configure and collect experience.</p><button disabled>Download counter QR</button><p className="note">Unavailable until an authenticated, shop-bound link is returned by the server.</p><div className="plan-summary"><span className="eyebrow">ALL-INCLUSIVE PLAN</span><h3>Room for every printer.</h3><p>One plan, monthly or annual. Device authorization is managed separately.</p></div></section></div>}
        </MotionSurface>
      </main><footer>Print Bot / Shop studio <span>Local interactive preview · resets on reload</span></footer>
    </div>
    <dialog ref={dialog} aria-labelledby="confirm-title" onCancel={() => setPending(null)}><form onSubmit={e => { e.preventDefault(); apply(); }}><span className="eyebrow">PREVIEW CONFIRMATION</span><h2 id="confirm-title">{pending?.type === 'mode' ? 'Change sample order mode?' : pending?.type === 'reject' ? `Reject ${selected} in preview?` : `Approve ${selected} in preview?`}</h2><p>{pending?.type === 'mode' ? 'Only future sample orders use this mode. No live shop policy changes.' : 'This changes local sample state only. An unverified payment still prevents dispatch.'}</p><label htmlFor="action-reason">Reason (required)</label><textarea id="action-reason" required maxLength={500} rows={3} value={reason} onChange={e => setReason(e.target.value)}/><div className="actions"><button type="button" onClick={() => { dialog.current?.close(); setPending(null); }}>Cancel</button><button className="primary" disabled={!reason.trim()}>Confirm local preview</button></div></form></dialog>
  </div>;
}
export default function App() { return <ThemeProvider><Console/></ThemeProvider>; }

