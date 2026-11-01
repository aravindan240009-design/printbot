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
  onInspectJob?: (job: PrintJob) => void;
  onRefreshJobs?: () => void;
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
  onInspectJob,
  onRefreshJobs,
}) => {
  const getStatusBadge = (status: PrintJob['status']) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return <span className="pb-badge pb-badge-warning">Awaiting Approval</span>;
      case 'QUEUED':
        return <span className="pb-badge pb-badge-info">Ready to Dispatch</span>;
      case 'PRINTING':
        return <span className="pb-badge pb-badge-accent">Spooling...</span>;
      case 'COMPLETED':
        return <span className="pb-badge pb-badge-success">Printed</span>;
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
            {filteredJobs.map((job) => (
              <div key={job.id} className="pb-job-card">
                <div className="pb-job-file-avatar">
                  <span className="pb-file-ext-tag">{getFileExtension(job.file_name)}</span>
                  <FileText size={20} />
                </div>

                <div className="pb-job-info">
                  <div className="pb-job-primary-row">
                    <span className="pb-job-filename" title={job.file_name}>
                      {job.file_name}
                    </span>
                    {getStatusBadge(job.status)}
                  </div>

                  <div className="pb-job-meta-row">
                    <span className="pb-job-id">#{job.id}</span>
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
                      {job.options.duplex_mode === 'duplex_long' ? 'Double Sided' : 'Single Sided'}
                    </span>
                    {job.options.binding && job.options.binding !== 'none' && (
                      <span className="pb-chip" style={{ borderColor: 'var(--pb-desk-accent-border)' }}>
                        Binding: {job.options.binding}
                      </span>
                    )}
                  </div>

                  {job.status === 'PENDING_APPROVAL' && (
                    <div className="pb-job-action-row">
                      <button
                        type="button"
                        className="pb-btn pb-btn-primary pb-btn-sm"
                        onClick={() => onApproveJob(job.id)}
                      >
                        <Printer size={13} /> Approve &amp; Spool
                      </button>
                      <button
                        type="button"
                        className="pb-btn pb-btn-danger pb-btn-sm"
                        onClick={() => onRejectJob(job.id)}
                      >
                        <XCircle size={13} /> Reject Order
                      </button>
                    </div>
                  )}
                </div>

                <div className="pb-job-price-col">
                  <div className="pb-job-price">
                    ₹{job.calculated_price_rupees.toFixed(2)}
                  </div>
                  <div className="pb-job-price-badge">Instant UPI Paid</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

