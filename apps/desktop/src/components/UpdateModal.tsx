import React from 'react';
import { Sparkles, ArrowRight, X, RefreshCw, AlertCircle, CheckCircle2, ShieldCheck, Download } from 'lucide-react';
import type { DesktopReleaseInfo } from '../utils/versionCheck';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVersion: string;
  release: DesktopReleaseInfo | null;
  onUpdateNow: () => Promise<void>;
  isUpdating: boolean;
  updateStatus: string | null;
  updateError: string | null;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  currentVersion,
  release,
  onUpdateNow,
  isUpdating,
  updateStatus,
  updateError,
}) => {
  if (!isOpen || !release) return null;

  const isMandatory = !!release.mandatory;

  // Split release notes by newline if multiple items
  const notesLines = (release.releaseNotes || 'General improvements and stability fixes.')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return (
    <div
      className="pb-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px',
      }}
    >
      <div
        className="pb-modal-card"
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '500px',
          boxShadow: '0 25px 50px -12px rgba(37, 99, 235, 0.35)',
          border: '1px solid #dbeafe',
          overflow: 'hidden',
          animation: 'fadeIn 0.25s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 28px',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
            color: '#ffffff',
            position: 'relative',
          }}
        >
          {!isMandatory && !isUpdating && (
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'grid',
                placeItems: 'center',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              title="Remind me later"
            >
              <X size={16} />
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Sparkles size={24} color="#fef08a" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: isMandatory ? '#ef4444' : '#10b981',
                    color: '#ffffff',
                  }}
                >
                  {isMandatory ? 'Mandatory Update' : 'New Update'}
                </span>
                {release.publishedAt && (
                  <span style={{ fontSize: '11px', color: '#bfdbfe' }}>{release.publishedAt}</span>
                )}
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0 0', color: '#ffffff' }}>
                Print Bot Workstation v{release.version}
              </h2>
            </div>
          </div>

          <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#dbeafe', lineHeight: 1.4 }}>
            A newer, faster version of Print Bot is available for your counter station.
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px' }}>
          {/* Version Comparison Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              borderRadius: '10px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              marginBottom: '18px',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>CURRENT VERSION</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>v{currentVersion}</div>
            </div>
            <ArrowRight size={18} color="#94a3b8" />
            <div>
              <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600 }}>AVAILABLE UPDATE</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#2563eb' }}>v{release.version}</div>
            </div>
          </div>

          {/* Release Notes */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              What's New in This Version:
            </div>
            <div
              style={{
                background: '#f1f5f9',
                borderRadius: '10px',
                padding: '14px 16px',
                border: '1px solid #e2e8f0',
                maxHeight: '140px',
                overflowY: 'auto',
              }}
            >
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#1e293b', lineHeight: 1.6 }}>
                {notesLines.map((note, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>
                    {note.replace(/^[-*•]\s*/, '')}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Status / Error Alert */}
          {updateStatus && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                borderRadius: '8px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#1e40af',
                fontSize: '12.5px',
                marginBottom: '18px',
              }}
            >
              <RefreshCw size={16} className="animate-spin" />
              <span>{updateStatus}</span>
            </div>
          )}

          {updateError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                borderRadius: '8px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: '12.5px',
                marginBottom: '18px',
              }}
            >
              <AlertCircle size={16} />
              <span>{updateError}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
            {!isMandatory && !isUpdating && (
              <button
                type="button"
                onClick={onClose}
                className="pb-btn pb-btn-secondary"
                style={{ height: '42px', padding: '0 20px', fontSize: '13px' }}
              >
                Remind Me Later
              </button>
            )}

            <button
              type="button"
              onClick={onUpdateNow}
              disabled={isUpdating}
              className="pb-btn pb-btn-primary"
              style={{
                height: '42px',
                padding: '0 24px',
                fontSize: '13.5px',
                fontWeight: 750,
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {isUpdating ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Update Now (1-Click)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

