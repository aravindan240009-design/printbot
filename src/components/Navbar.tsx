import React, { useState } from 'react';
import { Printer } from 'lucide-react';
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

  React.useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

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
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '11px',
              background: 'linear-gradient(135deg, #1c2432 0%, #0d121b 100%)',
              border: '1.5px solid var(--border-gold)',
              color: '#fce881',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 4px 16px rgba(212, 175, 55, 0.25)',
              flexShrink: 0,
            }}
          >
            <Printer size={20} />
          </div>
          <span className="brand-name">Print<span>Bot</span></span>
        </a>

        <nav className="nav-links-desktop" aria-label="Main navigation">
          <a href="#workflow" className="nav-link">How It Works</a>
          <a href="#features" className="nav-link">Capabilities</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <a href="#requirements" className="nav-link">Hardware</a>
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
            <a href="#hero" className="mobile-nav-link" onClick={closeMenu}>Overview</a>
            <a href="#workflow" className="mobile-nav-link" onClick={closeMenu}>How It Works</a>
            <a href="#features" className="mobile-nav-link" onClick={closeMenu}>Capabilities</a>
            <a href="#pricing" className="mobile-nav-link" onClick={closeMenu}>Pricing</a>
            <a href="#requirements" className="mobile-nav-link" onClick={closeMenu}>Hardware</a>
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
