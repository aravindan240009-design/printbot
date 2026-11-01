import React from 'react';
import {
  X,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Copy,
  Send,
  Trash2,
  Tag,
  Clock,
  Layers,
} from 'lucide-react';
import { type ShopServiceItem, type PrintJob } from '../App';

/* =========================================================================
   1. JOB REJECTION MODAL
   ========================================================================= */

interface JobRejectModalProps {
  jobId: string;
  job?: PrintJob;
  rejectionReason: string;
  setRejectionReason: (val: string) => void;
  onConfirmReject: (jobId: string, reason: string) => void;
  onClose: () => void;
}

export const JobRejectModal: React.FC<JobRejectModalProps> = ({
  jobId,
  job,
  rejectionReason,
  setRejectionReason,
  onConfirmReject,
  onClose,
}) => {
  const commonReasons = [
    'Document unreadable or corrupted',
    'Requested paper size / media currently out of stock',
    'Color printing unavailable on this printer',
    'File exceeds printable margins or pages',
    'Customer requested cancellation at counter',
  ];

  return (
    <div className="pb-modal-backdrop" onClick={onClose}>
      <div className="pb-modal pb-modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="pb-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="pb-badge-icon" style={{ background: 'var(--pb-desk-danger-subtle)', color: 'var(--pb-desk-danger)', width: '28px', height: '28px', borderRadius: '6px', display: 'grid', placeItems: 'center' }}>
              <AlertTriangle size={15} />
            </div>
            <h3 className="pb-modal-title">Reject Print Order #{jobId}</h3>
          </div>
          <button type="button" className="pb-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="pb-modal-body">
          {job && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--pb-desk-surface-raised)', border: '1px solid var(--pb-desk-border)', marginBottom: '14px', fontSize: '12px' }}>
              <div><strong>File:</strong> {job.file_name}</div>
              <div style={{ color: 'var(--pb-desk-text-dim)', marginTop: '2px' }}><strong>Customer:</strong> {job.customer_email || 'Walk-in'}</div>
            </div>
          )}

          <div className="pb-form-group">
            <label className="pb-form-label">Quick Reason Selector</label>
            <div style={{ display: 'grid', gap: '6px' }}>
              {commonReasons.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  className="pb-btn pb-btn-secondary pb-btn-sm"
                  style={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    borderColor: rejectionReason === r ? 'var(--pb-desk-danger)' : undefined,
                    background: rejectionReason === r ? 'var(--pb-desk-danger-subtle)' : undefined,
                    color: rejectionReason === r ? 'var(--pb-desk-danger)' : undefined,
                  }}
                  onClick={() => setRejectionReason(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="pb-form-group" style={{ marginTop: '14px' }}>
            <label className="pb-form-label">Explanation / Custom Message *</label>
            <textarea
              className="pb-textarea"
              rows={3}
              placeholder="Provide a clear reason for the customer..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="pb-modal-footer">
          <button type="button" className="pb-btn pb-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="pb-btn pb-btn-danger"
            disabled={!rejectionReason.trim()}
            onClick={() => onConfirmReject(jobId, rejectionReason)}
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   2. SERVICE EDIT / CREATE MODAL
   ========================================================================= */

interface ServiceEditModalProps {
  editingServiceId: string | null;
  serviceFormTitle: string;
  setServiceFormTitle: (val: string) => void;
  serviceFormCategory: string;
  setServiceFormCategory: (val: string) => void;
  serviceFormPrice: string;
  setServiceFormPrice: (val: string) => void;
  serviceFormTurnaround: string;
  setServiceFormTurnaround: (val: string) => void;
  serviceFormBadge: string;
  setServiceFormBadge: (val: string) => void;
  serviceFormDesc: string;
  setServiceFormDesc: (val: string) => void;
  serviceFormFeatures: string;
  setServiceFormFeatures: (val: string) => void;
  serviceFormHasDiscount: boolean;
  setServiceFormHasDiscount: (val: boolean) => void;
  serviceFormDiscountNote: string;
  setServiceFormDiscountNote: (val: string) => void;
  onSaveService: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const ServiceEditModal: React.FC<ServiceEditModalProps> = ({
  editingServiceId,
  serviceFormTitle,
  setServiceFormTitle,
  serviceFormCategory,
  setServiceFormCategory,
  serviceFormPrice,
  setServiceFormPrice,
  serviceFormTurnaround,
  setServiceFormTurnaround,
  serviceFormBadge,
  setServiceFormBadge,
  serviceFormDesc,
  setServiceFormDesc,
  serviceFormFeatures,
  setServiceFormFeatures,
  serviceFormHasDiscount,
  setServiceFormHasDiscount,
  serviceFormDiscountNote,
  setServiceFormDiscountNote,
  onSaveService,
  onClose,
}) => {
  return (
    <div className="pb-modal-backdrop" onClick={onClose}>
      <div className="pb-modal pb-modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="pb-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="pb-badge-icon" style={{ background: 'var(--pb-desk-accent-subtle)', color: 'var(--pb-desk-accent)', width: '28px', height: '28px', borderRadius: '6px', display: 'grid', placeItems: 'center' }}>
              <Sparkles size={15} />
            </div>
            <h3 className="pb-modal-title">
              {editingServiceId ? 'Edit Counter Service' : 'Add New Counter Service'}
            </h3>
          </div>
          <button type="button" className="pb-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSaveService}>
          <div className="pb-modal-body" style={{ maxHeight: 'calc(80vh - 120px)', overflowY: 'auto' }}>
            <div className="pb-form-grid-2">
              <div className="pb-form-group">
                <label className="pb-form-label">Service Title *</label>
                <input
                  type="text"
                  className="pb-input"
                  placeholder="e.g. Document Print &amp; Xerox"
                  value={serviceFormTitle}
                  onChange={(e) => setServiceFormTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="pb-form-group">
                <label className="pb-form-label">Category</label>
                <select
                  className="pb-select"
                  value={serviceFormCategory}
                  onChange={(e) => setServiceFormCategory(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="docs">Document Xerox</option>
                  <option value="photo">Photo &amp; ID</option>
                  <option value="binding">Binding &amp; Finishing</option>
                  <option value="other">Specialty</option>
                </select>
              </div>
            </div>

            <div className="pb-form-grid-2">
              <div className="pb-form-group">
                <label className="pb-form-label">Price Display (e.g. ₹1.50 / page) *</label>
                <input
                  type="text"
                  className="pb-input"
                  placeholder="₹1.50 / page or From ₹15.00"
                  value={serviceFormPrice}
                  onChange={(e) => setServiceFormPrice(e.target.value)}
                  required
                />
              </div>

              <div className="pb-form-group">
                <label className="pb-form-label">Turnaround Time</label>
                <input
                  type="text"
                  className="pb-input"
                  placeholder="Instant Counter Print / 5-15 mins"
                  value={serviceFormTurnaround}
                  onChange={(e) => setServiceFormTurnaround(e.target.value)}
                />
              </div>
            </div>

            <div className="pb-form-group">
              <label className="pb-form-label">Promotional Highlight Badge (Optional)</label>
              <input
                type="text"
                className="pb-input"
                placeholder="e.g. Most Popular, Student Favorite, Studio Quality"
                value={serviceFormBadge}
                onChange={(e) => setServiceFormBadge(e.target.value)}
              />
            </div>

            <div className="pb-form-group">
              <label className="pb-form-label">Short Description</label>
              <input
                type="text"
                className="pb-input"
                placeholder="Brief customer-facing summary of this service..."
                value={serviceFormDesc}
                onChange={(e) => setServiceFormDesc(e.target.value)}
              />
            </div>

            <div className="pb-form-group">
              <label className="pb-form-label">Features / Included Specs (One per line)</label>
              <textarea
                className="pb-textarea"
                rows={4}
                placeholder={"A4, A3, Legal, Letter\nBlack & White or Color\nSingle or Double Sided\nHigh-density toner"}
                value={serviceFormFeatures}
                onChange={(e) => setServiceFormFeatures(e.target.value)}
              />
            </div>

            {/* Discount Configuration (Optional & strictly customized) */}
            <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--pb-desk-surface-raised)', border: '1px solid var(--pb-desk-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="pb-discount-toggle"
                  checked={serviceFormHasDiscount}
                  onChange={(e) => setServiceFormHasDiscount(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="pb-discount-toggle" style={{ fontWeight: 750, fontSize: '13px', cursor: 'pointer' }}>
                  Enable Custom Discount Tag for this Service
                </label>
              </div>

              {serviceFormHasDiscount && (
                <div style={{ marginTop: '12px' }}>
                  <label className="pb-form-label">Custom Discount Note *</label>
                  <input
                    type="text"
                    className="pb-input"
                    placeholder="e.g. Double Sided (Save 15%) or Bulk Exam Special"
                    value={serviceFormDiscountNote}
                    onChange={(e) => setServiceFormDiscountNote(e.target.value)}
                    required={serviceFormHasDiscount}
                  />
                  <span className="pb-form-hint">
                    This badge will be displayed on your customer web portal.
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pb-modal-footer">
            <button type="button" className="pb-btn pb-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="pb-btn pb-btn-primary">
              {editingServiceId ? 'Save Changes' : 'Create Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* =========================================================================
   3. ISSUED CREDENTIALS MODAL (SUPER ADMIN)
   ========================================================================= */

interface IssuedCredsModalProps {
  data: {
    shopName: string;
    username: string;
    key: string;
    phone: string;
    duration: string;
    expiry: string;
  };
  onClose: () => void;
  onCopyNotice: (msg: string) => void;
}

export const IssuedCredsModal: React.FC<IssuedCredsModalProps> = ({
  data,
  onClose,
  onCopyNotice,
}) => {
  const whatsappUrl = `https://wa.me/91${data.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Hello *${data.shopName}*! 👋\n\nYour Print Bot Workstation access is approved.\n\n*Your Login Credentials:*\n🔑 *Username:* ${data.username}\n🛡️ *License Key:* ${data.key}\n📅 *Plan:* ${data.duration} (Unlimited Connected Printers)\n\nLaunch Print Bot Workstation software and enter your Username & Key to get started!`
  )}`;

  const fullText = `Print Bot Workstation Access Approved\nShop: ${data.shopName}\nUsername: ${data.username}\nLicense Key: ${data.key}\nPlan: ${data.duration}\nValid until: ${data.expiry}`;

  return (
    <div className="pb-modal-backdrop" onClick={onClose}>
      <div className="pb-modal pb-modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="pb-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="pb-badge-icon" style={{ background: 'var(--pb-desk-success-subtle)', color: 'var(--pb-desk-success)', width: '28px', height: '28px', borderRadius: '6px', display: 'grid', placeItems: 'center' }}>
              <CheckCircle2 size={16} />
            </div>
            <h3 className="pb-modal-title">Access Provisioned: {data.shopName}</h3>
          </div>
          <button type="button" className="pb-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="pb-modal-body">
          <div style={{ display: 'grid', gap: '14px' }}>
            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--pb-desk-surface-raised)', border: '1px solid var(--pb-desk-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--pb-desk-text-dim)', marginBottom: '4px' }}>OPERATOR USERNAME</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <code style={{ fontSize: '15px', fontWeight: 800 }}>{data.username}</code>
                <button
                  type="button"
                  className="pb-btn pb-btn-secondary pb-btn-sm"
                  onClick={() => {
                    navigator.clipboard.writeText(data.username);
                    onCopyNotice(`Copied username @${data.username}`);
                  }}
                >
                  <Copy size={12} /> Copy
                </button>
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--pb-desk-surface-raised)', border: '1px solid var(--pb-desk-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--pb-desk-text-dim)', marginBottom: '4px' }}>STATION LICENSE KEY</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <code style={{ fontSize: '14px', fontWeight: 800, color: 'var(--pb-desk-accent)' }}>{data.key}</code>
                <button
                  type="button"
                  className="pb-btn pb-btn-secondary pb-btn-sm"
                  onClick={() => {
                    navigator.clipboard.writeText(data.key);
                    onCopyNotice(`Copied License Key ${data.key}`);
                  }}
                >
                  <Copy size={12} /> Copy
                </button>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--pb-desk-text-dim)' }}>
              Plan Duration: <strong>{data.duration}</strong> (Valid until {data.expiry})
            </div>
          </div>
        </div>

        <div className="pb-modal-footer">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="pb-btn pb-btn-primary"
            style={{ textDecoration: 'none' }}
          >
            <Send size={14} /> Send WhatsApp (+91 {data.phone})
          </a>
          <button
            type="button"
            className="pb-btn pb-btn-secondary"
            onClick={() => {
              navigator.clipboard.writeText(fullText);
              onCopyNotice('Copied complete credentials payload.');
            }}
          >
            <Copy size={14} /> Copy All
          </button>
        </div>
      </div>
    </div>
  );
};

