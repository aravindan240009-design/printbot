import React, { useState, useMemo } from 'react';
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
  Trophy,
  Flame,
  ArrowUpDown,
  DollarSign,
  ArrowLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import { type PrintJob } from '../App';
import { type DesktopReleaseInfo } from '../utils/versionCheck';
import { DateRangePicker } from './DateRangePicker';
import { InteractiveLineGraph } from './InteractiveLineGraph';
import {
  type DateRangeType,
  getDateRangeBounds,
  filterJobsByRange,
  generateChartPoints,
  computeShopAnalytics,
  getLicenseFee,
  getLicenseDate,
  filterLicensesByRange,
  generateAdminChartPoints,
} from '../utils/analyticsUtils';

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
    | 'SHOP_SETUP_SAVED'
    | 'JOB_APPROVED'
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
  desktopRelease?: DesktopReleaseInfo | null;
  handlePublishDesktopRelease?: (release: DesktopReleaseInfo) => Promise<void>;
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
  desktopRelease,
  handlePublishDesktopRelease,
}) => {
  const [adminActiveTab, setAdminActiveTab] = useState<AdminTab>('APPLICATIONS');
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [licenseSearchQuery, setLicenseSearchQuery] = useState('');
  const [licenseStatusFilter, setLicenseStatusFilter] = useState<'ALL' | 'ACTIVE' | 'REVOKED'>('ALL');

  // Desktop Release Auto-Update State
  const [releaseVersionDraft, setReleaseVersionDraft] = useState(desktopRelease?.version || '1.0.1');
  const [releaseUrlDraft, setReleaseUrlDraft] = useState(
    desktopRelease?.downloadUrl || 'https://github.com/aravindan2004/print-bot-saas/raw/main/PrintBot-Setup.exe'
  );
  const [releaseNotesDraft, setReleaseNotesDraft] = useState(
    desktopRelease?.releaseNotes || '- Automated 1-Click In-App Update flow\n- Performance enhancements and native Win32 fixes'
  );
  const [releaseMandatoryDraft, setReleaseMandatoryDraft] = useState(desktopRelease?.mandatory ?? false);
  const [isPublishingRelease, setIsPublishingRelease] = useState(false);

  // Shop Directory & Devices Drill-Down View State
  const [selectedShopUsername, setSelectedShopUsername] = useState<string | null>(null);
  const [shopDirectorySearchQuery, setShopDirectorySearchQuery] = useState('');
  const [shopDirectoryFilter, setShopDirectoryFilter] = useState<'ALL' | 'LOCKED' | 'UNBOUND'>('ALL');

  // Revenue & Analytics Interactive State
  const [revenueDateRange, setRevenueDateRange] = useState<DateRangeType>('all');
  const [revenueCustomStart, setRevenueCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [revenueCustomEnd, setRevenueCustomEnd] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [revenueSearchQuery, setRevenueSearchQuery] = useState('');
  const [revenueSortKey, setRevenueSortKey] = useState<'REVENUE' | 'ORDERS' | 'PAGES'>('REVENUE');

  // Filter out the platform admin account from shop lists
  const shopList = Object.values(licenses).filter((l) => l.username.toLowerCase() !== 'admin');
  const activeCount = shopList.filter((l) => l.status === 'ACTIVE').length;
  const revokedCount = shopList.filter((l) => l.status === 'REVOKED').length;

  // Filtered Shop Directory for Simple List View
  const filteredShopDirectory = useMemo(() => {
    return shopList.filter((s) => {
      if (shopDirectoryFilter === 'LOCKED' && !s.deviceId) return false;
      if (shopDirectoryFilter === 'UNBOUND' && !!s.deviceId) return false;
      if (!shopDirectorySearchQuery.trim()) return true;
      const q = shopDirectorySearchQuery.toLowerCase();
      return (
        s.shopName.toLowerCase().includes(q) ||
        s.username.toLowerCase().includes(q) ||
        (s.ownerName && s.ownerName.toLowerCase().includes(q)) ||
        (s.location && s.location.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q)) ||
        (s.deviceName && s.deviceName.toLowerCase().includes(q)) ||
        (s.deviceId && s.deviceId.toLowerCase().includes(q))
      );
    });
  }, [shopList, shopDirectoryFilter, shopDirectorySearchQuery]);

  // Selected shop for Full Details Page
  const selectedShop = useMemo(() => {
    if (!selectedShopUsername) return null;
    return (
      licenses[selectedShopUsername] ||
      shopList.find((s) => s.username.toLowerCase() === selectedShopUsername.toLowerCase()) ||
      null
    );
  }, [selectedShopUsername, licenses, shopList]);

  // Selected Shop Individual Analytics & Ledger State
  const [shopDateRange, setShopDateRange] = useState<DateRangeType>('all');
  const [shopCustomStart, setShopCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [shopCustomEnd, setShopCustomEnd] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [shopOrderSearch, setShopOrderSearch] = useState('');

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

  // Date range bounds for Revenue tab
  const revenueBounds = useMemo(() => {
    return getDateRangeBounds(revenueDateRange, revenueCustomStart, revenueCustomEnd);
  }, [revenueDateRange, revenueCustomStart, revenueCustomEnd]);

  // Licenses filtered by selected date range for Admin Revenue
  const rangeLicenses = useMemo(() => {
    return filterLicensesByRange(shopList, revenueDateRange, revenueCustomStart, revenueCustomEnd);
  }, [shopList, revenueDateRange, revenueCustomStart, revenueCustomEnd]);

  const periodAdminRevenue = useMemo(() => {
    return rangeLicenses.reduce((acc, l) => acc + getLicenseFee(l.duration), 0);
  }, [rangeLicenses]);

  // Jobs filtered by selected date range
  const rangeCompletedJobs = useMemo(() => {
    return filterJobsByRange(jobs, revenueDateRange, revenueCustomStart, revenueCustomEnd);
  }, [jobs, revenueDateRange, revenueCustomStart, revenueCustomEnd]);

  // Admin Chart data points across the selected range (Tracks Admin SaaS Revenue + Network Volume)
  const adminChartPoints = useMemo(() => {
    return generateAdminChartPoints(shopList, jobs, revenueDateRange, revenueCustomStart, revenueCustomEnd);
  }, [shopList, jobs, revenueDateRange, revenueCustomStart, revenueCustomEnd]);

  // Selected Shop Analytics Computations (Live Shop View)
  const selectedShopAllJobs = useMemo(() => {
    if (!selectedShop) return [];
    const u = (selectedShop.username || '').toLowerCase();
    const n = (selectedShop.shopName || '').toLowerCase();
    const appId = (selectedShop.appId || '').toLowerCase();
    return jobs.filter((j) => {
      const jShop = ((j as any).shop_id || '').toLowerCase();
      const jEmail = (j.customer_email || '').toLowerCase();
      if (shopList.length === 1) return true;
      if (jShop && (jShop === u || jShop === n || (appId && jShop === appId) || jShop.includes(u) || u.includes(jShop))) return true;
      if (jEmail && jEmail.includes(u)) return true;
      return false;
    });
  }, [selectedShop, jobs, shopList]);

  const shopBounds = useMemo(() => {
    return getDateRangeBounds(shopDateRange, shopCustomStart, shopCustomEnd);
  }, [shopDateRange, shopCustomStart, shopCustomEnd]);

  const shopRangeJobs = useMemo(() => {
    return filterJobsByRange(selectedShopAllJobs, shopDateRange, shopCustomStart, shopCustomEnd);
  }, [selectedShopAllJobs, shopDateRange, shopCustomStart, shopCustomEnd]);

  const shopChartPoints = useMemo(() => {
    return generateChartPoints(selectedShopAllJobs, shopDateRange, shopCustomStart, shopCustomEnd);
  }, [selectedShopAllJobs, shopDateRange, shopCustomStart, shopCustomEnd]);

  const shopCompletedJobs = useMemo(() => {
    return shopRangeJobs.filter((j) => j.status === 'COMPLETED');
  }, [shopRangeJobs]);

  const shopPeriodTurnover = useMemo(() => {
    return shopCompletedJobs.reduce((acc, j) => acc + (j.calculated_price_rupees || 0), 0);
  }, [shopCompletedJobs]);

  const shopPeriodOrders = shopCompletedJobs.length;

  const { shopPeriodPages, shopBwPages, shopColorPages } = useMemo(() => {
    let total = 0;
    let bw = 0;
    let col = 0;
    shopCompletedJobs.forEach((j) => {
      const count = (j.page_count || 1) * (j.options.copies || 1);
      total += count;
      if (j.options.color_mode === 'color') col += count;
      else bw += count;
    });
    return { shopPeriodPages: total, shopBwPages: bw, shopColorPages: col };
  }, [shopCompletedJobs]);

  const shopAov = shopPeriodOrders > 0 ? shopPeriodTurnover / shopPeriodOrders : 0;

  const shopFilteredOrders = useMemo(() => {
    if (!shopOrderSearch.trim()) return selectedShopAllJobs;
    const q = shopOrderSearch.toLowerCase();
    return selectedShopAllJobs.filter(
      (j) =>
        j.id.toLowerCase().includes(q) ||
        (j.customer_email && j.customer_email.toLowerCase().includes(q)) ||
        (j.file_name && j.file_name.toLowerCase().includes(q)) ||
        (j.pickup_pin && j.pickup_pin.toLowerCase().includes(q))
    );
  }, [selectedShopAllJobs, shopOrderSearch]);

  // Computed & Ranked Shop Analytics (HIGHEST REVENUE ON TOP by default)
  const {
    items: rankedShops,
    totalNetworkTurnover,
    totalNetworkOrders: rangeNetworkOrders,
    totalNetworkPages: rangeNetworkPages,
  } = useMemo(() => {
    return computeShopAnalytics(shopList, rangeCompletedJobs, totalSubscriptionRevenue);
  }, [shopList, rangeCompletedJobs, totalSubscriptionRevenue]);

  // Sort and filter rankedShops for display
  const sortedAndFilteredShops = useMemo(() => {
    let list = [...rankedShops];

    // Filter by search query if any
    if (revenueSearchQuery.trim()) {
      const q = revenueSearchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.shopName.toLowerCase().includes(q) ||
          s.username.toLowerCase().includes(q) ||
          s.location.toLowerCase().includes(q) ||
          s.licenseKey.toLowerCase().includes(q)
      );
    }

    // Sort by chosen metric (defaults to REVENUE, so highest revenue is on top)
    if (revenueSortKey === 'REVENUE') {
      list.sort((a, b) => b.printTurnover - a.printTurnover || b.ordersCount - a.ordersCount);
    } else if (revenueSortKey === 'ORDERS') {
      list.sort((a, b) => b.ordersCount - a.ordersCount || b.printTurnover - a.printTurnover);
    } else if (revenueSortKey === 'PAGES') {
      list.sort((a, b) => b.pagesCount - a.pagesCount || b.printTurnover - a.printTurnover);
    }

    return list;
  }, [rankedShops, revenueSearchQuery, revenueSortKey]);

  // Top 3 Podium shops
  const topShops = useMemo(() => {
    return rankedShops.slice(0, 3);
  }, [rankedShops]);

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
                  onClick={() => {
                    setAdminActiveTab(item.id as AdminTab);
                    setSelectedShopUsername(null);
                  }}
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
                                  onClick={() => handleExtendLicense(lic.username, '1 Month')}
                                  className="pb-btn pb-btn-secondary pb-btn-sm"
                                  style={{ fontSize: '11px', height: '28px', padding: '0 8px' }}
                                  title="Extend existing license by 1 month (+30 days)"
                                >
                                  +1 Month
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleExtendLicense(lic.username, '1 Year')}
                                  className="pb-btn pb-btn-secondary pb-btn-sm"
                                  style={{ fontSize: '11px', height: '28px', padding: '0 8px' }}
                                  title="Extend existing license by 1 year (+365 days)"
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
              {/* IF A SPECIFIC SHOP IS SELECTED: SHOW FULL SHOP DETAILS PAGE */}
              {selectedShop ? (
                <div>
                  {/* Top Navigation & Back Bar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      marginBottom: '18px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedShopUsername(null)}
                      className="pb-btn pb-btn-secondary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                    >
                      <ArrowLeft size={14} /> Back to Shop Directory
                    </button>

                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                      Platform Operations / Shop Directory &amp; Devices /{' '}
                      <strong style={{ color: '#0f172a' }}>{selectedShop.shopName}</strong>
                    </div>
                  </div>

                  {/* Main Shop Header Card */}
                  {(() => {
                    // Calculate live stats for this selected shop from jobs
                    const shopJobs = jobs.filter((j) => {
                      const u = (selectedShop.username || '').toLowerCase();
                      const n = (selectedShop.shopName || '').toLowerCase();
                      const jShop = ((j as any).shop_id || '').toLowerCase();
                      const jEmail = (j.customer_email || '').toLowerCase();
                      if (shopList.length === 1) return true;
                      if (jShop && (jShop === u || jShop === n || jShop.includes(u) || u.includes(jShop))) return true;
                      if (jEmail && jEmail.includes(u)) return true;
                      return false;
                    });
                    const shopCompleted = shopJobs.filter((j) => j.status === 'COMPLETED');
                    const shopOrderCount = shopCompleted.length;
                    const shopPageCount = shopCompleted.reduce((acc, j) => acc + (j.page_count * (j.options.copies || 1)), 0);
                    const shopTurnover = shopCompleted.reduce((acc, j) => acc + (j.calculated_price_rupees || 0), 0);

                    return (
                      <div>
                        {/* Header Box */}
                        <div
                          className="pb-admin-card"
                          style={{
                            padding: '24px',
                            marginBottom: '20px',
                            borderLeft: '4px solid #2563eb',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '16px',
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <h1 style={{ fontSize: '22px', fontWeight: 850, margin: 0, color: '#0f172a' }}>
                                  {selectedShop.shopName}
                                </h1>
                                <span
                                  style={{
                                    padding: '3px 10px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: 750,
                                    background: selectedShop.status === 'ACTIVE' ? '#ecfdf5' : '#fef2f2',
                                    color: selectedShop.status === 'ACTIVE' ? '#047857' : '#b91c1c',
                                  }}
                                >
                                  {selectedShop.status}
                                </span>
                                <span
                                  style={{
                                    padding: '3px 10px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    background: '#eff6ff',
                                    color: '#2563eb',
                                  }}
                                >
                                  {selectedShop.duration || '1 Year Subscription'}
                                </span>
                              </div>
                              <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span>Username: <code style={{ color: '#2563eb' }}>{selectedShop.username}</code></span>
                                <span>•</span>
                                <span>Branch: <strong>{selectedShop.location || 'Main Counter'}</strong></span>
                                <span>•</span>
                                <span>
                                  Hardware Node:{' '}
                                  <strong style={{ color: selectedShop.deviceId ? '#059669' : '#ea580c' }}>
                                    {selectedShop.deviceId ? `● Locked to ${selectedShop.deviceName || 'Counter PC'}` : '○ Awaiting Pairing'}
                                  </strong>
                                </span>
                              </div>
                            </div>

                            {/* Top Actions */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => handleResetDevice(selectedShop.username)}
                                className="pb-btn pb-btn-secondary"
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                              >
                                <Laptop size={14} /> Reset Hardware Pairing
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRevokeKey(selectedShop.username)}
                                className="pb-btn pb-btn-secondary"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontSize: '12px',
                                  color: selectedShop.status === 'ACTIVE' ? '#b91c1c' : '#047857',
                                }}
                              >
                                {selectedShop.status === 'ACTIVE' ? 'Revoke License' : 'Reactivate License'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Delete shop "${selectedShop.shopName}"?`)) {
                                    handleDeleteKey(selectedShop.username);
                                    setSelectedShopUsername(null);
                                  }
                                }}
                                className="pb-btn pb-btn-danger"
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                              >
                                <Trash2 size={14} /> Delete Shop
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Detailed Sections Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '18px' }}>
                          {/* Card 1: Shop Profile & Contact Details */}
                          <div className="pb-admin-card" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                              <Building size={18} color="#2563eb" />
                              <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                                Shop Profile &amp; Contact Details
                              </h3>
                            </div>

                            <div style={{ display: 'grid', gap: '10px', fontSize: '12.5px', color: '#334155' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Shop Commercial Name:</span>
                                <strong>{selectedShop.shopName}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Registered Owner:</span>
                                <strong>{selectedShop.ownerName || selectedShop.shopName}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Primary Contact Phone:</span>
                                <strong>{selectedShop.phone || 'Contact on file'}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Official Email Address:</span>
                                <span>{selectedShop.email || 'Not specified'}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Branch / Location Address:</span>
                                <strong>{selectedShop.location || 'Main Counter'}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Counter UPI Payment ID:</span>
                                <code style={{ color: '#059669', fontSize: '11.5px' }}>
                                  {selectedShop.upiId || 'Not configured'}
                                </code>
                              </div>
                            </div>
                          </div>

                          {/* Card 2: Authorized PC Identity & Hardware Lock */}
                          <div className="pb-admin-card" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Laptop size={18} color="#059669" />
                                <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                                  Hardware Node &amp; Device Identity
                                </h3>
                              </div>
                              <span
                                style={{
                                  fontSize: '10.5px',
                                  fontWeight: 750,
                                  color: selectedShop.deviceId ? '#059669' : '#ea580c',
                                  background: selectedShop.deviceId ? '#ecfdf5' : '#fff7ed',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                }}
                              >
                                {selectedShop.deviceId ? '● Node Locked' : '○ Pending First Login'}
                              </span>
                            </div>

                            <div style={{ display: 'grid', gap: '10px', fontSize: '12.5px', color: '#334155' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Machine Hostname:</span>
                                <strong style={{ color: selectedShop.deviceName ? '#0f172a' : '#94a3b8' }}>
                                  {selectedShop.deviceName || 'Awaiting Station Login'}
                                </strong>
                              </div>
                              <div>
                                <div style={{ color: '#64748b', marginBottom: '3px' }}>Hardware Cryptographic Key:</div>
                                {selectedShop.deviceId ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <code style={{ fontSize: '11px', color: '#2563eb', background: '#f8fafc', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', flex: 1, wordBreak: 'break-all' }}>
                                      {selectedShop.deviceId}
                                    </code>
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(selectedShop.deviceId || '', 'Hardware Key')}
                                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px', color: '#64748b' }}
                                      title="Copy key"
                                    >
                                      <Copy size={13} />
                                    </button>
                                  </div>
                                ) : (
                                  <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unbound (Awaiting First Workstation Login)</span>
                                )}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Hardware Pairing Timestamp:</span>
                                <span>
                                  {selectedShop.boundAt
                                    ? new Date(selectedShop.boundAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                                    : 'Not Bound Yet'}
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Spooler Engine &amp; Architecture:</span>
                                <span style={{ fontSize: '11px', color: '#334155', fontWeight: 600 }}>
                                  Tauri 2.0 Native x86_64 Win32 Spooler
                                </span>
                              </div>
                            </div>

                            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                              <button
                                type="button"
                                onClick={() => handleResetDevice(selectedShop.username)}
                                className="pb-btn pb-btn-secondary pb-btn-sm"
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                              >
                                <Laptop size={13} /> Reset Hardware Pairing for this Shop
                              </button>
                              <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '4px', textAlign: 'center' }}>
                                Allows the shop to bind a new counter PC if computer is replaced or upgraded.
                              </div>
                            </div>
                          </div>

                          {/* Card 3: License & Subscription Contract */}
                          <div className="pb-admin-card" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                              <KeyRound size={18} color="#d97706" />
                              <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                                License &amp; Subscription Contract
                              </h3>
                            </div>

                            <div style={{ display: 'grid', gap: '10px', fontSize: '12.5px', color: '#334155' }}>
                              <div>
                                <div style={{ color: '#64748b', marginBottom: '3px' }}>Issued License Key:</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <code style={{ fontSize: '12px', fontWeight: 750, color: '#2563eb', background: '#eff6ff', padding: '4px 8px', borderRadius: '4px', border: '1px solid #bfdbfe', flex: 1 }}>
                                    {selectedShop.licenseKey}
                                  </code>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(selectedShop.licenseKey, 'License Key')}
                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px', color: '#64748b' }}
                                    title="Copy license key"
                                  >
                                    <Copy size={14} />
                                  </button>
                                </div>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Subscription Tier:</span>
                                <strong>{selectedShop.duration || '1 Year Commercial'}</strong>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Expires At:</span>
                                <strong style={{ color: '#0f172a' }}>
                                  {selectedShop.expiresAt
                                    ? new Date(selectedShop.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                                    : 'Never'}
                                </strong>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Contract Status:</span>
                                <span
                                  style={{
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    fontSize: '11px',
                                    fontWeight: 750,
                                    background: selectedShop.status === 'ACTIVE' ? '#ecfdf5' : '#fef2f2',
                                    color: selectedShop.status === 'ACTIVE' ? '#047857' : '#b91c1c',
                                  }}
                                >
                                  {selectedShop.status}
                                </span>
                              </div>
                            </div>

                            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => handleExtendLicense(selectedShop.username, '1 Month')}
                                className="pb-btn pb-btn-secondary pb-btn-sm"
                                style={{ flex: 1, fontSize: '11.5px' }}
                              >
                                + Extend 1 Month
                              </button>
                              <button
                                type="button"
                                onClick={() => handleExtendLicense(selectedShop.username, '1 Year')}
                                className="pb-btn pb-btn-secondary pb-btn-sm"
                                style={{ flex: 1, fontSize: '11.5px' }}
                              >
                                + Extend 1 Year
                              </button>
                            </div>
                          </div>

                          {/* Card 4: Operations & Live Spooler Performance */}
                          <div className="pb-admin-card" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                              <TrendingUp size={18} color="#7c3aed" />
                              <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                                Operations &amp; Live Performance
                              </h3>
                            </div>

                            <div style={{ display: 'grid', gap: '10px', fontSize: '12.5px', color: '#334155' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#64748b' }}>Dispatch Automation:</span>
                                <span
                                  style={{
                                    fontWeight: 750,
                                    color: selectedShop.orderMode === 'FULL_AUTOMATIC' ? '#059669' : '#d97706',
                                    background: selectedShop.orderMode === 'FULL_AUTOMATIC' ? '#ecfdf5' : '#fffbeb',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    fontSize: '11.5px',
                                  }}
                                >
                                  {selectedShop.orderMode === 'FULL_AUTOMATIC' ? '⚡ Full Automatic Dispatch' : '✋ Manual Operator Approval'}
                                </span>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Completed Orders:</span>
                                <strong style={{ fontSize: '13px', color: '#0f172a' }}>{shopOrderCount} orders</strong>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Spooled Print Volume:</span>
                                <strong style={{ fontSize: '13px', color: '#0f172a' }}>{shopPageCount} pages</strong>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Total Print Turnover:</span>
                                <strong style={{ fontSize: '14px', color: '#059669', fontWeight: 850 }}>
                                  ₹{shopTurnover.toFixed(2)}
                                </strong>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Last Counter Activity:</span>
                                <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                                  {selectedShop.lastActive
                                    ? new Date(selectedShop.lastActive).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                                    : 'Recently Active'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ========================================================= */}
                        {/* LIVE SHOP REVENUE & ANALYTICS SECTION (INDIVIDUAL SHOP)    */}
                        {/* ========================================================= */}
                        <div style={{ marginTop: '28px', borderTop: '2px solid #e2e8f0', paddingTop: '24px' }}>
                          {/* Section Header with DateRangePicker */}
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
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: '#ecfdf5',
                                    color: '#059669',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <TrendingUp size={18} />
                                </div>
                                <h2 style={{ fontSize: '18px', fontWeight: 850, color: '#0f172a', margin: 0 }}>
                                  {selectedShop.shopName} • Live Revenue &amp; Spooler Analytics
                                </h2>
                              </div>
                              <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 40px' }}>
                                Live customer print turnover, orders trajectory, and spooled documents for this counter station
                              </p>
                            </div>

                            {/* Date Range Picker for this shop */}
                            <div>
                              <DateRangePicker
                                rangeType={shopDateRange}
                                onChangeRange={setShopDateRange}
                                customStart={shopCustomStart}
                                customEnd={shopCustomEnd}
                                onChangeCustomStart={setShopCustomStart}
                                onChangeCustomEnd={setShopCustomEnd}
                                activeLabel={shopBounds.label}
                              />
                            </div>
                          </div>

                          {/* Shop Performance KPI Cards */}
                          <div className="pb-admin-stats-grid" style={{ marginBottom: '22px' }}>
                            <div className="pb-admin-stat-card">
                              <div className="pb-admin-stat-label">Period Print Turnover</div>
                              <div className="pb-admin-stat-val" style={{ color: '#059669' }}>
                                ₹{shopPeriodTurnover.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              <div className="pb-admin-stat-hint">Customer print payments in {shopBounds.label}</div>
                            </div>

                            <div className="pb-admin-stat-card">
                              <div className="pb-admin-stat-label">Completed Print Orders</div>
                              <div className="pb-admin-stat-val" style={{ color: '#2563eb' }}>
                                {shopPeriodOrders}
                              </div>
                              <div className="pb-admin-stat-hint">
                                Avg Order Value: ₹{shopAov.toFixed(2)}
                              </div>
                            </div>

                            <div className="pb-admin-stat-card">
                              <div className="pb-admin-stat-label">Spooled Print Volume</div>
                              <div className="pb-admin-stat-val" style={{ color: '#7c3aed' }}>
                                {shopPeriodPages} <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>pages</span>
                              </div>
                              <div className="pb-admin-stat-hint">
                                {shopBwPages} B&amp;W • {shopColorPages} Color
                              </div>
                            </div>

                            <div className="pb-admin-stat-card">
                              <div className="pb-admin-stat-label">Counter Pricing Rates</div>
                              <div className="pb-admin-stat-val" style={{ fontSize: '16px', color: '#0f172a' }}>
                                B&amp;W: ₹{(selectedShop as any).rates?.bwPerSideRupees || '1.5'} / Col: ₹{(selectedShop as any).rates?.colorPerSideRupees || '10'}
                              </div>
                              <div className="pb-admin-stat-hint">UPI: {selectedShop.upiId || `${selectedShop.username}@upi`}</div>
                            </div>
                          </div>

                          {/* Interactive Line Graph for this Shop */}
                          <div style={{ marginBottom: '24px' }}>
                            <InteractiveLineGraph
                              data={shopChartPoints}
                              title={`${selectedShop.shopName} • Print Revenue &amp; Volume Trajectory`}
                              subtitle={`Live hourly / daily print turnover and volume for this workstation in ${shopBounds.label}`}
                              accentColor="#059669"
                              defaultMetric="revenue"
                              height={260}
                              emptyMessage={`No print jobs recorded for ${selectedShop.shopName} in this period. Live orders will populate automatically when customers scan the counter QR and print.`}
                              customMetrics={[
                                {
                                  key: 'revenue',
                                  label: 'Print Turnover (₹)',
                                  color: '#059669',
                                  formatValue: (v) => `₹${v.toLocaleString('en-IN')}`,
                                  getValue: (p) => p.revenue,
                                },
                                {
                                  key: 'orders',
                                  label: 'Completed Orders',
                                  color: '#2563eb',
                                  formatValue: (v) => `${v} orders`,
                                  getValue: (p) => p.orders,
                                },
                                {
                                  key: 'pages',
                                  label: 'Pages Spooled',
                                  color: '#7c3aed',
                                  formatValue: (v) => `${v} pages`,
                                  getValue: (p) => p.pages,
                                },
                              ]}
                            />
                          </div>

                          {/* Live Orders & Spool Activity Ledger for this Shop */}
                          <div className="pb-admin-table-card">
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '12px',
                                marginBottom: '16px',
                              }}
                            >
                              <div>
                                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 2px', color: '#0f172a' }}>
                                  Live Print Jobs &amp; Spool Ledger ({shopFilteredOrders.length} Records)
                                </h3>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>
                                  All print jobs routed through this specific station counter
                                </div>
                              </div>

                              <div style={{ position: 'relative', width: '260px' }}>
                                <Search
                                  size={13}
                                  color="#94a3b8"
                                  style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                                />
                                <input
                                  type="text"
                                  placeholder="Search Job ID, file, customer email, PIN..."
                                  value={shopOrderSearch}
                                  onChange={(e) => setShopOrderSearch(e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '5px 8px 5px 28px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    fontSize: '11.5px',
                                    background: '#f8fafc',
                                    boxSizing: 'border-box',
                                  }}
                                />
                              </div>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                              <table className="pb-admin-table">
                                <thead>
                                  <tr>
                                    <th>Order / PIN</th>
                                    <th>Customer</th>
                                    <th>Document File</th>
                                    <th>Copies &amp; Mode</th>
                                    <th>Pages</th>
                                    <th>Amount (₹)</th>
                                    <th>Status</th>
                                    <th>Timestamp</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {shopFilteredOrders.length === 0 ? (
                                    <tr>
                                      <td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '32px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                          <FileText size={24} color="#cbd5e1" />
                                          <div style={{ fontWeight: 650 }}>No print jobs found for this station.</div>
                                          <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                                            When customers upload documents to print at this counter, their orders and turnover will appear here live in real-time.
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  ) : (
                                    shopFilteredOrders.map((job) => {
                                      const isCompleted = job.status === 'COMPLETED';
                                      const isPrinting = job.status === 'PRINTING';
                                      const isPending = job.status === 'PENDING_APPROVAL' || job.status === 'QUEUED';
                                      const statusBg = isCompleted ? '#ecfdf5' : isPrinting ? '#eff6ff' : isPending ? '#fffbeb' : '#fef2f2';
                                      const statusColor = isCompleted ? '#047857' : isPrinting ? '#1d4ed8' : isPending ? '#b45309' : '#b91c1c';

                                      return (
                                        <tr key={job.id}>
                                          <td>
                                            <div style={{ fontWeight: 750, color: '#0f172a', fontSize: '12.5px' }}>
                                              {job.pickup_pin ? `PIN: ${job.pickup_pin}` : job.id.slice(0, 8)}
                                            </div>
                                            <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                                              <code>{job.id.slice(0, 10)}...</code>
                                            </div>
                                          </td>
                                          <td>
                                            <div style={{ fontWeight: 600, color: '#334155' }}>
                                              {job.customer_email || 'Walk-in Customer'}
                                            </div>
                                          </td>
                                          <td>
                                            <div
                                              style={{
                                                maxWidth: '200px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                fontWeight: 650,
                                                color: '#0f172a',
                                              }}
                                              title={job.file_name}
                                            >
                                              {job.file_name}
                                            </div>
                                          </td>
                                          <td>
                                            <span style={{ fontSize: '11.5px', color: '#475569' }}>
                                              {job.options.copies || 1} {job.options.copies === 1 ? 'copy' : 'copies'} •{' '}
                                              <strong style={{ color: job.options.color_mode === 'color' ? '#7c3aed' : '#334155' }}>
                                                {job.options.color_mode === 'color' ? 'Color' : 'B&W'}
                                              </strong>
                                            </span>
                                          </td>
                                          <td>
                                            <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>
                                              {(job.page_count || 1) * (job.options.copies || 1)}
                                            </strong>{' '}
                                            <span style={{ fontSize: '10.5px', color: '#64748b' }}>pgs</span>
                                          </td>
                                          <td>
                                            <strong style={{ fontSize: '13px', color: '#059669', fontWeight: 800 }}>
                                              ₹{(job.calculated_price_rupees || 0).toFixed(2)}
                                            </strong>
                                          </td>
                                          <td>
                                            <span
                                              style={{
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                fontSize: '10.5px',
                                                fontWeight: 750,
                                                background: statusBg,
                                                color: statusColor,
                                              }}
                                            >
                                              {job.status}
                                            </span>
                                          </td>
                                          <td style={{ fontSize: '11.5px', color: '#64748b' }}>
                                            {job.timestamp
                                              ? new Date(job.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
                                              : (job as any).created_at || '-'}
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
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* OTHERWISE: SHOW SIMPLE SHOP DIRECTORY LIST (OUTSIDE VIEW) */
                <div>
                  {/* Header Title & Sync */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      marginBottom: '18px',
                    }}
                  >
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: 850, color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building size={22} color="#2563eb" />
                        Shop Directory &amp; Counter Workstations
                      </h2>
                      <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                        Click any shop to view its complete profile, hardware node identity, and license details.
                      </p>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        borderRadius: '20px',
                        fontSize: '11.5px',
                        fontWeight: 750,
                        color: '#065f46',
                      }}
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#10b981',
                          boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.25)',
                        }}
                      />
                      <span>Cloud Connected</span>
                    </div>
                  </div>

                  {/* Top KPI Metrics Strip */}
                  <div className="pb-admin-stats-grid">
                    <div className="pb-admin-stat-card">
                      <div className="pb-admin-stat-label">Total Subscribed Shops</div>
                      <div className="pb-admin-stat-val" style={{ color: '#0f172a' }}>{shopList.length}</div>
                      <div className="pb-admin-stat-hint">Active multi-tenant Xerox stations</div>
                    </div>

                    <div className="pb-admin-stat-card">
                      <div className="pb-admin-stat-label">Hardware Nodes Locked</div>
                      <div className="pb-admin-stat-val" style={{ color: '#059669' }}>
                        {shopList.filter((l) => l.deviceId).length}
                      </div>
                      <div className="pb-admin-stat-hint">Cryptographically bound PCs</div>
                    </div>

                    <div className="pb-admin-stat-card">
                      <div className="pb-admin-stat-label">Awaiting First Pairing</div>
                      <div className="pb-admin-stat-val" style={{ color: '#ea580c' }}>
                        {shopList.filter((l) => !l.deviceId).length}
                      </div>
                      <div className="pb-admin-stat-hint">Pending counter workstation login</div>
                    </div>

                    <div className="pb-admin-stat-card">
                      <div className="pb-admin-stat-label">Active Licenses</div>
                      <div className="pb-admin-stat-val" style={{ color: '#2563eb' }}>{activeCount}</div>
                      <div className="pb-admin-stat-hint">{revokedCount} revoked</div>
                    </div>
                  </div>

                  {/* Clean Search & Filter Toolbar */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      marginBottom: '16px',
                    }}
                  >
                    {/* Status Filter Pills */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 650, marginRight: '4px' }}>
                        Filter:
                      </span>
                      <button
                        type="button"
                        onClick={() => setShopDirectoryFilter('ALL')}
                        style={{
                          border: 'none',
                          background: shopDirectoryFilter === 'ALL' ? '#2563eb' : '#f1f5f9',
                          color: shopDirectoryFilter === 'ALL' ? '#ffffff' : '#475569',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: shopDirectoryFilter === 'ALL' ? 750 : 600,
                          cursor: 'pointer',
                        }}
                      >
                        All Shops ({shopList.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setShopDirectoryFilter('LOCKED')}
                        style={{
                          border: 'none',
                          background: shopDirectoryFilter === 'LOCKED' ? '#059669' : '#f1f5f9',
                          color: shopDirectoryFilter === 'LOCKED' ? '#ffffff' : '#475569',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: shopDirectoryFilter === 'LOCKED' ? 750 : 600,
                          cursor: 'pointer',
                        }}
                      >
                        Node Locked ({shopList.filter((l) => l.deviceId).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setShopDirectoryFilter('UNBOUND')}
                        style={{
                          border: 'none',
                          background: shopDirectoryFilter === 'UNBOUND' ? '#ea580c' : '#f1f5f9',
                          color: shopDirectoryFilter === 'UNBOUND' ? '#ffffff' : '#475569',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: shopDirectoryFilter === 'UNBOUND' ? 750 : 600,
                          cursor: 'pointer',
                        }}
                      >
                        Awaiting Pairing ({shopList.filter((l) => !l.deviceId).length})
                      </button>
                    </div>

                    {/* Search box */}
                    <div style={{ position: 'relative', width: '260px' }}>
                      <Search
                        size={14}
                        color="#94a3b8"
                        style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                      />
                      <input
                        type="text"
                        placeholder="Search shop, owner, city, PC..."
                        value={shopDirectorySearchQuery}
                        onChange={(e) => setShopDirectorySearchQuery(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 10px 6px 30px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '12px',
                          background: '#f8fafc',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  {/* Simple Clean Shop Directory Table */}
                  <div className="pb-admin-table-card">
                    <div style={{ overflowX: 'auto' }}>
                      <table className="pb-admin-table">
                        <thead>
                          <tr>
                            <th>Shop Name &amp; Counter</th>
                            <th>Owner &amp; Contact</th>
                            <th>Subscription Plan</th>
                            <th>Hardware Pairing Node</th>
                            <th>Dispatch Mode</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredShopDirectory.length === 0 ? (
                            <tr>
                              <td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: '36px' }}>
                                No Xerox shops found matching your search.
                              </td>
                            </tr>
                          ) : (
                            filteredShopDirectory.map((lic) => {
                              const isBound = !!lic.deviceId;

                              return (
                                <tr
                                  key={lic.username}
                                  onClick={() => setSelectedShopUsername(lic.username)}
                                  style={{
                                    cursor: 'pointer',
                                    transition: 'background 0.15s ease',
                                  }}
                                  title="Click to view full shop details"
                                >
                                  {/* Shop Name & Location */}
                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <div
                                        style={{
                                          width: '32px',
                                          height: '32px',
                                          borderRadius: '8px',
                                          background: '#eff6ff',
                                          color: '#2563eb',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontWeight: 800,
                                          fontSize: '12px',
                                          flexShrink: 0,
                                        }}
                                      >
                                        <Building size={16} />
                                      </div>
                                      <div>
                                        <strong style={{ color: '#0f172a', fontSize: '13.5px' }}>{lic.shopName}</strong>
                                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                                          {lic.location || 'Main Counter'} • <code style={{ color: '#2563eb' }}>{lic.username}</code>
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Owner & Contact */}
                                  <td>
                                    <div style={{ fontWeight: 650, color: '#334155' }}>
                                      {lic.ownerName || lic.shopName}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                                      {lic.phone || 'Contact on file'}
                                    </div>
                                  </td>

                                  {/* Plan */}
                                  <td>
                                    <div style={{ fontWeight: 650, color: '#0f172a' }}>{lic.duration || '1 Year'}</div>
                                    <code style={{ fontSize: '10.5px', color: '#2563eb' }}>{lic.licenseKey}</code>
                                  </td>

                                  {/* Hardware Node */}
                                  <td>
                                    {isBound ? (
                                      <div>
                                        <span
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            fontSize: '11px',
                                            fontWeight: 750,
                                            color: '#047857',
                                            background: '#ecfdf5',
                                            padding: '2px 8px',
                                            borderRadius: '6px',
                                          }}
                                        >
                                          <span>●</span>
                                          <span>{lic.deviceName || 'Counter PC'}</span>
                                        </span>
                                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', fontFamily: 'monospace' }}>
                                          {lic.deviceId ? `${lic.deviceId.slice(0, 16)}...` : ''}
                                        </div>
                                      </div>
                                    ) : (
                                      <span
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          fontSize: '11px',
                                          fontWeight: 700,
                                          color: '#c2410c',
                                          background: '#fff7ed',
                                          padding: '2px 8px',
                                          borderRadius: '6px',
                                        }}
                                      >
                                        <span>○</span>
                                        <span>Pending First Login</span>
                                      </span>
                                    )}
                                  </td>

                                  {/* Dispatch Mode */}
                                  <td>
                                    <span
                                      style={{
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        color: lic.orderMode === 'FULL_AUTOMATIC' ? '#059669' : '#d97706',
                                      }}
                                    >
                                      {lic.orderMode === 'FULL_AUTOMATIC' ? '⚡ Auto Spool' : '✋ Manual'}
                                    </span>
                                  </td>

                                  {/* Status */}
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

                                  {/* Action */}
                                  <td style={{ textAlign: 'right' }}>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedShopUsername(lic.username);
                                      }}
                                      className="pb-btn pb-btn-secondary pb-btn-sm"
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '11.5px',
                                        padding: '4px 10px',
                                      }}
                                    >
                                      <span>View Full Details</span>
                                      <ChevronRight size={13} />
                                    </button>
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
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: REVENUE & ANALYTICS                                */}
          {/* ========================================================= */}
          {adminActiveTab === 'REVENUE' && (
            <div>
              {/* Header with Live Sync Status */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '18px',
                }}
              >
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 850, color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={22} color="#059669" />
                    Platform Revenue &amp; Network Analytics
                  </h2>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                    Real-time aggregated print turnover, daily spooling trajectory, and dynamic revenue-ranked shop performance
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    borderRadius: '20px',
                    fontSize: '11.5px',
                    fontWeight: 750,
                    color: '#065f46',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#10b981',
                      boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.25)',
                    }}
                  />
                  <span>Live Real-Time Sync (Auto 3s)</span>
                </div>
              </div>

              {/* Date Range Picker Filter Bar */}
              <div style={{ marginBottom: '20px' }}>
                <DateRangePicker
                  rangeType={revenueDateRange}
                  onChangeRange={setRevenueDateRange}
                  customStart={revenueCustomStart}
                  customEnd={revenueCustomEnd}
                  onChangeCustomStart={setRevenueCustomStart}
                  onChangeCustomEnd={setRevenueCustomEnd}
                  activeLabel={revenueBounds.label}
                />
              </div>

              {/* Primary High-Impact Stats Grid */}
              <div className="pb-admin-stats-grid">
                <div className="pb-admin-stat-card">
                  <div className="pb-admin-stat-label">Period Admin SaaS Revenue</div>
                  <div className="pb-admin-stat-val" style={{ color: '#2563eb' }}>
                    ₹{periodAdminRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="pb-admin-stat-hint">
                    {rangeLicenses.length} license subscription{rangeLicenses.length === 1 ? '' : 's'} in {revenueBounds.label}
                  </div>
                </div>

                <div className="pb-admin-stat-card">
                  <div className="pb-admin-stat-label">Total Cumulative SaaS Revenue</div>
                  <div className="pb-admin-stat-val" style={{ color: '#0f172a' }}>
                    ₹{totalSubscriptionRevenue.toLocaleString('en-IN')}
                  </div>
                  <div className="pb-admin-stat-hint">From {shopList.length} subscribed Xerox shops</div>
                </div>

                <div className="pb-admin-stat-card">
                  <div className="pb-admin-stat-label">Projected Annual ARR</div>
                  <div className="pb-admin-stat-val" style={{ color: '#7c3aed' }}>
                    ₹{(activeCount * 4999).toLocaleString('en-IN')}
                  </div>
                  <div className="pb-admin-stat-hint">Active SaaS subscription run-rate</div>
                </div>

                <div className="pb-admin-stat-card">
                  <div className="pb-admin-stat-label">Network Customer Print Turnover</div>
                  <div className="pb-admin-stat-val" style={{ color: '#059669' }}>
                    ₹{totalNetworkTurnover.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="pb-admin-stat-hint">Customer print payments in {revenueBounds.label}</div>
                </div>

                <div className="pb-admin-stat-card">
                  <div className="pb-admin-stat-label">Network Orders &amp; Volume</div>
                  <div className="pb-admin-stat-val">
                    {rangeNetworkOrders} <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>({rangeNetworkPages} pgs)</span>
                  </div>
                  <div className="pb-admin-stat-hint">Direct customer uploads completed</div>
                </div>
              </div>

              {/* Interactive Line Graph */}
              <div style={{ marginBottom: '24px' }}>
                <InteractiveLineGraph
                  data={adminChartPoints}
                  title={`Admin Platform Revenue Trajectory • ${revenueBounds.label}`}
                  subtitle="Direct SaaS subscription revenue from Xerox shop licenses and platform transactions"
                  accentColor="#2563eb"
                  defaultMetric="adminRevenue"
                  height={260}
                  emptyMessage="No license or print activity recorded in this selected period yet. When new licenses are created, revenue will appear automatically."
                  customMetrics={[
                    {
                      key: 'adminRevenue',
                      label: 'Admin License Revenue (₹)',
                      color: '#2563eb',
                      formatValue: (v) => `₹${v.toLocaleString('en-IN')}`,
                      getValue: (p) => p.adminRevenue ?? p.revenue,
                    },
                    {
                      key: 'shopRevenue',
                      label: 'Shop Print Turnover (₹)',
                      color: '#059669',
                      formatValue: (v) => `₹${v.toLocaleString('en-IN')}`,
                      getValue: (p) => p.shopRevenue ?? 0,
                    },
                    {
                      key: 'totalRevenue',
                      label: 'Combined Total (₹)',
                      color: '#7c3aed',
                      formatValue: (v) => `₹${v.toLocaleString('en-IN')}`,
                      getValue: (p) => (p.adminRevenue ?? p.revenue) + (p.shopRevenue ?? 0),
                    },
                    {
                      key: 'orders',
                      label: 'Orders Count',
                      color: '#0891b2',
                      formatValue: (v) => `${v} orders`,
                      getValue: (p) => p.orders,
                    },
                    {
                      key: 'pages',
                      label: 'Pages Spooled',
                      color: '#d97706',
                      formatValue: (v) => `${v} pages`,
                      getValue: (p) => p.pages,
                    },
                  ]}
                />
              </div>

              {/* Top Performing Shops Podium / Leaderboard */}
              {topShops.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <Trophy size={18} color="#d97706" />
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Top Performing Xerox Shops • {revenueBounds.label}
                    </h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                    {topShops.map((shop, idx) => {
                      const isGold = idx === 0;
                      const isSilver = idx === 1;
                      const isBronze = idx === 2;

                      const medalEmoji = isGold ? '🥇' : isSilver ? '🥈' : '🥉';
                      const badgeBg = isGold ? '#fef3c7' : isSilver ? '#f1f5f9' : '#fff7ed';
                      const badgeBorder = isGold ? '#f59e0b' : isSilver ? '#cbd5e1' : '#fdba74';
                      const badgeColor = isGold ? '#b45309' : isSilver ? '#475569' : '#c2410c';
                      const labelText = isGold ? 'RANK #1 TOP EARNER' : isSilver ? 'RANK #2 RUNNER UP' : 'RANK #3 THIRD PLACE';

                      return (
                        <div
                          key={shop.username}
                          style={{
                            background: '#ffffff',
                            border: `1.5px solid ${badgeBorder}`,
                            borderRadius: '12px',
                            padding: '16px 18px',
                            boxShadow: isGold ? '0 4px 12px rgba(245, 158, 11, 0.12)' : '0 1px 3px rgba(15, 23, 42, 0.04)',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: badgeBg,
                                color: badgeColor,
                                border: `1px solid ${badgeBorder}`,
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '10.5px',
                                fontWeight: 800,
                                letterSpacing: '0.04em',
                              }}
                            >
                              <span>{medalEmoji}</span>
                              <span>{labelText}</span>
                            </span>
                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 650 }}>
                              {shop.marketSharePercent}% Volume
                            </span>
                          </div>

                          <div style={{ fontWeight: 850, fontSize: '16px', color: '#0f172a', marginBottom: '2px' }}>
                            {shop.shopName}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '12px' }}>
                            {shop.location} • <code style={{ fontSize: '10.5px', color: '#2563eb' }}>{shop.username}</code>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                            <div>
                              <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>PRINT REVENUE</div>
                              <div style={{ fontSize: '18px', fontWeight: 850, color: '#059669' }}>
                                ₹{shop.printTurnover.toFixed(2)}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>VOLUME</div>
                              <div style={{ fontSize: '12.5px', fontWeight: 750, color: '#0f172a' }}>
                                {shop.ordersCount} orders • {shop.pagesCount} pgs
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedShopUsername(shop.username);
                              setAdminActiveTab('SHOPS_DEVICES');
                            }}
                            className="pb-btn pb-btn-secondary pb-btn-sm"
                            style={{
                              marginTop: '12px',
                              width: '100%',
                              fontSize: '11.5px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                            }}
                          >
                            View Live Shop Analytics →
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Zero-Knowledge Privacy Card */}
              <div
                className="pb-admin-card"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '16px 18px',
                  marginBottom: '20px',
                }}
              >
                <ShieldCheck size={24} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h3 style={{ fontSize: '13.5px', fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>
                    Strict Zero-Knowledge Multi-Tenant Privacy Guarantee
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                    Platform administrators can monitor high-level aggregate metrics (orders count, pages count, active printers,
                    and subscription revenue). Customer documents, PDFs, personal images, and uploaded files are end-to-end
                    isolated per shop and <strong>never visible to platform administrators</strong>.
                  </p>
                </div>
              </div>

              {/* Shop Volume Breakdown Table (Highest Revenue Automatically Ranked First) */}
              <div className="pb-admin-table-card">
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    marginBottom: '16px',
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 2px', color: '#0f172a' }}>
                      Shop Volume &amp; Revenue Breakdown ({sortedAndFilteredShops.length} Active Shops)
                    </h3>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Real-time revenue ranking — the shop with highest revenue is placed automatically at the top
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Sort selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 650, padding: '0 4px' }}>
                        Sort by:
                      </span>
                      <button
                        type="button"
                        onClick={() => setRevenueSortKey('REVENUE')}
                        style={{
                          border: 'none',
                          background: revenueSortKey === 'REVENUE' ? '#ffffff' : 'transparent',
                          color: revenueSortKey === 'REVENUE' ? '#059669' : '#64748b',
                          fontWeight: revenueSortKey === 'REVENUE' ? 750 : 600,
                          fontSize: '11px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          boxShadow: revenueSortKey === 'REVENUE' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                        }}
                      >
                        Revenue (Top)
                      </button>
                      <button
                        type="button"
                        onClick={() => setRevenueSortKey('ORDERS')}
                        style={{
                          border: 'none',
                          background: revenueSortKey === 'ORDERS' ? '#ffffff' : 'transparent',
                          color: revenueSortKey === 'ORDERS' ? '#2563eb' : '#64748b',
                          fontWeight: revenueSortKey === 'ORDERS' ? 750 : 600,
                          fontSize: '11px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          boxShadow: revenueSortKey === 'ORDERS' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                        }}
                      >
                        Orders
                      </button>
                      <button
                        type="button"
                        onClick={() => setRevenueSortKey('PAGES')}
                        style={{
                          border: 'none',
                          background: revenueSortKey === 'PAGES' ? '#ffffff' : 'transparent',
                          color: revenueSortKey === 'PAGES' ? '#7c3aed' : '#64748b',
                          fontWeight: revenueSortKey === 'PAGES' ? 750 : 600,
                          fontSize: '11px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          boxShadow: revenueSortKey === 'PAGES' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                        }}
                      >
                        Pages
                      </button>
                    </div>

                    {/* Search box */}
                    <div style={{ position: 'relative', width: '220px' }}>
                      <Search
                        size={13}
                        color="#94a3b8"
                        style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                      />
                      <input
                        type="text"
                        placeholder="Search shop, city, key..."
                        value={revenueSearchQuery}
                        onChange={(e) => setRevenueSearchQuery(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '5px 8px 5px 28px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          background: '#f8fafc',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="pb-admin-table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px', textAlign: 'center' }}>Rank</th>
                        <th>Shop Name &amp; Counter</th>
                        <th>Plan &amp; License</th>
                        <th>Completed Orders</th>
                        <th>Printed Pages</th>
                        <th>Print Turnover (₹)</th>
                        <th>Avg Order Value</th>
                        <th style={{ width: '120px' }}>Network Share</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedAndFilteredShops.length === 0 ? (
                        <tr>
                          <td colSpan={10} style={{ textAlign: 'center', color: '#94a3b8', padding: '28px' }}>
                            No active shops matching criteria.
                          </td>
                        </tr>
                      ) : (
                        sortedAndFilteredShops.map((shop) => {
                          const isTop1 = shop.rank === 1;
                          const isTop2 = shop.rank === 2;
                          const isTop3 = shop.rank === 3;
                          const medal = isTop1 ? '🥇' : isTop2 ? '🥈' : isTop3 ? '🥉' : null;

                          return (
                            <tr
                              key={shop.username}
                              onClick={() => {
                                setSelectedShopUsername(shop.username);
                                setAdminActiveTab('SHOPS_DEVICES');
                              }}
                              style={{
                                background: isTop1 ? '#fafdf9' : undefined,
                                transition: 'background 0.15s ease',
                                cursor: 'pointer',
                              }}
                              title={`Click to view live analytics for ${shop.shopName}`}
                            >
                              <td style={{ textAlign: 'center' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: isTop1 ? '#fef3c7' : isTop2 ? '#f1f5f9' : isTop3 ? '#fff7ed' : '#f8fafc',
                                    border: `1px solid ${isTop1 ? '#f59e0b' : isTop2 ? '#cbd5e1' : isTop3 ? '#fdba74' : '#e2e8f0'}`,
                                    fontSize: '12px',
                                    fontWeight: 800,
                                    color: isTop1 ? '#b45309' : isTop2 ? '#475569' : isTop3 ? '#c2410c' : '#64748b',
                                  }}
                                  title={`Rank #${shop.rank}`}
                                >
                                  {medal || `#${shop.rank}`}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <strong style={{ color: '#0f172a', fontSize: '13px' }}>{shop.shopName}</strong>
                                  {isTop1 && (
                                    <span
                                      style={{
                                        fontSize: '9.5px',
                                        fontWeight: 800,
                                        background: '#ecfdf5',
                                        color: '#047857',
                                        border: '1px solid #a7f3d0',
                                        padding: '1px 5px',
                                        borderRadius: '4px',
                                      }}
                                    >
                                      Top Earner
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                  {shop.location} • <span style={{ color: '#94a3b8' }}>{shop.username}</span>
                                </div>
                              </td>
                              <td>
                                <div style={{ fontWeight: 650, color: '#334155' }}>{shop.planDuration}</div>
                                <code style={{ fontSize: '10.5px', color: '#2563eb' }}>{shop.licenseKey}</code>
                              </td>
                              <td>
                                <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{shop.ordersCount}</strong>
                              </td>
                              <td>
                                <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{shop.pagesCount}</strong>
                                <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                                  {shop.bwPages} B&amp;W • {shop.colorPages} Color
                                </div>
                              </td>
                              <td>
                                <strong style={{ fontSize: '14px', color: '#059669', fontWeight: 850 }}>
                                  ₹{shop.printTurnover.toFixed(2)}
                                </strong>
                              </td>
                              <td>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                                  ₹{shop.avgOrderValue.toFixed(2)}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div
                                      style={{
                                        width: `${Math.min(100, Math.max(shop.marketSharePercent, 4))}%`,
                                        height: '100%',
                                        background: isTop1 ? '#059669' : '#2563eb',
                                        borderRadius: '3px',
                                        transition: 'width 0.4s ease',
                                      }}
                                    />
                                  </div>
                                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', minWidth: '34px' }}>
                                    {shop.marketSharePercent}%
                                  </span>
                                </div>
                              </td>
                              <td>
                                <span
                                  style={{
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '10.5px',
                                    fontWeight: 750,
                                    background: shop.status === 'ACTIVE' ? '#ecfdf5' : '#fef2f2',
                                    color: shop.status === 'ACTIVE' ? '#047857' : '#b91c1c',
                                  }}
                                >
                                  {shop.status}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedShopUsername(shop.username);
                                    setAdminActiveTab('SHOPS_DEVICES');
                                  }}
                                  className="pb-btn pb-btn-secondary pb-btn-sm"
                                  style={{
                                    fontSize: '11px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '3px 8px',
                                  }}
                                >
                                  Live Analytics →
                                </button>
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

              {/* Desktop App Release & Auto-Updater Section */}
              <div className="pb-admin-card" style={{ padding: '24px', marginTop: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                        Desktop Workstation Auto-Update Releases
                      </h3>
                      <div style={{ color: '#64748b', fontSize: '12px' }}>
                        Publish new versions to trigger 1-Click in-app auto-updates for all connected shop counters.
                      </div>
                    </div>
                  </div>

                  {desktopRelease && (
                    <div
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#334155',
                      }}
                    >
                      Live Active Release: <strong style={{ color: '#2563eb' }}>v{desktopRelease.version}</strong>
                    </div>
                  )}
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!handlePublishDesktopRelease) return;
                    setIsPublishingRelease(true);
                    try {
                      await handlePublishDesktopRelease({
                        version: releaseVersionDraft.trim(),
                        downloadUrl: releaseUrlDraft.trim(),
                        releaseNotes: releaseNotesDraft.trim(),
                        mandatory: releaseMandatoryDraft,
                        publishedAt: new Date().toISOString().replace('T', ' ').slice(0, 10),
                      });
                    } finally {
                      setIsPublishingRelease(false);
                    }
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '5px', color: '#334155' }}>
                        Target Release Version *
                      </label>
                      <input
                        type="text"
                        className="pb-input"
                        placeholder="e.g. 1.0.1"
                        value={releaseVersionDraft}
                        onChange={(e) => setReleaseVersionDraft(e.target.value)}
                        required
                        style={{ fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '5px', color: '#334155' }}>
                        Installer Download URL (.exe) *
                      </label>
                      <input
                        type="url"
                        className="pb-input"
                        placeholder="https://.../PrintBot-Setup.exe"
                        value={releaseUrlDraft}
                        onChange={(e) => setReleaseUrlDraft(e.target.value)}
                        required
                        style={{ fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '5px', color: '#334155' }}>
                      Release Notes / What's New (One item per line) *
                    </label>
                    <textarea
                      className="pb-input"
                      rows={3}
                      placeholder="- Added 1-Click Auto Update mechanism&#10;- Improved spooling stability and print reliability"
                      value={releaseNotesDraft}
                      onChange={(e) => setReleaseNotesDraft(e.target.value)}
                      required
                      style={{ fontSize: '13px', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        id="mandatoryReleaseToggle"
                        checked={releaseMandatoryDraft}
                        onChange={(e) => setReleaseMandatoryDraft(e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <label htmlFor="mandatoryReleaseToggle" style={{ fontSize: '13px', fontWeight: 650, color: '#0f172a', cursor: 'pointer' }}>
                        Mandatory Update (Counters must update before proceeding)
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isPublishingRelease}
                      className="pb-btn pb-btn-primary"
                      style={{ height: '40px', padding: '0 24px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      {isPublishingRelease ? (
                        <>
                          <RefreshCw size={15} className="animate-spin" />
                          <span>Publishing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={15} />
                          <span>Publish Update to All Counters</span>
                        </>
                      )}
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
