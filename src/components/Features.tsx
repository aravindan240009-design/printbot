import React from 'react';

export const Features: React.FC = () => {
  return (
    <section id="features" className="section" aria-labelledby="features-heading">
      <div className="wrap">
        <div className="section-head" data-reveal>
          <h2 id="features-heading" className="head">
            Engineering for high-volume shop counters.
          </h2>
        </div>

        <div className="features-editorial">
          {/* Feature 1: Dual Fulfillment Modes */}
          <div className="feature-row" data-reveal>
            <div className="feature-info">
              <h3 className="feature-title">
                Full Automatic or Manual Staff Approval
              </h3>
              <p className="feature-body">
                Shop owners can toggle between two operational fulfillment modes depending on shop traffic and staffing.
              </p>
              <div className="feature-points">
                <div className="feature-point-item">
                  <span className="feature-point-bullet" />
                  <span><strong>Full Automatic:</strong> Verified paid jobs bypass the counter queue and dispatch directly to compatible printers.</span>
                </div>
                <div className="feature-point-item">
                  <span className="feature-point-bullet" />
                  <span><strong>Manual Approval:</strong> Counter operators inspect print plans, paper stock, and customer notes before releasing the spool.</span>
                </div>
                <div className="feature-point-item">
                  <span className="feature-point-bullet" />
                  <span><strong>Safety Holds:</strong> Incompatible paper sizes or offline printers automatically pause dispatch with actionable operator alerts.</span>
                </div>
              </div>
            </div>

            <div className="ui-panel" data-ui aria-label="Fulfillment mode selector fragment">
              <div className="ui-header">
                <div className="ui-title-group">
                  <span className="ui-status-dot" aria-hidden="true" />
                  <span className="ui-status-label">Shop Fulfillment Policy</span>
                </div>
                <span className="ui-badge">Active: Full-Auto</span>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border-card)', padding: '1rem', borderRadius: '6px', marginBottom: '0.85rem' }}>
                <div style={{ fontSize: 'var(--step-small)', fontWeight: 700, color: 'var(--accent)', marginBottom: '4px' }}>
                  Full Automatic Mode Enabled
                </div>
                <div style={{ fontSize: 'var(--step-small)', color: 'var(--muted)' }}>
                  Standard PDF and image jobs spool silently upon confirmed payment. Operator intervention is required only when paper jams or mismatches occur.
                </div>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border-card)', padding: '0.85rem', borderRadius: '6px', fontSize: 'var(--step-small)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Uncertain Spool Guard:</span>
                <span style={{ color: 'var(--status-green)', fontWeight: 600 }}>Active (Zero Duplicate Spools)</span>
              </div>
            </div>
          </div>

          {/* Feature 2: Hardware Fleet & Unlimited Printers */}
          <div className="feature-row reversed" data-reveal>
            <div className="feature-visual-col">
              <div className="photo-frame">
                <img
                  src="./assets/printer_hardware_fleet.jpg"
                  alt="High-volume commercial printing hardware fleet including copiers and laser printers"
                  className="cover"
                  loading="lazy"
                  width="1024"
                  height="576"
                />
                <div className="photo-overlay-tag" data-ui>
                  <span className="ui-status-dot" aria-hidden="true" />
                  <span>Hardware Fleet · 3 Windows Printers Active</span>
                </div>
              </div>
            </div>

            <div className="feature-info">
              <h3 className="feature-title">
                Unlimited Printers Per Shop PC
              </h3>
              <p className="feature-body">
                Print Bot discovers all USB, network, and Wi-Fi printers installed on your Windows computer through standard Win32 Spooler APIs (<code>winspool.drv</code>).
              </p>
              <div className="feature-points">
                <div className="feature-point-item">
                  <span className="feature-point-bullet" />
                  <span><strong>No per-printer licensing fee:</strong> Connect as many laser printers, color inkjets, and copiers as your business needs without device upgrade fees.</span>
                </div>
                <div className="feature-point-item">
                  <span className="feature-point-bullet" />
                  <span><strong>Driver discovery:</strong> Automatically detects supported paper trays, media types, color abilities, and duplex units directly from Windows.</span>
                </div>
                <div className="feature-point-item">
                  <span className="feature-point-bullet" />
                  <span><strong>Printer fallbacks:</strong> Automatically redirect jobs to alternate trays or devices if a printer runs out of paper or goes offline.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: Cryptographic PC Keys & Ephemeral Privacy */}
          <div className="feature-row" data-reveal>
            <div className="feature-info">
              <h3 className="feature-title">
                Cryptographic PC Pairing &amp; Ephemeral Privacy
              </h3>
              <p className="feature-body">
                Customer files are sensitive. Print Bot enforces hardware-level cryptographic authorization and automatic ephemeral file purging.
              </p>
              <div className="feature-points">
                <div className="feature-point-item">
                  <span className="feature-point-bullet" />
                  <span><strong>Windows CNG / TPM keys:</strong> Each shop PC generates asymmetric cryptographic keys upon pairing. Unapproved computers cannot pull or print jobs.</span>
                </div>
                <div className="feature-point-item">
                  <span className="feature-point-bullet" />
                  <span><strong>Automated file purge:</strong> Original documents and preview files stream to memory and are immediately purged from cloud storage and local caches upon printing.</span>
                </div>
                <div className="feature-point-item">
                  <span className="feature-point-bullet" />
                  <span><strong>Customer Delete Now:</strong> Customers can trigger immediate cloud purge from their order tracking screen at any time.</span>
                </div>
              </div>
            </div>

            <div className="ui-panel" data-ui aria-label="Security and cryptographic pairing fragment">
              <div className="ui-header">
                <div className="ui-title-group">
                  <span className="ui-status-dot" aria-hidden="true" />
                  <span className="ui-status-label">Security &amp; Privacy Monitor</span>
                </div>
                <span className="ui-badge">TPM Authorized</span>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border-card)', padding: '1rem', borderRadius: '6px', fontSize: 'var(--step-small)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Device Key:</span>
                  <span style={{ fontWeight: 600 }}>CNG/TPM Attested (SHA-256)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Cloud Storage:</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Private Tenant S3 Bucket</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Retention Policy:</span>
                  <span style={{ fontWeight: 600 }}>Auto-Purge Post-Collection</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Cross-Tenant Access:</span>
                  <span style={{ color: 'var(--status-green)', fontWeight: 600 }}>Zero Leakage (Isolated RLS)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
