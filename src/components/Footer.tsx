import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer-baseline">
      <div className="wrap">
        <div className="footer-inner">
          <div style={{ color: 'var(--ink)', fontWeight: 600 }}>
            Print Bot · Desktop Printing SaaS
          </div>

          <nav className="footer-nav" aria-label="Footer navigation">
            <a href="#hero">Top</a>
            <a href="#overview">Overview</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#features">Features</a>
            <a href="#requirements">Requirements</a>
            <a href="#download">Download</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div>
            &copy; {new Date().getFullYear()} Print Bot. Master Technical Architecture v1.0.
          </div>
        </div>
      </div>
    </footer>
  );
};
