import React, { useState } from 'react';

interface PrintJob {
  id: string;
  customer_email: string;
  file_name: string;
  page_count: number;
  options: {
    copies: number;
    color_mode: string;
    paper_size: string;
    duplex_mode: string;
    paper_gsm: number;
    binding: string;
    page_range?: string;
  };
  calculated_price_cents: number;
  status: string;
  created_at: string;
  mode: 'FULL_AUTOMATIC' | 'MANUAL_APPROVAL';
}

export default function WorkstationApp() {
  const [printers] = useState([
    { id: 'p1', name: 'Xerox AltaLink C8170 (Color High-Speed)', online: true, queue: 0 },
    { id: 'p2', name: 'Canon imageRUNNER ADVANCE DX (B&W High-Volume)', online: true, queue: 1 },
    { id: 'p3', name: 'Microsoft Print to PDF (Virtual)', online: true, queue: 0 },
  ]);
  const [selectedPrinter, setSelectedPrinter] = useState('p1');
  const [orderMode, setOrderMode] = useState<'FULL_AUTOMATIC' | 'MANUAL_APPROVAL'>('FULL_AUTOMATIC');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [localJournalCount, setLocalJournalCount] = useState(4);
  const [reconcileResult, setReconcileResult] = useState<string | null>(null);

  const [queue, setQueue] = useState<PrintJob[]>([
    {
      id: 'job-9841',
      customer_email: 'ramesh.kumar@college.edu',
      file_name: 'Engineering_Drawings_A3.pdf',
      page_count: 8,
      options: {
        copies: 1,
        color_mode: 'color',
        paper_size: 'A3',
        duplex_mode: 'simplex',
        paper_gsm: 100,
        binding: 'spiral',
        page_range: '1-8',
      },
      calculated_price_cents: 1800,
      status: 'QUEUED',
      created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      mode: 'FULL_AUTOMATIC',
    },
    {
      id: 'job-9842',
      customer_email: 'priya.sharma@startup.in',
      file_name: 'Legal_Agreement_Draft.pdf',
      page_count: 24,
      options: {
        copies: 2,
        color_mode: 'bw',
        paper_size: 'A4',
        duplex_mode: 'duplex_long',
        paper_gsm: 80,
        binding: 'staple',
        page_range: '1-24',
      },
      calculated_price_cents: 720,
      status: 'QUEUED',
      created_at: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
      mode: 'FULL_AUTOMATIC',
    },
  ]);

  const handleSpoolJob = (jobId: string) => {
    setQueue((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: 'PRINTING' } : j))
    );
    setLocalJournalCount((c) => c + 1);

    setTimeout(() => {
      setQueue((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: 'COMPLETED' } : j))
      );
    }, 2000);
  };

  const handleFlagAmbiguous = (jobId: string) => {
    // Shared contract rule: On ambiguous submitted outcomes use COMPLETION_UNKNOWN and supervised reconciliation, NEVER automatic reprint
    setQueue((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: 'COMPLETION_UNKNOWN' } : j))
    );
    alert(`Job ${jobId} flagged as COMPLETION_UNKNOWN. Spooler status ambiguous. Requires staff manual physical verification before re-spooling.`);
  };

  const handleReconcile = async () => {
    try {
      const spooledIds = queue.filter((j) => j.status !== 'QUEUED').map((j) => j.id);
      const res = await fetch('http://localhost:8000/api/v1/reconciliation/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': 'shop-anna-nagar-xerox',
        },
        body: JSON.stringify({
          workstation_id: 'workstation-counter-01',
          tenant_id: 'shop-anna-nagar-xerox',
          spooled_job_ids: spooledIds,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setReconcileResult(
        `Reconciled! Confirmed: ${data.confirmed_job_ids.length}, Re-spool queue: ${data.re_spool_required_job_ids.length}, Blocked/Invalid: ${data.invalid_job_ids.length}`
      );
    } catch (e: any) {
      setReconcileResult(`Reconcile check failed: ${e.message}`);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 font-sans select-none">
      {/* Top Counter Bar */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-sm">
            PB
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Print Bot Counter Station</h1>
            <p className="text-[10px] text-slate-400">Shop ID: shop-anna-nagar-xerox &bull; Station: WS-01</p>
          </div>
        </div>

        {/* Order Mode Switch & Hardware Selector */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-slate-800 px-2 py-1 rounded-lg">
            <span className="text-[11px] text-slate-400 font-semibold">Mode:</span>
            <button
              onClick={() => setOrderMode(orderMode === 'FULL_AUTOMATIC' ? 'MANUAL_APPROVAL' : 'FULL_AUTOMATIC')}
              className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all ${
                orderMode === 'FULL_AUTOMATIC'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-600 text-white'
              }`}
            >
              {orderMode === 'FULL_AUTOMATIC' ? '⚡ FULL AUTOMATIC' : '✋ MANUAL APPROVAL'}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Printer:</span>
            <select
              value={selectedPrinter}
              onChange={(e) => setSelectedPrinter(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none"
            >
              {printers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="h-5 w-px bg-slate-800" />

          <div className="flex items-center space-x-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isOfflineMode ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
              }`}
            />
            <span className="text-xs font-medium">
              {isOfflineMode ? 'Offline Spool' : 'Cloud Connected'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Workstation Layout */}
      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
        {/* Left: Dispatch Queue (3 cols) */}
        <div className="lg:col-span-3 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Live Printing Queue ({queue.filter((j) => j.status === 'QUEUED').length} Pending Dispatch)
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">Two-Phase Spool Ledger Active</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {queue.map((job) => (
              <div
                key={job.id}
                className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white">{job.file_name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        job.status === 'QUEUED'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800'
                          : job.status === 'PRINTING'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800 animate-pulse'
                          : job.status === 'COMPLETION_UNKNOWN'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    Customer: <span className="text-slate-200">{job.customer_email}</span> &bull; {job.page_count} pages
                    &bull; {job.options.copies} copy
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                      {job.options.color_mode.toUpperCase()}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                      {job.options.paper_size}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                      {job.options.duplex_mode.replace('_', ' ')}
                    </span>
                    {job.options.binding !== 'none' && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-medium">
                        Binding: {job.options.binding}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-center">
                  <div className="text-right">
                    <div className="text-sm font-black text-white">
                      ₹{(job.calculated_price_cents * 0.83).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-semibold">Paid Online</div>
                  </div>

                  {job.status === 'QUEUED' ? (
                    <button
                      onClick={() => handleSpoolJob(job.id)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow transition-all active:scale-95"
                    >
                      Spool to Press
                    </button>
                  ) : job.status === 'PRINTING' ? (
                    <button
                      onClick={() => handleFlagAmbiguous(job.id)}
                      className="px-3 py-1.5 bg-amber-600/80 hover:bg-amber-600 text-white text-[11px] font-bold rounded-lg shadow"
                    >
                      Stalled? Mark Unknown
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 font-semibold px-3 py-1 bg-slate-800 rounded-lg">
                      {job.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Hardware & Reconciliation (1 col) */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Hardware Ledger & Safety
            </h3>
            <div className="p-3 bg-slate-950 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Local Journal:</span>
                <span className="font-bold text-white">{localJournalCount} Spooled Entries</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Duplicate Prevention:</span>
                <span className="font-bold text-emerald-400">Guaranteed Locked</span>
              </div>
            </div>

            <button
              onClick={handleReconcile}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700"
            >
              Sync Ledger with Cloud API
            </button>

            {reconcileResult && (
              <p className="text-[11px] text-indigo-300 bg-indigo-950/40 p-2.5 rounded-lg border border-indigo-900 leading-relaxed">
                {reconcileResult}
              </p>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Workstation Quick Controls</h3>
            <button
              onClick={() => setIsOfflineMode(!isOfflineMode)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-300"
            >
              Simulate Network Offline ({isOfflineMode ? 'ON' : 'OFF'})
            </button>
            <button
              onClick={() => alert('Windows alignment test page spooled via winspool.drv')}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-300"
            >
              Print Test Calibration Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
