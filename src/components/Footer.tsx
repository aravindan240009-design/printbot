import React from 'react';
import { PrintBotLogo } from '../../packages/ui/src/components/PrintBotLogo';
import {
  ArrowUp,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Cpu,
  Globe,
  ArrowUpRight,
} from 'lucide-react';

interface FooterProps {
  onRequestAccessClick?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onRequestAccessClick }) => {
  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="luxury-footer" role="contentinfo" aria-label="Site Footer">
      {/* Subtle Top Accent Divider */}
      <div className="footer-accent-line" aria-hidden="true" />

      <div className="shell footer-shell">
        {/* Main 4-Column Grid */}
        <div className="footer-main-grid">
          {/* Column 1: Brand & Operating System Mission */}
          <div className="footer-brand-column">
            <a href="#" className="footer-brand-link" onClick={scrollToTop} aria-label="Print Bot Home">
              <PrintBotLogo size={38} />
              <span className="footer-brand-name">
                printbot<span className="footer-brand-dot">®</span>
              </span>
            </a>

            <p className="footer-tagline">
              The counter operating system for Indian print shops. Built for high-volume Xerox counters, digital print studios, and college engineering hubs.
            </p>

            {/* Live Operational Health Badge */}
            <div className="footer-status-badge">
              <span className="footer-status-indicator" />
              <span className="footer-status-text">winspool.drv v2.4 Native · 0% Page Cut</span>
            </div>

            {/* Indian Regional Languages Available */}
            <div className="footer-language-strip">
              <Globe size={13} className="footer-lang-icon" />
              <span className="footer-lang-item">English</span>
              <span className="footer-lang-sep">·</span>
              <span className="footer-lang-item">தமிழ் (Tamil)</span>
              <span className="footer-lang-sep">·</span>
              <span className="footer-lang-item">हिन्दी (Hindi)</span>
            </div>
          </div>

          {/* Column 2: Platform Experience */}
          <div className="footer-nav-column">
            <h3 className="footer-column-title">Platform</h3>
            <ul className="footer-links-list">
              <li>
                <a href="#experience">
                  Interactive Studio
                </a>
              </li>
              <li>
                <a href="#workflow">
                  Customer QR Journey
                </a>
              </li>
              <li>
                <a href="#control">
                  Autopilot vs. Manual
                </a>
              </li>
              <li>
                <a href="#roi">
                  Shop ROI Calculator
                </a>
              </li>
              <li>
                <a href="#pricing">
                  Single All-Inclusive Plan
                </a>
              </li>
              <li>
                <a href="#faq">
                  Driver & Hardware FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Live Ecosystem & Suite Portals */}
          <div className="footer-nav-column">
            <h3 className="footer-column-title">Live Suite</h3>
            <ul className="footer-links-list">
              <li>
                <a href="http://localhost:3000/" target="_blank" rel="noopener noreferrer">
                  <span>Customer Mobile PWA</span>
                  <ExternalLink size={12} className="footer-ext-icon" />
                </a>
              </li>
              <li>
                <a href="http://localhost:3001/" target="_blank" rel="noopener noreferrer">
                  <span>Shop Studio Portal</span>
                  <ExternalLink size={12} className="footer-ext-icon" />
                </a>
              </li>
              <li>
                <a href="http://localhost:3002/" target="_blank" rel="noopener noreferrer">
                  <span>SuperAdmin Command Deck</span>
                  <ExternalLink size={12} className="footer-ext-icon" />
                </a>
              </li>
              <li>
                <a href="http://localhost:5174/" target="_blank" rel="noopener noreferrer">
                  <span>Counter Workstation UI</span>
                  <ExternalLink size={12} className="footer-ext-icon" />
                </a>
              </li>
              <li>
                <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noopener noreferrer">
                  <span>FastAPI Cloud API Docs</span>
                  <ExternalLink size={12} className="footer-ext-icon" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Architectural Guarantees & CTA */}
          <div className="footer-cta-column">
            <h3 className="footer-column-title">Architecture</h3>
            <ul className="footer-guarantees-list">
              <li>
                <CheckCircle2 size={14} className="guarantee-icon" />
                <span>Unlimited printers per shop</span>
              </li>
              <li>
                <ShieldCheck size={14} className="guarantee-icon" />
                <span>PostgreSQL RLS tenant isolation</span>
              </li>
              <li>
                <Printer size={14} className="guarantee-icon" />
                <span>Zero commission on printed pages</span>
              </li>
              <li>
                <Cpu size={14} className="guarantee-icon" />
                <span>Offline-resilient Windows spooler</span>
              </li>
            </ul>

            {onRequestAccessClick && (
              <button
                type="button"
                onClick={onRequestAccessClick}
                className="footer-cta-btn"
                aria-label="Get started with Print Bot"
              >
                <span>Subscribe to Print Bot</span>
                <ArrowUpRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Bar: Copyright & Compliance */}
        <div className="footer-bottom-bar">
          <div className="footer-bottom-left">
            <span className="footer-copyright">
              &copy; {new Date().getFullYear()} Print Bot Platform. Designed for Indian Print Shops.
            </span>
            <span className="footer-bottom-divider">|</span>
            <span className="footer-meta-spec">
              DPDP Act 2023 Compliant · TPM-Backed Pairing · Zero-Commission Ledger
            </span>
          </div>

          <div className="footer-bottom-right">
            <a
              href="#main-content"
              onClick={scrollToTop}
              className="footer-back-to-top-btn"
              aria-label="Back to top"
            >
              <span>Back to top</span>
              <ArrowUp size={13} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
