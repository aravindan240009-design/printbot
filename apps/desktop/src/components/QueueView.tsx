import React from 'react';
import {
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  FileText,
  XCircle,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { type PrintJob } from '../App';

interface QueueViewProps {
  jobs: PrintJob[];
  filteredJobs: PrintJob[];
  pendingCount: number;
  queuedCount: number;
  completedCount: number;
  attentionCount: number;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  onApproveAll: () => void;
  onApproveJob: (jobId: string) => void;
  onRejectJob: (jobId: string) => void;
  onCompleteJob?: (jobId: string) => void;
  onInspectJob?: (job: PrintJob) => void;
  onRefreshJobs?: () => void;
  onClearAllDispatch: () => Promise<number>;
  selectedPrinterName?: string;
  setSelectedPrinterName?: (val: string) => void;
  nativePrinters?: Array<{ name: string; is_default?: boolean; is_online?: boolean }>;
  onDirectPrint?: (jobId: string, specificItemIndex?: number) => void;
}

export const QueueView: React.FC<QueueViewProps> = ({
  jobs,
  filteredJobs,
  pendingCount,
  queuedCount,
  completedCount,
  attentionCount,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  onApproveAll,
  onApproveJob,
  onRejectJob,
  onCompleteJob,
  onInspectJob,
  onRefreshJobs,
  onClearAllDispatch,
  selectedPrinterName,
  setSelectedPrinterName,
  nativePrinters,
  onDirectPrint,
}) => {
  const [isClearDialogOpen, setIsClearDialogOpen] = React.useState(false);
  const [clearError, setClearError] = React.useState<string | null>(null);
  const [isClearingDispatch, setIsClearingDispatch] = React.useState(false);

  const closeClearDialog = () => {
    if (isClearingDispatch) return;
    setIsClearDialogOpen(false);
    setClearError(null);
  };

  const handleClearAllDispatch = async (event: React.FormEvent) => {
    event.preventDefault();

    setClearError(null);
    setIsClearingDispatch(true);
    try {
      await onClearAllDispatch();
      setIsClearDialogOpen(false);
    } catch (error) {
      setClearError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsClearingDispatch(false);
    }
  };

  const getStatusBadge = (status: PrintJob['status']) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return <span className="pb-badge pb-badge-warning">Awaiting Approval</span>;
      case 'QUEUED':
        return <span className="pb-badge pb-badge-info">Ready to Dispatch</span>;
      case 'PRINTING':
        return <span className="pb-badge pb-badge-accent">Spooling...</span>;
      case 'COMPLETED':
        return <span className="pb-badge pb-badge-success">Completed</span>;
      case 'REJECTED':
        return <span className="pb-badge pb-badge-danger">Rejected</span>;
      case 'COMPLETION_UNKNOWN':
        return <span className="pb-badge pb-badge-warning">Needs Attention</span>;
      default:
        return <span className="pb-badge">{status}</span>;
    }
  };

  const getFileExtension = (filename: string) => {
    const ext = filename.split('.').pop()?.toUpperCase() || 'FILE';
    return ext.slice(0, 4);
  };

  const getFileViewUrl = (fileData: string, fileName: string) => {
    if (fileData.startsWith('data:')) return fileData;
    const extension = fileName.split('.').pop()?.toLowerCase();
    const mimeType = extension === 'pdf'
      ? 'application/pdf'
      : extension === 'png'
        ? 'image/png'
        : extension === 'jpg' || extension === 'jpeg'
          ? 'image/jpeg'
          : 'application/octet-stream';
    return `data:${mimeType};base64,${fileData}`;
  };

  return (
    <div className="pb-view">
      {/* Page Title & Top Actions */}
      <div className="pb-page-header">
        <div>
          <span className="pb-page-eyebrow">OPERATIONS / DISPATCH</span>
          <h1 className="pb-page-title">Counter Print Queue</h1>
          <p className="pb-page-subtitle">
            Review incoming customer print orders, approve spooling, or inspect document parameters.
          </p>
        </div>

        <div className="pb-header-actions">
          {onRefreshJobs && (
            <button
              type="button"
              className="pb-btn pb-btn-secondary"
              onClick={onRefreshJobs}
              title="Refresh queue from cloud"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          )}

          <button
            type="button"
            className="pb-btn pb-btn-danger"
            onClick={() => {
              setClearError(null);
              setIsClearDialogOpen(true);
            }}
            title="Permanently clear dispatch orders across all shops"
          >
            <Trash2 size={14} /> Clear All
          </button>

          <button
            type="button"
            className="pb-btn pb-btn-primary"
            disabled={pendingCount === 0}
            onClick={onApproveAll}
          >
            <CheckCircle2 size={14} />
            <span>Approve All Pending ({pendingCount})</span>
          </button>
        </div>
      </div>

      {/* Metric Counters Grid */}
      <div className="pb-stats-grid">
        <div className="pb-stat-card">
          <div className="pb-stat-label">Awaiting Approval</div>
          <div className="pb-stat-value" style={{ color: pendingCount > 0 ? 'var(--pb-desk-warning)' : 'var(--pb-desk-text)' }}>
            {pendingCount.toString().padStart(2, '0')}
          </div>
          <div className="pb-stat-desc">Customer orders requiring action</div>
        </div>

        <div className="pb-stat-card">
          <div className="pb-stat-label">In Dispatch Queue</div>
          <div className="pb-stat-value" style={{ color: queuedCount > 0 ? 'var(--pb-desk-accent)' : 'var(--pb-desk-text)' }}>
            {queuedCount.toString().padStart(2, '0')}
          </div>
          <div className="pb-stat-desc">Buffered for Windows printer</div>
        </div>

        <div className="pb-stat-card">
          <div className="pb-stat-label">Completed Today</div>
          <div className="pb-stat-value" style={{ color: 'var(--pb-desk-success)' }}>
            {completedCount.toString().padStart(2, '0')}
          </div>
          <div className="pb-stat-desc">Successfully printed and paid</div>
        </div>

        <div className="pb-stat-card">
          <div className="pb-stat-label">Needs Attention</div>
          <div className="pb-stat-value" style={{ color: attentionCount > 0 ? 'var(--pb-desk-danger)' : 'var(--pb-desk-text-dim)' }}>
            {attentionCount.toString().padStart(2, '0')}
          </div>
          <div className="pb-stat-desc">Requires operator reconciliation</div>
        </div>
      </div>

      {/* Main Operations Panel */}
      <div className="pb-panel">
        {/* Search & Filter Toolbar */}
        <div className="pb-toolbar">
          <div className="pb-search-box">
            <Search size={15} />
            <input
              type="text"
              className="pb-search-input"
              placeholder="Search filename, customer email, or Order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="pb-search-clear"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>

          <div className="pb-filter-group">
            <SlidersHorizontal size={14} color="var(--pb-desk-text-dim)" />
            <select
              className="pb-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Jobs ({jobs.length})</option>
              <option value="PENDING_APPROVAL">Awaiting Review ({pendingCount})</option>
              <option value="QUEUED">Ready to Dispatch ({queuedCount})</option>
              <option value="COMPLETED">Completed ({completedCount})</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {setSelectedPrinterName && nativePrinters && nativePrinters.length > 0 && (
            <div className="pb-filter-group" style={{ marginLeft: 'auto' }}>
              <Printer size={14} color="var(--pb-desk-accent)" />
              <select
                className="pb-select"
                value={selectedPrinterName}
                onChange={(e) => setSelectedPrinterName(e.target.value)}
                title="Active Output Printer"
                style={{ fontWeight: 650, color: 'var(--pb-desk-accent)' }}
              >
                {nativePrinters.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name.includes('4004') || p.name.includes('LaserJet') ? `🖨️ ${p.name} (Laser Hardware)` : `🖨️ ${p.name}`}
                    {p.is_online === false ? ' (Offline)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Job List / Cards */}
        {filteredJobs.length === 0 ? (
          <div className="pb-empty-state">
            <div className="pb-empty-icon">
              <Layers size={36} />
            </div>
            <h3 className="pb-empty-title">No matching jobs in queue</h3>
            <p className="pb-empty-subtitle">
              {jobs.length === 0
                ? 'Your counter queue is currently empty. Customers scanning your QR stand will appear here in real-time.'
                : 'No print jobs match your search or filter criteria. Try resetting filters.'}
            </p>
          </div>
        ) : (
          <div className="pb-jobs-list">
            {filteredJobs.map((job) => {
              const paymentVerificationPending =
                job.payment_method === 'upi' &&
                !['verified', 'paid'].includes((job.payment_status || '').toLowerCase());

              return (
              <div key={job.id} className="pb-job-card">
                <div className="pb-job-file-avatar">
                  <span className="pb-file-ext-tag">
                    {job.items && job.items.length > 1 ? `${job.items.length}x` : getFileExtension(job.file_name)}
                  </span>
                  <FileText size={20} />
                </div>

                <div className="pb-job-info">
                  <div className="pb-job-primary-row">
                    <span className="pb-job-filename" title={job.file_name}>
                      {job.file_name}
                    </span>
                    {job.items && job.items.length > 1 && (
                      <span
                        className="pb-chip"
                        style={{
                          background: 'rgba(37, 99, 235, 0.1)',
                          color: '#2563eb',
                          fontWeight: 700,
                          fontSize: '11px',
                        }}
                      >
                        📁 {job.items.length} Documents Batch
                      </span>
                    )}
                    {getStatusBadge(job.status)}
                  </div>

                  <div className="pb-job-meta-row">
                    <span className="pb-job-id">#{job.id}</span>
                    {job.pickup_pin && (
                      <span
                        className="pb-job-pin-badge"
                        style={{
                          background: 'rgba(37, 99, 235, 0.1)',
                          color: '#2563eb',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                        }}
                      >
                        PIN: {job.pickup_pin}
                      </span>
                    )}
                    <span>•</span>
                    <span className="pb-job-customer">{job.customer_email || 'Walk-in Customer'}</span>
                    <span>•</span>
                    <span className="pb-job-time">{job.created_at}</span>
                  </div>

                  <div className="pb-job-chips">
                    <span className="pb-chip">
                      {job.options.paper_size || 'A4'} • {job.options.color_mode.toUpperCase()}
                    </span>
                    <span className="pb-chip">
                      {job.options.copies} {job.options.copies === 1 ? 'copy' : 'copies'}
                    </span>
                    <span className="pb-chip">
                      {job.physical_sheets} {job.physical_sheets === 1 ? 'sheet' : 'sheets'} ({job.rendered_sides} sides)
                    </span>
                    <span className="pb-chip">
                      {job.options.duplex_mode === 'simplex' ? 'Single Sided' : 'Double Sided'}
                    </span>
                    {job.options.binding && job.options.binding !== 'none' && (
                      <span className="pb-chip" style={{ borderColor: 'var(--pb-desk-accent-border)' }}>
                        Binding: {job.options.binding}
                      </span>
                    )}
                    {Boolean((job.options as any).photo_preset || (job.options as any).photoPreset) &&
                      (job.options as any).photo_preset !== 'standard' &&
                      (job.options as any).photoPreset !== 'standard' && (
                        <span className="pb-chip" style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: '#d97706', fontWeight: 700 }}>
                          📸 {((job.options as any).photo_preset || (job.options as any).photoPreset) === 'passport_8up' ? 'Passport 8-Up Sheet' : ((job.options as any).photo_preset || (job.options as any).photoPreset) === 'photo_4x6' ? '4×6 Studio Photo' : 'ID Card 2-Up Sheet'}
                        </span>
                    )}
                  </div>

                  {job.items && job.items.length > 1 && (
                    <div
                      className="pb-job-multi-docs"
                      style={{
                        marginTop: '10px',
                        marginBottom: '8px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Layers size={13} color="#2563eb" />
                          Order Documents ({job.items.length})
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          Individual Controls
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {job.items.map((item, idx) => {
                          const itemExt = getFileExtension(item.name);
                          const itemData = item.file_data || (idx === 0 ? job.file_data : undefined);
                          return (
                            <div
                              key={item.id || `${item.name}-${idx}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                fontSize: '12px',
                                gap: '8px',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                                <span
                                  style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    background: '#eff6ff',
                                    color: '#2563eb',
                                    padding: '2px 5px',
                                    borderRadius: '4px',
                                    textTransform: 'uppercase',
                                    flexShrink: 0,
                                  }}
                                >
                                  {itemExt}
                                </span>
                                <span
                                  style={{
                                    fontWeight: 600,
                                    color: '#1e293b',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                  title={item.name}
                                >
                                  {idx + 1}. {item.name}
                                </span>
                                <span style={{ color: '#64748b', fontSize: '11px', flexShrink: 0 }}>
                                  • {item.page_count || 1} pgs • {item.copies || 1} {item.copies === 1 ? 'copy' : 'copies'} • {(item.color_mode || 'bw').toUpperCase()} • {item.duplex_mode === 'simplex' ? 'Single Sided' : 'Double Sided'}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                {itemData && (
                                  <a
                                    href={getFileViewUrl(itemData, item.name)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="pb-btn pb-btn-secondary pb-btn-sm"
                                    style={{
                                      textDecoration: 'none',
                                      padding: '2px 8px',
                                      fontSize: '11px',
                                      height: '24px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                    }}
                                    title={`Preview ${item.name}`}
                                  >
                                    <FileText size={11} /> View Doc
                                  </a>
                                )}
                                <button
                                  type="button"
                                  className="pb-btn pb-btn-primary pb-btn-sm"
                                  style={{
                                    padding: '2px 8px',
                                    fontSize: '11px',
                                    height: '24px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                  onClick={() => onDirectPrint && onDirectPrint(job.id, idx)}
                                  title={`Print ${item.name} individually to ${selectedPrinterName || 'printer'}`}
                                >
                                  <Printer size={11} /> Print Doc
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {job.status === 'PENDING_APPROVAL' && paymentVerificationPending && (
                    <p className="pb-form-hint" role="status">
                      Waiting for the payment provider to verify this UPI payment. Printing is locked until verification completes.
                    </p>
                  )}

                  {job.status === 'PENDING_APPROVAL' && !paymentVerificationPending && (
                    <div className="pb-job-action-row">
                      <button
                        type="button"
                        className="pb-btn pb-btn-primary pb-btn-sm"
                        onClick={() => onApproveJob(job.id)}
                        title={`Approve and send print stream directly to ${selectedPrinterName || 'connected printer'}`}
                      >
                        <Printer size={13} /> {job.items && job.items.length > 1 ? `Approve & Print All (${job.items.length} Docs)` : 'Approve & Print'}
                      </button>
                      <button
                        type="button"
                        className="pb-btn pb-btn-danger pb-btn-sm"
                        onClick={() => onRejectJob(job.id)}
                      >
                        <XCircle size={13} /> Reject Order
                      </button>
                      {job.file_data && (
                        <a
                          href={getFileViewUrl(job.file_data, job.file_name)}
                          target="_blank"
                          rel="noreferrer"
                          className="pb-btn pb-btn-secondary pb-btn-sm"
                          style={{ textDecoration: 'none' }}
                        >
                          <FileText size={13} /> {job.items && job.items.length > 1 ? 'View Primary Doc' : 'View File'}
                        </a>
                      )}
                    </div>
                  )}

                  {job.status === 'PRINTING' && (
                    <div className="pb-job-action-row">
                      <button
                        type="button"
                        className="pb-btn pb-btn-success pb-btn-sm"
                        onClick={() => onCompleteJob && onCompleteJob(job.id)}
                      >
                        <CheckCircle2 size={13} /> Mark Completed
                      </button>
                      {job.file_data && (
                        <a
                          href={getFileViewUrl(job.file_data, job.file_name)}
                          target="_blank"
                          rel="noreferrer"
                          className="pb-btn pb-btn-secondary pb-btn-sm"
                          style={{ textDecoration: 'none' }}
                        >
                          <FileText size={13} /> {job.items && job.items.length > 1 ? 'View Primary Doc' : 'View File'}
                        </a>
                      )}
                    </div>
                  )}

                  {job.status === 'QUEUED' && (
                    <div className="pb-job-action-row">
                      <button
                        type="button"
                        className="pb-btn pb-btn-primary pb-btn-sm"
                        onClick={() => onDirectPrint && onDirectPrint(job.id)}
                        title={`Send print job to ${selectedPrinterName || 'hardware printer'}`}
                      >
                        <Printer size={13} /> {job.items && job.items.length > 1 ? `Print All (${job.items.length} Docs)` : 'Print to Device'}
                      </button>
                      <button
                        type="button"
                        className="pb-btn pb-btn-success pb-btn-sm"
                        onClick={() => onCompleteJob && onCompleteJob(job.id)}
                      >
                        <CheckCircle2 size={13} /> Mark Printed &amp; Ready
                      </button>
                      {job.file_data && (
                        <a
                          href={getFileViewUrl(job.file_data, job.file_name)}
                          target="_blank"
                          rel="noreferrer"
                          className="pb-btn pb-btn-secondary pb-btn-sm"
                          style={{ textDecoration: 'none' }}
                        >
                          <FileText size={13} /> {job.items && job.items.length > 1 ? 'View Primary Doc' : 'View File'}
                        </a>
                      )}
                    </div>
                  )}

                  {job.status === 'COMPLETED' && (
                    <div className="pb-job-action-row">
                      <button
                        type="button"
                        className="pb-btn pb-btn-secondary pb-btn-sm"
                        onClick={() => onDirectPrint && onDirectPrint(job.id)}
                        title={`Print an extra copy to ${selectedPrinterName || 'hardware printer'}`}
                      >
                        <Printer size={13} /> {job.items && job.items.length > 1 ? `Print All Again (${job.items.length} Docs)` : 'Print Again'}
                      </button>
                      {job.file_data && (
                        <a
                          href={getFileViewUrl(job.file_data, job.file_name)}
                          target="_blank"
                          rel="noreferrer"
                          className="pb-btn pb-btn-secondary pb-btn-sm"
                          style={{ textDecoration: 'none' }}
                        >
                          <FileText size={13} /> {job.items && job.items.length > 1 ? 'View Primary Doc' : 'View File'}
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div className="pb-job-price-col">
                  <div className="pb-job-price">
                    ₹{job.calculated_price_rupees.toFixed(2)}
                  </div>
                  <div className="pb-job-price-badge">
                    {job.payment_method === 'cash'
                      ? 'Cash at Counter'
                      : paymentVerificationPending
                        ? 'UPI Verification Pending'
                        : 'UPI Payment Verified'}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {isClearDialogOpen && (
        <div className="pb-modal-backdrop" onClick={closeClearDialog}>
          <div
            className="pb-modal pb-modal-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-dispatch-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="pb-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={17} color="var(--pb-desk-danger)" />
                <h2 className="pb-modal-title" id="clear-dispatch-title">Clear all dispatch orders</h2>
              </div>
              <button
                type="button"
                className="pb-modal-close"
                onClick={closeClearDialog}
                aria-label="Close clear dispatch dialog"
                disabled={isClearingDispatch}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleClearAllDispatch}>
              <div className="pb-modal-body">
                <p style={{ margin: 0, color: 'var(--pb-desk-text-dim)', fontSize: '13px', lineHeight: 1.5 }}>
                  Are you sure you want to permanently delete every dispatch order across all shops and statuses?
                  This cannot be undone. Shop licenses, audit records, and local spool files will remain.
                </p>

                {clearError && (
                  <div role="alert" style={{ color: 'var(--pb-desk-danger)', fontSize: '12px', fontWeight: 650 }}>
                    {clearError}
                  </div>
                )}
              </div>

              <div className="pb-modal-footer">
                <button
                  type="button"
                  className="pb-btn pb-btn-secondary"
                  onClick={closeClearDialog}
                  disabled={isClearingDispatch}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pb-btn pb-btn-danger"
                  disabled={isClearingDispatch}
                >
                  <Trash2 size={14} />
                  {isClearingDispatch ? 'Clearing…' : 'Yes, Permanently Clear All'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

