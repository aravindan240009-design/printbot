import React, { useState } from 'react';
import { InstallerConfig } from '../utils/installer';

interface NavbarProps {
  installerConfig: InstallerConfig;
  onDownloadClick: () => void;
  onRequestAccessClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  installerConfig,
  onDownloadClick,
  onRequestAccessClick,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="nav-bar">
      <div className="nav-container">
        <a href="#hero" className="brand-link" onClick={closeMenu}>
          <svg
            width="32"
            height="32"
            viewBox="0 0 64 64"
            fill="none"
            aria-hidden="true"
          >
            <rect width="64" height="64" rx="12" fill="#1e3a8a" />
            <rect x="16" y="14" width="32" height="36" rx="4" fill="#ffffff" stroke="#bfdbfe" strokeWidth="2" />
            <rect x="22" y="22" width="20" height="3" rx="1.5" fill="#1e3a8a" />
            <rect x="22" y="29" width="20" height="3" rx="1.5" fill="#64748b" />
            <rect x="22" y="36" width="14" height="3" rx="1.5" fill="#059669" />
            <circle cx="48" cy="48" r="5" fill="#059669" />
          </svg>
          <span className="brand-name">Print<span>Bot</span></span>
        </a>

        <nav className="nav-links-desktop" aria-label="Main navigation">
          <a href="#the-problem" className="nav-link">The Problem</a>
          <a href="#how-it-works" className="nav-link">How It Works</a>
          <a href="#features" className="nav-link">Capabilities</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <a href="#requirements" className="nav-link">Requirements</a>
          <a href="#faq" className="nav-link">FAQ</a>
        </nav>

        <div className="nav-action-desktop">
          <button
            type="button"
            className="btn-secondary"
            onClick={onRequestAccessClick}
            style={{ paddingInline: '1rem', minHeight: '2.4rem', fontSize: 'var(--step-small)' }}
          >
            Request Access
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={onDownloadClick}
            style={{ paddingInline: '1rem', minHeight: '2.4rem', fontSize: 'var(--step-small)' }}
            aria-label={
              installerConfig.status === 'available'
                ? 'Download Print Bot for Windows'
                : 'View Print Bot Windows installer release status'
            }
          >
            <svg
              width="15"
              height="15"
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
                ? 'Download'
                : 'Windows (Pilot)'}
            </span>
          </button>
        </div>

        <button
          type="button"
          className={`hamburger-btn ${isMobileMenuOpen ? 'is-active' : ''}`}
          onClick={toggleMenu}
          aria-expanded={isMobileMenuOpen}
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          <span className="hamburger-bar" />
          <span className="hamburger-bar" />
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="wrap">
          <nav className="mobile-nav-panel" aria-label="Mobile navigation">
            <a href="#overview" className="mobile-nav-link" onClick={closeMenu}>Overview</a>
            <a href="#the-problem" className="mobile-nav-link" onClick={closeMenu}>The Problem</a>
            <a href="#how-it-works" className="mobile-nav-link" onClick={closeMenu}>How It Works</a>
            <a href="#features" className="mobile-nav-link" onClick={closeMenu}>Capabilities</a>
            <a href="#pricing" className="mobile-nav-link" onClick={closeMenu}>Pricing</a>
            <a href="#requirements" className="mobile-nav-link" onClick={closeMenu}>Requirements</a>
            <a href="#download" className="mobile-nav-link" onClick={closeMenu}>Download</a>
            <a href="#faq" className="mobile-nav-link" onClick={closeMenu}>FAQ</a>
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  closeMenu();
                  onRequestAccessClick();
                }}
              >
                Request Shop Pilot Access
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  closeMenu();
                  onDownloadClick();
                }}
              >
                {installerConfig.status === 'available'
                  ? 'Download for Windows'
                  : 'Windows Installer (Pilot)'}
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
