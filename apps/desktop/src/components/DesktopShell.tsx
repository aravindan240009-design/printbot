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
  Megaphone,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { type ShopLicense } from '../App';
import type { LicenseExpiryInfo } from '../utils/licenseExpiry';
import { LicenseExpiryBanner } from './LicenseExpiryBanner';

export type Tab = 'queue' | 'printers' | 'services' | 'analytics' | 'website' | 'settings';

interface DesktopShellProps {
  currentShop?: ShopLicense;
  username: string;
  deviceName?: string;
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
  globalBroadcast?: { active: boolean; message: string; type: 'info' | 'warning' | 'urgent' };
  hardwareWarning?: { title: string; message: string; printerName?: string } | null;
  expiryInfo?: LicenseExpiryInfo;
  onOpenRenewalModal?: () => void;
  onOpenCountdownModal?: () => void;
  onVerifyLicense?: () => void;
  isVerifyingLicense?: boolean;
  children: React.ReactNode;
}

export const DesktopShell: React.FC<DesktopShellProps> = ({
  currentShop,
  username,
  deviceName,
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
  globalBroadcast,
  hardwareWarning,
  expiryInfo,
  onOpenRenewalModal,
  onOpenCountdownModal,
  onVerifyLicense,
  isVerifyingLicense,
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
            <span>{deviceName || 'Station'}</span>
            <span style={{ color: 'var(--pb-desk-text-dim)' }}>•</span>
            <span style={{ color: 'var(--pb-desk-text)' }}>{username}</span>
          </div>

          {/* Real-Time License Expiry Warning / Countdown Status Chip */}
          {expiryInfo && expiryInfo.status !== 'ACTIVE' && expiryInfo.status !== 'LIFETIME' && (
            <div
              className="pb-titlebar-status-chip"
              onClick={expiryInfo.is24hCountdown ? onOpenCountdownModal : onOpenRenewalModal}
              style={{
                cursor: 'pointer',
                background: expiryInfo.isExpired ? '#991b1b' : expiryInfo.is24hCountdown ? '#450a0a' : '#fef3c7',
                color: expiryInfo.isExpired ? '#ffffff' : expiryInfo.is24hCountdown ? '#fecaca' : '#92400e',
                border: expiryInfo.isExpired ? '1px solid #ef4444' : expiryInfo.is24hCountdown ? '1px solid #ef4444' : '1px solid #fde68a',
                fontWeight: 750,
                fontSize: '11px',
                gap: '6px',
              }}
              title={expiryInfo.is24hCountdown ? 'Click to view countdown popup' : 'Click to renew license'}
            >
              {expiryInfo.isExpired ? (
                <>
                  <Lock size={12} color="#ffffff" />
                  <span>License Expired</span>
                </>
              ) : expiryInfo.is24hCountdown ? (
                <>
                  <Clock size={12} className="animate-pulse" color="#f87171" />
                  <span>Countdown: <strong style={{ fontFamily: 'monospace' }}>{expiryInfo.formattedCountdown}</strong></span>
                </>
              ) : (
                <>
                  <AlertTriangle size={12} color="#d97706" />
                  <span>Expires in: <strong>{expiryInfo.daysRemaining === 1 ? '1 day' : `${expiryInfo.daysRemaining} days`}</strong></span>
                </>
              )}
            </div>
          )}
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

          <div className="pb-titlebar-divider" />

          {/* Lock / Logout */}
          <button
            type="button"
            className="pb-btn pb-btn-secondary pb-btn-sm"
            onClick={onLogout}
            style={{ gap: '5px', height: '28px' }}
          >
            <Lock size={12} /> Lock Session
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

              <button
                type="button"
                className={`pb-sidebar-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
                aria-current={activeTab === 'analytics' ? 'page' : undefined}
                onClick={() => setActiveTab('analytics')}
              >
                <TrendingUp size={16} />
                <span>Revenue &amp; Analytics</span>
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
          {/* License Expiry Banner (Warning 72h, Countdown 24h, or Expired) */}
          {expiryInfo && (
            <LicenseExpiryBanner
              expiryInfo={expiryInfo}
              onOpenRenewalModal={onOpenRenewalModal || (() => {})}
              onVerifyLicense={onVerifyLicense || (() => {})}
              isVerifying={isVerifyingLicense}
              onOpenCountdownModal={onOpenCountdownModal}
            />
          )}
          {/* Network Broadcast Announcement */}
          {globalBroadcast?.active && globalBroadcast?.message && (
            <div
              style={{
                padding: '10px 20px',
                background:
                  globalBroadcast.type === 'urgent'
                    ? '#fef2f2'
                    : globalBroadcast.type === 'warning'
                      ? '#fffbeb'
                      : '#eff6ff',
                borderBottom: `1px solid ${
                  globalBroadcast.type === 'urgent'
                    ? '#fecaca'
                    : globalBroadcast.type === 'warning'
                      ? '#fde68a'
                      : '#bfdbfe'
                }`,
                color:
                  globalBroadcast.type === 'urgent'
                    ? '#b91c1c'
                    : globalBroadcast.type === 'warning'
                      ? '#b45309'
                      : '#1d4ed8',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '12.5px',
                fontWeight: 700,
              }}
            >
              <Megaphone size={16} style={{ flexShrink: 0 }} />
              <span>
                <strong>Network Announcement:</strong> {globalBroadcast.message}
              </span>
            </div>
          )}

          {/* Hardware Disconnection / Printer Offline Alert Banner */}
          {hardwareWarning && (
            <div
              style={{
                padding: '12px 20px',
                background: '#fef2f2',
                borderBottom: '1px solid #fecaca',
                color: '#991b1b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                fontSize: '13px',
                fontWeight: 700,
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.08)',
              }}
              role="alert"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#fee2e2',
                    color: '#dc2626',
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={15} />
                </span>
                <span>
                  <strong>{hardwareWarning.title}:</strong> {hardwareWarning.message}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('printers')}
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 0,
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 750,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Configure Printer Fleet →
              </button>
            </div>
          )}

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

