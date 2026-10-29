import React from 'react';
import { Printer, Shield, Cpu, RefreshCw, CheckCircle2 } from 'lucide-react';

export const Features: React.FC = () => {
  return (
    <section id="features" className="section" style={{ paddingBlock: 'clamp(4rem, 6vw, 6rem)', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
      <div className="wrap">
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto clamp(2.5rem, 4vw, 3.5rem)' }}>
          <span className="eyebrow">BUILT FOR COMMERCIAL WORKSTATIONS</span>
          <h2 className="head" style={{ fontSize: 'clamp(2.1rem, 3.5vw, 3rem)', margin: '12px 0 16px' }}>
            Engineered for high-volume Indian print shops.
          </h2>
          <p className="lead" style={{ fontSize: '17px', color: '#94a3b8' }}>
            No toy browser extensions or generic cloud drivers. Print Bot runs as a high-performance native Windows workstation service built in Rust.
          </p>
        </div>

        {/* 4 Capabilities Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}
        >
          {/* Capability 1 */}
          <div
            style={{
              background: 'rgba(15, 19, 27, 0.75)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '28px',
              transition: 'all 0.25s ease',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(212, 175, 55, 0.12)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                color: '#fce881',
                display: 'grid',
                placeItems: 'center',
                marginBottom: '20px',
              }}
            >
              <Printer size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>
              Unlimited Connected Printers
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6 }}>
              Connect as many Canon, HP, Epson, Ricoh, or Brother printers as your shop owns. We never charge per-printer fees or per-page commissions.
            </p>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#10b981' }}>
              <CheckCircle2 size={14} />
              <span>Zero device caps</span>
            </div>
          </div>

          {/* Capability 2 */}
          <div
            style={{
              background: 'rgba(15, 19, 27, 0.75)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '28px',
              transition: 'all 0.25s ease',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(212, 175, 55, 0.12)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                color: '#fce881',
                display: 'grid',
                placeItems: 'center',
                marginBottom: '20px',
              }}
            >
              <RefreshCw size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>
              Full Auto &amp; Manual Modes
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6 }}>
              Switch instantly between hands-free Full Automatic spooling for peak morning college rushes, and 1-Click Manual Release for custom stationery or thick cardstock.
            </p>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#10b981' }}>
              <CheckCircle2 size={14} />
              <span>Operator controlled</span>
            </div>
          </div>

          {/* Capability 3 */}
          <div
            style={{
              background: 'rgba(15, 19, 27, 0.75)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '28px',
              transition: 'all 0.25s ease',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(212, 175, 55, 0.12)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                color: '#fce881',
                display: 'grid',
                placeItems: 'center',
                marginBottom: '20px',
              }}
            >
              <Cpu size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>
              Smart Page &amp; Duplex Detection
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6 }}>
              Automatic PDF analysis identifies color versus grayscale pages, computes proper duplex sheet counts, and supports 2-up, 4-up, and passport photo layouts with accurate pricing.
            </p>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#10b981' }}>
              <CheckCircle2 size={14} />
              <span>Down to the paisa</span>
            </div>
          </div>

          {/* Capability 4 */}
          <div
            style={{
              background: 'rgba(15, 19, 27, 0.75)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '28px',
              transition: 'all 0.25s ease',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(212, 175, 55, 0.12)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                color: '#fce881',
                display: 'grid',
                placeItems: 'center',
                marginBottom: '20px',
              }}
            >
              <Shield size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>
              Offline Resilient Local Queue
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6 }}>
              If your shop internet flutters or drops momentarily, your Windows counter station continues spooling accepted jobs via its local SQLite journal. Zero duplicate prints.
            </p>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#10b981' }}>
              <CheckCircle2 size={14} />
              <span>Guaranteed spool integrity</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
