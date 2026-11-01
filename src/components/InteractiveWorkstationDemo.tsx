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
      filename: 'Court_Affidavit_Notary_Signed.pdf',
      customer: 'Anand Kumar',
      phone: '+91 94451 22334',
      pages: 8,
      color: 'B&W',
      duplex: false,
      price: 24.0,
      payment: 'UPI Paid',
      status: 'COMPLETED',
      timestamp: '12m ago',
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
          event: 'DISPATCHED_TO_PRINTER',
          hash: `sha256:${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 4)}`,
          result: 'SPOOL_SUCCESS (Win32)',
        },
        ...prev,
      ]);
    }, 1400);
  };

  const handleSimulateNewJob = () => {
    const sampleFiles = [
      'Resume_Aravind_FullStack_2026.pdf',
      'Passport_Application_Acknowledgement.pdf',
      'Medical_Lab_Report_Pathology.pdf',
      'Aadhaar_Card_E_Copy_Download.pdf',
      'Property_Tax_Challan_Receipt.pdf',
    ];
    const sampleNames = ['Suresh Raina', 'Deepa Nair', 'Manish Verma', 'Kavita Menon'];
    const randomFile = sampleFiles[Math.floor(Math.random() * sampleFiles.length)];
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const pages = Math.floor(Math.random() * 12) + 1;
    const isColor = Math.random() > 0.65;
    const isDuplex = Math.random() > 0.5;
    const rate = isColor ? 10.0 : 2.0;
    const price = pages * rate * (isDuplex ? 0.85 : 1.0);

    const newJob: QueuedJob = {
      id: `JOB-${Math.floor(Math.random() * 800) + 9100}`,
      filename: randomFile,
      customer: randomName,
      phone: `+91 ${Math.floor(Math.random() * 90000) + 10000} ${Math.floor(Math.random() * 90000) + 10000}`,
      pages: pages,
      color: isColor ? 'Color' : 'B&W',
      duplex: isDuplex,
      price: Math.max(2.0, parseFloat(price.toFixed(2))),
      payment: Math.random() > 0.4 ? 'UPI Paid' : 'Cash at Counter',
      status: 'PENDING_APPROVAL',
      timestamp: 'Just now',
    };

    setJobs((prev) => [newJob, ...prev]);
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden text-left">
      
      {/* Desktop Window Chrome Titlebar */}
      <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-3">
          {/* Windows / Mac style window dots */}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-300">
            <Printer className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-800 tracking-tight">
              Print Bot Workstation v1.0.0
            </span>
            <span className="hidden sm:inline text-xs text-slate-500 font-medium">
              — Central Xerox Counter (#CX-8802)
            </span>
          </div>
        </div>

        {/* Telemetry status bar */}
        <div className="flex items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Spooler Active</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-slate-500 font-mono text-[11px]">
            <Cpu className="w-3.5 h-3.5 text-blue-600" />
            <span>RAM: 38 MB</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-bar */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'queue'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Operator Queue</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeTab === 'queue' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {jobs.filter((j) => j.status === 'PENDING_APPROVAL').length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('printers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'printers'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Printers ({printers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'qr'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Counter QR</span>
          </button>

          <button
            onClick={() => setActiveTab('journal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'journal'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Audit Journal</span>
          </button>
        </div>

        {/* Action simulator button */}
        <button
          onClick={handleSimulateNewJob}
          className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Simulate Customer Order</span>
        </button>
      </div>

      {/* Main Workstation View Area */}
      <div className="p-4 sm:p-6 min-h-[380px] bg-slate-50/50">
        
        {/* TAB 1: Operator Queue */}
        {activeTab === 'queue' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Incoming customer documents ready for one-click printing:</span>
              <span className="font-mono text-[11px] text-slate-400">Live Spooler Sync</span>
            </div>

            <div className="grid gap-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">
                          {job.filename}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                          {job.id}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                          job.color === 'Color'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {job.color}
                        </span>
                        {job.duplex && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            Duplex
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span>Customer: <strong className="text-slate-800">{job.customer}</strong> ({job.phone})</span>
                        <span>•</span>
                        <span>{job.pages} pages</span>
                        <span>•</span>
                        <span className="font-mono font-bold text-emerald-600">₹{job.price.toFixed(2)}</span>
                        <span>•</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          job.payment === 'UPI Paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
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
                        className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Print Document</span>
                      </button>
                    )}

                    {job.status === 'SPOOLING' && (
                      <div className="px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg border border-blue-200 flex items-center gap-2 animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending to Spooler...</span>
                      </div>
                    )}

                    {job.status === 'COMPLETED' && (
                      <div className="px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
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
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Auto-detected local USB and Network printers:</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Windows Spooler Active</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {printers.map((p, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2 hover:border-blue-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                        <Printer className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <span>{p.name}</span>
                          {p.isDefault && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 rounded uppercase">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">{p.type}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {p.status}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Interface:</span>
                      <span className="font-mono text-slate-700 text-[11px]">{p.port}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Paper Status:</span>
                      <span className="text-slate-700 text-[11px] font-medium">{p.paper}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Counter QR Code */}
        {activeTab === 'qr' && (
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8 justify-around">
            <div className="space-y-4 max-w-sm text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <QrCode className="w-3.5 h-3.5" />
                <span>Counter Stand QR</span>
              </div>
              <h4 className="text-lg font-bold text-slate-900 tracking-tight">
                Walk-in Customer Upload Portal
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Customers scan this standee with any smartphone camera to upload documents directly. No mobile apps, no account signups, and no messy WhatsApp file transfers.
              </p>

              <div className="pt-2 space-y-2 text-xs text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">B&W Rate:</span>
                  <span className="font-mono font-bold text-slate-900">₹2.00 / page</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Color Rate:</span>
                  <span className="font-mono font-bold text-slate-900">₹10.00 / page</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Duplex Discount:</span>
                  <span className="font-mono font-bold text-emerald-600">15% Off</span>
                </div>
              </div>
            </div>

            {/* Generated QR Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-md flex flex-col items-center gap-3">
              <div className="w-44 h-44 bg-white rounded-xl p-3 border border-slate-200 flex items-center justify-center relative shadow-sm">
                {/* Visual SVG QR representation */}
                <div className="w-full h-full bg-slate-50 rounded-lg flex flex-col items-center justify-center p-2 border border-slate-100">
                  <div className="grid grid-cols-6 gap-1 w-full h-full">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-xs ${
                          (i % 2 === 0 || i % 7 === 0 || i === 0 || i === 5 || i === 30 || i === 35)
                            ? 'bg-slate-900'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="p-2 rounded-lg bg-blue-600 text-white shadow-md">
                    <Printer className="w-5 h-5" />
                  </div>
                </div>
              </div>
              <div className="text-center">
                <span className="font-bold text-xs tracking-tight text-slate-900 block">
                  Scan to Print at Counter
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  printbotak.vercel.app/case
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Audit Journal */}
        {activeTab === 'journal' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-600 font-sans">
              <span>Automatic duplicate-print protection & audit trail:</span>
              <span className="text-[11px] text-emerald-700 font-semibold font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Verified
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-slate-200 space-y-2 overflow-x-auto shadow-sm">
              <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-slate-400 pb-2 border-b border-slate-800">
                <div className="col-span-1">SEQ</div>
                <div className="col-span-2">TIME</div>
                <div className="col-span-2">JOB ID</div>
                <div className="col-span-3">EVENT</div>
                <div className="col-span-2">CHECKSUM</div>
                <div className="col-span-2 text-right">DISPATCH</div>
              </div>

              {journalEntries.map((entry) => (
                <div
                  key={entry.seq}
                  className="grid grid-cols-12 gap-2 text-[11px] text-slate-300 py-1.5 hover:bg-white/[0.05] rounded px-1 font-mono"
                >
                  <div className="col-span-1 text-slate-500">#{entry.seq}</div>
                  <div className="col-span-2 text-slate-400">{entry.time}</div>
                  <div className="col-span-2 text-blue-400 font-bold">{entry.jobId}</div>
                  <div className="col-span-3 text-emerald-400">{entry.event}</div>
                  <div className="col-span-2 text-slate-500">{entry.hash}</div>
                  <div className="col-span-2 text-right text-slate-300">{entry.result}</div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Every print intent is verified locally before sending to the Windows spooler, preventing accidental duplicate sheets and double-billing.
            </p>
          </div>
        )}

      </div>

      {/* Bottom Workstation Status Bar */}
      <div className="px-4 py-2.5 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 font-mono text-[11px]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-700 font-semibold font-sans">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Counter Workstation: Connected</span>
          </span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="hidden sm:inline text-slate-500">Station ID: <code className="text-slate-800 font-semibold">station_cx8802</code></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-sans text-xs">Today's Counter Revenue:</span>
          <span className="font-mono font-bold text-slate-900 text-xs bg-white px-2 py-0.5 rounded border border-slate-200">₹1,842.00</span>
        </div>
      </div>

    </div>
  );
};
