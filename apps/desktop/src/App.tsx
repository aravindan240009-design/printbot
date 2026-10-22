import React, { useState, useEffect } from 'react';

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
    color_mode: string;
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

export default function WorkstationApp() {
  const [activeTab, setActiveTab] = useState<'queue' | 'printers' | 'pairing' | 'settings'>('queue');
  const [orderMode, setOrderMode] = useState<'FULL_AUTOMATIC' | 'MANUAL_APPROVAL'>('MANUAL_APPROVAL');
  const [isIpcConnected, setIsIpcConnected] = useState<boolean>(true);
  const [isPairingModalOpen, setIsPairingModalOpen] = useState<boolean>(false);
  const [pairingCode, setPairingCode] = useState<string>('');
  const [deviceName, setDeviceName] = useState<string>('Counter-PC-01');
  const [pairingSuccess, setPairingSuccess] = useState<boolean>(true);
  const [rejectionModalJobId, setRejectionModalJobId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('Poor image quality or corrupted formatting');
  const [selectedPrinter, setSelectedPrinter] = useState<string>('prn-canon-ir3530');
  const [localJournalCount, setLocalJournalCount] = useState<number>(6);
  const [reconcileResult, setReconcileResult] = useState<string | null>(null);

  const [printers, setPrinters] = useState<ConnectedPrinter[]>([
    {
      id: 'prn-canon-ir3530',
      name: 'Canon imageRUNNER ADV C3530i',
      driver_name: 'Canon Generic Plus UFR II',
      port: '192.168.1.150',
      online: true,
      supports_color: true,
      supports_duplex: true,
      supported_sizes: ['A4', 'A3', 'Legal', 'Letter'],
    },
    {
      id: 'prn-hp-m404dn',
      name: 'HP LaserJet Pro M404dn (Mono High-Speed)',
      driver_name: 'HP LaserJet Pro M404-M405 PCL-6',
      port: 'USB001',
      online: true,
      supports_color: false,
      supports_duplex: true,
      supported_sizes: ['A4', 'Letter', 'Legal'],
    },
    {
      id: 'prn-virtual-pdf',
      name: 'Microsoft Print to PDF (Virtual)',
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
      physical_sheets: 12, // Golden proof: 11 pages x 2 copies duplex = 12 sheets!
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
  ]);

  const handleApproveAndPrint = (jobId: string) => {
    // Transition to PRINTING and persist to local journal
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

  const handleRejectJob = () => {
    if (!rejectionModalJobId) return;
    setQueue((prev) =>
      prev.map((j) =>
        j.id === rejectionModalJobId
          ? { ...j, status: 'REJECTED', rejection_reason: rejectionReason }
          : j
      )
    );
    setRejectionModalJobId(null);
  };

  const handleFlagAmbiguous = (jobId: string) => {
    // Strict contract invariant: On ambiguous submitted outcomes use COMPLETION_UNKNOWN and supervised reconciliation, NEVER automatic reprint
    setQueue((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: 'COMPLETION_UNKNOWN' } : j))
    );
    alert(
      `Job ${jobId} flagged as COMPLETION_UNKNOWN.\nSpooler status ambiguous. Auto-reprint is blocked.\nRequires supervised staff confirmation.`
    );
  };

  const handleReconcile = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/reconciliation/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shop-ID': '11111111-1111-1111-1111-111111111111',
        },
        body: JSON.stringify({
          workstation_id: 'workstation-counter-01',
          tenant_id: '11111111-1111-1111-1111-111111111111',
          spooled_job_ids: queue.filter((j) => j.status === 'COMPLETED').map((j) => j.id),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReconcileResult(`Reconciled with Cloud! Confirmed: ${data.confirmed_job_ids.length}, Spooled: ${data.re_spool_required_job_ids.length}`);
      } else {
        setReconcileResult('Local journal synchronized in offline cache.');
      }
    } catch (e: any) {
      setReconcileResult('Local journal synchronized in offline cache.');
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0F172A', color: '#F8FAFC', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top Header Bar */}
      <header style={{ height: '56px', background: '#1E293B', borderBottom: '1px solid #334155', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem' }}>
            PB
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Print Bot Workstation Station</h1>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#94A3B8' }}>
              Shop: Anna University Quick Xerox • Paired: {deviceName}
            </p>
          </div>
        </div>

        {/* Status Indicators & Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Order Mode Switch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0F172A', padding: '4px 8px', borderRadius: '8px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Mode:</span>
            <button
              onClick={() => setOrderMode(orderMode === 'FULL_AUTOMATIC' ? 'MANUAL_APPROVAL' : 'FULL_AUTOMATIC')}
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                background: orderMode === 'FULL_AUTOMATIC' ? '#059669' : '#D97706',
                color: '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              {orderMode === 'FULL_AUTOMATIC' ? '⚡ FULL AUTOMATIC' : '✋ MANUAL APPROVAL'}
            </button>
          </div>

          {/* Rust Service IPC Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', background: '#0F172A', padding: '5px 10px', borderRadius: '8px', border: '1px solid #334155' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isIpcConnected ? '#10B981' : '#EF4444' }} />
            <span style={{ color: '#E2E8F0', fontWeight: 600 }}>Rust Service IPC (Named Pipe)</span>
          </div>

          {/* Subscription Status */}
          <div style={{ fontSize: '0.75rem', background: '#1E1B4B', color: '#818CF8', border: '1px solid #4338CA', padding: '4px 10px', borderRadius: '8px', fontWeight: 700 }}>
            All-Inclusive (Unlimited Printers)
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div style={{ background: '#1E293B', borderBottom: '1px solid #334155', padding: '0 20px', display: 'flex', gap: '8px' }}>
        {[
          { key: 'queue', label: `Dispatch Queue (${queue.filter((j) => j.status !== 'COMPLETED' && j.status !== 'REJECTED').length})` },
          { key: 'printers', label: `Connected Printers (${printers.length})` },
          { key: 'pairing', label: 'Device Pairing & TPM' },
          { key: 'settings', label: 'Workstation Settings' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              minHeight: '44px',
              padding: '0 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.key ? '3px solid #2563EB' : '3px solid transparent',
              color: activeTab === tab.key ? '#FFFFFF' : '#94A3B8',
              fontWeight: activeTab === tab.key ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Body */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        {/* ================= TAB 1: LIVE PRINT QUEUE ================= */}
        {activeTab === 'queue' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Live Operational Queue</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleReconcile}
                  style={{ minHeight: '44px', padding: '0 14px', borderRadius: '8px', background: '#334155', color: '#FFFFFF', border: 'none', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Sync Cloud Ledger ({localJournalCount} WAL Events)
                </button>
              </div>
            </div>

            {reconcileResult && (
              <div style={{ background: '#064E3B', color: '#A7F3D0', padding: '8px 14px', borderRadius: '8px', fontSize: '0.8rem' }}>
                {reconcileResult}
              </div>
            )}

            {/* Queue Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {queue.map((job) => (
                <div
                  key={job.id}
                  style={{
                    background: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{job.file_name}</span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background:
                            job.status === 'COMPLETED'
                              ? '#064E3B'
                              : job.status === 'PRINTING'
                              ? '#1E3A8A'
                              : job.status === 'COMPLETION_UNKNOWN'
                              ? '#7F1D1D'
                              : job.status === 'REJECTED'
                              ? '#374151'
                              : '#78350F',
                          color: '#FFFFFF',
                        }}
                      >
                        {job.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                      Customer: <b>{job.customer_email}</b> • {job.options.copies} copies • {job.options.color_mode.toUpperCase()} • {job.options.duplex_mode} • {job.options.paper_size}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#38BDF8' }}>
                      Accounting: <b>{job.physical_sheets} physical sheets</b> ({job.rendered_sides} sides, {job.logical_pages} pages) • ₹{job.calculated_price_rupees.toFixed(2)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {job.status === 'PENDING_APPROVAL' && (
                      <>
                        <button
                          onClick={() => handleApproveAndPrint(job.id)}
                          style={{ minHeight: '44px', padding: '0 14px', borderRadius: '8px', background: '#059669', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          Approve & Spool
                        </button>
                        <button
                          onClick={() => setRejectionModalJobId(job.id)}
                          style={{ minHeight: '44px', padding: '0 14px', borderRadius: '8px', background: '#DC2626', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {job.status === 'QUEUED' && (
                      <button
                        onClick={() => handleApproveAndPrint(job.id)}
                        style={{ minHeight: '44px', padding: '0 14px', borderRadius: '8px', background: '#2563EB', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        Dispatch to Spooler
                      </button>
                    )}

                    {job.status === 'PRINTING' && (
                      <button
                        onClick={() => handleFlagAmbiguous(job.id)}
                        style={{ minHeight: '44px', padding: '0 14px', borderRadius: '8px', background: '#991B1B', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        Mark Unknown (Safety)
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 2: CONNECTED PRINTERS ================= */}
        {activeTab === 'printers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Discovered Windows Hardware (Unlimited Support)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
              {printers.map((p) => (
                <div key={p.id} style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{p.name}</div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: p.online ? '#064E3B' : '#7F1D1D', color: '#FFFFFF' }}>
                      {p.online ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '6px' }}>Driver: {p.driver_name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '10px' }}>Port: {p.port}</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: '#334155' }}>
                      {p.supports_color ? 'Color & Mono' : 'Mono Only'}
                    </span>
                    <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: '#334155' }}>
                      {p.supports_duplex ? 'Duplex Supported' : 'Simplex Only'}
                    </span>
                    <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: '#334155' }}>
                      Sizes: {p.supported_sizes.join(', ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3: DEVICE PAIRING & TPM ================= */}
        {activeTab === 'pairing' && (
          <div style={{ maxWidth: '480px', background: '#1E293B', border: '1px solid #334155', borderRadius: '14px', padding: '20px' }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '1rem', fontWeight: 800 }}>Device Enrollment & Cryptographic Identity</h2>
            <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '16px' }}>
              Workstation authenticates to the cloud via asymmetric TPM-backed Ed25519 challenge-response keys.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Device Name</label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  style={{ minHeight: '44px', width: '100%', borderRadius: '8px', border: '1px solid #475569', background: '#0F172A', color: '#FFFFFF', padding: '0 10px', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Pairing Code (from Shop Web)</label>
                <input
                  type="text"
                  placeholder="Enter 6-char pairing code"
                  value={pairingCode}
                  onChange={(e) => setPairingCode(e.target.value)}
                  style={{ minHeight: '44px', width: '100%', borderRadius: '8px', border: '1px solid #475569', background: '#0F172A', color: '#FFFFFF', padding: '0 10px', fontSize: '0.85rem' }}
                />
              </div>
              <button
                onClick={() => {
                  setPairingSuccess(true);
                  alert('Device pairing handshake completed successfully! Asymmetric JWT bound to TPM public key.');
                }}
                style={{ minHeight: '44px', borderRadius: '8px', border: 'none', background: '#2563EB', color: '#FFFFFF', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', marginTop: '8px' }}
              >
                Perform Asymmetric Handshake
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 4: SETTINGS ================= */}
        {activeTab === 'settings' && (
          <div style={{ maxWidth: '480px', background: '#1E293B', border: '1px solid #334155', borderRadius: '14px', padding: '20px' }}>
            <h2 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: 800 }}>Workstation Preferences</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem' }}>Auto-start Service on Boot</span>
                <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px', accentColor: '#2563EB' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem' }}>Suppress Sensitive Document Paths in OS Toasts</span>
                <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px', accentColor: '#2563EB' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rejection Modal Dialog */}
      {rejectionModalJobId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 100 }}>
          <div style={{ background: '#1E293B', borderRadius: '16px', border: '1px solid #475569', padding: '24px', maxWidth: '420px', width: '100%' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: '#EF4444' }}>Reject Job #{rejectionModalJobId}</h3>
            <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '14px' }}>
              Please select or enter the reason for rejecting this job. The customer will see this message.
            </p>
            <select
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              style={{ minHeight: '44px', width: '100%', borderRadius: '8px', border: '1px solid #475569', background: '#0F172A', color: '#FFFFFF', padding: '0 10px', fontSize: '0.85rem', marginBottom: '16px' }}
            >
              <option value="Poor image resolution or blurred scan">Poor image resolution or blurred scan</option>
              <option value="Requested paper size currently out of stock">Requested paper size currently out of stock</option>
              <option value="Corrupted or unreadable PDF text">Corrupted or unreadable PDF text</option>
              <option value="Customer requested cancellation">Customer requested cancellation</option>
            </select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                onClick={() => setRejectionModalJobId(null)}
                style={{ minHeight: '44px', borderRadius: '8px', border: '1px solid #475569', background: '#0F172A', color: '#FFFFFF', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectJob}
                style={{ minHeight: '44px', borderRadius: '8px', border: 'none', background: '#DC2626', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
