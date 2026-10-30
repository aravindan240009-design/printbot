import React, { useState } from 'react';
import { 
  Printer, 
  Layers, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  QrCode, 
  Database, 
  FileText, 
  Send, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Laptop, 
  ArrowRight, 
  RefreshCw,
  HardDrive,
  Cpu,
  ShieldCheck
} from 'lucide-react';

interface QueuedJob {
  id: string;
  filename: string;
  customer: string;
  phone: string;
  pages: number;
  color: 'B&W' | 'Color';
  duplex: boolean;
  price: number;
  payment: 'UPI Paid' | 'Cash at Counter';
  status: 'PENDING_APPROVAL' | 'SPOOLING' | 'COMPLETED';
  timestamp: string;
}

export const InteractiveWorkstationDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'queue' | 'printers' | 'qr' | 'journal'>('queue');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [jobs, setJobs] = useState<QueuedJob[]>([
    {
      id: 'JOB-9041',
      filename: 'Engineering_Thesis_Final_Draft.pdf',
      customer: 'Rahul Sharma',
      phone: '+91 98765 43210',
      pages: 48,
      color: 'B&W',
      duplex: true,
      price: 82.0,
      payment: 'UPI Paid',
      status: 'PENDING_APPROVAL',
      timestamp: 'Just now',
    },
    {
      id: 'JOB-9040',
      filename: 'Govt_ID_BothSides_Verification.pdf',
      customer: 'Priya Patel',
      phone: '+91 98234 56789',
      pages: 2,
      color: 'Color',
      duplex: false,
      price: 20.0,
      payment: 'Cash at Counter',
      status: 'PENDING_APPROVAL',
      timestamp: '2m ago',
    },
    {
      id: 'JOB-9039',
      filename: 'Commercial_Lease_Agreement.pdf',
      customer: 'Anand Kumar',
      phone: '+91 97112 33445',
      pages: 14,
      color: 'B&W',
      duplex: true,
      price: 24.0,
      payment: 'UPI Paid',
      status: 'COMPLETED',
      timestamp: '8m ago',
    },
  ]);

  const [printers] = useState([
    {
      name: 'HP LaserJet Enterprise M608',
      status: 'Online & Ready',
      type: 'High-Speed B&W Laser (65 ppm)',
      port: 'USB001 (Winspool)',
      paper: 'A4 / Legal - Tray 2 (85%)',
      isDefault: true,
    },
    {
      name: 'Epson EcoTank L3250 Series',
      status: 'Online & Ready',
      type: 'Precision Color Inkjet',
      port: 'WSD-Port (Network IPv4)',
      paper: 'A4 - Main Tray (92%)',
      isDefault: false,
    },
    {
      name: 'Brother HL-L2321D Duplex',
      status: 'Online & Ready',
      type: 'Automated Duplex Laser',
      port: 'USB002 (Winspool)',
      paper: 'A4 - Tray 1 (60%)',
      isDefault: false,
    },
    {
      name: 'POS-80 Thermal Counter Printer',
      status: 'Online & Ready',
      type: 'Counter Receipt & Token Printer',
      port: 'COM3 (Direct ESC/POS)',
      paper: '80mm Roll (Full)',
      isDefault: false,
    },
  ]);

  const [journalEntries, setJournalEntries] = useState([
    {
      seq: 1042,
      time: '02:44:18',
      jobId: 'JOB-9039',
      event: 'COMMITTED_TO_SPOOLER',
      hash: 'sha256:d8f1e29c...3a',
      result: 'SUBMITTED (Job #4812)',
    },
    {
      seq: 1041,
      time: '02:44:05',
      jobId: 'JOB-9039',
      event: 'PRICE_QUOTE_VALIDATED',
      hash: 'sha256:c72a819b...1f',
      result: '₹24.00 (UPI SIGNED)',
    },
    {
      seq: 1040,
      time: '02:42:11',
      jobId: 'JOB-9038',
      event: 'DUPLICATE_SUPPRESSED',
      hash: 'sha256:4b9101ff...8e',
      result: 'REJECTED (Replay Guard)',
    },
  ]);

  const handleApproveJob = (jobId: string) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: 'SPOOLING' } : j))
    );

    // Simulate native spooling delay then complete
    setTimeout(() => {
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: 'COMPLETED' } : j))
      );

      // Append to journal
      setJournalEntries((prev) => [
        {
          seq: prev[0].seq + 1,
          time: new Date().toLocaleTimeString(),
          jobId: jobId,
          event: 'COMMITTED_TO_SPOOLER',
          hash: `sha256:${Math.random().toString(36).substring(2, 10)}...`,
          result: 'SUBMITTED (Winspool API)',
        },
        ...prev,
      ]);
    }, 1200);
  };

  const handleSimulateNewJob = () => {
    const newId = `JOB-${Math.floor(9042 + Math.random() * 100)}`;
    const newJob: QueuedJob = {
      id: newId,
      filename: 'Customer_Upload_Document.pdf',
      customer: 'New Customer',
      phone: '+91 99000 ' + Math.floor(10000 + Math.random() * 90000),
      pages: Math.floor(2 + Math.random() * 15),
      color: Math.random() > 0.5 ? 'Color' : 'B&W',
      duplex: Math.random() > 0.3,
      price: Math.floor(10 + Math.random() * 40),
      payment: Math.random() > 0.4 ? 'UPI Paid' : 'Cash at Counter',
      status: 'PENDING_APPROVAL',
      timestamp: 'Just now',
    };

    setJobs((prev) => [newJob, ...prev]);
  };

  return (
    <div className="w-full rounded-2xl border border-white/[0.12] bg-[#0A0D14] shadow-2xl overflow-hidden">
      
      {/* Desktop Window Chrome Titlebar */}
      <div className="px-4 py-3 bg-[#0E131F] border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-3">
          {/* Mac / Windows style window dots */}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-white/[0.1]">
            <Printer className="w-4 h-4 text-brand-400" />
            <span className="text-xs font-semibold text-white tracking-tight">
              Print Bot Workstation v1.0.0
            </span>
            <span className="hidden sm:inline text-xs text-slate-400">
              — Central Xerox Counter (#CX-8802)
            </span>
          </div>
        </div>

        {/* Telemetry status bar */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Winspool: 12ms</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-slate-400 font-mono text-[11px]">
            <Cpu className="w-3.5 h-3.5 text-brand-400" />
            <span>RAM: 38 MB</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-bar */}
      <div className="px-4 py-2.5 bg-[#090C13] border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'queue'
                ? 'bg-brand-blue/20 text-brand-300 border border-brand-blue/40'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Operator Queue</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-brand-500/30 text-white font-mono">
              {jobs.filter((j) => j.status === 'PENDING_APPROVAL').length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('printers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'printers'
                ? 'bg-brand-blue/20 text-brand-300 border border-brand-blue/40'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Printers ({printers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'qr'
                ? 'bg-brand-blue/20 text-brand-300 border border-brand-blue/40'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Counter QR</span>
          </button>

          <button
            onClick={() => setActiveTab('journal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'journal'
                ? 'bg-brand-blue/20 text-brand-300 border border-brand-blue/40'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>SQLite Journal</span>
          </button>
        </div>

        {/* Action simulator button */}
        <button
          onClick={handleSimulateNewJob}
          className="px-3 py-1 text-xs font-semibold text-brand-300 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Simulate Customer Order</span>
        </button>
      </div>

      {/* Main Workstation View Area */}
      <div className="p-4 sm:p-6 min-h-[380px] bg-[#0A0D14]">
        
        {/* TAB 1: Operator Queue */}
        {activeTab === 'queue' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Active Customer Submissions awaiting Windows Spooler dispatch:</span>
              <span className="font-mono text-[11px] text-slate-500">Auto-refresh: 1s polling</span>
            </div>

            <div className="grid gap-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.14] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center text-brand-400 flex-shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white text-sm">
                          {job.filename}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-slate-300">
                          {job.id}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          job.color === 'Color'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-slate-700/40 text-slate-300'
                        }`}>
                          {job.color}
                        </span>
                        {job.duplex && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            Duplex (Both Sides)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>Customer: <strong className="text-slate-200">{job.customer}</strong> ({job.phone})</span>
                        <span>•</span>
                        <span>{job.pages} pages</span>
                        <span>•</span>
                        <span className="font-mono font-bold text-emerald-400">₹{job.price.toFixed(2)}</span>
                        <span>•</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                          job.payment === 'UPI Paid'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {job.payment}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Job Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                    {job.status === 'PENDING_APPROVAL' && (
                      <button
                        onClick={() => handleApproveJob(job.id)}
                        className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 rounded-lg shadow-md shadow-emerald-900/30 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Approve & Spool</span>
                      </button>
                    )}

                    {job.status === 'SPOOLING' && (
                      <div className="px-4 py-2 text-xs font-semibold text-brand-300 bg-brand-500/20 rounded-lg border border-brand-500/40 flex items-center gap-2 animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending to Winspool...</span>
                      </div>
                    )}

                    {job.status === 'COMPLETED' && (
                      <div className="px-3.5 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Printed</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Printer Fleet */}
        {activeTab === 'printers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Discovered local Windows Spooler drivers & network printers:</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Win32 EnumPrinters API connected</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {printers.map((p, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-2 hover:border-brand-500/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center text-brand-400">
                        <Printer className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-white text-sm flex items-center gap-2">
                          <span>{p.name}</span>
                          {p.isDefault && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-brand-500/20 text-brand-300 rounded uppercase">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">{p.type}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      {p.status}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-white/[0.04] grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Port / Interface:</span>
                      <span className="font-mono text-slate-300 text-[11px]">{p.port}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Paper Status:</span>
                      <span className="text-slate-300 text-[11px]">{p.paper}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Counter QR Code */}
        {activeTab === 'qr' && (
          <div className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.08] flex flex-col md:flex-row items-center gap-8 justify-around">
            <div className="space-y-4 max-w-sm text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20">
                <QrCode className="w-3.5 h-3.5" />
                <span>Shop Counter Terminal QR</span>
              </div>
              <h4 className="text-lg font-bold text-white tracking-tight">
                Walk-in Customer Upload Portal
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Customers simply open their standard phone camera, scan this QR code, and upload documents directly. No mobile apps, no Bluetooth pairing, and no USB flash drives.
              </p>

              <div className="pt-2 space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-white/[0.06]">
                  <span className="text-slate-400">B&W Rate:</span>
                  <span className="font-mono font-semibold">₹2.00 / page</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.06]">
                  <span className="text-slate-400">Color Rate:</span>
                  <span className="font-mono font-semibold">₹10.00 / page</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Duplex Discount:</span>
                  <span className="font-mono font-semibold text-emerald-400">15% Off</span>
                </div>
              </div>
            </div>

            {/* Generated QR Card */}
            <div className="p-5 rounded-2xl bg-white text-slate-900 shadow-2xl flex flex-col items-center gap-3">
              <div className="w-44 h-44 bg-slate-900 rounded-xl p-3 flex items-center justify-center relative group">
                {/* Visual SVG QR representation */}
                <div className="w-full h-full bg-white rounded-lg flex flex-col items-center justify-center p-2">
                  <div className="grid grid-cols-6 gap-1 w-full h-full">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-xs ${
                          (i % 2 === 0 || i % 7 === 0 || i === 0 || i === 5 || i === 30 || i === 35)
                            ? 'bg-slate-950'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="p-1.5 rounded-lg bg-brand-blue text-white shadow-lg">
                    <Printer className="w-5 h-5" />
                  </div>
                </div>
              </div>
              <div className="text-center">
                <span className="font-bold text-xs tracking-tight text-slate-900 block">
                  Scan to Print at Counter #1
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  https://printbot.dev/c/cx-8802
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SQLite Journal */}
        {activeTab === 'journal' && (
          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400 font-sans">
              <span>Local Write-Ahead SQLite Spool Audit Journal:</span>
              <span className="text-[11px] text-emerald-400 font-mono">Atomic State: COMMITTED</span>
            </div>

            <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08] space-y-2 overflow-x-auto">
              <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-slate-500 pb-2 border-b border-white/[0.08]">
                <div className="col-span-1">SEQ</div>
                <div className="col-span-2">TIME</div>
                <div className="col-span-2">JOB ID</div>
                <div className="col-span-3">EVENT</div>
                <div className="col-span-2">HASH</div>
                <div className="col-span-2 text-right">DISPATCH</div>
              </div>

              {journalEntries.map((entry) => (
                <div
                  key={entry.seq}
                  className="grid grid-cols-12 gap-2 text-[11px] text-slate-300 py-1.5 hover:bg-white/[0.02] rounded px-1"
                >
                  <div className="col-span-1 text-slate-500">#{entry.seq}</div>
                  <div className="col-span-2 text-slate-400">{entry.time}</div>
                  <div className="col-span-2 text-brand-300 font-bold">{entry.jobId}</div>
                  <div className="col-span-3 text-emerald-400">{entry.event}</div>
                  <div className="col-span-2 text-slate-500">{entry.hash}</div>
                  <div className="col-span-2 text-right text-slate-300">{entry.result}</div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              Every job intent is stored in the local SQLite journal before the Windows spooler submission is initiated. If power is interrupted or a printer is unplugged, Print Bot prevents automatic duplicate reprinting and marks the job outcome as verified.
            </p>
          </div>
        )}

      </div>

      {/* Bottom Workstation Status Bar */}
      <div className="px-4 py-2.5 bg-[#080B11] border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 font-mono text-[11px]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Shop Engine: Online</span>
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline">Shop Token: <code className="text-slate-300">tk_prod_cx8802</code></span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-sans text-xs">Total Daily Revenue:</span>
          <span className="font-mono font-bold text-white text-xs">₹1,842.00</span>
        </div>
      </div>

    </div>
  );
};

