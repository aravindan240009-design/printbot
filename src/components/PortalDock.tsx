import { useState } from 'react';
import { Smartphone, Store, Shield, Laptop, ExternalLink, ChevronUp, ChevronDown } from 'lucide-react';

const PORTALS = [
  { name: 'Customer Mobile PWA', port: '3000', path: '/?shop_id=11111111-1111-1111-1111-111111111111', icon: Smartphone, desc: 'Scan QR · Upload & Pay' },
  { name: 'Shop Studio Portal', port: '3001', path: '/', icon: Store, desc: 'Queue & Fleet Policy' },
  { name: 'SuperAdmin Command', port: '3002', path: '/', icon: Shield, desc: 'Entitlements & Audit' },
  { name: 'Counter Workstation', port: '5174', path: '/', icon: Laptop, desc: 'Windows Native EXE UI' },
];

export function PortalDock() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`portal-dock ${collapsed ? 'collapsed' : ''}`} aria-label="Local Apps Portal Dock">
      <div className="portal-dock-header">
        <div className="portal-dock-title">
          <span className="live-dot" />
          <strong>Print Bot Suite</strong>
        </div>
        <button
          type="button"
          className="portal-dock-collapse"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand Local Suite Dock' : 'Collapse Local Suite Dock'}
        >
          {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {!collapsed && (
        <div className="portal-dock-links">
          {PORTALS.map((p) => {
            const Icon = p.icon;
            const url = `http://localhost:${p.port}${p.path}`;
            return (
              <a
                key={p.name}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="portal-link-item"
                title={`Open ${p.name} on port ${p.port}`}
              >
                <div className="portal-link-icon">
                  <Icon size={15} />
                </div>
                <div className="portal-link-text">
                  <span className="portal-name">{p.name}</span>
                  <small className="portal-port">:{p.port} · {p.desc}</small>
                </div>
                <ExternalLink size={12} className="portal-arrow" />
              </a>
            );
          })}
        </div>
      )}
    </aside>
  );
}
