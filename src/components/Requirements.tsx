import React from 'react';

interface ReqRow {
  parameter: string;
  specification: string;
  notes: string;
}

const REQUIREMENTS_DATA: ReqRow[] = [
  {
    parameter: 'Operating System',
    specification: 'Windows 10 & 11 (64-bit)',
    notes: 'Build 1903 or newer; standard Home and Pro editions supported',
  },
  {
    parameter: 'Processor & RAM',
    specification: 'x64 Processor · 4 GB RAM',
    notes: 'Standard counter PC hardware; 8 GB recommended for concurrent queues',
  },
  {
    parameter: 'Local Storage',
    specification: '500 MB Free Disk Space',
    notes: 'For Tauri application binaries and temporary SQLite WAL print journal',
  },
  {
    parameter: 'Windows Print Spooler',
    specification: 'Native spoolsv.exe Service',
    notes: 'Operates via Win32 Spooler APIs; no custom kernel driver required',
  },
  {
    parameter: 'Printer Compatibility',
    specification: 'Standard Windows Drivers',
    notes: 'Compatible with USB, Ethernet, and Wi-Fi printers (Canon, HP, Epson, Brother, Ricoh)',
  },
  {
    parameter: 'Network Connectivity',
    specification: 'Outbound HTTPS (Port 443)',
    notes: 'Outbound encrypted TLS sync only; no inbound ports or router changes needed',
  },
];

export const Requirements: React.FC = () => {
  return (
    <section id="requirements" className="section" aria-labelledby="requirements-heading">
      <div className="wrap">
        <div className="section-head" data-reveal>
          <h2 id="requirements-heading" className="head">
            Windows desktop and printer requirements.
          </h2>
        </div>

        <div className="requirements-table-wrap" data-reveal>
          <table className="requirements-table">
            <thead>
              <tr>
                <th scope="col">Component</th>
                <th scope="col">Minimum Specification</th>
                <th scope="col">Architecture Note</th>
              </tr>
            </thead>
            <tbody>
              {REQUIREMENTS_DATA.map((row) => (
                <tr key={row.parameter}>
                  <td><strong>{row.parameter}</strong></td>
                  <td style={{ color: 'var(--ink)' }}>{row.specification}</td>
                  <td>{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="hardware-compatibility-block" data-reveal style={{ marginTop: '2.5rem', background: 'var(--surface)', padding: 'clamp(1.5rem, 3vw, 2.5rem)', borderRadius: 'var(--radius)' }}>
          <h3 style={{ fontSize: 'var(--step-lead)', fontWeight: 700, color: 'var(--ink)' }}>
            Tested hardware fleets across Indian photocopy &amp; print shops
          </h3>
          <p className="muted" style={{ marginTop: '0.5rem', maxWidth: '68ch', fontSize: 'var(--step-body)' }}>
            Print Bot requires zero proprietary hardware dongles or vendor-locked firmware. The background service communicates through native Windows Spooler APIs (<code>winspool.drv</code>). If Windows can print a test page to your machine, Print Bot can spool to it.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginTop: '1.75rem' }}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 'var(--step-body)' }}>
                Commercial Multifunction Copiers
              </div>
              <div className="muted" style={{ fontSize: 'var(--step-small)', marginTop: '0.35rem', lineHeight: 1.5 }}>
                Canon imageRUNNER / iR-ADV, Ricoh Aficio &amp; MP Series, Konica Minolta bizhub, Kyocera TASKalfa, Sharp MX Series.
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 'var(--step-body)' }}>
                Monochrome Laser Workhorses
              </div>
              <div className="muted" style={{ fontSize: 'var(--step-small)', marginTop: '0.35rem', lineHeight: 1.5 }}>
                HP LaserJet Pro &amp; Enterprise (M428, 1020, MFP M126), Canon LBP (2900B, 6030), Brother DCP &amp; HL Series.
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 'var(--step-body)' }}>
                High-Capacity Color InkTank
              </div>
              <div className="muted" style={{ fontSize: 'var(--step-small)', marginTop: '0.35rem', lineHeight: 1.5 }}>
                Epson EcoTank (L8050, L3250, L6490, M3170), Canon PIXMA G-Series &amp; MAXIFY, HP Smart Tank (580, 720).
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
