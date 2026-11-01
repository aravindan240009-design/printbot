import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  KeyRound,
  Building,
  TrendingUp,
  Megaphone,
  LogOut,
  Search,
  RefreshCw,
  Building2,
  Trash2,
  Send,
  Sparkles,
  Copy,
  PlusCircle,
  RotateCcw,
  Laptop,
  BarChart3,
  PieChart,
  History,
  Key,
  CheckCircle2,
  X,
  AlertTriangle,
} from 'lucide-react';

export interface PilotApplication {
  id: string;
  shopName: string;
  city: string;
  contactNumber: string;
  plan: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedAt: string;
  generatedUsername?: string;
  generatedKey?: string;
  approvedAt?: string;
  raw?: any;
}

export interface ShopLicense {
  shopName: string;
  username: string;
  licenseKey: string;
  location?: string;
  phone?: string;
  upiId?: string;
  status: 'ACTIVE' | 'REVOKED';
  createdAt: string;
  expiresAt: string;
  duration?: '1 Month' | '1 Year' | 'Lifetime Commercial';
  deviceId?: string;
  deviceToken?: string;
  appId?: string;
  isConfigured?: boolean;
  orderMode?: 'FULL_AUTOMATIC' | 'MANUAL_APPROVAL';
  lastActive?: string;
  totalOrdersCount?: number;
  totalPagesCount?: number;
}

export interface AdminAuditEntry {
  id: string;
  timestamp: string;
  action:
    | 'KEY_ISSUED'
    | 'KEY_REVOKED'
    | 'KEY_EXTENDED'
    | 'KEY_DELETED'
    | 'DEVICE_UNBOUND'
    | 'BROADCAST_PUBLISHED'
    | 'SETTINGS_UPDATED'
    | 'PASSWORD_CHANGED'
    | 'PASSWORD_UPDATED'
    | 'ADMIN_LOGIN';
  details: string;
  actor: string;
}

export type AdminTab =
  | 'APPLICATIONS'
  | 'LICENSES'
  | 'SHOPS_DEVICES'
  | 'REVENUE'
  | 'BROADCASTS'
  | 'AUDIT_SECURITY';

interface AdminPortalProps {
  activeSession: { role: 'ADMIN' | 'SHOP_OWNER'; username: string; token?: string } | null;
  onLogout: () => void;
  applications: PilotApplication[];
  licenses: Record<string, ShopLicense>;
  cloudSyncStatus: 'CONNECTED' | 'CONNECTING' | 'OFFLINE';
  isSyncing: boolean;
  fetchApplicationsFromCloud: () => Promise<void>;
  adminNotice: string | null;
  setAdminNotice: (val: string | null) => void;
  auditLogs: AdminAuditEntry[];
  handleModifyAppSubscription: (appId: string, newPlan: '1 Month' | '1 Year' | 'Lifetime Commercial') => Promise<void>;
  handleGenerateCredentialsFromApp: (app: PilotApplication) => Promise<void>;
  handleRejectApp: (appId: string) => Promise<void>;
  handleDeleteApp: (appId: string) => Promise<void>;
  newShopName: string;
  setNewShopName: (v: string) => void;
  newUsername: string;
  setNewUsername: (v: string) => void;
  newDuration: '1 Month' | '1 Year' | 'Lifetime Commercial';
  setNewDuration: (v: '1 Month' | '1 Year' | 'Lifetime Commercial') => void;
  handleGenerateKey: (e: React.FormEvent) => void;
  generatedKey: string;
  handleRevokeKey: (username: string) => void;
  handleExtendLicense: (username: string, duration: '1 Month' | '1 Year') => void;
  handleResetDevice: (username: string) => void;
  handleDeleteKey: (username: string) => void;
  globalBroadcast: { active: boolean; message: string; type: 'info' | 'warning' | 'urgent'; timestamp: string };
  broadcastDraft: string;
  setBroadcastDraft: (v: string) => void;
  broadcastTypeDraft: 'info' | 'warning' | 'urgent';
  setBroadcastTypeDraft: (v: 'info' | 'warning' | 'urgent') => void;
  broadcastEnabledDraft: boolean;
  setBroadcastEnabledDraft: (v: boolean) => void;
  handleSaveBroadcast: (e: React.FormEvent) => void;
  currentPassInput: string;
  setCurrentPassInput: (v: string) => void;
  newPassInput: string;
  setNewPassInput: (v: string) => void;
  confirmPassInput: string;
  setConfirmPassInput: (v: string) => void;
  passChangeStatus: { type: 'success' | 'error'; msg: string } | null;
  handleChangeAdminPassword: (e: React.FormEvent) => Promise<void>;
  issuedCredsModal: {
    shopName: string;
    username: string;
    key: string;
    duration: string;
    expiry: string;
    phone: string;
  } | null;
  setIssuedCredsModal: (val: any) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  activeSession,
  onLogout,
  applications,
  licenses,
  cloudSyncStatus,
  isSyncing,
  fetchApplicationsFromCloud,
  adminNotice,
  setAdminNotice,
  auditLogs,
  handleModifyAppSubscription,
  handleGenerateCredentialsFromApp,
  handleRejectApp,
  handleDeleteApp,
  newShopName,
  setNewShopName,
  newUsername,
  setNewUsername,
  newDuration,
  setNewDuration,
  handleGenerateKey,
  generatedKey,
  handleRevokeKey,
  handleExtendLicense,
  handleResetDevice,
  handleDeleteKey,
  globalBroadcast,
  broadcastDraft,
  setBroadcastDraft,
  broadcastTypeDraft,
  setBroadcastTypeDraft,
  broadcastEnabledDraft,
  setBroadcastEnabledDraft,
  handleSaveBroadcast,
  currentPassInput,
  setCurrentPassInput,
  newPassInput,
  setNewPassInput,
  confirmPassInput,
  setConfirmPassInput,
  passChangeStatus,
  handleChangeAdminPassword,
  issuedCredsModal,
  setIssuedCredsModal,
}) => {
  const [adminActiveTab, setAdminActiveTab] = useState<AdminTab>('APPLICATIONS');
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [licenseSearchQuery, setLicenseSearchQuery] = useState('');
  const [licenseStatusFilter, setLicenseStatusFilter] = useState<'ALL' | 'ACTIVE' | 'REVOKED'>('ALL');

  const shopList = Object.values(licenses).filter((l) => l.username.toLowerCase() !== 'admin');
  const activeCount = shopList.filter((l) => l.status === 'ACTIVE').length;
  const revokedCount = shopList.filter((l) => l.status === 'REVOKED').length;

  const totalRevenueRupees = shopList.reduce((acc, l) => {
    if (l.duration === '1 Month') return acc + 499;
    if (l.duration === 'Lifetime Commercial') return acc + 14999;
    return acc + 4999;
  }, 0);

  const totalNetworkOrders = shopList.reduce((acc, l) => acc + (l.totalOrdersCount || 0), 0);
  const totalNetworkPages = shopList.reduce((acc, l) => acc + (l.totalPagesCount || 0), 0);

  const validApplications = applications.filter((a) => a.id !== 'APP-ADMIN-MASTER-ROOT');
  const pendingAppCount = validApplications.filter((a) => a.status === 'PENDING').length;
  const approvedAppCount = validApplications.filter((a) => a.status === 'APPROVED').length;
  const rejectedAppCount = validApplications.filter((a) => a.status === 'REJECTED').length;

  const filteredApplications = validApplications.filter((app) => {
    if (appStatusFilter !== 'ALL' && app.status !== appStatusFilter) return false;
    if (!appSearchQuery) return true;
    const q = appSearchQuery.toLowerCase();
    return (
      app.shopName.toLowerCase().includes(q) ||
      app.city.toLowerCase().includes(q) ||
      app.contactNumber.includes(q) ||
      app.id.toLowerCase().includes(q)
    );
  });

  const filteredLicenses = shopList.filter((l) => {
    if (licenseStatusFilter !== 'ALL' && l.status !== licenseStatusFilter) return false;
    if (!licenseSearchQuery) return true;
    const q = licenseSearchQuery.toLowerCase();
    return (
      l.shopName.toLowerCase().includes(q) ||
      l.username.toLowerCase().includes(q) ||
      l.licenseKey.toLowerCase().includes(q) ||
      (l.location && l.location.toLowerCase().includes(q))
    );
  });

  return (
    <div className="pb-admin-root">
      {/* Top Header */}
      <header className="pb-admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="pb-admin-logo-box">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Print Bot Admin Center
              </strong>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  background: '#dbeafe',
                  color: '#1d4ed8',
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}
              >
                Super Admin
              </span>
            </div>
            <div style={{ color: '#64748b', fontSize: '11px', marginTop: '1px' }}>
              Platform Operations · Commercial Licensing · Multi-Tenant Monitoring
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
              Logged in: {activeSession?.username || 'admin'}
            </div>
            <div style={{ fontSize: '10.5px', color: '#64748b' }}>Assurance: Audited Elevated</div>
          </div>
          <button
            onClick={onLogout}
            className="pb-btn pb-btn-outline pb-btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </header>

      {/* Tabs Bar */}
      <nav className="pb-admin-tabs-bar">
        {[
          {
            id: 'APPLICATIONS',
            label: 'Pilot Applications',
            icon: UserCheck,
            badge: pendingAppCount > 0 ? `${pendingAppCount} NEW` : `${applications.length}`,
          },
          { id: 'LICENSES', label: 'Licenses & Keys', icon: KeyRound, badge: `${shopList.length}` },
          { id: 'SHOPS_DEVICES', label: 'Shop Directory & Devices', icon: Building, badge: null },
          { id: 'REVENUE', label: 'Revenue & Analytics', icon: TrendingUp, badge: null },
          {
            id: 'BROADCASTS',
            label: 'Broadcast Announcements',
            icon: Megaphone,
            badge: globalBroadcast.active ? 'LIVE' : null,
          },
          { id: 'AUDIT_SECURITY', label: 'Audit Logs & Security', icon: ShieldCheck, badge: null },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = adminActiveTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAdminActiveTab(tab.id as AdminTab)}
              className={`pb-admin-tab ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.badge && <span className="pb-admin-tab-badge">{tab.badge}</span>}
            </button>
          );
        })}
      </nav>

      {/* Global Admin Notice Toast */}
      {adminNotice && (
        <div
          style={{
            background: '#ecfdf5',
            color: '#065f46',
            borderBottom: '1px solid #a7f3d0',
            padding: '10px 28px',
            fontSize: '12.5px',
            fontWeight: 650,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="#059669" />
            <span>{adminNotice}</span>
          </div>
          <button
            onClick={() => setAdminNotice(null)}
            style={{ border: 0, background: 'transparent', padding: '2px', cursor: 'pointer', color: '#065f46' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="pb-admin-content">
        {/* ========================================================= */}
        {/* TAB 0: PILOT APPLICATIONS */}
        {/* ========================================================= */}
        {adminActiveTab === 'APPLICATIONS' && (
          <div>
            {/* Stat Cards */}
            <div className="pb-admin-stats-grid">
              <div className="pb-admin-stat-card">
                <div className="pb-admin-stat-label">Pending Applications</div>
                <div
                  className="pb-admin-stat-val"
                  style={{ color: pendingAppCount > 0 ? '#d97706' : '#0f172a' }}
                >
                  {pendingAppCount}
                </div>
                <div className="pb-admin-stat-hint">Awaiting review &amp; provisioning</div>
              </div>

              <div className="pb-admin-stat-card">
                <div className="pb-admin-stat-label">Approved &amp; Active Shops</div>
                <div className="pb-admin-stat-val" style={{ color: '#059669' }}>
                  {approvedAppCount}
                </div>
                <div className="pb-admin-stat-hint">Credentials generated &amp; active</div>
              </div>

              <div className="pb-admin-stat-card">
                <div className="pb-admin-stat-label">Total Pilot Applications</div>
                <div className="pb-admin-stat-val">{applications.length}</div>
                <div className="pb-admin-stat-hint">From website &amp; onboarding requests</div>
              </div>

              <div className="pb-admin-stat-card">
                <div className="pb-admin-stat-label">Subscription Entitlement</div>
                <div className="pb-admin-stat-val" style={{ color: '#2563eb' }}>
                  Unlimited
                </div>
                <div className="pb-admin-stat-hint">Printers per subscribed shop</div>
              </div>
            </div>

            {/* Filter and Action Header */}
            <div className="pb-admin-filter-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 320px' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
                  <Search
                    size={15}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                    }}
                  />
                  <input
                    type="text"
                    className="pb-input"
                    placeholder="Search by shop name, city, phone or ID..."
                    value={appSearchQuery}
                    onChange={(e) => setAppSearchQuery(e.target.value)}
                    style={{ paddingLeft: '36px', height: '36px', fontSize: '12.5px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => {
                  const count =
                    status === 'ALL'
                      ? applications.length
                      : status === 'PENDING'
                      ? pendingAppCount
                      : status === 'APPROVED'
                      ? approvedAppCount
                      : rejectedAppCount;
                  const isSelected = appStatusFilter === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setAppStatusFilter(status)}
                      className={`pb-btn pb-btn-sm ${isSelected ? 'pb-btn-primary' : 'pb-btn-outline'}`}
                      style={{ fontSize: '11.5px', height: '34px', padding: '0 12px' }}
                    >
                      {status === 'ALL'
                        ? `All (${count})`
                        : status === 'PENDING'
                        ? `Pending (${count})`
                        : status === 'APPROVED'
                        ? `Approved (${count})`
                        : `Rejected (${count})`}
                    </button>
                  );
                })}

                <div style={{ width: '1px', height: '22px', background: '#e2e8f0', margin: '0 4px' }} />

                {/* Cloud Live Sync Indicator */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: cloudSyncStatus === 'CONNECTED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: cloudSyncStatus === 'CONNECTED' ? '#059669' : '#dc2626',
                    border: `1px solid ${cloudSyncStatus === 'CONNECTED' ? '#a7f3d0' : '#fecaca'}`,
                  }}
                  title="Live connection status with Supabase PostgreSQL cloud database"
                >
                  <div
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background:
                        cloudSyncStatus === 'CONNECTED'
                          ? '#10b981'
                          : cloudSyncStatus === 'CONNECTING'
                          ? '#f59e0b'
                          : '#ef4444',
                    }}
                  />
                  {cloudSyncStatus === 'CONNECTED'
                    ? 'Cloud Connected'
                    : cloudSyncStatus === 'CONNECTING'
                    ? 'Connecting...'
                    : 'Cloud Offline'}
                </div>

                {/* Sync Button */}
                <button
                  type="button"
                  onClick={() => fetchApplicationsFromCloud()}
                  disabled={isSyncing}
                  className="pb-btn pb-btn-outline pb-btn-sm"
                  style={{ height: '34px', fontSize: '11.5px', gap: '5px' }}
                  title="Poll Supabase Cloud for new submissions"
                >
                  <RefreshCw size={13} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
                </button>
              </div>
            </div>

            {/* Applications List */}
            {filteredApplications.length === 0 ? (
              <div className="pb-admin-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
                <UserCheck size={40} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px', color: '#0f172a' }}>
                  No Applications Found
                </h3>
                <p style={{ color: '#64748b', fontSize: '12.5px', margin: 0, maxWidth: '420px', marginInline: 'auto' }}>
                  {appSearchQuery || appStatusFilter !== 'ALL'
                    ? 'No applications match your active search filter.'
                    : 'When print shop owners submit the pilot application form on the website, they will appear here for admin review, subscription modification, and login credential generation.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {filteredApplications.map((app) => {
                  const rawPhone = app.contactNumber || '';
                  // Clean phone number: remove any existing +91 or non-digits to prevent double +91 +91
                  const cleanPhone = rawPhone.replace(/^\+?91\s*/, '').replace(/\D/g, '');
                  const displayPhone = `+91 ${cleanPhone || rawPhone}`;
                  const isPending = app.status === 'PENDING';
                  const isApproved = app.status === 'APPROVED';

                  return (
                    <div
                      key={app.id}
                      className={`pb-admin-card ${isPending ? 'pb-admin-card-pending' : ''}`}
                    >
                      {/* Header Row */}
                      <div className="pb-admin-card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              background: isPending
                                ? '#fef3c7'
                                : isApproved
                                ? '#ecfdf5'
                                : '#f1f5f9',
                              color: isPending ? '#b45309' : isApproved ? '#047857' : '#64748b',
                              display: 'grid',
                              placeItems: 'center',
                            }}
                          >
                            <Building size={18} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                                {app.shopName}
                              </h3>
                              <code
                                style={{
                                  fontSize: '11px',
                                  color: '#64748b',
                                  background: '#f1f5f9',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                }}
                              >
                                {app.id}
                              </code>
                            </div>
                            <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                              Applied: {new Date(app.appliedAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {isPending && (
                            <span
                              style={{
                                background: '#fef3c7',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#d97706' }} />
                              Pending Admin Review
                            </span>
                          )}
                          {isApproved && (
                            <span
                              style={{
                                background: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                              }}
                            >
                              <CheckCircle2 size={13} strokeWidth={2.5} />
                              Approved &amp; Active
                            </span>
                          )}
                          {app.status === 'REJECTED' && (
                            <span
                              style={{
                                background: '#fef2f2',
                                color: '#b91c1c',
                                border: '1px solid #fecaca',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                              }}
                            >
                              Rejected
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteApp(app.id)}
                            title="Delete Application Record"
                            style={{
                              background: 'transparent',
                              border: 0,
                              color: '#94a3b8',
                              padding: '6px',
                              cursor: 'pointer',
                              borderRadius: '6px',
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* 3-Column Body Grid */}
                      <div className="pb-admin-card-grid">
                        {/* Col 1: Shop & Contact */}
                        <div className="pb-admin-section-box">
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Shop Location &amp; Contact
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                            📍 {app.city}
                          </div>
                          <div style={{ fontSize: '13px', color: '#334155', marginBottom: '10px' }}>
                            📱 {displayPhone}
                          </div>
                          <a
                            href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                              `Hello ${app.shopName}! We received your Print Bot shop pilot request from ${app.city}.`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="pb-btn pb-btn-outline pb-btn-sm"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '11.5px',
                              color: '#047857',
                              background: '#ecfdf5',
                              borderColor: '#a7f3d0',
                              textDecoration: 'none',
                            }}
                          >
                            <Send size={12} /> Chat on WhatsApp
                          </a>
                        </div>

                        {/* Col 2: Subscription Modifier */}
                        <div className="pb-admin-section-box">
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Subscription Plan (Admin Managed)
                          </div>
                          <label style={{ display: 'block', fontSize: '11.5px', color: '#64748b', marginBottom: '4px' }}>
                            Configure / Modify Shop Plan:
                          </label>
                          <select
                            value={
                              app.plan?.includes('Month')
                                ? '1 Month'
                                : app.plan?.includes('Lifetime')
                                ? 'Lifetime Commercial'
                                : '1 Year'
                            }
                            onChange={(e) =>
                              handleModifyAppSubscription(
                                app.id,
                                e.target.value as '1 Month' | '1 Year' | 'Lifetime Commercial'
                              )
                            }
                            className="pb-select"
                            style={{ height: '36px', fontSize: '12px', fontWeight: 700 }}
                          >
                            <option value="1 Year">1 Year Subscription — ₹4,999 (2 Mo Free)</option>
                            <option value="1 Month">1 Month Subscription — ₹499/mo</option>
                            <option value="Lifetime Commercial">Lifetime Commercial — ₹14,999</option>
                          </select>
                          <small style={{ display: 'block', marginTop: '6px', color: '#94a3b8', fontSize: '11px', lineHeight: 1.4 }}>
                            Admin can modify subscription anytime in the exe. Includes unlimited connected printers.
                          </small>
                        </div>

                        {/* Col 3: Credentials & Actions */}
                        <div className="pb-admin-section-box">
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Workstation Access &amp; Credentials
                          </div>

                          {isPending && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => handleGenerateCredentialsFromApp(app)}
                                className="pb-btn pb-btn-primary pb-btn-sm"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '8px',
                                  fontSize: '12.5px',
                                  height: '38px',
                                }}
                              >
                                <Sparkles size={15} />
                                Generate Login Credentials
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectApp(app.id)}
                                className="pb-btn pb-btn-outline pb-btn-sm"
                                style={{ height: '32px', fontSize: '11.5px', color: '#64748b' }}
                              >
                                Decline Application
                              </button>
                            </div>
                          )}

                          {isApproved && (
                            <div>
                              <div
                                style={{
                                  background: '#ffffff',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '8px',
                                  padding: '8px 12px',
                                  marginBottom: '10px',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                  <span style={{ fontSize: '11px', color: '#64748b' }}>Username:</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <code style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>{app.generatedUsername}</code>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(app.generatedUsername || '');
                                        setAdminNotice(`Copied username @${app.generatedUsername}`);
                                      }}
                                      style={{ background: 'transparent', border: 0, padding: '2px', cursor: 'pointer', color: '#64748b' }}
                                      title="Copy Username"
                                    >
                                      <Copy size={12} />
                                    </button>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '11px', color: '#64748b' }}>License Key:</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <code style={{ fontSize: '12px', fontWeight: 800, color: '#2563eb' }}>
                                      {app.generatedKey}
                                    </code>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(app.generatedKey || '');
                                        setAdminNotice(`Copied License Key ${app.generatedKey}`);
                                      }}
                                      style={{ background: 'transparent', border: 0, padding: '2px', cursor: 'pointer', color: '#64748b' }}
                                      title="Copy Key"
                                    >
                                      <Copy size={12} />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <a
                                href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                                  `Hello *${app.shopName}*! 🎉\n\nYour Print Bot Workstation access is approved.\n\n*Login Credentials:*\n👤 *Username:* ${app.generatedUsername}\n🔑 *License Key:* ${app.generatedKey}\n📅 *Plan:* ${app.plan} (Unlimited Connected Printers)\n\nLaunch Print Bot Workstation software and enter your Username & Key to get started!`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="pb-btn pb-btn-primary pb-btn-sm"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  height: '34px',
                                  fontSize: '11.5px',
                                  background: '#059669',
                                  borderColor: '#059669',
                                  textDecoration: 'none',
                                  width: '100%',
                                }}
                              >
                                <Send size={13} /> Send Credentials on WhatsApp
                              </a>
                            </div>
                          )}

                          {app.status === 'REJECTED' && (
                            <div>
                              <small style={{ color: '#94a3b8', fontSize: '11.5px', display: 'block', marginBottom: '8px' }}>
                                Application was declined.
                              </small>
                              <button
                                type="button"
                                onClick={() => handleGenerateCredentialsFromApp(app)}
                                className="pb-btn pb-btn-outline pb-btn-sm"
                                style={{ height: '32px', fontSize: '11.5px' }}
                              >
                                Reconsider &amp; Approve
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1: LICENSES & KEYS */}
        {/* ========================================================= */}
        {adminActiveTab === 'LICENSES' && (
          <div>
            {/* Stat Cards */}
            <div className="pb-admin-stats-grid">
              <div className="pb-admin-stat-card">
                <div className="pb-admin-stat-label">Total Issued Keys</div>
                <div className="pb-admin-stat-val">{shopList.length}</div>
                <div className="pb-admin-stat-hint">Active and historic licenses</div>
              </div>

              <div className="pb-admin-stat-card">
                <div className="pb-admin-stat-label">Active Subscriptions</div>
                <div className="pb-admin-stat-val" style={{ color: '#059669' }}>{activeCount}</div>
                <div className="pb-admin-stat-hint">Currently active shop stations</div>
              </div>

              <div className="pb-admin-stat-card">
                <div className="pb-admin-stat-label">Revoked / Paused</div>
                <div className="pb-admin-stat-val" style={{ color: revokedCount > 0 ? '#dc2626' : '#64748b' }}>
                  {revokedCount}
                </div>
                <div className="pb-admin-stat-hint">Locked or expired keys</div>
              </div>

              <div className="pb-admin-stat-card">
                <div className="pb-admin-stat-label">Subscription Revenue</div>
                <div className="pb-admin-stat-val" style={{ color: '#2563eb' }}>
                  ₹{totalRevenueRupees.toLocaleString('en-IN')}
                </div>
                <div className="pb-admin-stat-hint">Direct ARR from issued keys</div>
              </div>
            </div>

            {/* Key Generator Card */}
            <div className="pb-admin-card" style={{ padding: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <PlusCircle size={20} color="#2563eb" />
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                    Generate New Shop License Key
                  </h2>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>
                    Issue an authenticated key for a Xerox shop subscription with unlimited connected printers.
                  </div>
                </div>
              </div>

              <form
                onSubmit={handleGenerateKey}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) auto',
                  gap: '12px',
                  alignItems: 'flex-end',
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '5px', color: '#334155' }}>
                    Xerox Shop Name *
                  </label>
                  <input
                    type="text"
                    className="pb-input"
                    placeholder="e.g. City Central Xerox"
                    value={newShopName}
                    onChange={(e) => setNewShopName(e.target.value)}
                    required
                    style={{ height: '38px', fontSize: '12.5px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '5px', color: '#334155' }}>
                    Shop Owner Username *
                  </label>
                  <input
                    type="text"
                    className="pb-input"
                    placeholder="e.g. central_xerox"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                    style={{ height: '38px', fontSize: '12.5px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '5px', color: '#334155' }}>
                    Plan Duration &amp; Price
                  </label>
                  <select
                    className="pb-select"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value as any)}
                    style={{ height: '38px', fontSize: '12.5px' }}
                  >
                    <option value="1 Month">1 Month (₹499)</option>
                    <option value="1 Year">1 Year (₹4,999)</option>
                    <option value="Lifetime Commercial">Lifetime Commercial (₹14,999)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="pb-btn pb-btn-primary"
                  style={{ height: '38px', fontSize: '12.5px', whiteSpace: 'nowrap' }}
                >
                  Generate Key
                </button>
              </form>

              {generatedKey && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '14px 18px',
                    borderRadius: '10px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', color: '#1d4ed8', textTransform: 'uppercase', fontWeight: 700 }}>
                      Newly Generated Key (Share with Shop Owner):
                    </span>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                      <code>{generatedKey}</code>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedKey);
                      setAdminNotice('Copied license key to clipboard!');
                    }}
                    className="pb-btn pb-btn-outline pb-btn-sm"
                    style={{ gap: '6px' }}
                  >
                    <Copy size={14} /> Copy Key
                  </button>
                </div>
              )}
            </div>

            {/* License Management Table */}
            <div className="pb-admin-table-card">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Active Shop Licenses ({filteredLicenses.length})
                </h2>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="pb-input"
                    placeholder="Search shop, username, or key..."
                    value={licenseSearchQuery}
                    onChange={(e) => setLicenseSearchQuery(e.target.value)}
                    style={{ width: '220px', fontSize: '12px', height: '34px' }}
                  />
                  <select
                    className="pb-select"
                    value={licenseStatusFilter}
                    onChange={(e) => setLicenseStatusFilter(e.target.value as any)}
                    style={{ fontSize: '12px', height: '34px', width: '130px' }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active Only</option>
                    <option value="REVOKED">Revoked Only</option>
                  </select>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="pb-admin-table">
                  <thead>
                    <tr>
                      <th>Shop &amp; Plan</th>
                      <th>Username</th>
                      <th>License Key</th>
                      <th>Expires At</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLicenses.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8' }}>
                          {shopList.length === 0
                            ? 'No shop licenses issued yet. Use the generator above to create your first shop license key.'
                            : 'No licenses match your search criteria.'}
                        </td>
                      </tr>
                    ) : (
                      filteredLicenses.map((lic) => (
                        <tr key={lic.username}>
                          <td>
                            <div style={{ fontWeight: 750, color: '#0f172a' }}>{lic.shopName}</div>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                background: '#f1f5f9',
                                color: '#475569',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                marginTop: '3px',
                                display: 'inline-block',
                              }}
                            >
                              {lic.duration || '1 Year'}
                            </span>
                          </td>

                          <td>
                            <code style={{ fontSize: '12px', color: '#334155' }}>{lic.username}</code>
                          </td>

                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <code style={{ background: '#f1f5f9', padding: '3px 6px', borderRadius: '4px', fontSize: '12px' }}>
                                {lic.licenseKey}
                              </code>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(lic.licenseKey);
                                  setAdminNotice(`Copied key for ${lic.shopName}`);
                                }}
                                style={{ border: 0, padding: '3px', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
                                title="Copy Key"
                              >
                                <Copy size={13} />
                              </button>
                            </div>
                          </td>

                          <td style={{ fontSize: '12px' }}>
                            <div style={{ color: '#0f172a' }}>{lic.expiresAt}</div>
                            <small style={{ color: new Date(lic.expiresAt) > new Date() ? '#059669' : '#dc2626' }}>
                              {new Date(lic.expiresAt) > new Date() ? 'Valid' : 'Expired'}
                            </small>
                          </td>

                          <td>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 700,
                                background: lic.status === 'ACTIVE' ? '#ecfdf5' : '#fef2f2',
                                color: lic.status === 'ACTIVE' ? '#047857' : '#b91c1c',
                              }}
                            >
                              {lic.status}
                            </span>
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              <button
                                onClick={() => handleExtendLicense(lic.username, '1 Year')}
                                className="pb-btn pb-btn-outline pb-btn-sm"
                                style={{ height: '28px', fontSize: '11px', padding: '0 8px', gap: '4px' }}
                                title="Extend license for 1 more year"
                              >
                                <RotateCcw size={11} /> +1 Year
                              </button>
                              <button
                                onClick={() => handleRevokeKey(lic.username)}
                                className="pb-btn pb-btn-outline pb-btn-sm"
                                style={{
                                  height: '28px',
                                  fontSize: '11px',
                                  padding: '0 8px',
                                  color: lic.status === 'ACTIVE' ? '#b91c1c' : '#047857',
                                }}
                              >
                                {lic.status === 'ACTIVE' ? 'Revoke' : 'Reactivate'}
                              </button>
                              <button
                                onClick={() => handleResetDevice(lic.username)}
                                className="pb-btn pb-btn-outline pb-btn-sm"
                                style={{ height: '28px', fontSize: '11px', padding: '0 8px', gap: '4px' }}
                                title="Allow shop owner to re-pair on a new computer"
                              >
                                <Laptop size={11} /> Reset PC
                              </button>
                              <button
                                onClick={() => handleDeleteKey(lic.username)}
                                className="pb-btn pb-btn-danger pb-btn-sm"
                                style={{ height: '28px', fontSize: '11px', padding: '0 8px' }}
                                title="Permanently delete this shop license key"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: SHOP DIRECTORY & DEVICES */}
        {/* ========================================================= */}
        {adminActiveTab === 'SHOPS_DEVICES' && (
          <div>
            <div
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '12px',
                padding: '14px 18px',
                marginBottom: '20px',
                fontSize: '12.5px',
                color: '#1e3a8a',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <Laptop size={22} color="#2563eb" style={{ flexShrink: 0 }} />
              <div>
                <strong>Hardware Device Binding Policy:</strong> Each subscribed Xerox shop connects unlimited physical
                printers through their authenticated Windows counter PC. Device pairing is locked to the counter computer's
                hardware/TPM identity to prevent unauthorized software copying. If a shop replaces their PC, click "Reset Hardware Pairing".
              </div>
            </div>

            {shopList.length === 0 ? (
              <div className="pb-admin-card" style={{ textAlign: 'center', padding: '48px 24px', color: '#94a3b8' }}>
                <Building2 size={40} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>
                  No Registered Shops
                </h3>
                <p style={{ fontSize: '12.5px', margin: 0 }}>
                  No shop licenses have been created yet. Go to Tab 1 (Licenses &amp; Keys) to issue the first shop license key.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                {shopList.map((lic) => (
                  <div
                    key={lic.username}
                    className="pb-admin-card"
                    style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0f172a' }}>{lic.shopName}</h3>
                          <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                            User: <code>{lic.username}</code> · Plan: {lic.duration || '1 Year'}
                          </div>
                        </div>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: lic.status === 'ACTIVE' ? '#ecfdf5' : '#fef2f2',
                            color: lic.status === 'ACTIVE' ? '#047857' : '#b91c1c',
                          }}
                        >
                          {lic.status}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gap: '6px', fontSize: '12px', color: '#334155' }}>
                        <div>
                          <strong style={{ color: '#64748b' }}>Location:</strong> {lic.location || 'Not set'}
                        </div>
                        <div>
                          <strong style={{ color: '#64748b' }}>Phone:</strong> {lic.phone || 'Not set'}
                        </div>
                        <div>
                          <strong style={{ color: '#64748b' }}>Order Dispatch Mode:</strong>{' '}
                          <span style={{ fontWeight: 650 }}>
                            {lic.orderMode === 'FULL_AUTOMATIC' ? '⚡ Full Automatic' : '✋ Manual Approval'}
                          </span>
                        </div>
                        <div>
                          <strong style={{ color: '#64748b' }}>Setup Status:</strong>{' '}
                          <span style={{ color: lic.isConfigured ? '#059669' : '#d97706', fontWeight: 650 }}>
                            {lic.isConfigured ? '✓ Configured & Operational' : '⏳ Pending Initial Setup'}
                          </span>
                        </div>

                        {/* Device Pairing info */}
                        <div
                          style={{
                            marginTop: '10px',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <div style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                            Authorized PC Identity (Hardware Key):
                          </div>
                          <div style={{ marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Laptop size={13} color="#64748b" />
                            <code style={{ fontSize: '11.5px', color: '#0f172a' }}>{lic.deviceId || 'Pending PC Login'}</code>
                          </div>
                          <small style={{ color: '#059669', fontSize: '10.5px', display: 'block', marginTop: '3px' }}>
                            ✓ TPM-backed hardware assurance
                          </small>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: '16px',
                        paddingTop: '12px',
                        borderTop: '1px solid #f1f5f9',
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: '8px',
                      }}
                    >
                      <button
                        onClick={() => handleResetDevice(lic.username)}
                        className="pb-btn pb-btn-outline pb-btn-sm"
                        style={{ height: '32px', fontSize: '11.5px', gap: '5px' }}
                      >
                        <Laptop size={13} /> Reset Hardware Pairing
                      </button>
                      <button
                        onClick={() => handleDeleteKey(lic.username)}
                        className="pb-btn pb-btn-danger pb-btn-sm"
                        style={{ height: '32px', fontSize: '11.5px', padding: '0 10px' }}
                        title="Delete this shop license permanently"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: REVENUE & ANALYTICS */}
        {/* ========================================================= */}
        {adminActiveTab === 'REVENUE' && (
          <div>
            <div className="pb-admin-stats-grid">
              <div className="pb-admin-stat-card">
                <div className="pb-admin-stat-label">Total Subscription Revenue</div>
                <div className="pb-admin-stat-val" style={{ color: '#2563eb' }}>
                  ₹{totalRevenueRupees.toLocaleString('en-IN')}
                </div>
                <div className="pb-admin-stat-hint">From {shopList.length} subscribed Xerox shops</div>
              </div>

              <div className="pb-admin-stat-card">
                <div className="pb-admin-stat-label">Projected Annual ARR</div>
                <div className="pb-admin-stat-val" style={{ color: '#059669' }}>
                  ₹{(activeCount * 4999).toLocaleString('en-IN')}
                </div>
                <div className="pb-admin-stat-hint">Recurring software subscription ARR</div>
              </div>

              <div className="pb-admin-stat-card">
                <div className="pb-admin-stat-label">Network Orders Handled</div>
                <div className="pb-admin-stat-val">{totalNetworkOrders.toLocaleString()}</div>
                <div className="pb-admin-stat-hint">Direct customer QR uploads</div>
              </div>

              <div className="pb-admin-stat-card">
                <div className="pb-admin-stat-label">Total Pages Spooled</div>
                <div className="pb-admin-stat-val">{totalNetworkPages.toLocaleString()}</div>
                <div className="pb-admin-stat-hint">High-level anonymous volume</div>
              </div>
            </div>

            {/* Privacy Guarantee Card */}
            <div
              className="pb-admin-card"
              style={{
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                padding: '18px 20px',
                marginBottom: '20px',
              }}
            >
              <ShieldCheck size={26} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>
                  Strict Zero-Knowledge Multi-Tenant Privacy Guarantee
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  Platform administrators can monitor high-level aggregate metrics (orders count, pages count, active printers,
                  and subscription revenue). Customer documents, PDFs, personal images, and uploaded files are end-to-end
                  isolated per shop and <strong>never visible to platform administrators</strong>.
                </p>
              </div>
            </div>

            {/* Shop Breakdown Table */}
            <div className="pb-admin-table-card">
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 14px', color: '#0f172a' }}>
                Anonymous Shop Volume Breakdown
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="pb-admin-table">
                  <thead>
                    <tr>
                      <th>Shop Name</th>
                      <th>Plan Duration</th>
                      <th>Completed Orders</th>
                      <th>Printed Pages</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shopList.map((lic) => (
                      <tr key={lic.username}>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>{lic.shopName}</td>
                        <td>{lic.duration || '1 Year'}</td>
                        <td style={{ fontWeight: 700 }}>{lic.totalOrdersCount || 0}</td>
                        <td style={{ fontWeight: 700 }}>{lic.totalPagesCount || 0}</td>
                        <td>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: lic.status === 'ACTIVE' ? '#ecfdf5' : '#fef2f2',
                              color: lic.status === 'ACTIVE' ? '#047857' : '#b91c1c',
                            }}
                          >
                            {lic.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: BROADCAST ANNOUNCEMENTS */}
        {/* ========================================================= */}
        {adminActiveTab === 'BROADCASTS' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
            <div className="pb-admin-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Megaphone size={20} color="#2563eb" />
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                    Network Broadcast Banner
                  </h2>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>
                    Publish an alert or system message to all Xerox shop counter workstations.
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveBroadcast} style={{ display: 'grid', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    id="broadcastActive"
                    checked={broadcastEnabledDraft}
                    onChange={(e) => setBroadcastEnabledDraft(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="broadcastActive" style={{ fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', color: '#0f172a' }}>
                    Broadcast is currently active on shop counters
                  </label>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '5px', color: '#334155' }}>
                    Banner Alert Level
                  </label>
                  <select
                    className="pb-select"
                    value={broadcastTypeDraft}
                    onChange={(e) => setBroadcastTypeDraft(e.target.value as any)}
                    style={{ height: '36px', fontSize: '12.5px' }}
                  >
                    <option value="info">Information (Blue · Maintenance / Tips)</option>
                    <option value="warning">Warning (Amber · Scheduled Downtime)</option>
                    <option value="urgent">Urgent Notice (Red · Emergency / Critical)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '5px', color: '#334155' }}>
                    Announcement Message Text
                  </label>
                  <textarea
                    rows={4}
                    className="pb-textarea"
                    value={broadcastDraft}
                    onChange={(e) => setBroadcastDraft(e.target.value)}
                    placeholder="e.g. Server maintenance scheduled tonight from 2:00 AM to 3:00 AM. Spooling will continue without interruption."
                    required
                    style={{ fontSize: '12.5px' }}
                  />
                </div>

                <button type="submit" className="pb-btn pb-btn-primary" style={{ height: '40px', fontSize: '12.5px', gap: '8px' }}>
                  <Send size={15} /> Publish Broadcast to All Counters
                </button>
              </form>
            </div>

            {/* Live Preview Simulation Card */}
            <div className="pb-admin-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>
                Live Counter Screen Preview
              </h3>
              <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '16px' }}>
                This is how the banner appears at the top of every shop owner's desktop workstation:
              </div>

              {broadcastEnabledDraft ? (
                <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <div
                    style={{
                      padding: '10px 14px',
                      background:
                        broadcastTypeDraft === 'urgent'
                          ? '#fee2e2'
                          : broadcastTypeDraft === 'warning'
                          ? '#fef3c7'
                          : '#dbeafe',
                      color:
                        broadcastTypeDraft === 'urgent'
                          ? '#991b1b'
                          : broadcastTypeDraft === 'warning'
                          ? '#92400e'
                          : '#1e40af',
                      fontSize: '12px',
                      fontWeight: 650,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Megaphone size={15} />
                    <span>
                      <strong>Platform Notice:</strong> {broadcastDraft || 'No message entered'}
                    </span>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '20px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
                    [ Counter Workspace Area Below ]
                  </div>
                </div>
              ) : (
                <div style={{ padding: '32px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', color: '#94a3b8', fontSize: '12.5px' }}>
                  Broadcast banner is currently disabled.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: AUDIT LOGS & SECURITY */}
        {/* ========================================================= */}
        {adminActiveTab === 'AUDIT_SECURITY' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
            <div className="pb-admin-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Key size={20} color="#2563eb" />
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                    Super-Admin Credentials
                  </h2>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>
                    Change your secret platform key / password from the default.
                  </div>
                </div>
              </div>

              <form onSubmit={handleChangeAdminPassword} style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '5px', color: '#334155' }}>
                    Current Admin Password
                  </label>
                  <input
                    type="password"
                    className="pb-input"
                    placeholder="Enter current password"
                    value={currentPassInput}
                    onChange={(e) => setCurrentPassInput(e.target.value)}
                    required
                    style={{ height: '36px', fontSize: '12.5px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '5px', color: '#334155' }}>
                    New Admin Password (min 6 characters)
                  </label>
                  <input
                    type="password"
                    className="pb-input"
                    placeholder="Enter new strong password"
                    value={newPassInput}
                    onChange={(e) => setNewPassInput(e.target.value)}
                    required
                    style={{ height: '36px', fontSize: '12.5px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '5px', color: '#334155' }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    className="pb-input"
                    placeholder="Confirm new password"
                    value={confirmPassInput}
                    onChange={(e) => setConfirmPassInput(e.target.value)}
                    required
                    style={{ height: '36px', fontSize: '12.5px' }}
                  />
                </div>

                {passChangeStatus && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 650,
                      background: passChangeStatus.type === 'success' ? '#ecfdf5' : '#fef2f2',
                      color: passChangeStatus.type === 'success' ? '#065f46' : '#991b1b',
                      border: `1px solid ${passChangeStatus.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                    }}
                  >
                    {passChangeStatus.msg}
                  </div>
                )}

                <button type="submit" className="pb-btn pb-btn-primary" style={{ height: '38px', fontSize: '12.5px', marginTop: '4px' }}>
                  Update Admin Password
                </button>
              </form>
            </div>

            {/* Audit Trail Card */}
            <div className="pb-admin-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <History size={20} color="#2563eb" />
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                    Platform Audit Trail
                  </h2>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>
                    Immutable record of key issuances, revocations, and security actions.
                  </div>
                </div>
              </div>

              <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {auditLogs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8' }}>
                      <History size={36} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                      <strong style={{ display: 'block', fontSize: '13px', color: '#0f172a' }}>No Audit Logs Yet</strong>
                      <small style={{ fontSize: '11px' }}>
                        Key issuances, shop edits, password changes, and security events will be automatically logged here.
                      </small>
                    </div>
                  ) : (
                    auditLogs.map((log) => (
                      <div
                        key={log.id}
                        style={{
                          padding: '10px 12px',
                          background: '#f8fafc',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: '#eff6ff',
                              color: '#2563eb',
                            }}
                          >
                            {log.action}
                          </span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>{log.timestamp}</span>
                        </div>
                        <div style={{ color: '#0f172a', fontWeight: 600, marginTop: '2px' }}>{log.details}</div>
                        <small style={{ color: '#64748b', fontSize: '10px' }}>Actor: {log.actor}</small>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Issued Credentials Modal */}
      {issuedCredsModal && (
        <div className="pb-modal-backdrop">
          <div className="pb-modal pb-modal-md">
            <div className="pb-modal-header">
              <h2 className="pb-modal-title">Workstation Login Credentials Generated</h2>
              <button
                type="button"
                className="pb-modal-close"
                onClick={() => setIssuedCredsModal(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="pb-modal-body">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '16px',
                  background: '#ecfdf5',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  color: '#065f46',
                  fontSize: '12.5px',
                  fontWeight: 650,
                }}
              >
                <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0 }} />
                <span>
                  Credentials for <strong>{issuedCredsModal.shopName}</strong> are active and synced.
                </span>
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ marginBottom: '12px' }}>
                  <small style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                    Shop Owner Username
                  </small>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '3px' }}>
                    <code style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{issuedCredsModal.username}</code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(issuedCredsModal.username);
                        setAdminNotice(`Copied username @${issuedCredsModal.username}`);
                      }}
                      className="pb-btn pb-btn-outline pb-btn-sm"
                      style={{ height: '28px', fontSize: '11px', gap: '4px' }}
                    >
                      <Copy size={12} /> Copy
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <small style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                    Workstation License Key
                  </small>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '3px' }}>
                    <code style={{ fontSize: '15px', fontWeight: 800, color: '#2563eb' }}>
                      {issuedCredsModal.key}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(issuedCredsModal.key);
                        setAdminNotice(`Copied License Key ${issuedCredsModal.key}`);
                      }}
                      className="pb-btn pb-btn-outline pb-btn-sm"
                      style={{ height: '28px', fontSize: '11px', gap: '4px' }}
                    >
                      <Copy size={12} /> Copy
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    borderTop: '1px solid #e2e8f0',
                    paddingTop: '8px',
                  }}
                >
                  <span style={{ color: '#64748b' }}>Subscription Validity:</span>
                  <strong style={{ color: '#0f172a' }}>
                    {issuedCredsModal.duration} (Valid until {issuedCredsModal.expiry})
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a
                  href={`https://wa.me/91${issuedCredsModal.phone.replace(/^\+?91\s*/, '').replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Hello *${issuedCredsModal.shopName}*! 🎉\n\nYour Print Bot Workstation access is approved.\n\n*Your Login Credentials:*\n👤 *Username:* ${issuedCredsModal.username}\n🔑 *License Key:* ${issuedCredsModal.key}\n📅 *Plan:* ${issuedCredsModal.duration} (Unlimited Connected Printers)\n\nLaunch Print Bot Workstation software and enter your Username & Key to get started!`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="pb-btn pb-btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    height: '40px',
                    background: '#059669',
                    borderColor: '#059669',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <Send size={14} /> Send Credentials via WhatsApp (+91 {issuedCredsModal.phone.replace(/^\+?91\s*/, '')})
                </a>

                <button
                  type="button"
                  onClick={() => {
                    const fullText = `Print Bot Workstation Access Approved\nShop: ${issuedCredsModal.shopName}\nUsername: ${issuedCredsModal.username}\nLicense Key: ${issuedCredsModal.key}\nPlan: ${issuedCredsModal.duration}\nValid until: ${issuedCredsModal.expiry}`;
                    navigator.clipboard.writeText(fullText);
                    setAdminNotice('Copied complete credentials summary to clipboard!');
                  }}
                  className="pb-btn pb-btn-outline"
                  style={{ height: '36px', fontSize: '12px', gap: '6px' }}
                >
                  <Copy size={13} /> Copy Full Invitation Summary
                </button>
              </div>
            </div>
            <div className="pb-modal-footer">
              <button
                type="button"
                className="pb-btn pb-btn-secondary"
                onClick={() => setIssuedCredsModal(null)}
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
