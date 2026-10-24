import React, { useState } from 'react';
import { InstallerConfig } from '../utils/installer';

interface HeroProps {
  installerConfig: InstallerConfig;
  onDownloadClick: () => void;
}

type ServiceType = 'document' | 'photo' | 'id_card';
type ColorMode = 'grayscale' | 'color';
type DuplexMode = 'long_edge' | 'single';
type NUpMode = 1 | 2 | 4;

export const Hero: React.FC<HeroProps> = ({ installerConfig, onDownloadClick }) => {
  const [service, setService] = useState<ServiceType>('document');
  const [colorMode, setColorMode] = useState<ColorMode>('grayscale');
  const [duplexMode, setDuplexMode] = useState<DuplexMode>('long_edge');
  const [nUp, setNUp] = useState<NUpMode>(2);
  const [copies, setCopies] = useState<number>(1);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simState, setSimState] = useState<string>('CONNECTED');

  const sourcePages = service === 'document' ? 6 : service === 'photo' ? 2 : 1;
  const imposedSidesPerCopy = Math.ceil(sourcePages / nUp);
  const sheetsPerCopy = duplexMode === 'long_edge' ? Math.ceil(imposedSidesPerCopy / 2) : imposedSidesPerCopy;
  const totalSheets = sheetsPerCopy * copies;

  const costPerSide = colorMode === 'color' ? 7 : 1.5;
  const totalPrice = Math.max(2, (totalSheets * costPerSide * (duplexMode === 'long_edge' ? 1.8 : 1.0))).toFixed(2);

  const runSpoolSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimState('VALIDATING_PRINT_PLAN');

    setTimeout(() => {
      setSimState('QUOTE_LOCKED_INR');
    }, 450);

    setTimeout(() => {
      setSimState('LEASED_TO_WINDOWS_AGENT');
    }, 950);

    setTimeout(() => {
      setSimState('WIN32_SPOOL_SUBMITTED_ID_8042');
    }, 1500);

    setTimeout(() => {
      setSimState('PRINT_CONFIRMED_EPHEMERAL_PURGED');
      setIsSimulating(false);
    }, 2200);
  };

  return (
    <section id="hero" className="section" style={{ paddingTop: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
      <div className="wrap">
        <div className="hero-grid">
          <div className="hero-content">
            <h1 className="display headline-masked">
              <span className="headline-line">
                <span className="headline-text">Mobile print jobs</span>
              </span>
              <span className="headline-line">
                <span className="headline-text">to shop Windows printers.</span>
              </span>
            </h1>

            <p className="lead" data-reveal>
              Customers scan your counter QR code to upload documents and configure print options without installing an app. Your shop Windows PC receives verified jobs directly into the local print spooler.
            </p>

            <div className="hero-actions" data-reveal>
              <button
                type="button"
                className="btn-primary"
                onClick={onDownloadClick}
                aria-label={
                  installerConfig.status === 'available'
                    ? 'Download Print Bot for Windows'
                    : 'Check Windows Desktop installer pilot availability'
                }
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>
                  {installerConfig.status === 'available'
                    ? 'Download for Windows'
                    : 'Windows Installer (Pilot)'}
                </span>
              </button>

              <a href="#how-it-works" className="btn-secondary">
                Inspect the workflow
              </a>
            </div>

            <div className="hero-trust-row" data-reveal>
              <span className="hero-trust-item">
                <span className="hero-trust-dot" aria-hidden="true" />
                <span>Closed Pilot Active</span>
              </span>
              <span className="hero-trust-item">
                <span className="hero-trust-dot" aria-hidden="true" />
                <span>Zero App Install</span>
              </span>
              <span className="hero-trust-item">
                <span className="hero-trust-dot" aria-hidden="true" />
                <span>100% Ephemeral File Purge</span>
              </span>
            </div>

            <p className="small muted" data-reveal style={{ marginTop: '0.25rem' }}>
              Built for Windows 10 and Windows 11 (64-bit). Works with your existing USB and network printers.
            </p>
          </div>

          {/* Interactive Working Product Fragment with Floating Status Chips */}
          <div className="ui-visual-wrapper" data-reveal>
            <div className="hero-float-card card-top" data-ui aria-hidden="true">
              <div className="float-icon-box green">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <div className="float-text-title">Order #1042 Approved</div>
                <div className="float-text-sub">Printing automatically…</div>
              </div>
            </div>

            <div className="hero-float-card card-bottom" data-ui aria-hidden="true">
              <div className="float-icon-box blue">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div>
                <div className="float-text-title">Ephemeral Purge</div>
                <div className="float-text-sub">100% private, zero customer data retained</div>
              </div>
            </div>

            <div className="ui-panel" data-ui aria-label="Interactive Print Bot print configurator and spooler simulator">
              <div className="ui-header">
                <div className="ui-title-group">
                  <span className="ui-status-dot" aria-hidden="true" />
                  <span className="ui-status-label">Shop Spooler Ready</span>
                </div>
                <span className="ui-badge">Canon imageRUNNER 2525</span>
              </div>

              <div className="ui-segmented" role="tablist" aria-label="Printing service selection">
                <button
                  type="button"
                  role="tab"
                  aria-selected={service === 'document'}
                  className={`ui-segment-btn ${service === 'document' ? 'is-active' : ''}`}
                  onClick={() => setService('document')}
                >
                  Document (PDF)
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={service === 'photo'}
                  className={`ui-segment-btn ${service === 'photo' ? 'is-active' : ''}`}
                  onClick={() => setService('photo')}
                >
                  Photo Grid
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={service === 'id_card'}
                  className={`ui-segment-btn ${service === 'id_card' ? 'is-active' : ''}`}
                  onClick={() => setService('id_card')}
                >
                  ID / Passport
                </button>
              </div>

              <div className="ui-controls-grid">
                <div className="ui-field-group">
                  <label htmlFor="hero-color-mode" className="ui-field-label">Color Mode</label>
                  <select
                    id="hero-color-mode"
                    className="ui-select"
                    value={colorMode}
                    onChange={(e) => setColorMode(e.target.value as ColorMode)}
                  >
                    <option value="grayscale">Black &amp; White (Grayscale)</option>
                    <option value="color">Full Color</option>
                  </select>
                </div>

                <div className="ui-field-group">
                  <label htmlFor="hero-duplex-mode" className="ui-field-label">Duplex Sides</label>
                  <select
                    id="hero-duplex-mode"
                    className="ui-select"
                    value={duplexMode}
                    onChange={(e) => setDuplexMode(e.target.value as DuplexMode)}
                  >
                    <option value="long_edge">2-Sided (Long-Edge Duplex)</option>
                    <option value="single">1-Sided (Single Sided)</option>
                  </select>
                </div>

                <div className="ui-field-group">
                  <label htmlFor="hero-nup-mode" className="ui-field-label">Pages per Sheet</label>
                  <select
                    id="hero-nup-mode"
                    className="ui-select"
                    value={nUp}
                    onChange={(e) => setNUp(Number(e.target.value) as NUpMode)}
                  >
                    <option value="1">1-Up (Standard)</option>
                    <option value="2">2-Up (2 Pages per Side)</option>
                    <option value="4">4-Up (4 Pages per Side)</option>
                  </select>
                </div>

                <div className="ui-field-group">
                  <label htmlFor="hero-copies-stepper" className="ui-field-label">Copies</label>
                  <input
                    id="hero-copies-stepper"
                    type="number"
                    min="1"
                    max="50"
                    className="ui-input"
                    value={copies}
                    onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
              </div>

              {/* Live Sheet Imposition Preview Canvas */}
              <div className="ui-sheet-stage">
                <div className="ui-sheet-header">
                  <span>Imposition Preview: A4 Output</span>
                  <span>{duplexMode === 'long_edge' ? 'Double Sided' : 'Single Sided'}</span>
                </div>

                <div className="ui-sheet-preview-wrap">
                  <div className={`ui-paper-sheet nup-${nUp}`} aria-hidden="true">
                    {Array.from({ length: nUp }).map((_, idx) => (
                      <div key={idx} className="ui-paper-page-box">
                        <span style={{ fontSize: '7px' }}>p.{idx + 1}</span>
                        <div className="ui-paper-line" />
                        <div className={`ui-paper-line ${colorMode === 'color' ? 'accent' : ''}`} />
                        <div className="ui-paper-line" />
                      </div>
                    ))}
                  </div>

                  {duplexMode === 'long_edge' && (
                    <div className={`ui-paper-sheet nup-${nUp}`} style={{ opacity: 0.75 }} aria-hidden="true">
                      {Array.from({ length: nUp }).map((_, idx) => (
                        <div key={idx} className="ui-paper-page-box">
                          <span style={{ fontSize: '7px' }}>p.{idx + 1 + nUp}</span>
                          <div className="ui-paper-line" />
                          <div className={`ui-paper-line ${colorMode === 'color' ? 'accent' : ''}`} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="ui-sheet-specs">
                  <div className="ui-spec-item">
                    <div className="ui-spec-val">{sourcePages}</div>
                    <div className="ui-spec-lbl">Source Pages</div>
                  </div>
                  <div className="ui-spec-item">
                    <div className="ui-spec-val">{imposedSidesPerCopy}</div>
                    <div className="ui-spec-lbl">Imposed Sides</div>
                  </div>
                  <div className="ui-spec-item">
                    <div className="ui-spec-val">{totalSheets}</div>
                    <div className="ui-spec-lbl">Physical Sheets</div>
                  </div>
                </div>
              </div>

              {/* Real-time Locked Quote & Spooler Simulator */}
              <div className="ui-quote-bar">
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Locked Server Quote</div>
                  <div className="ui-quote-amount">₹{totalPrice}</div>
                </div>
                <button
                  type="button"
                  className="ui-spool-btn"
                  onClick={runSpoolSimulation}
                  disabled={isSimulating}
                >
                  {isSimulating ? 'Spooling...' : 'Test print simulation'}
                </button>
              </div>

              <div className="ui-spool-journal" aria-live="polite">
                <div className="ui-journal-entry">
                  <span>Windows Spooler Agent:</span>
                  <span className="ui-journal-state">{simState}</span>
                </div>
                <div className="ui-journal-entry" style={{ marginTop: '2px' }}>
                  <span>Memory Cache Policy:</span>
                  <span>Immediate Ephemeral Purge on Exit</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
