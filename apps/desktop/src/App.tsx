import React, { useState, useEffect } from 'react';

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
  };
  calculated_price_cents: number;
  status: string;
  created_at: string;
}

export default function WorkstationApp() {
  const [printers] = useState([
    { id: 'p1', name: 'Xerox AltaLink C8170 (Color High-Speed)', online: true, queue: 0 },
    { id: 'p2', name: 'Canon imageRUNNER ADVANCE DX (B&W)', online: true, queue: 1 },
    { id: 'p3', name: 'Microsoft Print to PDF (Virtual)', online: true, queue: 0 },
  ]);
  const [selectedPrinter, setSelectedPrinter] = useState('p1');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [localJournalCount, setLocalJournalCount] = useState(2);
  const [reconcileResult, setReconcileResult] = useState<string | null>(null);

  const [queue, setQueue] = useState<PrintJob[]>([
    {
      id: 'job-9841',
      customer_email: 'alex.smith@college.edu',
      file_name: 'Thesis_Final_Draft_v4.pdf',
      page_count: 52,
      options: {
        copies: 2,
        color_mode: 'color',
        paper_size: 'A4',
        duplex_mode: 'duplex_long',
        paper_gsm: 100,
        binding: 'spiral',
      },
      calculated_price_cents: 3240,
      status: 'QUEUED',
      created_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    },
    {
      id: 'job-9842',
      customer_email: 'maria.reyes@design.org',
      file_name: 'Architecture_Portfolio_A3.pdf',
      page_count: 14,
      options: {
        copies: 1,
        color_mode: 'color',
        paper_size: 'A3',
        duplex_mode: 'simplex',
        paper_gsm: 200,
        binding: 'none',
      },
      calculated_price_cents: 1400,
      status: 'QUEUED',
      created_at: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
    },
  ]);

  const handleSpoolJob = (jobId: string) => {
    setQueue((prev) =>
      prev.map((j) => {
        if (j.id === jobId) {
          return { ...j, status: 'PRINTING' };
        }
        return j;
      })
    );
    setLocalJournalCount((c) => c + 1);

    // Simulate physical Windows Spooler completion
    setTimeout(() => {
      setQueue((prev) =>
        prev.map((j) => {
          if (j.id === jobId) {
            return { ...j, status: 'COMPLETED' };
          }
          return j;
        })
      );
    }, 2500);
  };

  const handleReconcile = async () => {
    try {
      const spooledIds = queue.filter((j) => j.status !== 'QUEUED').map((j) => j.id);
      const res = await fetch('http://localhost:8000/api/v1/reconciliation/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': 'tenant-downtown-xerox',
        },
        body: JSON.stringify({
          workstation_id: 'workstation-counter-01',
          tenant_id: 'tenant-downtown-xerox',
          spooled_job_ids: spooledIds,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setReconcileResult(
        `Synced! Confirmed: ${data.confirmed_job_ids.length}, Pending Spool: ${data.re_spool_required_job_ids.length}`
      );
    } catch (e: any) {
      setReconcileResult(`Reconcile failed: ${e.message}`);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-slate-100 font-sans select-none">
      {/* Top Windows Title & Hardware Bar */}
      <header className="h-14 bg-slate-950 border-b border-slate-800 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-sm">
            XP
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Xerox PrintFlow Station</h1>
            <p className="text-[10px] text-slate-400">Station ID: WS-COUNTER-01 &bull; Windows Spooler v2.0</p>
          </div>
        </div>

        {/* Printer Selector */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Target Printer:</span>
            <select
              value={selectedPrinter}
              onChange={(e) => setSelectedPrinter(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {printers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.online ? '(Online)' : '(Offline)'}
                </option>
              ))}
            </select>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          {/* Cloud Connection Indicator */}
          <div className="flex items-center space-x-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isOfflineMode ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
              }`}
            />
            <span className="text-xs font-medium">
              {isOfflineMode ? 'Offline Journal' : 'Cloud Connected'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Workstation Queue Area */}
      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
        {/* Left: Live Spool Queue (3 cols) */}
        <div className="lg:col-span-3 flex flex-col bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Incoming Spool Dispatch Queue ({queue.filter((j) => j.status === 'QUEUED').length} Pending)
              </h2>
            </div>
            <span className="text-[11px] text-slate-500">Atomic Lock Active (Zero Duplicate Spooling)</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {queue.map((job) => (
              <div
                key={job.id}
                className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
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
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    Customer: <span className="text-slate-300">{job.customer_email}</span> &bull;{' '}
                    {job.page_count} pages &bull; {job.options.copies} {job.options.copies > 1 ? 'copies' : 'copy'}
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
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                      {job.options.paper_gsm} GSM
                    </span>
                    {job.options.binding !== 'none' && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-medium">
                        Binding: {job.options.binding}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4 self-end sm:self-center">
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">
                      ${(job.calculated_price_cents / 100).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-400">Paid & Verified</div>
                  </div>

                  <button
                    disabled={job.status !== 'QUEUED'}
                    onClick={() => handleSpoolJob(job.id)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow transition-all active:scale-95 flex items-center space-x-1.5"
                  >
                    <span>{job.status === 'QUEUED' ? 'Spool to Hardware' : job.status}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Workstation Diagnostics & Reconciliation (1 col) */}
        <div className="space-y-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Spooler Ledger & Resilience
            </h3>
            <div className="p-3 bg-slate-900 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Local Journal:</span>
                <span className="font-bold text-white">{localJournalCount} Spooled Jobs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Spooler Service:</span>
                <span className="font-bold text-emerald-400">Running (winspool)</span>
              </div>
            </div>

            <button
              onClick={handleReconcile}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700"
            >
              Reconcile Spool with Cloud
            </button>

            {reconcileResult && (
              <p className="text-[11px] text-indigo-300 bg-indigo-950/40 p-2 rounded border border-indigo-900">
                {reconcileResult}
              </p>
            )}
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Operator Quick Actions
            </h3>
            <button
              onClick={() => setIsOfflineMode(!isOfflineMode)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-300"
            >
              Toggle Offline Simulation ({isOfflineMode ? 'ON' : 'OFF'})
            </button>
            <button
              onClick={() => alert('Test print test page sent to Windows Print Spooler.')}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-300"
            >
              Print Alignment Test Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
