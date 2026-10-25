import React from 'react';
import { InstallerConfig } from '../utils/installer';

interface DownloadSectionProps {
  installerConfig: InstallerConfig;
  onDownloadClick: () => void;
}

export const DownloadSection: React.FC<DownloadSectionProps> = ({ installerConfig, onDownloadClick }) => {
  return (
    <section id="download" className="section" aria-labelledby="download-heading">
      <div className="wrap">
        <div className="download-card" data-reveal>
          <div className="download-head">
            <h2 id="download-heading" className="head">
              Download Print Bot for Windows
            </h2>
            <p className="lead">
              The single Windows desktop package includes the Tauri operator control panel and the independent background Rust Windows Service for automatic print spooling.
            </p>
          </div>

          <div>
            <div className="download-status-banner">
              <span className="status-indicator-dot" aria-hidden="true" />
              <span>
                {installerConfig.status === 'available'
                  ? 'Official Release Available: Windows 10 & 11 (x64)'
                  : 'Installer Status: Closed Commercial Pilot in Progress'}
              </span>
            </div>
          </div>

          <div className="download-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={onDownloadClick}
              style={{ minHeight: '3.5rem', paddingInline: '2rem' }}
              aria-label={
                installerConfig.status === 'available'
                  ? 'Download official Print Bot Windows Installer'
                  : 'View Print Bot Windows desktop pilot release information'
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
                  : 'Windows Installer (Pilot Release)'}
              </span>
            </button>

            <a href="#requirements" className="btn-secondary" style={{ minHeight: '3.5rem' }}>
              Review system requirements
            </a>
          </div>

          <p className="small muted">
            Official distribution notice: Obtain Print Bot installers exclusively through official HTTPS release channels. Never download or execute binaries from unverified third-party mirrors.
          </p>

          <div className="download-instructions-grid">
            <div className="instruction-step" data-reveal>
              <span className="instruction-step-name">1. Download setup</span>
              <span className="instruction-step-desc">
                Obtain the official installer for 64-bit Windows systems.
              </span>
            </div>

            <div className="instruction-step" data-reveal>
              <span className="instruction-step-name">2. Run installer</span>
              <span className="instruction-step-desc">
                The setup registers the background Rust print service automatically.
              </span>
            </div>

            <div className="instruction-step" data-reveal>
              <span className="instruction-step-name">3. Pair computer</span>
              <span className="instruction-step-desc">
                Scan the pairing challenge from your shop owner dashboard to bind TPM keys.
              </span>
            </div>

            <div className="instruction-step" data-reveal>
              <span className="instruction-step-name">4. Discover printers</span>
              <span className="instruction-step-desc">
                The wizard discovers connected USB and network printers immediately.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
