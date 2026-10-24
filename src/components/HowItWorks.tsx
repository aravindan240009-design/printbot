import React, { useState } from 'react';

interface StageData {
  id: number;
  orderWord: string;
  clause: string;
  description: string;
  uiTitle: string;
  uiBadge: string;
}

const STAGES: StageData[] = [
  {
    id: 1,
    orderWord: 'First,',
    clause: 'scan the counter QR code and upload documents.',
    description: 'Customers scan the shop QR code on their smartphone camera. A progressive web application opens instantly without app installation. Files are uploaded directly to encrypted, private storage with automatic MIME type verification.',
    uiTitle: 'Guest Session Intake',
    uiBadge: 'PWA Direct Upload',
  },
  {
    id: 2,
    orderWord: 'Next,',
    clause: 'configure print settings with live sheet previews.',
    description: 'Customers choose page ranges, color or monochrome modes, long-edge or short-edge duplex, and multi-page imposition. The server renders an exact normalized preview of the output sheet before charging.',
    uiTitle: 'Sheet Imposition Engine',
    uiBadge: 'A4 / A3 Imposition',
  },
  {
    id: 3,
    orderWord: 'Then,',
    clause: 'receive an immutable quote and verify payment.',
    description: 'The server computes the exact sheet count and locks the price quote. Customers settle payment via UPI or counter cash. The locked quote cannot be tampered with or modified after confirmation.',
    uiTitle: 'Deterministic Price Lock',
    uiBadge: 'Reconciled Payment',
  },
  {
    id: 4,
    orderWord: 'Finally,',
    clause: 'the Windows service spools directly to printers.',
    description: 'The paired shop PC leases the job and writes to its local SQLite journal. The background Rust service submits the job to the Win32 Spooler, issues a customer pickup code, and permanently purges source files.',
    uiTitle: 'Win32 Spooler Dispatch',
    uiBadge: 'Ephemeral Purged',
  },
];

export const HowItWorks: React.FC = () => {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const currentStage = STAGES[activeStageIndex];

  return (
    <section id="how-it-works" className="section" aria-labelledby="how-it-works-heading">
      <div className="wrap">
        <div className="section-head" data-reveal>
          <h2 id="how-it-works-heading" className="head">
            The four-step print path from phone to paper.
          </h2>
        </div>

        <div className="stages-slider-container">
          <div className="stage-nav-bar" role="tablist" aria-label="Print Bot workflow stages" data-reveal>
            {STAGES.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={activeStageIndex === idx}
                className={`stage-nav-item ${activeStageIndex === idx ? 'is-selected' : ''}`}
                onClick={() => setActiveStageIndex(idx)}
              >
                {s.orderWord} {s.uiBadge}
              </button>
            ))}
          </div>

          <div className="stage-body-split">
            <div className="stage-detail-card" data-reveal>
              <h3 className="stage-clause">
                {currentStage.orderWord} {currentStage.clause}
              </h3>
              <p className="stage-description">
                {currentStage.description}
              </p>
            </div>

            {/* Dynamic Product UI Fragment */}
            <div className="ui-panel" data-ui data-reveal aria-label={`Interface simulation for ${currentStage.uiTitle}`}>
              <div className="ui-header">
                <div className="ui-title-group">
                  <span className="ui-status-dot" aria-hidden="true" />
                  <span className="ui-status-label">{currentStage.uiTitle}</span>
                </div>
                <span className="ui-badge">{currentStage.uiBadge}</span>
              </div>

              {activeStageIndex === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border-card)', padding: '1rem', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--step-small)', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600 }}>Project_Blueprint_Final.pdf</span>
                      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>2.4 MB · Ready</span>
                    </div>
                    <div style={{ fontSize: 'var(--step-small)', color: 'var(--muted)' }}>
                      SHA-256 Checksum Verified · 12 Pages Total
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border-card)', padding: '1rem', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--step-small)', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600 }}>Identity_Card_Front_Back.jpg</span>
                      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>1.1 MB · Ready</span>
                    </div>
                    <div style={{ fontSize: 'var(--step-small)', color: 'var(--muted)' }}>
                      Perspective Cropped · 300 DPI Rendering
                    </div>
                  </div>

                  <div style={{ fontSize: 'var(--step-small)', color: 'var(--muted)', padding: '4px' }}>
                    Session Token: Ephemeral Guest Scope (Shop ID #PB-TN-04)
                  </div>
                </div>
              )}

              {activeStageIndex === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border-card)', padding: '0.85rem', borderRadius: '6px', fontSize: 'var(--step-small)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--muted)' }}>Page Selection</span>
                      <span style={{ fontWeight: 600 }}>All Pages (1–12)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--muted)' }}>Duplex Orientation</span>
                      <span style={{ fontWeight: 600 }}>Long-Edge Double Sided</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted)' }}>Imposition N-Up</span>
                      <span style={{ fontWeight: 600 }}>2 Pages per Side (6 Sheets)</span>
                    </div>
                  </div>

                  <div style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', padding: '0.85rem', borderRadius: '6px', textAlign: 'center' }}>
                    <span style={{ fontSize: 'var(--step-small)', color: 'var(--accent)', fontWeight: 600 }}>
                      Mechanical Alignment Verified (No Margin Clipping)
                    </span>
                  </div>
                </div>
              )}

              {activeStageIndex === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border-card)', padding: '1rem', borderRadius: '6px', fontSize: 'var(--step-small)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBlock: '4px' }}>
                      <span>6 Physical A4 Sheets (Duplex B&amp;W)</span>
                      <span style={{ fontWeight: 600 }}>₹9.00</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBlock: '4px' }}>
                      <span>Finishing (Single Corner Staple)</span>
                      <span style={{ fontWeight: 600 }}>₹2.00</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBlock: '8px', fontWeight: 700, borderTop: '1px solid var(--border-card)', marginTop: '4px' }}>
                      <span>Locked Total Payable</span>
                      <span style={{ color: 'var(--accent)', fontSize: 'var(--step-body)' }}>₹11.00</span>
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border-card)', padding: '0.75rem', borderRadius: '6px', fontSize: 'var(--step-small)', color: 'var(--muted)' }}>
                    Payment Mode: Counter Cash / Direct UPI (Instant Verification)
                  </div>
                </div>
              )}

              {activeStageIndex === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border-card)', padding: '0.85rem', borderRadius: '6px', fontSize: 'var(--step-small)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--muted)' }}>Win32 Spooler Job ID</span>
                      <span style={{ fontWeight: 600 }}>#PB-SPOOL-9124</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--muted)' }}>Target Fleet Device</span>
                      <span style={{ fontWeight: 600 }}>Canon iR2525 (Tray 2 · A4)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted)' }}>Pickup Token</span>
                      <span style={{ color: 'var(--status-green)', fontWeight: 700 }}>CODE: 842</span>
                    </div>
                  </div>

                  <div style={{ background: 'var(--status-green-soft)', border: '1px solid var(--status-green-border)', padding: '0.75rem', borderRadius: '6px', fontSize: 'var(--step-small)', color: 'var(--status-green)', fontWeight: 500 }}>
                    Security Status: Source files purged from cloud storage. Local journal committed.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
