import React, { useState } from 'react';
import { Smartphone, Monitor, BarChart3, ArrowRight, ExternalLink, CheckCircle2, Zap } from 'lucide-react';
import { InstallerConfig } from '../utils/installer';

interface HeroProps {
  installerConfig: InstallerConfig;
  onDownloadClick: () => void;
  onRequestAccessClick: () => void;
}

type ShowcaseTab = 'customer' | 'counter' | 'owner';

export const Hero: React.FC<HeroProps> = ({
  installerConfig,
  onDownloadClick,
  onRequestAccessClick,
}) => {
  const [activeTab, setActiveTab] = useState<ShowcaseTab>('customer');

  return (
    <section id="hero" className="section hero-section" style={{ paddingTop: 'clamp(3rem, 5vw, 5rem)', paddingBottom: 'clamp(4rem, 6vw, 6rem)' }}>
      <div className="wrap">
        {/* Main Grid: Headline + Interactive Product Showcase */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'clamp(2rem, 4vw, 4rem)', alignItems: 'center' }}>
          
          {/* Left Column: Clear Value Proposition */}
          <div style={{ maxWidth: '580px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '999px',
                background: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                color: '#fce881',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                marginBottom: '20px',
              }}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              <span>COMMERCIAL PRINT COUNTER OS · INDIA</span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.4rem, 4.2vw, 3.8rem)',
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-0.035em',
                color: '#ffffff',
                marginBottom: '20px',
              }}
            >
              Your Xerox counter, <br />
              <span style={{ background: 'linear-gradient(135deg, #fce881 0%, #d4af37 60%, #aa8010 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                on complete autopilot.
              </span>
            </h1>

            <p
              style={{
                fontSize: 'clamp(1rem, 1.2vw, 1.15rem)',
                lineHeight: 1.65,
                color: '#94a3b8',
                marginBottom: '32px',
              }}
            >
              Walk-in customers scan your counter QR to upload, preview, and pay from their phone. Your shop Windows PC receives verified print jobs directly into the native print spooler — with <strong style={{ color: '#e2e8f0' }}>zero WhatsApp file clutter</strong> and <strong style={{ color: '#e2e8f0' }}>zero infected USB pen drives</strong>.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '32px' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={onRequestAccessClick}
                style={{ padding: '14px 28px', fontSize: '15px' }}
              >
                <span>Request Counter Pilot</span>
                <ArrowRight size={17} />
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={onDownloadClick}
                style={{ padding: '14px 24px', fontSize: '15px' }}
              >
                <Monitor size={17} />
                <span>
                  {installerConfig.status === 'available'
                    ? 'Download Windows App (.exe)'
                    : 'Windows Installer (Pilot)'}
                </span>
              </button>
            </div>

            {/* Grounded Counter Proof Points */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '13px', color: '#cbd5e1' }}>
                <CheckCircle2 size={16} color="#10b981" />
                <span>Unlimited connected printers</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '13px', color: '#cbd5e1' }}>
                <CheckCircle2 size={16} color="#10b981" />
                <span>Zero WhatsApp number sharing</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '13px', color: '#cbd5e1' }}>
                <CheckCircle2 size={16} color="#10b981" />
                <span>Canon, HP, Epson, Ricoh</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '13px', color: '#cbd5e1' }}>
                <CheckCircle2 size={16} color="#10b981" />
                <span>Instant ephemeral file purge</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive 3-Perspective Live Showcase */}
          <div
            style={{
              background: 'rgba(15, 19, 27, 0.85)',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '20px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Perspective Switcher Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', background: 'rgba(0, 0, 0, 0.35)', padding: '5px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <button
                type="button"
                onClick={() => setActiveTab('customer')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'customer' ? 'rgba(212, 175, 55, 0.18)' : 'transparent',
                  color: activeTab === 'customer' ? '#fce881' : '#94a3b8',
                  borderBottom: activeTab === 'customer' ? '2px solid #d4af37' : '2px solid transparent',
                  fontSize: '13px',
                  fontWeight: 650,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <Smartphone size={15} />
                <span>Customer Mobile</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('counter')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'counter' ? 'rgba(212, 175, 55, 0.18)' : 'transparent',
                  color: activeTab === 'counter' ? '#fce881' : '#94a3b8',
                  borderBottom: activeTab === 'counter' ? '2px solid #d4af37' : '2px solid transparent',
                  fontSize: '13px',
                  fontWeight: 650,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <Monitor size={15} />
                <span>Counter Station</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('owner')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'owner' ? 'rgba(212, 175, 55, 0.18)' : 'transparent',
                  color: activeTab === 'owner' ? '#fce881' : '#94a3b8',
                  borderBottom: activeTab === 'owner' ? '2px solid #d4af37' : '2px solid transparent',
                  fontSize: '13px',
                  fontWeight: 650,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <BarChart3 size={15} />
                <span>Owner Portal</span>
              </button>
            </div>

            {/* TAB 1: Customer Mobile View */}
            {activeTab === 'customer' && (
              <div style={{ animation: 'fadeIn 0.25s ease' }}>
                <div style={{ background: '#090b10', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                  {/* Phone Header */}
                  <div style={{ background: '#121620', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>Sri Ganesh Xerox &amp; Prints</div>
                      <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                        Counter Stand #1 · Instant Upload
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '6px', color: '#94a3b8' }}>
                      No App Needed
                    </span>
                  </div>

                  {/* Document Card */}
                  <div style={{ padding: '16px' }}>
                    <div style={{ background: '#151a24', borderRadius: '12px', padding: '12px', border: '1px solid rgba(255, 255, 255, 0.06)', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>College_Project_Final.pdf</span>
                        <span style={{ fontSize: '11px', color: '#fce881', background: 'rgba(212,175,55,0.15)', padding: '2px 6px', borderRadius: '4px' }}>16 Pages</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '12px' }}>
                        <div style={{ background: '#0d1117', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ color: '#64748b', fontSize: '10px' }}>COLOR</div>
                          <div style={{ color: '#e2e8f0', fontWeight: 600, marginTop: '2px' }}>B&amp;W (₹1.50)</div>
                        </div>
                        <div style={{ background: '#0d1117', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ color: '#64748b', fontSize: '10px' }}>DUPLEX</div>
                          <div style={{ color: '#e2e8f0', fontWeight: 600, marginTop: '2px' }}>2-Sided (8 Shts)</div>
                        </div>
                        <div style={{ background: '#0d1117', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ color: '#64748b', fontSize: '10px' }}>COPIES</div>
                          <div style={{ color: '#e2e8f0', fontWeight: 600, marginTop: '2px' }}>1 Copy</div>
                        </div>
                      </div>
                    </div>

                    {/* Price & Pay Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '12px 14px', borderRadius: '12px', marginBottom: '14px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Total Verified Price</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981' }}>₹12.00</div>
                      </div>
                      <button
                        type="button"
                        style={{
                          background: '#10b981',
                          color: '#041f13',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontWeight: 750,
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>Pay via UPI</span>
                        <Zap size={14} />
                      </button>
                    </div>

                    {/* Direct Test Link */}
                    <div style={{ textAlign: 'center' }}>
                      <a
                        href="http://localhost:5174/"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          color: '#fce881',
                          textDecoration: 'none',
                          fontWeight: 600,
                        }}
                      >
                        <span>Open Live Customer Web (Port 5174)</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Counter Station View (Windows App) */}
            {activeTab === 'counter' && (
              <div style={{ animation: 'fadeIn 0.25s ease' }}>
                <div style={{ background: '#090b10', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                  {/* Windows 11 Title Bar */}
                  <div style={{ background: '#121620', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Monitor size={15} color="#d4af37" />
                      <span style={{ fontSize: '12px', fontWeight: 650, color: '#f1f5f9' }}>Print Bot Counter OS — Station #01 (Windows Win32)</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#334155', display: 'inline-block' }} />
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#334155', display: 'inline-block' }} />
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                    </div>
                  </div>

                  {/* Connected Hardware & Spool Queue */}
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                      <div style={{ flex: 1, background: '#151a24', padding: '10px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>ACTIVE PRINTER</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>Canon iR 2525</div>
                        <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px' }}>● Ready (Tray 1: A4)</div>
                      </div>
                      <div style={{ flex: 1, background: '#151a24', padding: '10px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>COLOR PRINTER</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>Epson L805</div>
                        <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px' }}>● Ready (Photo Tray)</div>
                      </div>
                    </div>

                    {/* Live Job Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                      <div style={{ background: '#11151e', padding: '10px 12px', borderRadius: '8px', borderLeft: '3px solid #10b981', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 650, color: '#f1f5f9' }}>Job #1084 · College_Project.pdf</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>8 Sheets Duplex · Canon iR 2525</div>
                        </div>
                        <span style={{ fontSize: '11px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                          SPOOLING (75%)
                        </span>
                      </div>

                      <div style={{ background: '#11151e', padding: '10px 12px', borderRadius: '8px', borderLeft: '3px solid #d4af37', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 650, color: '#f1f5f9' }}>Job #1085 · Aadhaar_Front_Back.pdf</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>1 Sheet Color · Epson L805</div>
                        </div>
                        <span style={{ fontSize: '11px', color: '#fce881', background: 'rgba(212, 175, 55, 0.15)', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                          VERIFIED PAID
                        </span>
                      </div>
                    </div>

                    {/* Direct Test Link */}
                    <div style={{ textAlign: 'center' }}>
                      <a
                        href="http://localhost:5175/"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          color: '#fce881',
                          textDecoration: 'none',
                          fontWeight: 600,
                        }}
                      >
                        <span>Open Counter Workstation App (Port 5175)</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Shop Owner Portal */}
            {activeTab === 'owner' && (
              <div style={{ animation: 'fadeIn 0.25s ease' }}>
                <div style={{ background: '#090b10', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                  {/* Owner Header */}
                  <div style={{ background: '#121620', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>Owner Remote Dashboard</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Accessible from your smartphone or laptop</div>
                    </div>
                    <span style={{ fontSize: '11px', color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                      Live Today
                    </span>
                  </div>

                  {/* Metrics Grid */}
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '14px' }}>
                      <div style={{ background: '#151a24', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>TODAY'S REVENUE</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#fce881', marginTop: '2px' }}>₹4,850</div>
                        <div style={{ fontSize: '10px', color: '#10b981', marginTop: '2px' }}>↑ 18% vs yesterday</div>
                      </div>
                      <div style={{ background: '#151a24', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>TOTAL SHEETS</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>1,240</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>1,020 B&amp;W · 220 Color</div>
                      </div>
                    </div>

                    <div style={{ background: '#11151e', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <span style={{ fontSize: '12px', color: '#cbd5e1' }}>UPI Settlement (Direct to Bank)</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981' }}>₹3,920 (81%)</span>
                    </div>

                    {/* Direct Test Link */}
                    <div style={{ textAlign: 'center' }}>
                      <a
                        href="http://localhost:5176/"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          color: '#fce881',
                          textDecoration: 'none',
                          fontWeight: 600,
                        }}
                      >
                        <span>Open Shop Owner Portal (Port 5176)</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};
