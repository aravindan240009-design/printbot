import React from 'react';
import {
  Printer,
  RefreshCw,
  CheckCircle2,
  Cpu,
  Layers,
  Settings,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { type NativePrinterInfo } from '../native';

interface PrintersViewProps {
  nativePrinters: NativePrinterInfo[];
  fallbackPrinters?: Array<{ id: string; name: string; driver_name?: string }>;
  onRefreshPrinters: () => void;
  isRefreshing?: boolean;
}

export const PrintersView: React.FC<PrintersViewProps> = ({
  nativePrinters,
  fallbackPrinters = [],
  onRefreshPrinters,
  isRefreshing = false,
}) => {
  const displayPrinters =
    nativePrinters && nativePrinters.length > 0
      ? nativePrinters.map((p) => ({
          id: p.name,
          name: p.name,
          isOnline: p.is_online,
          statusText: p.status ? `Windows Spooler (${p.status})` : 'Windows Print Spooler Driver',
          isDefault: p.is_default,
        }))
      : fallbackPrinters.map((p, idx) => ({
          id: p.id || p.name,
          name: p.name,
          isOnline: true,
          statusText: p.driver_name || 'Windows Print Spooler Driver',
          isDefault: idx === 0,
        }));

  return (
    <div className="pb-view">
      {/* Page Header */}
      <div className="pb-page-header">
        <div>
          <span className="pb-page-eyebrow">HARDWARE CONNECTIONS / WIN32</span>
          <h1 className="pb-page-title">Printer Fleet</h1>
          <p className="pb-page-subtitle">
            Zero-config Win32 spooler discovery. Jobs dispatch directly through Windows native printing APIs.
          </p>
        </div>

        <div className="pb-header-actions">
          <button
            type="button"
            className="pb-btn pb-btn-primary"
            onClick={onRefreshPrinters}
            disabled={isRefreshing}
          >
            <RefreshCw size={14} className={isRefreshing ? 'pb-spin' : ''} />
            <span>{isRefreshing ? 'Scanning Spooler...' : 'Scan / Refresh Fleet'}</span>
          </button>
        </div>
      </div>

      {/* Spooler Status Banner */}
      <div className="pb-panel" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="pb-badge-icon" style={{ background: 'var(--pb-desk-success-subtle)', color: 'var(--pb-desk-success)', width: '36px', height: '36px', borderRadius: '8px', display: 'grid', placeItems: 'center' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 750, fontSize: '13px', color: 'var(--pb-desk-text)' }}>
                Native Windows Spooler Engine Active
              </div>
              <div style={{ fontSize: '12px', color: 'var(--pb-desk-text-dim)' }}>
                Supports USB, Ethernet, WiFi, and Virtual PDF queues without proprietary vendor drivers.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="pb-badge pb-badge-success">
              <span className="pb-pulse-dot" style={{ background: 'var(--pb-desk-success)' }} />
              {displayPrinters.length} Attached {displayPrinters.length === 1 ? 'Printer' : 'Printers'}
            </span>
          </div>
        </div>
      </div>

      {/* Printer Cards Grid */}
      {displayPrinters.length === 0 ? (
        <div className="pb-panel pb-empty-state" style={{ padding: '48px 24px' }}>
          <div className="pb-empty-icon">
            <Printer size={40} />
          </div>
          <h3 className="pb-empty-title">No Windows Printers Detected</h3>
          <p className="pb-empty-subtitle">
            Connect your USB or network printer and install drivers via Windows Settings. Print Bot automatically discovers all local and networked Windows spooler printers.
          </p>
          <button
            type="button"
            className="pb-btn pb-btn-secondary"
            onClick={onRefreshPrinters}
            style={{ marginTop: '16px' }}
          >
            <RefreshCw size={14} /> Scan Hardware Now
          </button>
        </div>
      ) : (
        <div className="pb-printers-grid">
          {displayPrinters.map((prn) => (
            <div key={prn.id} className="pb-printer-card">
              <div className="pb-printer-card-hero">
                <div className="pb-printer-icon-wrap">
                  <Printer size={32} />
                </div>
                {prn.isDefault && (
                  <span className="pb-printer-default-badge">
                    <Check size={11} /> Default Counter Printer
                  </span>
                )}
              </div>

              <div className="pb-printer-card-body">
                <div className="pb-printer-name-row">
                  <h3 className="pb-printer-title" title={prn.name}>
                    {prn.name}
                  </h3>
                  <span className={`pb-badge ${prn.isOnline ? 'pb-badge-success' : 'pb-badge-neutral'}`}>
                    <span
                      className="pb-pulse-dot"
                      style={{ background: prn.isOnline ? 'var(--pb-desk-success)' : 'var(--pb-desk-text-dim)' }}
                    />
                    {prn.isOnline ? 'Online / Ready' : 'Spooler Attached'}
                  </span>
                </div>

                <div className="pb-printer-driver-text">{prn.statusText}</div>

                {/* Capabilities specs table */}
                <div className="pb-printer-specs-table">
                  <div className="pb-printer-spec-row">
                    <span className="pb-printer-spec-label">Print Channels</span>
                    <span className="pb-printer-spec-val">Color &amp; Monochrome</span>
                  </div>
                  <div className="pb-printer-spec-row">
                    <span className="pb-printer-spec-label">Duplex Engine</span>
                    <span className="pb-printer-spec-val">Automatic Long &amp; Short Edge</span>
                  </div>
                  <div className="pb-printer-spec-row">
                    <span className="pb-printer-spec-label">Supported Media</span>
                    <span className="pb-printer-spec-val">A4, A3, Legal, Letter, Glossy</span>
                  </div>
                  <div className="pb-printer-spec-row">
                    <span className="pb-printer-spec-label">Spooler Protocol</span>
                    <span className="pb-printer-spec-val">EMF / RAW Win32 Stream</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

