import React from 'react';
import {
  Printer,
  Layers,
  Sparkles,
  Globe,
  Settings,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Lock,
  Radio,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { type ShopLicense } from '../App';

export type Tab = 'queue' | 'printers' | 'services' | 'website' | 'settings';

interface DesktopShellProps {
  currentShop?: ShopLicense;
  username: string;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  queueCount: number;
  printersCount: number;
  servicesCount: number;
  isAudioEnabled: boolean;
  setIsAudioEnabled: (val: boolean) => void;
  theme: string;
  setTheme: (val: string) => void;
  onLogout: () => void;
  cloudSyncStatus: 'CONNECTED' | 'OFFLINE';
  notice: string | null;
  onDismissNotice: () => void;
  children: React.ReactNode;
}

export const DesktopShell: React.FC<DesktopShellProps> = ({
  currentShop,
  username,
  activeTab,
  setActiveTab,
  queueCount,
  printersCount,
  servicesCount,
  isAudioEnabled,
  setIsAudioEnabled,
  theme,
  setTheme,
  onLogout,
  cloudSyncStatus,
  notice,
  onDismissNotice,
  children,
}) => {
  return (
    <div className="pb-desktop-app">
      {/* Titlebar Chrome */}
      <header className="pb-desktop-titlebar">
        <div className="pb-titlebar-left">
          <div className="pb-titlebar-brand">
            <span className="pb-titlebar-brand-icon">
              <Printer size={13} />
            </span>
            <span>Print Bot Workstation</span>
          </div>

          <div className="pb-titlebar-divider" />

          <div className="pb-titlebar-status-chip">
            <span className="pb-pulse-dot" />
            <span>Spooler Active</span>
          </div>

          <div className="pb-titlebar-status-chip">
            <span>Counter-PC-01</span>
            <span style={{ color: 'var(--pb-desk-text-dim)' }}>•</span>
            <span style={{ color: 'var(--pb-desk-text)' }}>{username}</span>
          </div>
        </div>

        <div className="pb-titlebar-right">
          {/* Audio Alerts Toggle */}
          <button
            type="button"
            className="pb-titlebar-btn"
            title={isAudioEnabled ? 'Audio Alerts: Enabled (Click to Mute)' : 'Audio Alerts: Muted (Click to Enable)'}
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
          >
            {isAudioEnabled ? <Volume2 size={14} color="var(--pb-desk-accent)" /> : <VolumeX size={14} />}
          </button>

          {/* Theme Switcher */}
          <button
            type="button"
            className="pb-titlebar-btn"
            title={`Current Theme: ${theme.toUpperCase()} (Click to toggle)`}
            onClick={() => {
              const nextTheme = theme === 'dark' ? 'light' : 'dark';
              setTheme(nextTheme);
              document.documentElement.setAttribute('data-theme', nextTheme);
            }}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          <div className="pb-titlebar-divider" />

          {/* Lock / Logout */}
          <button
            type="button"
            className="pb-btn pb-btn-sm"
            onClick={onLogout}
            style={{ gap: '5px', height: '26px' }}
          >
            <Lock size={12} /> Lock
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="pb-desktop-body">
        {/* Desktop Sidebar Navigation */}
        <aside className="pb-desktop-sidebar">
          {/* Shop Header Card */}
          <div className="pb-sidebar-shop-card">
            <span className="pb-sidebar-shop-label">Licensed Station</span>
            <div className="pb-sidebar-shop-title" title={currentShop?.shopName || username}>
              {currentShop?.shopName || username}
            </div>
            <div className="pb-sidebar-shop-sub">
              {currentShop?.location || 'Counter 01'}
            </div>
          </div>

          {/* Section: Operational Core */}
          <div className="pb-sidebar-nav-section">
            <span className="pb-sidebar-section-title">Operations</span>
            <nav className="pb-sidebar-nav-list" aria-label="Workstation Operations">
              <button
                type="button"
                className={`pb-sidebar-nav-item ${activeTab === 'queue' ? 'active' : ''}`}
                aria-current={activeTab === 'queue' ? 'page' : undefined}
                onClick={() => setActiveTab('queue')}
              >
                <Layers size={16} />
                <span>Dispatch Queue</span>
                <span className="pb-sidebar-badge">{queueCount}</span>
              </button>

              <button
                type="button"
                className={`pb-sidebar-nav-item ${activeTab === 'printers' ? 'active' : ''}`}
                aria-current={activeTab === 'printers' ? 'page' : undefined}
                onClick={() => setActiveTab('printers')}
              >
                <Printer size={16} />
                <span>Hardware Fleet</span>
                <span className="pb-sidebar-badge">{printersCount}</span>
              </button>

              <button
                type="button"
                className={`pb-sidebar-nav-item ${activeTab === 'services' ? 'active' : ''}`}
                aria-current={activeTab === 'services' ? 'page' : undefined}
                onClick={() => setActiveTab('services')}
              >
                <Sparkles size={16} />
                <span>Services &amp; Rates</span>
                <span className="pb-sidebar-badge">{servicesCount}</span>
              </button>
            </nav>
          </div>

          {/* Section: Customer & Machine Config */}
          <div className="pb-sidebar-nav-section">
            <span className="pb-sidebar-section-title">Management</span>
            <nav className="pb-sidebar-nav-list" aria-label="Workstation Management">
              <button
                type="button"
                className={`pb-sidebar-nav-item ${activeTab === 'website' ? 'active' : ''}`}
                aria-current={activeTab === 'website' ? 'page' : undefined}
                onClick={() => setActiveTab('website')}
              >
                <Globe size={16} />
                <span>Website &amp; QR</span>
              </button>

              <button
                type="button"
                className={`pb-sidebar-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                aria-current={activeTab === 'settings' ? 'page' : undefined}
                onClick={() => setActiveTab('settings')}
              >
                <Settings size={16} />
                <span>Configuration</span>
              </button>
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="pb-sidebar-footer">
            <div className="pb-workstation-id-card">
              <ShieldCheck size={14} color="var(--pb-desk-success)" style={{ flexShrink: 0 }} />
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div style={{ fontWeight: 750, color: 'var(--pb-desk-text)', fontSize: '11px' }}>
                  Hardware Verified
                </div>
                <div style={{ fontSize: '10px', color: 'var(--pb-desk-text-dim)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {currentShop?.deviceId || 'Win32 Spooler Engine'}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="pb-sidebar-logout-btn"
              onClick={onLogout}
            >
              <Lock size={13} /> Lock Session
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="pb-desktop-main">
          {/* Notification Banner if active */}
          {notice && (
            <div style={{
              padding: '10px 20px',
              background: 'var(--pb-desk-accent-subtle)',
              borderBottom: '1px solid var(--pb-desk-accent-border)',
              color: 'var(--pb-desk-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              fontSize: '12px',
              fontWeight: 650,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={15} />
                <span>{notice}</span>
              </div>
              <button
                type="button"
                onClick={onDismissNotice}
                style={{
                  background: 'transparent',
                  border: 0,
                  color: 'var(--pb-desk-accent)',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  fontWeight: 800,
                }}
              >
                ✕
              </button>
            </div>
          )}

          <div className="pb-desktop-content-padded">
            {children}
          </div>
        </main>
      </div>

      {/* Desktop Native Status Bar */}
      <footer className="pb-desktop-statusbar">
        <div className="pb-statusbar-section">
          <div className="pb-statusbar-item">
            <span className="pb-pulse-dot" style={{ background: cloudSyncStatus === 'CONNECTED' ? 'var(--pb-desk-success)' : 'var(--pb-desk-warning)' }} />
            <span>Cloud Sync: <strong>{cloudSyncStatus}</strong></span>
          </div>

          <div className="pb-titlebar-divider" />

          <div className="pb-statusbar-item">
            <Radio size={12} color="var(--pb-desk-accent)" />
            <span>Dispatch Mode: <strong>{currentShop?.orderMode === 'FULL_AUTOMATIC' ? 'Full Automatic' : 'Manual Approval'}</strong></span>
          </div>
        </div>

        <div className="pb-statusbar-section">
          <div className="pb-statusbar-item">
            <span>Active Queue: <strong>{queueCount}</strong> orders</span>
          </div>

          <div className="pb-titlebar-divider" />

          <div className="pb-statusbar-item">
            <span>Tauri 2.0 • Win32 Native</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

