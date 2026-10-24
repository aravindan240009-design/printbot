import React from 'react';

export const Intro: React.FC = () => {
  return (
    <section id="overview" className="section" aria-labelledby="overview-heading">
      <div className="wrap">
        <div className="section-head" data-reveal>
          <h2 id="overview-heading" className="head">
            Two distinct sides of one queue-free workflow.
          </h2>
        </div>

        <div className="intro-lead-block" data-reveal>
          <p className="intro-lead-text">
            Print Bot connects customer smartphones directly to shop Windows computers, replacing manual file transfers and unpaid counter queues with verified background print spooling.
          </p>
        </div>

        <div className="intro-four-cols">
          <div className="intro-col" data-reveal>
            <p className="intro-col-text">
              <span className="intro-run-in">Zero customer apps:</span> Walk-in customers scan a counter QR code to upload PDFs, images, or documents from any mobile browser, receiving instant sheet previews without registering an account.
            </p>
          </div>

          <div className="intro-col" data-reveal>
            <p className="intro-col-text">
              <span className="intro-run-in">Independent Windows service:</span> A background Rust print agent runs silently on the shop PC, communicating directly with Win32 Spooler APIs even when the desktop operator window is closed.
            </p>
          </div>

          <div className="intro-col" data-reveal>
            <p className="intro-col-text">
              <span className="intro-run-in">Strict tenant firewall:</span> Every shop operates with independent database scopes, unique QR tokens, and dedicated printer leases. No cross-shop document leakage or dispatch is possible.
            </p>
          </div>

          <div className="intro-col" data-reveal>
            <p className="intro-col-text">
              <span className="intro-run-in">Dual fulfillment modes:</span> Shop operators choose between Full Automatic release for verified immediate printing or Manual Approval for physical verification before paper output.
            </p>
          </div>
        </div>

        {/* Real photo feature */}
        <div className="photo-feature-block" data-reveal>
          <div className="photo-frame">
            <img
              src="./assets/print_shop_counter.jpg"
              alt="Print shop counter with computer running Print Bot software beside customer QR code stand and paper reams"
              className="cover"
              loading="lazy"
              width="1024"
              height="576"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.75rem' }}>
            <h3 style={{ fontSize: 'var(--step-lead)', fontWeight: 700 }}>
              Tested on real print shop counters
            </h3>
            <p className="small muted">
              Designed for high-traffic photocopy centers where customer queue time and document security determine shop throughput. Operators oversee queues from their Windows workstation while the background service handles silent spooling.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
