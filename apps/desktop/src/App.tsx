import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Printer, Layers, KeyRound, Settings, Search, FileText, Eye, RefreshCw, Volume2, VolumeX, Copy, ArrowUpRight, ShieldCheck, X, AlertTriangle } from 'lucide-react';
import { ThemeProvider, ThemeSwitch, MotionSurface, PaperScene, PrinterScene, useGsapStagger } from '@xerox/ui';

interface PrintJob {
  id: string;
  customer_email: string;
  file_name: string;
  page_count: number;
  logical_pages: number;
  rendered_sides: number;
  physical_sheets: number;
  options: {
    copies: number;
    color_mode: 'color' | 'bw' | 'grayscale';
    paper_size: string;
    duplex_mode: string;
    paper_gsm: number;
    binding: string;
    page_range?: string;
    pages_per_sheet?: number;
  };
  calculated_price_paise: number;
  calculated_price_rupees: number;
  status: 'PENDING_APPROVAL' | 'QUEUED' | 'PRINTING' | 'COMPLETED' | 'COMPLETION_UNKNOWN' | 'REJECTED';
  rejection_reason?: string;
  created_at: string;
}

interface ConnectedPrinter {
  id: string;
  name: string;
  driver_name: string;
  port: string;
  online: boolean;
  supports_color: boolean;
  supports_duplex: boolean;
  supported_sizes: string[];
}

type Tab = 'queue' | 'printers' | 'pairing' | 'settings';
const statusLabels: Record<PrintJob['status'], string> = { PENDING_APPROVAL: 'Needs approval', QUEUED: 'Ready to dispatch', PRINTING: 'Dispatch simulated', COMPLETED: 'Completed · sample', COMPLETION_UNKNOWN: 'Completion unknown', REJECTED: 'Rejected' };
function Dialog({title, children, onClose}: {title: string; children: React.ReactNode; onClose: () => void}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const previous = document.activeElement as HTMLElement | null; ref.current?.showModal(); return () => { ref.current?.close(); previous?.focus(); }; }, []);
  return <dialog ref={ref} className="ws-dialog" aria-labelledby="dialog-title" onCancel={e => {e.preventDefault(); onClose();}}><div className="ws-dialog-head"><h2 id="dialog-title">{title}</h2><button aria-label="Close dialog" onClick={onClose}><X size={20}/></button></div>{children}</dialog>;
}
function Workstation() {
  const [activeTab, setActiveTab] = useState<Tab>('queue');
  const [orderMode, setOrderMode] = useState('MANUAL_APPROVAL');
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectionModalJobId, setRejectionModalJobId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Poor image resolution or blurred scan');
  const [reconcileId, setReconcileId] = useState<string | null>(null);
  const [reconcileNote, setReconcileNote] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [deviceName, setDeviceName] = useState('Counter-PC-01');
  const [notice, setNotice] = useState('');
  const [localJournalCount, setLocalJournalCount] = useState(0);
  const [redact, setRedact] = useState(true);
  const [background, setBackground] = useState(true);
  const statsRef = useGsapStagger<HTMLDivElement>({ selector: '.ws-stat', stagger: 0.05, y: 10 });
  const jobListRef = useGsapStagger<HTMLDivElement>({ selector: '.ws-job', stagger: 0.04, y: 12 });
  const tone = () => { if (!isAudioEnabled) return; try { const ctx = new AudioContext(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); gain.gain.value = 0.03; osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.08); osc.onended = () => { void ctx.close(); }; } catch {} };
  const [printers] = useState<ConnectedPrinter[]>([
    {
      id: 'prn-canon-ir3530',
      name: 'Canon imageRUNNER ADV C3530i (Color Production)',
      driver_name: 'Canon Generic Plus UFR II',
      port: '192.168.1.150',
      online: true,
      supports_color: true,
      supports_duplex: true,
      supported_sizes: ['A4', 'A3', 'Legal', 'Letter'],
    },
    {
      id: 'prn-hp-m404dn',
      name: 'HP LaserJet Pro M404dn (Mono Workhorse)',
      driver_name: 'HP LaserJet Pro M404-M405 PCL-6',
      port: 'USB001',
      online: true,
      supports_color: false,
      supports_duplex: true,
      supported_sizes: ['A4', 'Letter', 'Legal'],
    },
    {
      id: 'prn-virtual-pdf',
      name: 'Microsoft Print to PDF (Virtual Native Proof)',
      driver_name: 'Microsoft Print To PDF',
      port: 'PORTPROMPT:',
      online: true,
      supports_color: true,
      supports_duplex: false,
      supported_sizes: ['A4', 'Letter'],
    },
  ]);

  const [queue, setQueue] = useState<PrintJob[]>([
    {
      id: 'job-9841',
      customer_email: 'ramesh.kumar@annauniv.edu',
      file_name: 'Engineering_Drawings_A3.pdf',
      page_count: 8,
      logical_pages: 8,
      rendered_sides: 8,
      physical_sheets: 8,
      options: {
        copies: 1,
        color_mode: 'color',
        paper_size: 'A3',
        duplex_mode: 'simplex',
        paper_gsm: 100,
        binding: 'spiral',
        page_range: '1-8',
        pages_per_sheet: 1,
      },
      calculated_price_paise: 20000,
      calculated_price_rupees: 200.0,
      status: 'PENDING_APPROVAL',
      created_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    },
    {
      id: 'job-9842',
      customer_email: 'priya.sharma@startup.in',
      file_name: 'Legal_Agreement_Draft.pdf',
      page_count: 11,
      logical_pages: 11,
      rendered_sides: 22,
      physical_sheets: 12,
      options: {
        copies: 2,
        color_mode: 'bw',
        paper_size: 'A4',
        duplex_mode: 'duplex_long',
        paper_gsm: 80,
        binding: 'staple',
        page_range: '1-11',
        pages_per_sheet: 1,
      },
      calculated_price_paise: 3075,
      calculated_price_rupees: 30.75,
      status: 'QUEUED',
      created_at: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
    },
    {
      id: 'job-9843',
      customer_email: 'kavitha.m@gmail.com',
      file_name: 'Passport_ID_Front_Back.pdf',
      page_count: 1,
      logical_pages: 1,
      rendered_sides: 1,
      physical_sheets: 1,
      options: {
        copies: 4,
        color_mode: 'color',
        paper_size: 'A4',
        duplex_mode: 'simplex',
        paper_gsm: 180,
        binding: 'none',
        page_range: '1',
        pages_per_sheet: 4,
      },
      calculated_price_paise: 8000,
      calculated_price_rupees: 80.0,
      status: 'COMPLETED',
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
  ]);

  const selected = queue.find(job => job.id === selectedId);
  const filteredQueue = useMemo(() => queue.filter(job => {
    const matches = `${job.file_name} ${job.customer_email} ${job.id}`.toLowerCase().includes(searchQuery.toLowerCase());
    return matches && (statusFilter === 'ALL' || (statusFilter === 'PENDING' && job.status === 'PENDING_APPROVAL') || (statusFilter === 'SPOOLING' && ['QUEUED','PRINTING'].includes(job.status)) || (statusFilter === 'COMPLETED' && job.status === 'COMPLETED') || (statusFilter === 'ATTENTION' && job.status === 'COMPLETION_UNKNOWN'));
  }), [queue, searchQuery, statusFilter]);
  const pendingCount = queue.filter(j => j.status === 'PENDING_APPROVAL').length;
  const dispatch = (ids: string[]) => { setQueue(prev => prev.map(job => ids.includes(job.id) && ['QUEUED','PENDING_APPROVAL'].includes(job.status) ? {...job, status: 'PRINTING'} : job)); setLocalJournalCount(n => n + ids.length); tone(); setNotice('Dispatch simulated locally. No document was sent to a printer; physical completion is unverified.'); };
  const setJobStatus = (id: string, status: PrintJob['status'], rejection_reason?: string) => { setQueue(prev => prev.map(job => job.id === id ? {...job, status, rejection_reason} : job)); setLocalJournalCount(n => n + 1); };
  const money = (paise: number) => new Intl.NumberFormat('en-IN', {style:'currency', currency:'INR'}).format(paise / 100);
  const nav = [{id:'queue',label:'Dispatch queue',icon:Layers},{id:'printers',label:'Printers',icon:Printer},{id:'pairing',label:'Device pairing',icon:KeyRound},{id:'settings',label:'Preferences',icon:Settings}] as const;
  return <div className="workstation">
    <aside className="ws-sidebar"><a className="ws-brand" href="#main"><span><Printer size={25}/></span><div>Print Bot<small>COUNTER WORKSPACE</small></div></a><div className="ws-shop"><strong>Anna University<br/>Quick Xerox</strong><small>Chennai, Tamil Nadu</small></div>
      <nav aria-label="Workstation">{nav.map(({id,label,icon:Icon}) => <button key={id} aria-current={activeTab === id ? 'page' : undefined} onClick={() => {setActiveTab(id); tone();}}><Icon size={19}/><span>{label}</span>{id === 'queue' && <b>{queue.length}</b>}</button>)}</nav>
      <div className="ws-sidebar-bottom"><ShieldCheck size={21}/><strong>One plan. Every printer.</strong><p>Unlimited printers for each subscribed shop.</p></div>
    </aside>
    <div className="ws-workspace"><header className="ws-topbar"><div><span className="ws-eyebrow">WORKSTATION</span><strong>{deviceName}</strong></div><div className="ws-top-actions"><button aria-label={isAudioEnabled ? 'Mute feedback sounds' : 'Enable feedback sounds'} aria-pressed={isAudioEnabled} onClick={() => setIsAudioEnabled(!isAudioEnabled)}>{isAudioEnabled ? <Volume2 size={19}/> : <VolumeX size={19}/>}</button><ThemeSwitch/></div></header>
      <main id="main" className="ws-main"><div className="ws-simulation"><AlertTriangle size={17}/><span>Local simulation · Sample jobs and printers. Cloud connection, payment verification and physical printing are not active.</span></div>
      <MotionSurface transitionKey={activeTab} className="ws-view">
        <div className="ws-page-heading"><div><span className="ws-eyebrow">PRINT STUDIO / {activeTab === 'queue' ? 'OPERATIONS' : activeTab.toUpperCase()}</span><h1>{activeTab === 'queue' ? 'A clear view of your queue.' : activeTab === 'printers' ? 'Your print room.' : activeTab === 'pairing' ? 'Connect with confidence.' : 'Make this space yours.'}</h1><p>{activeTab === 'queue' ? 'Review the details. Keep every job moving with care.' : activeTab === 'printers' ? 'Inspect sample capabilities before assigning a job.' : activeTab === 'pairing' ? 'A trusted workstation starts with a shop-authorized pairing.' : 'Appearance and local workstation preferences.'}</p></div>{activeTab === 'queue' && <button className="ws-primary" disabled={!pendingCount} onClick={() => dispatch(queue.filter(j => j.status === 'PENDING_APPROVAL').map(j => j.id))}>Simulate approval ({pendingCount})<ArrowUpRight size={18}/></button>}</div>
        {notice && <div className="ws-notice" role="status"><span>{notice}</span><button aria-label="Dismiss message" onClick={() => setNotice('')}><X size={18}/></button></div>}
        {activeTab === 'queue' && <>
          <div ref={statsRef} className="ws-stats">{[{label:'Awaiting review',value:pendingCount,filter:'PENDING',note:'Your next decisions'},{label:'In the queue',value:queue.filter(j => ['QUEUED','PRINTING'].includes(j.status)).length,filter:'SPOOLING',note:'Sample dispatch activity'},{label:'Completed samples',value:queue.filter(j => j.status === 'COMPLETED').length,filter:'COMPLETED',note:'Not physical output'},{label:'Needs attention',value:queue.filter(j => j.status === 'COMPLETION_UNKNOWN').length,filter:'ATTENTION',note:'Supervised reconciliation'}].map(stat => <button className="ws-stat" key={stat.filter} aria-pressed={statusFilter === stat.filter} onClick={() => setStatusFilter(statusFilter === stat.filter ? 'ALL' : stat.filter)}><span>{stat.label}</span><strong>{String(stat.value).padStart(2,'0')}</strong><small>{stat.note}</small></button>)}</div>
          <section className="ws-panel"><div className="ws-queue-toolbar"><div><h2>Job activity</h2><p>{filteredQueue.length} of {queue.length} sample jobs</p></div><label className="ws-search"><Search size={18}/><input aria-label="Search jobs" placeholder="Search filename, customer or ID" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}/>{searchQuery && <button aria-label="Clear search" onClick={() => setSearchQuery('')}><X size={16}/></button>}</label><label className="ws-filter"><span className="ws-sr-only">Filter jobs</span><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="ALL">All jobs</option><option value="PENDING">Needs approval</option><option value="SPOOLING">In queue</option><option value="COMPLETED">Completed samples</option><option value="ATTENTION">Needs attention</option></select></label></div>
          <div ref={jobListRef} className="ws-job-list">{filteredQueue.map(job => <article className="ws-job" key={job.id}><div className="ws-file-icon"><FileText size={23}/></div><div className="ws-job-main"><div className="ws-job-title"><h3>{job.file_name}</h3><span className={`ws-chip ${job.status === 'COMPLETION_UNKNOWN' ? 'ws-danger' : job.status === 'PENDING_APPROVAL' ? 'ws-warning' : ''}`}>{statusLabels[job.status]}</span></div><p>{job.id} · {job.customer_email}</p><div className="ws-job-specs"><span>{job.options.paper_size} / {job.options.color_mode === 'color' ? 'Color' : 'B&W'}</span><span>{job.options.copies} copies</span><span>{job.physical_sheets} sheets · {job.rendered_sides} sides · {job.logical_pages} logical pages</span></div>{job.rejection_reason && <p className="ws-reason">Reason: {job.rejection_reason}</p>}<div className="ws-job-actions"><button onClick={() => setSelectedId(job.id)}><Eye size={16}/>Details</button>{['PENDING_APPROVAL','QUEUED'].includes(job.status) && <button className="ws-primary" onClick={() => dispatch([job.id])}>{job.status === 'PENDING_APPROVAL' ? 'Simulate approval & dispatch' : 'Simulate dispatch'}</button>}{job.status === 'PENDING_APPROVAL' && <button onClick={() => setRejectionModalJobId(job.id)}>Reject</button>}{job.status === 'PRINTING' && <button onClick={() => setJobStatus(job.id,'COMPLETION_UNKNOWN')}>Flag uncertain outcome</button>}{job.status === 'COMPLETION_UNKNOWN' && <button className="ws-primary" onClick={() => {setReconcileId(job.id); setReconcileNote('');}}>Reconcile sample</button>}</div></div><strong className="ws-price">{money(job.calculated_price_paise)}<small>Sample quote</small></strong></article>)}{!filteredQueue.length && <div className="ws-empty"><Layers size={34}/><h3>No matching jobs</h3><p>Try a different filename or status.</p><button onClick={() => {setSearchQuery('');setStatusFilter('ALL');}}>Clear filters</button></div>}</div><footer className="ws-queue-footer"><span>{localJournalCount} local session events · Not a durable journal</span><button onClick={() => setNotice('Sync unavailable: this workspace has no authenticated cloud connection. Local events remain in memory; nothing was synchronized.')}><RefreshCw size={16}/>Check cloud sync</button></footer></section>
        </>}
        {activeTab === 'printers' && <><div className="ws-section-line"><span className="ws-chip">{printers.length} sample printers · Unlimited allowance</span><button onClick={() => setNotice('Hardware discovery is unavailable in this simulation. Connect the native Windows service to discover real printers.')}><RefreshCw size={17}/>Discover printers</button></div><div style={{ marginBottom: '1.5rem', borderRadius: '1rem', overflow: 'hidden', border: '1px solid var(--st-border, #e5ded6)', background: 'var(--st-card, #ffffff)' }}><PrinterScene /></div><div className="ws-printer-grid">{printers.map(printer => <article className="ws-panel ws-printer" key={printer.id}><div className="ws-printer-symbol"><Printer size={40}/></div><span className="ws-eyebrow">SAMPLE DEVICE</span><h2>{printer.name}</h2><p>{printer.driver_name}</p><dl><div><dt>Port</dt><dd>{printer.port}</dd></div><div><dt>Color</dt><dd>{printer.supports_color ? 'Color + mono' : 'Mono'}</dd></div><div><dt>Two-sided</dt><dd>{printer.supports_duplex ? 'Supported in sample' : 'Single-sided'}</dd></div></dl><div className="ws-size-list">{printer.supported_sizes.map(size => <span className="ws-chip" key={size}>{size}</span>)}</div></article>)}</div></>}
        {activeTab === 'pairing' && <div className="ws-pairing-grid"><section className="ws-panel ws-form-panel"><KeyRound size={30}/><h2>Pair this workstation</h2><p>Use a short-lived code issued by an authorized shop account. Device IDs are identifiers, never credentials.</p><label>Workstation name<input value={deviceName} onChange={e => setDeviceName(e.target.value)} maxLength={64}/></label><label htmlFor="pair-code">One-time pairing code</label><input id="pair-code" inputMode="numeric" autoComplete="off" placeholder="6-digit code" value={pairingCode} onChange={e => setPairingCode(e.target.value.replace(/\D/g,'').slice(0,6))}/><button className="ws-primary" disabled={pairingCode.length !== 6} onClick={() => setNotice('Code format accepted locally. Pairing is BLOCKED: authenticated server challenge-response and hardware key attestation are not connected. No device was paired.')}>Check pairing readiness<ArrowUpRight size={18}/></button><dl><div><dt>Connection</dt><dd>Not paired</dd></div><div><dt>Key assurance</dt><dd>Unverified</dd></div></dl><button onClick={async () => {try {await navigator.clipboard.writeText(deviceName);setNotice('Workstation name copied.');} catch {setNotice('Clipboard unavailable. Select and copy the workstation name manually.');}}}><Copy size={16}/>Copy workstation name</button></section><div className="ws-pairing-art"><PrinterScene compact/><h2>Your shop. Your trusted devices.</h2><p>Live setup requires an active subscription and revocable device credentials. Hardware-backed key assurance is shown only after verification.</p></div></div>}
        {activeTab === 'settings' && <div className="ws-settings-grid"><section className="ws-panel ws-form-panel"><h2>Working preferences</h2><p>These controls apply to this local simulation session.</p><label>Sample order mode<select value={orderMode} onChange={e => {setOrderMode(e.target.value);setNotice('Sample mode changed for future simulated jobs. Existing jobs are unchanged; no live shop setting was changed.');}}><option value="MANUAL_APPROVAL">MANUAL APPROVAL</option><option value="FULL_AUTOMATIC">FULL AUTOMATIC</option></select></label><p>Live changes require authorized, audited server actions. Cash or unverified payments cannot bypass approval.</p><label className="ws-check"><input type="checkbox" checked={background} onChange={e => setBackground(e.target.checked)}/><span>Prefer background service after logoff<small>Local preference only; Windows service integration unverified.</small></span></label><label className="ws-check"><input type="checkbox" checked={redact} onChange={e => setRedact(e.target.checked)}/><span>Redact filenames in notifications<small>Local preference; OS notifications are not connected.</small></span></label><label className="ws-check"><input type="checkbox" checked={isAudioEnabled} onChange={e => setIsAudioEnabled(e.target.checked)}/><span>Play feedback sounds</span></label></section><section className="ws-panel ws-form-panel"><h2>Appearance</h2><p>Follow your system or choose a light or dark workspace. Your queue and form values stay in place.</p><ThemeSwitch/><div className="ws-settings-note"><ShieldCheck size={24}/><h3>Privacy by design</h3><p>Only your appearance choice is saved by the theme system. Sample jobs and preferences remain in this session.</p></div></section></div>}
      </MotionSurface></main><footer className="ws-bottom"><span>Print Bot / Windows workstation</span><span>Native service: unverified</span></footer>
    </div>
    {selected && <Dialog title="Job details" onClose={() => setSelectedId(null)}><div className="ws-detail-name"><FileText size={28}/><h3>{selected.file_name}</h3><p>{selected.id} · Sample document metadata</p></div><dl className="ws-details">{[['Customer',selected.customer_email],['Status',statusLabels[selected.status]],['Paper',`${selected.options.paper_size} · ${selected.options.paper_gsm} GSM`],['Color / copies',`${selected.options.color_mode} · ${selected.options.copies}`],['Duplex / finishing',`${selected.options.duplex_mode} · ${selected.options.binding}`],['Page selection',selected.options.page_range || 'All'],['Pages per sheet',selected.options.pages_per_sheet || 1],['Accounting',`${selected.logical_pages} logical pages / ${selected.rendered_sides} sides / ${selected.physical_sheets} sheets`]].map(([key,value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl><div className="ws-detail-price"><span>Sample customer quote</span><strong>{money(selected.calculated_price_paise)}</strong><small>No per-page software commission. Payment is unverified.</small></div><button onClick={() => setSelectedId(null)}>Close details</button></Dialog>}
    {rejectionModalJobId && <Dialog title="Reject sample job" onClose={() => setRejectionModalJobId(null)}><p>Record a reason in this local session. No notification is sent to a customer.</p><label>Rejection reason<select value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}>{['Poor image resolution or blurred scan','Requested paper size currently out of stock','Corrupted or unreadable PDF text','Customer requested cancellation'].map(reason => <option key={reason}>{reason}</option>)}</select></label><div className="ws-dialog-actions"><button onClick={() => setRejectionModalJobId(null)}>Cancel</button><button className="ws-primary" onClick={() => {setJobStatus(rejectionModalJobId,'REJECTED',rejectionReason);setRejectionModalJobId(null);}}>Confirm rejection</button></div></Dialog>}
    {reconcileId && <Dialog title="Supervised sample reconciliation" onClose={() => setReconcileId(null)}><p>An unknown outcome must never trigger an automatic reprint. Record the operator's review before closing this sample job.</p><label>Operator review note<textarea rows={3} value={reconcileNote} onChange={e => setReconcileNote(e.target.value)} placeholder="Describe the reviewed outcome"/></label><div className="ws-dialog-actions"><button onClick={() => setReconcileId(null)}>Keep unresolved</button><button className="ws-primary" disabled={!reconcileNote.trim()} onClick={() => {setJobStatus(reconcileId,'COMPLETED',`Simulated operator review: ${reconcileNote.trim()}`);setReconcileId(null);setNotice('Sample reconciliation recorded locally. This does not confirm physical output or create a durable audit event.');}}>Resolve sample</button></div></Dialog>}
  </div>;
}
export default function WorkstationApp() { return <ThemeProvider><Workstation/></ThemeProvider>; }
