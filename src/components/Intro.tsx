import React from 'react';

export const Intro: React.FC = () => {
  return (
    <section id="overview" className="section" aria-labelledby="overview-heading">
      <div className="wrap">
        <div className="intro-split-grid" data-reveal>
          {/* Left Column: Real print shop counter photo */}
          <div className="intro-photo-col">
            <div className="photo-frame">
              <img
                src="./assets/print_shop_counter.jpg"
                alt="Print shop counter with computer running Print Bot software beside customer QR code stand and paper reams"
                className="cover"
                loading="lazy"
                width="1024"
                height="680"
              />
              <div className="photo-overlay-tag" data-ui>
                <span className="ui-status-dot" aria-hidden="true" />
                <span>Commercial Counter Deployment · Closed Pilot</span>
              </div>
            </div>
          </div>

          {/* Right Column: Two distinct sides of the product */}
          <div className="intro-text-col">
            <h2 id="overview-heading" className="head">
              Two distinct sides of one queue-free workflow.
            </h2>

            <p className="lead" style={{ marginTop: '0.75rem' }}>
              Print Bot connects walk-in smartphone customers directly to your shop Windows workstation, replacing manual file handoffs and unpaid queue bottlenecks with background print spooling.
            </p>

            <div className="intro-sides-stack">
              <div className="intro-side-card" data-ui>
                <div className="intro-side-header">
                  <span className="intro-side-badge">Customer Experience</span>
                  <span className="intro-side-sub">Zero Mobile App Downloads</span>
                </div>
                <p className="intro-side-body">
                  Walk-in customers simply scan your counter QR stand with their smartphone camera. A web app opens instantly in iOS Safari or Android Chrome. Customers upload documents, configure color/duplex settings, and inspect output sheet previews while waiting in line.
                </p>
              </div>

              <div className="intro-side-card" data-ui>
                <div className="intro-side-header">
                  <span className="intro-side-badge" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                    Shop Operator Experience
                  </span>
                  <span className="intro-side-sub">Native Windows Spooler</span>
                </div>
                <p className="intro-side-body">
                  An authorized background Rust service runs silently on the shop Windows computer, receiving verified print orders and injecting them directly into <code>spoolsv.exe</code>. Files stream to memory and are immediately purged the moment paper leaves the tray.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
