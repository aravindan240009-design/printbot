import React from 'react';
import {
  Printer,
  RefreshCw,
  ShieldCheck,
  Check,
  Sliders,
  FileCheck,
  QrCode,
  Zap,
  AlertTriangle,
  Play,
} from 'lucide-react';
import { type NativePrinterInfo } from '../native';

export interface PrinterRoutingConfig {
  bwPrinter: string;
  colorPrinter: string;
  duplexPrinter: string;
}

interface PrintersViewProps {
  nativePrinters: NativePrinterInfo[];
  fallbackPrinters?: Array<{ id: string; name: string; driver_name?: string }>;
  onRefreshPrinters: () => void;
  isRefreshing?: boolean;
  printerRouting: PrinterRoutingConfig;
  onUpdatePrinterRouting: (routing: PrinterRoutingConfig) => void;
  onTestPrint: (printerName: string) => Promise<void>;
  testingPrinterName?: string | null;
  onPrintStandee?: () => Promise<void>;
  isPrintingStandee?: boolean;
}

export const PrintersView: React.FC<PrintersViewProps> = ({
  nativePrinters,
  fallbackPrinters = [],
  onRefreshPrinters,
  isRefreshing = false,
  printerRouting,
  onUpdatePrinterRouting,
  onTestPrint,
  testingPrinterName = null,
  onPrintStandee,
  isPrintingStandee = false,
}) => {
  const displayPrinters =
    nativePrinters && nativePrinters.length > 0
      ? nativePrinters.map((p) => {
          const media =
            p.supported_paper_sizes && p.supported_paper_sizes.length > 0
              ? p.supported_paper_sizes.slice(0, 5).join(', ') +
                (p.supported_paper_sizes.length > 5 ? ` +${p.supported_paper_sizes.length - 5} more` : '')
              : 'Standard Media (A4, Letter)';
          return {
            id: p.name,
            name: p.name,
            isOnline: p.is_online,
            statusText: p.driver_name
              ? `${p.driver_name} (${p.status || 'Ready'})`
              : p.status
              ? `Windows Spooler (${p.status})`
              : 'Windows Print Spooler Driver',
            isDefault: p.is_default,
            channels: p.supports_color ? 'Color & Monochrome' : 'Monochrome Only',
            duplex: p.supports_duplex ? 'Automatic Long & Short Edge' : 'Manual / Simplex Only',
            supportedMedia: media,
            fullMediaList: p.supported_paper_sizes?.join(', ') || media,
            protocol: p.protocol || (p.port_name ? `Win32 Stream (${p.port_name})` : 'Win32 RAW Stream'),
            queueCount: p.queue_count,
          };
        })
      : fallbackPrinters.map((p, idx) => ({
          id: p.id || p.name,
          name: p.name,
          isOnline: true,
          statusText: p.driver_name || 'Windows Print Spooler Driver',
          isDefault: idx === 0,
          channels: 'Monochrome Only',
          duplex: 'Manual / Simplex Only',
          supportedMedia: 'A4, Letter',
          fullMediaList: 'A4, Letter',
          protocol: 'Win32 Print Spooler',
          queueCount: 0,
        }));

  const allPrinterNames = displayPrinters.map((p) => p.name);

  return (
    <div className="pb-view">
      {/* Page Header */}
      <div className="pb-page-header">
        <div>
          <span className="pb-page-eyebrow">HARDWARE CONNECTIONS / WIN32</span>
          <h1 className="pb-page-title">Printer Fleet &amp; Auto-Routing</h1>
          <p className="pb-page-subtitle">
            Configure dedicated B&amp;W, Color, and Duplex printers. Jobs dispatch automatically with zero-config Windows spooler bindings.
          </p>
        </div>

        <div className="pb-header-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {onPrintStandee && (
            <button
              type="button"
              className="pb-btn pb-btn-secondary"
              onClick={onPrintStandee}
              disabled={isPrintingStandee || displayPrinters.length === 0}
              title="Print high-resolution A4 QR counter standee flyer"
            >
              <QrCode size={14} className={isPrintingStandee ? 'pb-spin' : ''} />
              <span>{isPrintingStandee ? 'Generating Standee...' : 'Print Counter QR Standee'}</span>
            </button>
          )}

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

      {/* Smart Dedicated Routing Panel */}
      <div
        className="pb-panel"
        style={{
          padding: '20px',
          marginBottom: '24px',
          background: 'var(--pb-desk-surface)',
          border: '1px solid var(--pb-desk-border-subtle)',
          borderRadius: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--pb-desk-accent-subtle)',
                color: 'var(--pb-desk-accent)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Zap size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 750, color: 'var(--pb-desk-text)' }}>
                Smart Printer Auto-Routing (By Job Specifications)
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: 'var(--pb-desk-text-dim)' }}>
                Incoming orders are automatically dispatched to the matching printer based on Color, B&amp;W, and Double-Sided options.
              </p>
            </div>
          </div>
          <span className="pb-badge pb-badge-success" style={{ fontSize: '11px' }}>
            <Check size={12} /> Auto-Dispatch Engine Active
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
          }}
        >
          {/* Black & White Dedicated */}
          <div
            style={{
              padding: '14px',
              borderRadius: '8px',
              background: 'var(--pb-desk-surface-alt)',
              border: '1px solid var(--pb-desk-border-subtle)',
            }}
          >
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 750, color: 'var(--pb-desk-text)', marginBottom: '6px' }}>
              ⚫ Black &amp; White Dedicated Printer:
            </label>
            <select
              className="pb-select"
              value={printerRouting.bwPrinter}
              onChange={(e) =>
                onUpdatePrinterRouting({ ...printerRouting, bwPrinter: e.target.value })
              }
              style={{ width: '100%', fontSize: '12px', padding: '6px 8px' }}
            >
              <option value="">-- Use Default Counter Printer --</option>
              {allPrinterNames.map((name) => (
                <option key={`bw-${name}`} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--pb-desk-text-dim)' }}>
              Handles regular monochrome document print jobs and xerox sheets.
            </div>
          </div>

          {/* Color Dedicated */}
          <div
            style={{
              padding: '14px',
              borderRadius: '8px',
              background: 'var(--pb-desk-surface-alt)',
              border: '1px solid var(--pb-desk-border-subtle)',
            }}
          >
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 750, color: 'var(--pb-desk-text)', marginBottom: '6px' }}>
              🎨 Color Dedicated Printer:
            </label>
            <select
              className="pb-select"
              value={printerRouting.colorPrinter}
              onChange={(e) =>
                onUpdatePrinterRouting({ ...printerRouting, colorPrinter: e.target.value })
              }
              style={{ width: '100%', fontSize: '12px', padding: '6px 8px' }}
            >
              <option value="">-- Use Default Counter Printer --</option>
              {allPrinterNames.map((name) => (
                <option key={`color-${name}`} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--pb-desk-text-dim)' }}>
              Handles color certificates, glossy photos, and passport sheets.
            </div>
          </div>

          {/* Duplex / Double-Sided Dedicated */}
          <div
            style={{
              padding: '14px',
              borderRadius: '8px',
              background: 'var(--pb-desk-surface-alt)',
              border: '1px solid var(--pb-desk-border-subtle)',
            }}
          >
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 750, color: 'var(--pb-desk-text)', marginBottom: '6px' }}>
              🔄 Double-Side Dedicated Printer (Duplex):
            </label>
            <select
              className="pb-select"
              value={printerRouting.duplexPrinter}
              onChange={(e) =>
                onUpdatePrinterRouting({ ...printerRouting, duplexPrinter: e.target.value })
              }
              style={{ width: '100%', fontSize: '12px', padding: '6px 8px' }}
            >
              <option value="">-- Use Default Counter Printer --</option>
              {allPrinterNames.map((name) => (
                <option key={`duplex-${name}`} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--pb-desk-text-dim)' }}>
              Dedicated machine with auto-duplex unit for 2-sided book printing.
            </div>
          </div>
        </div>
      </div>

      {/* Spooler Status Banner */}
      <div className="pb-panel" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
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
          {displayPrinters.map((prn) => {
            const isBwAssigned = printerRouting.bwPrinter === prn.name;
            const isColorAssigned = printerRouting.colorPrinter === prn.name;
            const isDuplexAssigned = printerRouting.duplexPrinter === prn.name;
            const isTesting = testingPrinterName === prn.name;

            return (
              <div key={prn.id} className="pb-printer-card">
                <div className="pb-printer-card-hero">
                  <div className="pb-printer-icon-wrap">
                    <Printer size={32} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                    {prn.isDefault && (
                      <span className="pb-printer-default-badge">
                        <Check size={11} /> Default Counter Printer
                      </span>
                    )}
                    {isBwAssigned && (
                      <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#0f172a', color: '#ffffff' }}>
                        ⚫ B&amp;W Default
                      </span>
                    )}
                    {isColorAssigned && (
                      <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#ec4899', color: '#ffffff' }}>
                        🎨 Color Default
                      </span>
                    )}
                    {isDuplexAssigned && (
                      <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#2563eb', color: '#ffffff' }}>
                        🔄 Duplex Default
                      </span>
                    )}
                  </div>
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
                      <span className="pb-printer-spec-val">{prn.channels}</span>
                    </div>
                    <div className="pb-printer-spec-row">
                      <span className="pb-printer-spec-label">Duplex Engine</span>
                      <span className="pb-printer-spec-val">{prn.duplex}</span>
                    </div>
                    <div className="pb-printer-spec-row">
                      <span className="pb-printer-spec-label">Supported Media</span>
                      <span className="pb-printer-spec-val" title={prn.fullMediaList}>
                        {prn.supportedMedia}
                      </span>
                    </div>
                    <div className="pb-printer-spec-row">
                      <span className="pb-printer-spec-label">Spooler Protocol</span>
                      <span className="pb-printer-spec-val">{prn.protocol}</span>
                    </div>
                  </div>

                  {/* Test Print Action Button */}
                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--pb-desk-border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="pb-btn pb-btn-secondary pb-btn-sm"
                      onClick={() => onTestPrint(prn.name)}
                      disabled={isTesting || !prn.isOnline}
                      style={{ gap: '6px' }}
                      title={`Send diagnostic test alignment page to ${prn.name}`}
                    >
                      <Play size={12} className={isTesting ? 'pb-spin' : ''} />
                      <span>{isTesting ? 'Sending Test Page...' : 'Test Print'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
