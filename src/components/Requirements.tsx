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
      </div>
    </section>
  );
};
