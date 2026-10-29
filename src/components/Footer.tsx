import React from 'react';

interface FooterProps {
  onRequestAccessClick?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onRequestAccessClick }) => {
  return (
    <footer className="footer-baseline">
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand-col">
            <div className="footer-brand-title">
              Print<span>Bot</span>
            </div>
            <p className="footer-brand-desc">
              The modern desktop printing and shop management operating system for high-traffic photocopy and digital print counters.
            </p>
            <div className="footer-status-pill">
              <span className="ui-status-dot" aria-hidden="true" />
              <span>Closed Commercial Pilot · India</span>
            </div>
          </div>

          <div className="footer-links-col">
            <div className="footer-col-heading">Product</div>
            <ul className="footer-col-list">
              <li><a href="#hero">Overview</a></li>
              <li><a href="#workflow">How It Works</a></li>
              <li><a href="#features">Capabilities</a></li>
              <li><a href="#pricing">Pricing Plans</a></li>
              <li><a href="#requirements">Hardware Specs</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>

          <div className="footer-links-col">
            <div className="footer-col-heading">Live Applications</div>
            <ul className="footer-col-list">
              <li><a href="http://localhost:5174/" target="_blank" rel="noreferrer">Customer Mobile Upload (:5174) ↗</a></li>
              <li><a href="http://localhost:5175/" target="_blank" rel="noreferrer">Counter Workstation (:5175) ↗</a></li>
              <li><a href="http://localhost:5176/" target="_blank" rel="noreferrer">Shop Owner Portal (:5176) ↗</a></li>
              {onRequestAccessClick && (
                <li style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={onRequestAccessClick}
                    className="footer-action-link"
                  >
                    Request Pilot Access
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <div className="footer-copyright">
            &copy; {new Date().getFullYear()} Print Bot. Master Technical Architecture v1.0. All trademarks belong to their respective owners.
          </div>
          <a href="#hero" className="footer-top-link">Back to top &uarr;</a>
        </div>
      </div>
    </footer>
  );
};
