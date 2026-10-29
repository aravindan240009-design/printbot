import React from 'react';
import { QrCode, SlidersHorizontal, Printer, XCircle, CheckCircle2 } from 'lucide-react';

export const WorkflowSection: React.FC = () => {
  return (
    <section id="workflow" className="section" style={{ paddingBlock: 'clamp(4rem, 7vw, 7rem)', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
      <div className="wrap">
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto clamp(2.5rem, 4vw, 4rem)' }}>
          <span className="eyebrow">COUNTER TRANSFORMATION</span>
          <h2 className="head" style={{ fontSize: 'clamp(2.1rem, 3.5vw, 3.2rem)', margin: '12px 0 16px' }}>
            Say goodbye to counter chaos. <br />
            <span style={{ background: 'linear-gradient(135deg, #fce881 0%, #d4af37 60%, #aa8010 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Print in under 15 seconds.
            </span>
          </h2>
          <p className="lead" style={{ fontSize: '17px', color: '#94a3b8' }}>
            Traditional photocopy shops lose 4–6 minutes per walk-in customer managing personal WhatsApp numbers, corrupted USB drives, and manual printer dialogs. Here is how Print Bot automates the counter:
          </p>
        </div>

        {/* 3-Step Interactive Process Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: 'clamp(3rem, 5vw, 5rem)',
          }}
        >
          {/* Step 1 */}
          <div
            style={{
              background: 'rgba(15, 19, 27, 0.75)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.25s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
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
                }}
              >
                <QrCode size={22} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#fce881', background: 'rgba(212, 175, 55, 0.15)', padding: '3px 10px', borderRadius: '999px' }}>
                STEP 01
              </span>
            </div>

            <h3 style={{ fontSize: '19px', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>
              Scan Counter Standee QR
            </h3>
            <p style={{ fontSize: '14.5px', color: '#94a3b8', lineHeight: 1.6, flexGrow: 1 }}>
              Customers point their smartphone camera at the acrylic QR stand on your desk. The mobile web app opens immediately in Safari or Chrome. No Android APK or iOS app download required.
            </p>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#10b981' }}>
              <CheckCircle2 size={15} />
              <span>Zero personal WhatsApp sharing</span>
            </div>
          </div>

          {/* Step 2 */}
          <div
            style={{
              background: 'rgba(15, 19, 27, 0.75)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.25s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
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
                }}
              >
                <SlidersHorizontal size={22} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#fce881', background: 'rgba(212, 175, 55, 0.15)', padding: '3px 10px', borderRadius: '999px' }}>
                STEP 02
              </span>
            </div>

            <h3 style={{ fontSize: '19px', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>
              Auto-Preview &amp; UPI Payment
            </h3>
            <p style={{ fontSize: '14.5px', color: '#94a3b8', lineHeight: 1.6, flexGrow: 1 }}>
              Customers pick B&amp;W or Color, single or double-sided, and copies. The server accurately counts pages and renders an exact sheet preview with guaranteed upfront pricing. Customer pays via UPI QR.
            </p>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#10b981' }}>
              <CheckCircle2 size={15} />
              <span>Exact paisa calculation upfront</span>
            </div>
          </div>

          {/* Step 3 */}
          <div
            style={{
              background: 'rgba(15, 19, 27, 0.75)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.25s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
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
                }}
              >
                <Printer size={22} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#fce881', background: 'rgba(212, 175, 55, 0.15)', padding: '3px 10px', borderRadius: '999px' }}>
                STEP 03
              </span>
            </div>

            <h3 style={{ fontSize: '19px', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>
              Windows Spool &amp; Instant Purge
            </h3>
            <p style={{ fontSize: '14.5px', color: '#94a3b8', lineHeight: 1.6, flexGrow: 1 }}>
              Your Windows counter PC receives the job directly into <code>spoolsv.exe</code>. Paper prints on Canon, HP, Epson, or Ricoh. Files are immediately wiped from memory the moment paper leaves the tray.
            </p>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#10b981' }}>
              <CheckCircle2 size={15} />
              <span>100% ephemeral file privacy</span>
            </div>
          </div>
        </div>

        {/* Side-by-Side Reality Comparison: Chaos vs Print Bot */}
        <div
          style={{
            background: 'rgba(10, 14, 22, 0.85)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: 'clamp(24px, 4vw, 40px)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', color: '#94a3b8', textTransform: 'uppercase' }}>
              REALITY AUDIT
            </span>
            <h3 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2.2rem)', fontWeight: 750, color: '#ffffff', marginTop: '6px' }}>
              Why Indian print shops are upgrading from WhatsApp
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* The Chaos Column */}
            <div style={{ background: 'rgba(239, 68, 68, 0.04)', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#f87171', fontWeight: 750, fontSize: '15px' }}>
                <XCircle size={18} />
                <span>Traditional Counter Chaos</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px', color: '#cbd5e1' }}>
                <li style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ color: '#ef4444' }}>✕</span>
                  <span>Sharing personal mobile numbers with dozens of strangers daily.</span>
                </li>
                <li style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ color: '#ef4444' }}>✕</span>
                  <span>Workstations infected by shortcut viruses from customer pen drives.</span>
                </li>
                <li style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ color: '#ef4444' }}>✕</span>
                  <span>Staff opening Acrobat, manually counting color vs B&amp;W pages, and arguing over quotes.</span>
                </li>
                <li style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ color: '#ef4444' }}>✕</span>
                  <span>Aadhaar cards, salary slips, and legal contracts lingering in the Windows Downloads folder.</span>
                </li>
              </ul>
            </div>

            {/* The Print Bot Column */}
            <div style={{ background: 'rgba(16, 185, 129, 0.04)', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#34d399', fontWeight: 750, fontSize: '15px' }}>
                <CheckCircle2 size={18} />
                <span>With Print Bot Counter OS</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px', color: '#cbd5e1' }}>
                <li style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ color: '#10b981' }}>✓</span>
                  <span>Direct QR code intake with zero phone numbers exchanged.</span>
                </li>
                <li style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ color: '#10b981' }}>✓</span>
                  <span>Isolated cloud sandbox with automatic MIME checking; zero pen drives.</span>
                </li>
                <li style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ color: '#10b981' }}>✓</span>
                  <span>Automated B&amp;W vs color page counting with locked upfront pricing and UPI verification.</span>
                </li>
                <li style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ color: '#10b981' }}>✓</span>
                  <span>Files stream to memory, spool to the printer, and are automatically purged.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
