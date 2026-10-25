import React from 'react';

interface PricingPlan {
  id: string;
  name: string;
  targetAudience: string;
  badge?: string;
  highlighted?: boolean;
  statusLabel: string;
  features: string[];
  limitations: string;
  actionText: string;
}

const PLANS: PricingPlan[] = [
  {
    id: 'single-counter',
    name: 'Single Counter Shop',
    targetAudience: 'Neighbourhood photocopy, Xerox, and stationery shops running one counter workstation.',
    statusLabel: 'Commercial pilot · Pricing to be confirmed',
    features: [
      '1 Windows workstation pairing license',
      'Up to 2 connected USB or network printers',
      'Zero-app customer smartphone QR intake',
      'Manual staff approval & auto-dispatch modes',
      '100% ephemeral in-memory file purge on print',
      'Standard shop counter operating hours support',
    ],
    limitations: 'Designed for single-PC counter operations.',
    actionText: 'Request Shop Pilot Access',
  },
  {
    id: 'print-center',
    name: 'Commercial Print Center',
    targetAudience: 'High-volume photocopy centres and commercial print hubs with multiple multi-function copiers.',
    badge: 'Recommended for Print Shops',
    highlighted: true,
    statusLabel: 'Commercial pilot · Pricing to be confirmed',
    features: [
      '1 Primary workstation license with multi-spooling',
      'Unlimited connected printers (USB, Ethernet, TCP 9100)',
      'Advanced sheet imposition engine (1-Up, 2-Up, 4-Up)',
      'Simplex and long-edge duplex normalization',
      'Live printer offline & paper tray telemetry',
      'Priority operator onboarding & remote pairing',
    ],
    limitations: 'Unlimited printers per paired Windows PC.',
    actionText: 'Request Shop Pilot Access',
  },
  {
    id: 'campus-fleet',
    name: 'Campus / Multi-Branch Fleet',
    targetAudience: 'University campus print rooms, multi-branch photocopy franchises, and reprographic departments.',
    statusLabel: 'Custom pilot deployment',
    features: [
      'Multi-branch shop network management',
      'Centralized operator dashboard & tenant isolation',
      'Custom counter QR stand templates with shop branding',
      'Dedicated hardware compatibility testing for rare copiers',
      'Direct architecture team support for setup',
      'Guaranteed uptime support during exam rush periods',
    ],
    limitations: 'Multi-location network deployment.',
    actionText: 'Contact for Fleet Pilot',
  },
];

interface PricingProps {
  onRequestPilot: (planName?: string) => void;
}

export const Pricing: React.FC<PricingProps> = ({ onRequestPilot }) => {
  return (
    <section id="pricing" className="section" aria-labelledby="pricing-heading">
      <div className="wrap">
        <div className="section-head" data-reveal>
          <h2 id="pricing-heading" className="head">
            Subscription plans designed for print businesses.
          </h2>
          <p className="lead" style={{ maxWidth: '60ch', marginTop: '0.75rem' }}>
            Predictable per-shop subscription pricing tailored for single-counter photocopy shops up to high-volume commercial print hubs.
          </p>
        </div>

        <div className="pricing-grid">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`pricing-card ${plan.highlighted ? 'is-highlighted' : ''}`}
              data-ui
              data-reveal
            >
              <div className="pricing-header">
                {plan.badge && (
                  <span className="pricing-badge">{plan.badge}</span>
                )}
                <h3 className="pricing-plan-name">{plan.name}</h3>
                <p className="pricing-audience">{plan.targetAudience}</p>
              </div>

              <div className="pricing-status-pill">
                <span className="pricing-status-dot" aria-hidden="true" />
                <span>{plan.statusLabel}</span>
              </div>

              <div className="pricing-features-wrap">
                <div className="pricing-features-title">Planned Entitlements</div>
                <ul className="pricing-features-list">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="pricing-feature-item">
                      <span className="pricing-feature-bullet" aria-hidden="true" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pricing-footer">
                <button
                  type="button"
                  className={plan.highlighted ? 'btn-primary' : 'btn-secondary'}
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => onRequestPilot(plan.name)}
                >
                  {plan.actionText}
                </button>
                <span className="pricing-limitation-text">{plan.limitations}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="pricing-disclaimer-box" data-ui data-reveal>
          <div className="disclaimer-header">
            <strong>Commercial pilot status &amp; pricing transparency</strong>
          </div>
          <p className="muted" style={{ marginTop: '0.5rem', lineHeight: 1.6, fontSize: 'var(--step-body)' }}>
            Print Bot is currently conducting closed commercial pilots with partner print shops across India. Final subscription rates, billing cycles (monthly/annual), and UPI autopay integrations will be published upon conclusion of Phase 6 pilot validation. No credit card or payment is required to request pilot participation.
          </p>
        </div>
      </div>
    </section>
  );
};
