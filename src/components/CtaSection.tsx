import React from 'react';
import { InstallerConfig } from '../utils/installer';

interface CtaSectionProps {
  installerConfig: InstallerConfig;
  onDownloadClick: () => void;
  onRequestAccessClick: () => void;
}

export const CtaSection: React.FC<CtaSectionProps> = ({
  installerConfig,
  onDownloadClick,
  onRequestAccessClick,
}) => {
  return (
    <section className="section" aria-labelledby="cta-heading">
      <div className="wrap">
        <div className="cta-banner" data-reveal>
          <div className="cta-content-column">
            <h2 id="cta-heading" className="cta-headline">
              Modernize your photocopy counter today.
            </h2>

            <p className="lead" style={{ maxWidth: '52ch', marginTop: '1rem' }}>
              Transform walk-in phone submissions into verified, automated Windows print jobs with zero customer app downloads and complete tenant privacy.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={onRequestAccessClick}
                style={{ minHeight: '3.4rem', paddingInline: '2rem' }}
              >
                <span>Request Shop Pilot Access</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={onDownloadClick}
                style={{ minHeight: '3.4rem', paddingInline: '1.75rem' }}
                aria-label={
                  installerConfig.status === 'available'
                    ? 'Download Print Bot for Windows'
                    : 'Check Windows desktop installer pilot availability'
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
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <span className="hero-trust-item">
                <span className="hero-trust-dot" aria-hidden="true" />
                <span>Closed Commercial Pilot Active</span>
              </span>
              <span className="hero-trust-item">
                <span className="hero-trust-dot" aria-hidden="true" />
                <span>Standard Windows Printers</span>
              </span>
              <span className="hero-trust-item">
                <span className="hero-trust-dot" aria-hidden="true" />
                <span>No Credit Card Required</span>
              </span>
            </div>
          </div>

          <div className="cta-aside-column" data-ui>
            <div className="ui-header">
              <div className="ui-title-group">
                <span className="ui-status-dot" aria-hidden="true" />
                <span className="ui-status-label">Pilot Deployment Specs</span>
              </div>
              <span className="ui-badge">Commercial Phase 6</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ background: '#ffffff', padding: '0.85rem 1rem', borderRadius: '6px' }}>
                <div style={{ fontWeight: 600, color: 'var(--ink)' }}>Workstation Compatibility</div>
                <div style={{ color: 'var(--muted)', fontSize: 'var(--step-small)', marginTop: '2px' }}>
                  Windows 10 &amp; 11 (64-bit), Native spoolsv.exe service
                </div>
              </div>
              <div style={{ background: '#ffffff', padding: '0.85rem 1rem', borderRadius: '6px' }}>
                <div style={{ fontWeight: 600, color: 'var(--ink)' }}>Customer Experience</div>
                <div style={{ color: 'var(--muted)', fontSize: 'var(--step-small)', marginTop: '2px' }}>
                  Standard smartphone browser, zero customer app downloads
                </div>
              </div>
              <div style={{ background: '#ffffff', padding: '0.85rem 1rem', borderRadius: '6px' }}>
                <div style={{ fontWeight: 600, color: 'var(--ink)' }}>Security &amp; Privacy</div>
                <div style={{ color: 'var(--status-green)', fontSize: 'var(--step-small)', marginTop: '2px', fontWeight: 600 }}>
                  100% ephemeral in-memory file purge upon print completion
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
