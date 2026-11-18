import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  KeyRound,
  Building,
  Building2,
  TrendingUp,
  Megaphone,
  LogOut,
  Search,
  RefreshCw,
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
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  User,
  Clock,
  Radio,
  Check,
  Lock,
  ChevronDown,
  Layers,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { type PrintJob } from '../App';

export interface PilotApplication {
  id: string;
  shopName: string;
  ownerName?: string;
  city: string;
  contactNumber: string;
  email?: string;
  plan: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedAt: string;
  generatedUsername?: string;
  generatedKey?: string;
  approvedAt?: string;
  notes?: string;
  raw?: any;
}

export interface ShopLicense {
  shopName: string;
  ownerName?: string;
  username: string;
  licenseKey: string;
  location?: string;
  phone?: string;
  email?: string;
  upiId?: string;
  status: 'ACTIVE' | 'REVOKED';
  createdAt?: string;
  expiresAt: string;
  duration?: '1 Month' | '1 Year' | 'Lifetime Commercial';
  deviceId?: string | null;
  deviceName?: string | null;
  deviceToken?: string | null;
  boundAt?: string | null;
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
    | 'KEY_REACTIVATED'
    | 'KEY_EXTENDED'
    | 'KEY_DELETED'
    | 'DEVICE_RESET'
    | 'DEVICE_UNBOUND'
    | 'BROADCAST_PUBLISHED'
    | 'SETTINGS_UPDATED'
    | 'PASSWORD_CHANGED'
    | 'PASSWORD_UPDATED'
    | 'ADMIN_LOGIN'
    | 'LOGIN_LOCKOUT';
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
  cloudSyncStatus: 'CONNECTED' | 'CONNECTING' | 'OFFLINE' | 'ACCESS_DENIED';
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
  newOwnerName: string;
  setNewOwnerName: (v: string) => void;
  newPhone: string;
  setNewPhone: (v: string) => void;
  newEmail: string;
  setNewEmail: (v: string) => void;
  newUsername: string;
  setNewUsername: (v: string) => void;
  newLocation: string;
  setNewLocation: (v: string) => void;
  newDuration: '1 Month' | '1 Year' | 'Lifetime Commercial';
  setNewDuration: (v: '1 Month' | '1 Year' | 'Lifetime Commercial') => void;
  handleGenerateKey: (e: React.FormEvent) => Promise<void>;
  generatedKey: string | null;
  handleRevokeKey: (username: string) => void;
  handleExtendLicense: (username: string, duration: '1 Month' | '1 Year') => void;
  handleResetDevice: (username: string) => Promise<void>;
  handleDeleteKey: (username: string) => void;
  globalBroadcast: { active: boolean; message: string; type: 'info' | 'warning' | 'urgent'; updatedAt: string };
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
    ownerName?: string;
    username: string;
    key: string;
    duration: string;
    expiry: string;
    phone: string;
    location?: string;
    email?: string;
  } | null;
  setIssuedCredsModal: (val: any) => void;
  jobs?: PrintJob[];
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
  newOwnerName,
  setNewOwnerName,
  newPhone,
  setNewPhone,
  newEmail,
  setNewEmail,
  newUsername,
  setNewUsername,
  newLocation,
  setNewLocation,
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
  jobs = [],
}) => {
  const [adminActiveTab, setAdminActiveTab] = useState<AdminTab>('APPLICATIONS');
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [licenseSearchQuery, setLicenseSearchQuery] = useState('');
  const [licenseStatusFilter, setLicenseStatusFilter] = useState<'ALL' | 'ACTIVE' | 'REVOKED'>('ALL');

  // Filter out the platform admin account from shop lists
  const shopList = Object.values(licenses).filter((l) => l.username.toLowerCase() !== 'admin');
  const activeCount = shopList.filter((l) => l.status === 'ACTIVE').length;
  const revokedCount = shopList.filter((l) => l.status === 'REVOKED').length;

  // Real Revenue Calculations
  const totalSubscriptionRevenue = shopList.reduce((acc, l) => {
    if (l.duration === '1 Month') return acc + 499;
    if (l.duration === 'Lifetime Commercial') return acc + 14999;
    return acc + 4999; // Default 1 Year
  }, 0);

  const completedJobs = jobs.filter((j) => j.status === 'COMPLETED');
  const totalNetworkOrders = completedJobs.length;
  const totalNetworkPages = completedJobs.reduce((acc, j) => acc + (j.page_count * (j.options.copies || 1)), 0);
  const totalPrintRevenueRupees = completedJobs.reduce((acc, j) => acc + (j.calculated_price_rupees || 0), 0);

  const pendingAppCount = applications.filter((a) => a.status === 'PENDING').length;

  // Filtered Applications
  const filteredApplications = applications.filter((app) => {
    if (appStatusFilter !== 'ALL' && app.status !== appStatusFilter) return false;
    if (!appSearchQuery.trim()) return true;
    const q = appSearchQuery.toLowerCase();
    return (
      app.shopName.toLowerCase().includes(q) ||
      (app.city && app.city.toLowerCase().includes(q)) ||
      (app.contactNumber && app.contactNumber.includes(q)) ||
      (app.generatedUsername && app.generatedUsername.toLowerCase().includes(q))
    );
  });

  // Filtered Licenses
  const filteredLicenses = shopList.filter((l) => {
    if (licenseStatusFilter !== 'ALL' && l.status !== licenseStatusFilter) return false;
    if (!licenseSearchQuery.trim()) return true;
    const q = licenseSearchQuery.toLowerCase();
    return (
      l.shopName.toLowerCase().includes(q) ||
      l.username.toLowerCase().includes(q) ||
      l.licenseKey.toLowerCase().includes(q) ||
      (l.location && l.location.toLowerCase().includes(q)) ||
      (l.phone && l.phone.includes(q))
    );
  });

  // Copy helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setAdminNotice(`Copied ${label} to clipboard: "${text}"`);
  };

  const navItems = [
    {
      id: 'APPLICATIONS',
      label: 'Pilot Applications',
      icon: UserCheck,
      badge: pendingAppCount > 0 ? `${pendingAppCount} NEW` : `${applications.length}`,
    },
    { id: 'LICENSES', label: 'Licenses & Keys', icon: KeyRound, badge: `${shopList.length}` },
    { id: 'SHOPS_DEVICES', label: 'Shop Directory & Devices', icon: Building, badge: `${shopList.length}` },
    { id: 'REVENUE', label: 'Revenue & Analytics', icon: TrendingUp, badge: null },
    {
      id: 'BROADCASTS',
      label: 'Broadcast Announcements',
      icon: Megaphone,
      badge: globalBroadcast.active ? 'LIVE' : null,
    },
    { id: 'AUDIT_SECURITY', label: 'Audit Logs & Security', icon: ShieldCheck, badge: `${auditLogs.length}` },
  ];

  return (
    <div className="pb-admin-layout">
      {/* ========================================================= */}
      {/* 1. SIDEBAR (VERTICAL NAVIGATION)                          */}
      {/* ========================================================= */}
      <aside className="pb-admin-sidebar">
        <div>
          {/* Brand Header */}
          <div className="pb-admin-sidebar-header">
            <div className="pb-admin-sidebar-brand">
              <div className="pb-admin-sidebar-logo">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2 className="pb-admin-sidebar-title">Print Bot</h2>
                <div className="pb-admin-sidebar-sub">
                  <span>Admin Center</span>
                  <span className="pb-admin-sidebar-badge">Super Admin</span>
                </div>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="pb-admin-sidebar-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = adminActiveTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAdminActiveTab(item.id as AdminTab)}
                  className={`pb-admin-nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                  {item.badge && <span className="pb-admin-nav-badge">{item.badge}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Info & Logout */}
        <div className="pb-admin-sidebar-footer">
          <div className="pb-admin-user-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#2563eb',
                  color: '#ffffff',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 800,
                  fontSize: '13px',
                }}
              >
                A
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 750, color: '#ffffff' }}>
                  {activeSession?.username || 'admin'}
                </div>
                <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>Platform Super Admin</div>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="pb-btn-link"
              style={{
                color: '#ef4444',
                padding: '6px',
                display: 'grid',
                placeItems: 'center',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.12)',
              }}
              title="Log out of Super Admin session"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MAIN CONTENT CONTAINER                                 */}
      {/* ========================================================= */}
      <div className="pb-admin-main-container">
        {/* Top Header Bar */}
        <header className="pb-admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Platform Operations</span>
            <span style={{ color: '#cbd5e1' }}>/</span>
            <strong style={{ fontSize: '15px', color: '#0f172a', fontWeight: 800 }}>
              {navItems.find((n) => n.id === adminActiveTab)?.label}
            </strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Live Database Sync Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11.5px',
                fontWeight: 700,
                color: cloudSyncStatus === 'CONNECTED' ? '#059669' : '#d97706',
                background: cloudSyncStatus === 'CONNECTED' ? '#ecfdf5' : '#fffbeb',
                padding: '4px 10px',
                borderRadius: '20px',
                border: `1px solid ${cloudSyncStatus === 'CONNECTED' ? '#a7f3d0' : '#fde68a'}`,
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: cloudSyncStatus === 'CONNECTED' ? '#10b981' : '#f59e0b',
                }}
              />
              <span>{cloudSyncStatus === 'CONNECTED' ? 'Cloud Connected' : 'Syncing...'}</span>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => {
                fetchApplicationsFromCloud();
                setAdminNotice('Synchronized live data with Supabase Cloud Database.');
              }}
              disabled={isSyncing}
              className="pb-btn pb-btn-secondary pb-btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '32px' }}
            >
              <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
            </button>
          </div>
        </header>

        {/* Global Admin Notice Toast */}
        {adminNotice && (
          <div
            style={{
              background: '#ecfdf5',
              color: '#065f46',
              borderBottom: '1px solid #a7f3d0',
              padding: '10px 32px',
              fontSize: '12.5px',
              fontWeight: 650,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              animation: 'slideDown 0.2s ease',
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

        {/* Scrollable View Area */}
        <div className="pb-admin-body-scroll">
          {/* ========================================================= */}
          {/* TAB 1: PILOT APPLICATIONS                                */}
          {/* ========================================================= */}
          {adminActiveTab === 'APPLICATIONS' && (
            <div>
              {/* Stat Counters Grid */}
              <div className="pb-admin-stats-grid">
                <div className="pb-admin-stat-card">
                  <div className="pb-admin-stat-label">Pending Applications</div>
                  <div className="pb-admin-stat-val" style={{ color: pendingAppCount > 0 ? '#ea580c' : '#0f172a' }}>
                    {pendingAppCount}
                  </div>
                  <div className="pb-admin-stat-hint">Awaiting review &amp; provisioning</div>
                </div>

                <div className="pb-admin-stat-card">
                  <div className="pb-admin-stat-label">Approved &amp; Active Shops</div>
                  <div className="pb-admin-stat-val" style={{ color: '#059669' }}>
                    {applications.filter((a) => a.status === 'APPROVED').length}
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

              {/* Filter Bar */}
              <div className="pb-admin-filter-bar">
                <div className="pb-search-box" style={{ width: '280px' }}>
                  <Search size={14} />
                  <input
                    type="text"
                    className="pb-search-input"
                    placeholder="Search by shop name, city..."
                    value={appSearchQuery}
                    onChange={(e) => setAppSearchQuery(e.target.value)}
                  />
                  {appSearchQuery && (
                    <button type="button" className="pb-search-clear" onClick={() => setAppSearchQuery('')}>
                      ✕
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setAppStatusFilter(st)}
                      className={`pb-btn pb-btn-sm ${appStatusFilter === st ? 'pb-btn-primary' : 'pb-btn-secondary'}`}
                      style={{ fontSize: '11.5px', textTransform: 'capitalize' }}
                    >
                      {st === 'ALL'
                        ? `All (${applications.length})`
                        : `${st.toLowerCase()} (${applications.filter((a) => a.status === st).length})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Applications List */}
              {filteredApplications.length === 0 ? (
                <div className="pb-admin-card" style={{ textAlign: 'center', padding: '48px 24px', color: '#94a3b8' }}>
                  <Building2 size={40} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>
                    No applications found
                  </h3>
                  <p style={{ fontSize: '12.5px', margin: 0 }}>
                    {appSearchQuery ? 'No pilot requests match your search criteria.' : 'No shop onboarding applications yet.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {filteredApplications.map((app) => {
                    const parsedNotes = (() => {
                      try {
                        return app.notes ? (typeof app.notes === 'string' ? JSON.parse(app.notes) : app.notes) : {};
                      } catch {
                        return {};
                      }
                    })();
                    const appEmail = app.email || parsedNotes.email || (app.generatedUsername ? licenses[app.generatedUsername]?.email : '') || '';

                    return (
                    <div
                      key={app.id}
                      className={`pb-admin-card ${app.status === 'PENDING' ? 'pb-admin-card-pending' : ''}`}
                    >
                      <div className="pb-admin-card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: '#eff6ff',
                              color: '#2563eb',
                              display: 'grid',
                              placeItems: 'center',
                            }}
                          >
                            <Building size={16} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                                {app.shopName}
                              </strong>
                              <span
                                style={{
                                  fontSize: '10.5px',
                                  color: '#64748b',
                                  background: '#f1f5f9',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  fontWeight: 700,
                                }}
                              >
                                {app.id}
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                              Applied: {new Date(app.appliedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 750,
                              padding: '3px 9px',
                              borderRadius: '12px',
                              background:
                                app.status === 'APPROVED' ? '#ecfdf5' : app.status === 'PENDING' ? '#fff7ed' : '#fef2f2',
                              color:
                                app.status === 'APPROVED' ? '#047857' : app.status === 'PENDING' ? '#c2410c' : '#b91c1c',
                            }}
                          >
                            {app.status === 'APPROVED' ? 'Approved & Active' : app.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteApp(app.id)}
                            className="pb-btn-link"
                            style={{ color: '#94a3b8', padding: '4px' }}
                            title="Delete application"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="pb-admin-card-grid">
                        {/* Column 1: Shop Location & Contact */}
                        <div className="pb-admin-section-box">
                          <span className="pb-admin-section-title">Shop Location &amp; Contact</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                            <MapPin size={13} color="#ef4444" />
                            <span>{app.city || 'Main Counter'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                            <Phone size={13} color="#2563eb" />
                            <span>{app.contactNumber || 'Contact not specified'}</span>
                          </div>
                          {appEmail && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                              <Mail size={13} color="#059669" />
                              <span style={{ color: '#0f172a', fontWeight: 600 }}>{appEmail}</span>
                            </div>
                          )}
                        </div>

                        {/* Column 2: Subscription Plan */}
                        <div className="pb-admin-section-box">
                          <span className="pb-admin-section-title">Subscription Plan (Admin Managed)</span>
                          <div style={{ fontSize: '11.5px', color: '#64748b' }}>Configure / Modify Shop Plan:</div>
                          <select
                            className="pb-select"
                            value={app.plan}
                            onChange={(e) => handleModifyAppSubscription(app.id, e.target.value as any)}
                            style={{ height: '32px', fontSize: '12px' }}
                          >
                            <option value="1 Month">1 Month Subscription — ₹499</option>
                            <option value="1 Year">1 Year Subscription — ₹4,999 (2 Mo Free)</option>
                            <option value="Lifetime Commercial">Lifetime Commercial — ₹14,999</option>
                          </select>
                          <div style={{ fontSize: '10.5px', color: '#64748b', lineHeight: 1.3 }}>
                            Admin can modify subscription anytime in the exe. Includes unlimited connected printers.
                          </div>
                        </div>

                        {/* Column 3: Workstation Access & Credentials */}
                        <div className="pb-admin-section-box">
                          <span className="pb-admin-section-title">Workstation Access &amp; Credentials</span>
                          {app.status === 'APPROVED' && app.generatedUsername && app.generatedKey ? (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                                <span style={{ color: '#64748b' }}>Username:</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <code style={{ fontWeight: 700, color: '#0f172a' }}>{app.generatedUsername}</code>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(app.generatedUsername!, 'Username')}
                                    className="pb-btn-link"
                                    style={{ color: '#64748b', padding: '2px' }}
                                  >
                                    <Copy size={11} />
                                  </button>
                                </div>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                                <span style={{ color: '#64748b' }}>License Key:</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <code style={{ fontWeight: 700, color: '#2563eb' }}>{app.generatedKey}</code>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(app.generatedKey!, 'License Key')}
                                    className="pb-btn-link"
                                    style={{ color: '#64748b', padding: '2px' }}
                                  >
                                    <Copy size={11} />
                                  </button>
                                </div>
                              </div>
                              <a
                                href={`mailto:${appEmail}?subject=${encodeURIComponent(
                                  `Your Print Bot Workstation Credentials - ${app.shopName}`
                                )}&body=${encodeURIComponent(
                                  `Hello ${app.shopName}!\n\nYour Print Bot Workstation access is approved.\n\nHere are your workstation credentials:\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Username: ${app.generatedUsername}\n🔑 License Key: ${app.generatedKey}\n📅 Plan: ${app.plan}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nHow to get started:\n1. Open Print Bot software on your counter PC.\n2. Enter your Username & License Key.\n3. Your workstation will automatically pair to your connected printers!\n\nSupport: support@printbot.in`
                                )}`}
                                className="pb-btn pb-btn-primary pb-btn-sm"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11.5px', marginTop: '6px', textDecoration: 'none' }}
                              >
                                <Mail size={12} /> Send Credentials to Email
                              </a>
                            </>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleGenerateCredentialsFromApp(app)}
                                className="pb-btn pb-btn-primary pb-btn-sm"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                              >
                                <Sparkles size={13} /> Approve &amp; Generate Key
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectApp(app.id)}
                                className="pb-btn pb-btn-secondary pb-btn-sm"
                                style={{ color: '#dc2626' }}
                              >
                                Reject Application
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
          {/* TAB 2: LICENSES & KEYS                                    */}
          {/* ========================================================= */}
          {adminActiveTab === 'LICENSES' && (
            <div>
              {/* Stats Grid */}
              <div className="pb-admin-stats-grid">
                <div className="pb-admin-stat-card">
                  <div className="pb-admin-stat-label">Total Issued Keys</div>
                  <div className="pb-admin-stat-val">{shopList.length}</div>
                  <div className="pb-admin-stat-hint">Active and historic licenses</div>
                </div>

                <div className="pb-admin-stat-card">
                  <div className="pb-admin-stat-label">Active Subscriptions</div>
                  <div className="pb-admin-stat-val" style={{ color: '#059669' }}>
                    {activeCount}
                  </div>
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
                    ₹{totalSubscriptionRevenue.toLocaleString('en-IN')}
                  </div>
                  <div className="pb-admin-stat-hint">Direct ARR from issued keys</div>
                </div>
              </div>

              {/* Comprehensive Key Generator Card */}
              <div className="pb-admin-card" style={{ padding: '24px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: '#dbeafe',
                      color: '#2563eb',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <PlusCircle size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                      Generate New Shop License Key
                    </h2>
                    <div style={{ color: '#64748b', fontSize: '12px' }}>
                      Fill shop details to issue an authenticated subscription key with unlimited connected printers.
                    </div>
                  </div>
                </div>

                <form onSubmit={handleGenerateKey}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                      gap: '14px',
                      marginBottom: '16px',
                    }}
                  >
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '5px', color: '#334155' }}>
                        Shop Name *
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
                        Shop Owner Name
                      </label>
                      <input
                        type="text"
                        className="pb-input"
                        placeholder="e.g. Rajesh Kumar"
                        value={newOwnerName}
                        onChange={(e) => setNewOwnerName(e.target.value)}
                        style={{ height: '38px', fontSize: '12.5px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '5px', color: '#334155' }}>
                        Contact Phone Number *
                      </label>
                      <input
                        type="text"
                        className="pb-input"
                        placeholder="e.g. +91 98765 43210"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        required
                        style={{ height: '38px', fontSize: '12.5px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '5px', color: '#334155' }}>
                        Email Address
                      </label>
                      <input
                        type="email"
                        className="pb-input"
                        placeholder="e.g. shop@gmail.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        style={{ height: '38px', fontSize: '12.5px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '5px', color: '#334155' }}>
                        Username (Unique Station ID) *
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
                        Location / City
                      </label>
                      <input
                        type="text"
                        className="pb-input"
                        placeholder="e.g. Gandhipuram, Coimbatore"
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        style={{ height: '38px', fontSize: '12.5px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '5px', color: '#334155' }}>
                        Plan Duration &amp; Price *
                      </label>
                      <select
                        className="pb-select"
                        value={newDuration}
                        onChange={(e) => setNewDuration(e.target.value as any)}
                        style={{ height: '38px', fontSize: '12.5px' }}
                      >
                        <option value="1 Month">1 Month (₹499)</option>
                        <option value="1 Year">1 Year (₹4,999 - 2 Months Free)</option>
                        <option value="Lifetime Commercial">Lifetime Commercial (₹14,999)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="submit"
                      className="pb-btn pb-btn-primary"
                      style={{ height: '40px', padding: '0 24px', fontSize: '13px', fontWeight: 700 }}
                    >
                      <PlusCircle size={15} /> Generate License Key
                    </button>
                  </div>
                </form>

                {/* Generated Key Inline Feedback */}
                {generatedKey && (
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '14px 18px',
                      background: '#ecfdf5',
                      borderRadius: '8px',
                      border: '1px solid #a7f3d0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '12px', color: '#065f46', fontWeight: 700 }}>
                        Key Issued Successfully:
                      </span>
                      <code style={{ fontSize: '16px', fontWeight: 800, color: '#047857', marginLeft: '8px' }}>
                        {generatedKey}
                      </code>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(generatedKey, 'License Key')}
                      className="pb-btn pb-btn-secondary pb-btn-sm"
                      style={{ gap: '6px' }}
                    >
                      <Copy size={13} /> Copy Key
                    </button>
                  </div>
                )}
              </div>

              {/* Active Shop Licenses Table */}
              <div className="pb-admin-table-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                    Active Shop Licenses ({filteredLicenses.length})
                  </h3>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="pb-input"
                      placeholder="Search shop, username, key..."
                      value={licenseSearchQuery}
                      onChange={(e) => setLicenseSearchQuery(e.target.value)}
                      style={{ width: '220px', height: '32px', fontSize: '11.5px' }}
                    />
                    <select
                      className="pb-select"
                      value={licenseStatusFilter}
                      onChange={(e) => setLicenseStatusFilter(e.target.value as any)}
                      style={{ height: '32px', fontSize: '11.5px' }}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="ACTIVE">Active</option>
                      <option value="REVOKED">Revoked</option>
                    </select>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="pb-admin-table">
                    <thead>
                      <tr>
                        <th>Shop &amp; Owner</th>
                        <th>Username</th>
                        <th>License Key</th>
                        <th>Plan &amp; Expiry</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLicenses.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>
                            No shop licenses match the filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredLicenses.map((lic) => (
                          <tr key={lic.username}>
                            <td>
                              <strong style={{ color: '#0f172a' }}>{lic.shopName}</strong>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>
                                {lic.ownerName ? `${lic.ownerName} · ` : ''}{lic.location || 'Main Counter'}
                              </div>
                            </td>
                            <td>
                              <code>{lic.username}</code>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <code style={{ color: '#2563eb', fontWeight: 700 }}>{lic.licenseKey}</code>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(lic.licenseKey, 'License Key')}
                                  className="pb-btn-link"
                                  style={{ color: '#94a3b8' }}
                                >
                                  <Copy size={11} />
                                </button>
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 650 }}>{lic.duration || '1 Year'}</div>
                              <div style={{ fontSize: '10.5px', color: '#64748b' }}>Expires: {lic.expiresAt}</div>
                            </td>
                            <td>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '10.5px',
                                  fontWeight: 750,
                                  background: lic.status === 'ACTIVE' ? '#ecfdf5' : '#fef2f2',
                                  color: lic.status === 'ACTIVE' ? '#047857' : '#b91c1c',
                                }}
                              >
                                {lic.status}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleExtendLicense(lic.username, '1 Year')}
                                  className="pb-btn pb-btn-secondary pb-btn-sm"
                                  style={{ fontSize: '11px', height: '28px', padding: '0 8px' }}
                                  title="Extend license by 1 year"
                                >
                                  +1 Year
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRevokeKey(lic.username)}
                                  className="pb-btn pb-btn-secondary pb-btn-sm"
                                  style={{ fontSize: '11px', height: '28px', padding: '0 8px' }}
                                >
                                  {lic.status === 'ACTIVE' ? 'Revoke' : 'Reactivate'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteKey(lic.username)}
                                  className="pb-btn pb-btn-danger pb-btn-sm"
                                  style={{ fontSize: '11px', height: '28px', padding: '0 8px' }}
                                  title="Delete key permanently"
                                >
                                  <Trash2 size={12} />
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
          {/* TAB 3: SHOPS & DEVICES                                    */}
          {/* ========================================================= */}
          {adminActiveTab === 'SHOPS_DEVICES' && (
            <div>
              {/* Policy Banner */}
              <div
                className="pb-admin-card"
                style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '16px 20px',
                  marginBottom: '20px',
                }}
              >
                <Laptop size={22} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h3 style={{ fontSize: '13.5px', fontWeight: 800, margin: '0 0 3px', color: '#1e3a8a' }}>
                    Hardware Node Device Binding Policy
                  </h3>
                  <p style={{ margin: 0, fontSize: '11.5px', color: '#1e40af', lineHeight: 1.45 }}>
                    Each subscribed Xerox shop connects unlimited physical printers through their authenticated Windows counter PC.
                    Device pairing is cryptographically locked to the workstation's hardware/TPM identity to prevent unauthorized cloning.
                    If a shop upgrades or replaces their counter computer, click <strong>Reset Hardware Pairing</strong>.
                  </p>
                </div>
              </div>

              {/* Shop & Devices Grid */}
              {shopList.length === 0 ? (
                <div className="pb-admin-card" style={{ textAlign: 'center', padding: '48px 24px', color: '#94a3b8' }}>
                  <Building2 size={40} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>
                    No Registered Shops
                  </h3>
                  <p style={{ fontSize: '12.5px', margin: 0 }}>
                    No shop licenses have been created yet. Issue a license key to register a shop.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
                  {shopList.map((lic) => (
                    <div
                      key={lic.username}
                      className="pb-admin-card"
                      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px' }}
                    >
                      <div>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                          <div>
                            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                              {lic.shopName}
                            </h3>
                            <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                              User: <code>{lic.username}</code> · Plan: {lic.duration || '1 Year'}
                            </div>
                          </div>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '10.5px',
                              fontWeight: 750,
                              background: lic.status === 'ACTIVE' ? '#ecfdf5' : '#fef2f2',
                              color: lic.status === 'ACTIVE' ? '#047857' : '#b91c1c',
                            }}
                          >
                            {lic.status}
                          </span>
                        </div>

                        {/* Shop Details */}
                        <div style={{ display: 'grid', gap: '8px', fontSize: '12px', color: '#334155', marginBottom: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <User size={13} color="#64748b" />
                            <span><strong style={{ color: '#64748b' }}>Owner:</strong> {lic.ownerName || lic.shopName}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={13} color="#64748b" />
                            <span><strong style={{ color: '#64748b' }}>Location:</strong> {lic.location || 'Main Counter'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Phone size={13} color="#64748b" />
                            <span><strong style={{ color: '#64748b' }}>Phone:</strong> {lic.phone || 'Contact on file'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Radio size={13} color="#64748b" />
                            <span>
                              <strong style={{ color: '#64748b' }}>Dispatch Mode:</strong>{' '}
                              <span style={{ fontWeight: 700, color: lic.orderMode === 'FULL_AUTOMATIC' ? '#059669' : '#d97706' }}>
                                {lic.orderMode === 'FULL_AUTOMATIC' ? '⚡ Full Automatic' : '✋ Manual Approval'}
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Device Pairing info card */}
                        <div
                          style={{
                            padding: '12px 14px',
                            borderRadius: '8px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>
                              Authorized PC Identity
                            </span>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 750,
                                color: lic.deviceId ? '#059669' : '#ea580c',
                                background: lic.deviceId ? '#ecfdf5' : '#fff7ed',
                                padding: '1px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              {lic.deviceId ? '● Node Locked' : '○ Pending First Login'}
                            </span>
                          </div>

                          <div style={{ display: 'grid', gap: '4px', fontSize: '11.5px' }}>
                            <div>
                              <strong style={{ color: '#64748b' }}>Machine Name:</strong>{' '}
                              <span style={{ fontWeight: 700, color: lic.deviceName ? '#0f172a' : '#94a3b8' }}>
                                {lic.deviceName || 'Awaiting Station Login'}
                              </span>
                            </div>
                            <div>
                              <strong style={{ color: '#64748b' }}>Hardware Key:</strong>{' '}
                              {lic.deviceId ? (
                                <code style={{ fontSize: '11px', color: '#2563eb' }}>{lic.deviceId}</code>
                              ) : (
                                <span style={{ color: '#94a3b8' }}>Unbound</span>
                              )}
                            </div>
                            <div>
                              <strong style={{ color: '#64748b' }}>Binding Timestamp:</strong>{' '}
                              <span style={{ color: lic.boundAt ? '#334155' : '#94a3b8' }}>
                                {lic.boundAt
                                  ? new Date(lic.boundAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                                  : 'Not Bound Yet'}
                              </span>
                            </div>
                            <div>
                              <strong style={{ color: '#64748b' }}>Architecture:</strong>{' '}
                              <span style={{ color: '#334155' }}>Tauri 2.0 Native x86_64 Win32 Spooler</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div
                        style={{
                          marginTop: '16px',
                          paddingTop: '12px',
                          borderTop: '1px solid #f1f5f9',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleResetDevice(lic.username)}
                          className="pb-btn pb-btn-secondary pb-btn-sm"
                          style={{ height: '32px', fontSize: '11.5px', gap: '6px' }}
                        >
                          <Laptop size={13} /> Reset Hardware Pairing
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteKey(lic.username)}
                          className="pb-btn pb-btn-danger pb-btn-sm"
                          style={{ height: '32px', fontSize: '11.5px', padding: '0 10px' }}
                          title="Delete shop license"
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
          {/* TAB 4: REVENUE & ANALYTICS                                */}
          {/* ========================================================= */}
          {adminActiveTab === 'REVENUE' && (
            <div>
              {/* Stats Grid */}
              <div className="pb-admin-stats-grid">
                <div className="pb-admin-stat-card">
                  <div className="pb-admin-stat-label">Total Subscription Revenue</div>
                  <div className="pb-admin-stat-val" style={{ color: '#2563eb' }}>
                    ₹{totalSubscriptionRevenue.toLocaleString('en-IN')}
                  </div>
                  <div className="pb-admin-stat-hint">From {shopList.length} subscribed Xerox shops</div>
                </div>

                <div className="pb-admin-stat-card">
                  <div className="pb-admin-stat-label">Projected Annual ARR</div>
                  <div className="pb-admin-stat-val" style={{ color: '#059669' }}>
                    ₹{(activeCount * 4999).toLocaleString('en-IN')}
                  </div>
                  <div className="pb-admin-stat-hint">Software subscription run-rate</div>
                </div>

                <div className="pb-admin-stat-card">
                  <div className="pb-admin-stat-label">Network Orders Handled</div>
                  <div className="pb-admin-stat-val">{totalNetworkOrders}</div>
                  <div className="pb-admin-stat-hint">Direct customer QR uploads</div>
                </div>

                <div className="pb-admin-stat-card">
                  <div className="pb-admin-stat-label">Total Pages Spooled</div>
                  <div className="pb-admin-stat-val">{totalNetworkPages}</div>
                  <div className="pb-admin-stat-hint">Aggregated print volume</div>
                </div>
              </div>

              {/* Zero-Knowledge Privacy Card */}
              <div
                className="pb-admin-card"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
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

              {/* Shop Volume Breakdown Table */}
              <div className="pb-admin-table-card">
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 14px', color: '#0f172a' }}>
                  Anonymous Shop Volume &amp; Revenue Breakdown
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="pb-admin-table">
                    <thead>
                      <tr>
                        <th>Shop Name</th>
                        <th>Plan &amp; License</th>
                        <th>Completed Orders</th>
                        <th>Printed Pages</th>
                        <th>Print Turnover (₹)</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shopList.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>
                            No active shops in directory.
                          </td>
                        </tr>
                      ) : (
                        shopList.map((lic) => {
                          const shopJobs = completedJobs.filter(
                            (j) =>
                              ((j as any).shop_id && (j as any).shop_id === lic.username.toLowerCase()) ||
                              j.customer_email.toLowerCase().includes(lic.username.toLowerCase()) ||
                              shopList.length === 1
                          );
                          const shopOrderCount = shopJobs.length;
                          const shopPageCount = shopJobs.reduce((acc, j) => acc + (j.page_count * (j.options.copies || 1)), 0);
                          const shopGmv = shopJobs.reduce((acc, j) => acc + (j.calculated_price_rupees || 0), 0);

                          return (
                            <tr key={lic.username}>
                              <td>
                                <strong style={{ color: '#0f172a' }}>{lic.shopName}</strong>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                  {lic.location || 'Main Counter'}
                                </div>
                              </td>
                              <td>
                                <div>{lic.duration || '1 Year'}</div>
                                <code style={{ fontSize: '10.5px', color: '#2563eb' }}>{lic.licenseKey}</code>
                              </td>
                              <td>
                                <strong style={{ fontSize: '13px', color: '#0f172a' }}>{shopOrderCount}</strong>
                              </td>
                              <td>
                                <strong style={{ fontSize: '13px', color: '#0f172a' }}>{shopPageCount}</strong>
                              </td>
                              <td>
                                <strong style={{ fontSize: '13px', color: '#059669' }}>
                                  ₹{shopGmv > 0 ? shopGmv.toFixed(2) : (lic.duration === '1 Month' ? '499.00' : '4,999.00')}
                                </strong>
                              </td>
                              <td>
                                <span
                                  style={{
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '10.5px',
                                    fontWeight: 750,
                                    background: lic.status === 'ACTIVE' ? '#ecfdf5' : '#fef2f2',
                                    color: lic.status === 'ACTIVE' ? '#047857' : '#b91c1c',
                                  }}
                                >
                                  {lic.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: BROADCAST ANNOUNCEMENTS                            */}
          {/* ========================================================= */}
          {adminActiveTab === 'BROADCASTS' && (
            <div>
              {/* Current Status Card */}
              <div
                className="pb-admin-card"
                style={{
                  background: globalBroadcast.active ? '#eff6ff' : '#f8fafc',
                  border: `1px solid ${globalBroadcast.active ? '#bfdbfe' : '#e2e8f0'}`,
                  padding: '20px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: globalBroadcast.active ? '#2563eb' : '#94a3b8',
                      color: '#ffffff',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <Megaphone size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                        {globalBroadcast.active ? 'Network Broadcast is LIVE' : 'Network Broadcast is Inactive'}
                      </strong>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: globalBroadcast.active ? '#dbeafe' : '#f1f5f9',
                          color: globalBroadcast.active ? '#1e40af' : '#64748b',
                        }}
                      >
                        {globalBroadcast.type.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ color: '#475569', fontSize: '12.5px', marginTop: '3px' }}>
                      &ldquo;{globalBroadcast.message}&rdquo;
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Updated: {globalBroadcast.updatedAt || 'Recent'}
                </div>
              </div>

              {/* Broadcast Composer */}
              <div className="pb-admin-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>
                  Compose Network Announcement
                </h3>
                <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 18px' }}>
                  This banner message is instantly broadcast to all active shop workstation counters and customer checkout screens across the network.
                </p>

                <form onSubmit={handleSaveBroadcast}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <input
                      type="checkbox"
                      id="broadcastToggle"
                      checked={broadcastEnabledDraft}
                      onChange={(e) => setBroadcastEnabledDraft(e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <label htmlFor="broadcastToggle" style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}>
                      Publish live announcement banner across all shop workstations
                    </label>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '5px', color: '#334155' }}>
                      Announcement Severity Level
                    </label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {(['info', 'warning', 'urgent'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setBroadcastTypeDraft(type)}
                          className={`pb-btn pb-btn-sm ${broadcastTypeDraft === type ? 'pb-btn-primary' : 'pb-btn-secondary'}`}
                          style={{
                            textTransform: 'capitalize',
                            fontWeight: broadcastTypeDraft === type ? 750 : 600,
                          }}
                        >
                          {type === 'info' ? 'ℹ Info (Blue)' : type === 'warning' ? '⚠ Warning (Amber)' : '🚨 Urgent (Red)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: '18px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '5px', color: '#334155' }}>
                      Broadcast Message Content *
                    </label>
                    <textarea
                      className="pb-input"
                      rows={3}
                      placeholder="e.g. Scheduled server maintenance tonight from 11:00 PM to 11:30 PM. Offline spooling remains active."
                      value={broadcastDraft}
                      onChange={(e) => setBroadcastDraft(e.target.value)}
                      required
                      style={{ fontSize: '13px', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="submit"
                      className="pb-btn pb-btn-primary"
                      style={{ height: '40px', padding: '0 24px', fontSize: '13px', fontWeight: 700 }}
                    >
                      <Megaphone size={15} /> Publish Network Broadcast
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: AUDIT LOGS & SECURITY                              */}
          {/* ========================================================= */}
          {adminActiveTab === 'AUDIT_SECURITY' && (
            <div>
              {/* Change Password Card */}
              <div className="pb-admin-card" style={{ padding: '24px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: '#eff6ff',
                      color: '#2563eb',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <Key size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                      Change Super Admin Master Password
                    </h3>
                    <div style={{ color: '#64748b', fontSize: '12px' }}>
                      Updates the platform administrator password in the Supabase Cloud Database.
                    </div>
                  </div>
                </div>

                <form onSubmit={handleChangeAdminPassword} style={{ maxWidth: '480px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                      Current Master Password
                    </label>
                    <input
                      type="password"
                      className="pb-input"
                      placeholder="Enter current password"
                      value={currentPassInput}
                      onChange={(e) => setCurrentPassInput(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                      New Master Password
                    </label>
                    <input
                      type="password"
                      className="pb-input"
                      placeholder="Enter new strong password"
                      value={newPassInput}
                      onChange={(e) => setNewPassInput(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      className="pb-input"
                      placeholder="Confirm new password"
                      value={confirmPassInput}
                      onChange={(e) => setConfirmPassInput(e.target.value)}
                      required
                    />
                  </div>

                  {passChangeStatus && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '6px',
                        marginBottom: '16px',
                        fontSize: '12px',
                        fontWeight: 650,
                        background: passChangeStatus.type === 'success' ? '#ecfdf5' : '#fef2f2',
                        color: passChangeStatus.type === 'success' ? '#047857' : '#b91c1c',
                      }}
                    >
                      {passChangeStatus.msg}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="pb-btn pb-btn-primary"
                    style={{ height: '36px', fontSize: '12.5px', fontWeight: 700 }}
                  >
                    Update Master Password
                  </button>
                </form>
              </div>

              {/* Audit Logs Table */}
              <div className="pb-admin-table-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                      Immutable Security Audit Trail ({auditLogs.length})
                    </h3>
                    <div style={{ color: '#64748b', fontSize: '11.5px' }}>
                      All platform actions, key events, and logins are audited and persisted.
                    </div>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="pb-admin-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Action Type</th>
                        <th>Actor</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>
                            No audit trail entries recorded yet.
                          </td>
                        </tr>
                      ) : (
                        auditLogs.map((log) => (
                          <tr key={log.id}>
                            <td style={{ whiteSpace: 'nowrap', fontSize: '11.5px', color: '#64748b' }}>
                              {log.timestamp}
                            </td>
                            <td>
                              <span
                                style={{
                                  fontSize: '10.5px',
                                  fontWeight: 750,
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  background:
                                    log.action.includes('ISSUED') || log.action.includes('APPROVED')
                                      ? '#ecfdf5'
                                      : log.action.includes('REVOKED') || log.action.includes('DELETED')
                                      ? '#fef2f2'
                                      : '#eff6ff',
                                  color:
                                    log.action.includes('ISSUED') || log.action.includes('APPROVED')
                                      ? '#047857'
                                      : log.action.includes('REVOKED') || log.action.includes('DELETED')
                                      ? '#b91c1c'
                                      : '#1e40af',
                                }}
                              >
                                {log.action}
                              </span>
                            </td>
                            <td>
                              <code>{log.actor}</code>
                            </td>
                            <td style={{ fontSize: '12px', color: '#334155' }}>{log.details}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. ISSUED CREDENTIALS POPUP MODAL                         */}
      {/* ========================================================= */}
      {issuedCredsModal && (
        <div className="pb-modal-backdrop" onClick={() => setIssuedCredsModal(null)}>
          <div
            className="pb-modal pb-modal-md"
            style={{ maxWidth: '520px', padding: '28px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: '#ecfdf5',
                  color: '#059669',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>
                New License Key Issued!
              </h3>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                Credentials for <strong>{issuedCredsModal.shopName}</strong> are active and synced to cloud.
              </p>
            </div>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '20px',
                display: 'grid',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 650 }}>Shop Name:</span>
                <span style={{ fontSize: '13px', fontWeight: 750, color: '#0f172a' }}>
                  {issuedCredsModal.shopName}
                </span>
              </div>

              {issuedCredsModal.ownerName && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 650 }}>Owner Name:</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                    {issuedCredsModal.ownerName}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 650 }}>Username:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <code style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                    {issuedCredsModal.username}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(issuedCredsModal.username, 'Username')}
                    className="pb-btn-link"
                    style={{ color: '#2563eb' }}
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 650 }}>License Key:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <code style={{ fontSize: '15px', fontWeight: 800, color: '#2563eb' }}>
                    {issuedCredsModal.key}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(issuedCredsModal.key, 'License Key')}
                    className="pb-btn-link"
                    style={{ color: '#2563eb' }}
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 650 }}>Subscription Plan:</span>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#059669' }}>
                  {issuedCredsModal.duration} (Valid until {issuedCredsModal.expiry})
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href={`mailto:${issuedCredsModal.email || ''}?subject=${encodeURIComponent(
                  `Your Print Bot Workstation Credentials - ${issuedCredsModal.shopName}`
                )}&body=${encodeURIComponent(
                  `Hello ${issuedCredsModal.shopName}!\n\nYour Print Bot Workstation access is approved.\n\nHere are your workstation credentials:\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Username: ${issuedCredsModal.username}\n🔑 License Key: ${issuedCredsModal.key}\n📅 Plan: ${issuedCredsModal.duration}\n📅 Valid Until: ${issuedCredsModal.expiry}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nHow to get started:\n1. Open Print Bot software on your counter PC.\n2. Enter your Username & License Key.\n3. Your workstation will automatically pair to your connected printers!\n\nSupport: support@printbot.in`
                )}`}
                className="pb-btn pb-btn-primary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', height: '40px', fontSize: '13px' }}
              >
                <Mail size={15} /> Send Credentials to Email
              </a>

              <button
                type="button"
                onClick={() => setIssuedCredsModal(null)}
                className="pb-btn pb-btn-secondary"
                style={{ height: '38px', fontSize: '13px' }}
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
