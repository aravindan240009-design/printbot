import React from 'react';

interface ProblemItem {
  id: string;
  title: string;
  painPoint: string;
  solutionImpact: string;
}

const PROBLEMS: ProblemItem[] = [
  {
    id: 'channels',
    title: 'Fragmented Inflow Channels',
    painPoint: 'Customers send files via personal WhatsApp numbers, Bluetooth, email, or infected USB drives, cluttering personal phones and exposing shop workstations to malware.',
    solutionImpact: 'Single counter QR code directs customers to an in-browser upload session. No phone numbers exchanged, no Bluetooth pairing, zero USB thumbdrives.',
  },
  {
    id: 'manual',
    title: 'Repetitive Print Dialog Fatigue',
    painPoint: 'Operators waste minutes per customer opening Acrobat, checking page counts, manually choosing paper trays, selecting duplex orientation, and computing change.',
    solutionImpact: 'Customers configure color, duplex, and page imposition on their own phones before submission. Jobs arrive at the PC normalized and pre-configured.',
  },
  {
    id: 'queues',
    title: 'Counter Congestion & Walk-In Delay',
    painPoint: 'Even simple two-page printouts require counter interaction, causing queues to spill out during morning college rushes or peak government submission deadlines.',
    solutionImpact: 'Customers complete upload and preview while standing in line. By the time they reach the counter, their job is verified and ready for automatic or single-click release.',
  },
  {
    id: 'privacy',
    title: 'Document Retention & Privacy Risks',
    painPoint: 'Aadhaar cards, bank statements, legal affidavits, and tax forms linger indefinitely in shop desktop "Downloads" folders and WhatsApp media caches.',
    solutionImpact: 'Strict ephemeral handling: files stream directly to memory, spool to the printer, and are immediately purged from both cloud storage and local caches.',
  },
];

export const TheProblem: React.FC = () => {
  return (
    <section id="the-problem" className="section" aria-labelledby="problem-heading">
      <div className="wrap">
        <div className="problem-editorial-split">
          {/* Left Column: Context & Industry Counter Metrics */}
          <div className="problem-editorial-lead" data-reveal>
            <h2 id="problem-heading" className="head">
              The counter bottlenecks holding print shops back.
            </h2>
            <p className="lead" style={{ marginTop: '1rem' }}>
              Photocopy and commercial print shops handle hundreds of walk-in customers daily. Traditional counter handoffs waste operator time and introduce severe document security liabilities.
            </p>

            <div className="problem-metrics-card" data-ui>
              <div className="problem-metric-item">
                <span className="problem-metric-val">4–6 min</span>
                <span className="problem-metric-lbl">Wasted counter interaction per walk-in file transfer</span>
              </div>
              <div className="problem-metric-item">
                <span className="problem-metric-val">8 clicks</span>
                <span className="problem-metric-lbl">Manual printer dialog steps for simple duplex jobs</span>
              </div>
              <div className="problem-metric-item">
                <span className="problem-metric-val">100%</span>
                <span className="problem-metric-lbl">Customer files lingering in unpurged download caches</span>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Comparison Stack */}
          <div className="problem-editorial-stack">
            {PROBLEMS.map((item) => (
              <div key={item.id} className="problem-editorial-item" data-reveal>
                <h3 className="problem-item-title">{item.title}</h3>

                <div className="problem-item-body">
                  <div className="problem-friction-box">
                    <div className="problem-label friction">Counter friction</div>
                    <p>{item.painPoint}</p>
                  </div>
                  <div className="problem-solution-box">
                    <div className="problem-label solution">Print Bot solution</div>
                    <p>{item.solutionImpact}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
