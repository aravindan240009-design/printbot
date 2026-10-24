import React from 'react';

interface FooterProps {
  onRequestAccessClick?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onRequestAccessClick }) => {
  return (
    <footer className="footer-baseline">
      <div className="wrap">
        <div className="footer-inner">
          <div>
            <div style={{ color: 'var(--ink)', fontWeight: 700, fontSize: 'var(--step-body)' }}>
              Print Bot · Desktop Printing &amp; Shop Manager
            </div>
            <div className="small muted" style={{ marginTop: '4px' }}>
              Designed for high-traffic photocopy counters and digital print businesses.
            </div>
          </div>

          <nav className="footer-nav" aria-label="Footer navigation">
            <a href="#hero">Top</a>
            <a href="#the-problem">The Problem</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#features">Capabilities</a>
            <a href="#pricing">Pricing</a>
            <a href="#requirements">Requirements</a>
            <a href="#download">Download</a>
            <a href="#faq">FAQ</a>
            {onRequestAccessClick && (
              <button
                type="button"
                onClick={onRequestAccessClick}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  font: 'inherit',
                  color: 'var(--accent)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Request Pilot Access
              </button>
            )}
          </nav>

          <div className="small muted">
            &copy; {new Date().getFullYear()} Print Bot. Master Technical Architecture v1.0. All trademarks belong to their respective owners.
          </div>
        </div>
      </div>
    </footer>
  );
};
