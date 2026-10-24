import React from 'react';
import { InstallerConfig } from '../utils/installer';

interface CtaSectionProps {
  installerConfig: InstallerConfig;
  onDownloadClick: () => void;
}

export const CtaSection: React.FC<CtaSectionProps> = ({ installerConfig, onDownloadClick }) => {
  return (
    <section className="section" aria-labelledby="cta-heading">
      <div className="wrap">
        <div className="cta-banner" data-reveal>
          <h2 id="cta-heading" className="cta-headline">
            Queue-free mobile printing for Windows.
          </h2>

          <p className="lead" style={{ maxWidth: '48ch' }}>
            Transform walk-in phone submissions into verified, automated Windows print jobs with zero customer app downloads and complete tenant privacy.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={onDownloadClick}
              style={{ minHeight: '3.5rem', paddingInline: '2rem' }}
              aria-label={
                installerConfig.status === 'available'
                  ? 'Download Print Bot for Windows'
                  : 'Check Windows desktop installer pilot availability'
              }
            >
              <svg
                width="20"
                height="20"
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
              <span style={{ fontSize: '1rem' }}>
                {installerConfig.status === 'available'
                  ? 'Download for Windows (x64)'
                  : 'Windows Installer (Pilot)'}
              </span>
            </button>

            <a href="#how-it-works" className="btn-secondary" style={{ minHeight: '3.5rem' }}>
              Inspect the workflow
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
