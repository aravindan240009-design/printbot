import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Printer,
  Layers,
  KeyRound,
  Settings,
  Search,
  FileText,
  Eye,
  RefreshCw,
  Volume2,
  VolumeX,
  Copy,
  ArrowUpRight,
  ShieldCheck,
  X,
  AlertTriangle,
  Lock,
  Unlock,
  CheckCircle2,
  UserCheck,
  PlusCircle,
  Building,
  Phone,
  QrCode,
  DollarSign,
  LogOut,
  Sliders,
  ChevronRight,
  Sparkles,
  Laptop,
  Radio,
  Calendar,
  History,
  Send,
  Key,
  RotateCcw,
  Activity,
  TrendingUp,
  Megaphone,
  Check,
  Trash2,
  BarChart3,
  PieChart
} from 'lucide-react';
import { ThemeProvider, ThemeSwitch, MotionSurface, PaperScene, PrinterScene, useGsapStagger } from '@xerox/ui';
import { discoverPrinters, type NativePrinterInfo } from './native';

// --- Models & Contracts ---

export interface ShopLicense {
  username: string;
  licenseKey: string;
  shopName: string;
  location: string;
  phone: string;
  upiId: string;
  rates: {
    bwPerSideRupees: number;
    colorPerSideRupees: number;
    duplexDiscountPercent: number;
  };
  orderMode: 'MANUAL_APPROVAL' | 'FULL_AUTOMATIC';
  status: 'ACTIVE' | 'REVOKED';
  expiresAt: string;
  isConfigured: boolean;
  duration?: '1 Month' | '1 Year' | 'Lifetime Commercial';
  deviceId?: string | null;
  totalOrdersCount?: number;
  totalPagesCount?: number;
  lastActive?: string;
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
    | 'BROADCAST_PUBLISHED'
    | 'PASSWORD_UPDATED'
    | 'SHOP_SETUP_SAVED'
    | 'JOB_APPROVED';
  details: string;
  actor: string;
}

export interface GlobalBroadcast {
  active: boolean;
  message: string;
  type: 'info' | 'warning' | 'urgent';
  updatedAt: string;
}

export interface PrintJob {
  id: string;
  customer_email: string;
  file_name: string;
  page_count: number;
  logical_pages: number;
  rendered_sides: number;
  physical_sheets: number;
  options: {
    copies: number;
    color_mode: 'color' | 'bw' | 'grayscale';
    paper_size: string;
    duplex_mode: string;
    paper_gsm: number;
    binding: string;
    page_range?: string;
    pages_per_sheet?: number;
  };
  calculated_price_paise: number;
  calculated_price_rupees: number;
  status: 'PENDING_APPROVAL' | 'QUEUED' | 'PRINTING' | 'COMPLETED' | 'COMPLETION_UNKNOWN' | 'REJECTED';
  rejection_reason?: string;
  created_at: string;
}

export interface ConnectedPrinter {
  id: string;
  name: string;
  driver_name: string;
  port: string;
  online: boolean;
  supports_color: boolean;
  supports_duplex: boolean;
  supported_sizes: string[];
}

// Auto-purge any legacy mock/seeded data from browser localStorage once
try {
  if (!localStorage.getItem('printbot_clean_v1')) {
    localStorage.removeItem('printbot_licenses');
    localStorage.removeItem('printbot_audit_logs');
    localStorage.setItem('printbot_clean_v1', 'true');
  }
} catch {}

const INITIAL_LICENSES: Record<string, ShopLicense> = {};

type AppScreen = 'LOCK_SCREEN' | 'SETUP_WIZARD' | 'WORKSTATION' | 'ADMIN_PORTAL';
type Tab = 'queue' | 'printers' | 'pairing' | 'settings';

function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    return () => {
      ref.current?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="ws-dialog"
      aria-labelledby="dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="ws-dialog-head">
        <h2 id="dialog-title">{title}</h2>
        <button aria-label="Close dialog" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export default function App() {
  // --- Persistent Storage State ---
  const [licenses, setLicenses] = useState<Record<string, ShopLicense>>(() => {
    try {
      const saved = localStorage.getItem('printbot_licenses');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_LICENSES;
  });

  const [activeSession, setActiveSession] = useState<{
    role: 'SHOP_OWNER' | 'ADMIN';
    username: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('printbot_session');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // Current Screen
  const screen: AppScreen = useMemo(() => {
    if (!activeSession) return 'LOCK_SCREEN';
    if (activeSession.role === 'ADMIN') return 'ADMIN_PORTAL';
    const shop = licenses[activeSession.username];
    if (shop && !shop.isConfigured) return 'SETUP_WIZARD';
    return 'WORKSTATION';
  }, [activeSession, licenses]);

  // Save changes
  useEffect(() => {
    localStorage.setItem('printbot_licenses', JSON.stringify(licenses));
  }, [licenses]);

  useEffect(() => {
    if (activeSession) {
      localStorage.setItem('printbot_session', JSON.stringify(activeSession));
    } else {
      localStorage.removeItem('printbot_session');
    }
  }, [activeSession]);

  // Current Shop Data
  const currentShop: ShopLicense | undefined =
    activeSession?.role === 'SHOP_OWNER' ? licenses[activeSession.username] : undefined;

  // --- Admin Security & Password Persistence ---
  const [adminCustomPassword, setAdminCustomPassword] = useState<string>(() => {
    return localStorage.getItem('printbot_admin_key') || 'admin@123';
  });

  // --- Unified Lock Screen Form State ---
  const [loginUsername, setLoginUsername] = useState('');
  const [loginKey, setLoginKey] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleUnifiedLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const u = loginUsername.trim().toLowerCase();
    const k = loginKey.trim();

    // 1. Admin Authentication Check (Matches custom password or default admin@123)
    if (u === 'admin' && (k === adminCustomPassword || k === 'admin@123')) {
      setActiveSession({ role: 'ADMIN', username: 'admin' });
      return;
    }

    // 2. Shop Owner License Check (case-insensitive key comparison)
    const license = licenses[u];
    if (license && license.licenseKey.trim().toUpperCase() === k.toUpperCase()) {
      if (license.status === 'REVOKED') {
        setLoginError('This license key has been revoked by the Admin.');
        return;
      }
      setActiveSession({ role: 'SHOP_OWNER', username: u });
      return;
    }

    setLoginError('Invalid Username or Key. Please check your credentials or contact Admin.');
  };

  const handleLogout = () => {
    setActiveSession(null);
    setLoginError('');
  };

  // --- Setup Wizard State (Fill Details) ---
  const [setupShopName, setSetupShopName] = useState(currentShop?.shopName || '');
  const [setupLocation, setSetupLocation] = useState(currentShop?.location || '');
  const [setupPhone, setSetupPhone] = useState(currentShop?.phone || '');
  const [setupUpi, setSetupUpi] = useState(currentShop?.upiId || '');
  const [setupBwRate, setSetupBwRate] = useState(currentShop?.rates.bwPerSideRupees || 1.5);
  const [setupColorRate, setSetupColorRate] = useState(currentShop?.rates.colorPerSideRupees || 10.0);
  const [setupOrderMode, setSetupOrderMode] = useState<'MANUAL_APPROVAL' | 'FULL_AUTOMATIC'>(
    currentShop?.orderMode || 'MANUAL_APPROVAL'
  );

  const handleSaveSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    const u = activeSession.username;
    setLicenses((prev) => ({
      ...prev,
      [u]: {
        ...prev[u],
        shopName: setupShopName || 'My Xerox Shop',
        location: setupLocation || 'Counter 01',
        phone: setupPhone || '+91 99999 99999',
        upiId: setupUpi || 'shop@upi',
        rates: {
          bwPerSideRupees: Number(setupBwRate) || 1.5,
          colorPerSideRupees: Number(setupColorRate) || 10.0,
          duplexDiscountPercent: 15,
        },
        orderMode: setupOrderMode,
        isConfigured: true,
      },
    }));
  };

  // --- Admin Multi-Tab & Management State ---
  type AdminTab = 'LICENSES' | 'SHOPS_DEVICES' | 'REVENUE' | 'BROADCASTS' | 'AUDIT_SECURITY';
  const [adminActiveTab, setAdminActiveTab] = useState<AdminTab>('LICENSES');
  const [adminNotice, setAdminNotice] = useState<string | null>(null);

  // Auto-dismiss admin notice after 5 seconds
  useEffect(() => {
    if (!adminNotice) return;
    const timer = setTimeout(() => setAdminNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [adminNotice]);

  // --- Audit Trail State ---
  const [auditLogs, setAuditLogs] = useState<AdminAuditEntry[]>(() => {
    try {
      const saved = localStorage.getItem('printbot_audit_logs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    localStorage.setItem('printbot_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  const logAdminAction = (action: AdminAuditEntry['action'], details: string) => {
    const entry: AdminAuditEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      action,
      details,
      actor: 'admin',
    };
    setAuditLogs((prev) => [entry, ...prev]);
  };

  // --- Global Broadcast State ---
  const [globalBroadcast, setGlobalBroadcast] = useState<GlobalBroadcast>(() => {
    try {
      const saved = localStorage.getItem('printbot_global_broadcast');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      active: true,
      message: 'Cloud print spooling is operational across all shop counters. Welcome to Print Bot network!',
      type: 'info',
      updatedAt: '2026-10-29',
    };
  });

  useEffect(() => {
    localStorage.setItem('printbot_global_broadcast', JSON.stringify(globalBroadcast));
  }, [globalBroadcast]);

  const [broadcastDraft, setBroadcastDraft] = useState(globalBroadcast.message);
  const [broadcastTypeDraft, setBroadcastTypeDraft] = useState<GlobalBroadcast['type']>(globalBroadcast.type);
  const [broadcastEnabledDraft, setBroadcastEnabledDraft] = useState(globalBroadcast.active);

  const handleSaveBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: GlobalBroadcast = {
      active: broadcastEnabledDraft,
      message: broadcastDraft.trim() || 'All counters operational.',
      type: broadcastTypeDraft,
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 10),
    };
    setGlobalBroadcast(updated);
    logAdminAction('BROADCAST_PUBLISHED', `Updated network broadcast: "${updated.message.slice(0, 45)}..."`);
    setAdminNotice('Network broadcast updated! All shop counter screens will reflect this message.');
  };

  // --- Key Generator & Management State ---
  const [newShopName, setNewShopName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newDuration, setNewDuration] = useState<'1 Month' | '1 Year' | 'Lifetime Commercial'>('1 Year');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [licenseSearchQuery, setLicenseSearchQuery] = useState('');
  const [licenseStatusFilter, setLicenseStatusFilter] = useState<'ALL' | 'ACTIVE' | 'REVOKED'>('ALL');

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName.trim() || !newUsername.trim()) return;

    const u = newUsername.trim().toLowerCase();
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randomHex2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const key = `PB-KEY-${randomHex}-${randomHex2}`;

    // Calculate expiry date
    const expiry = new Date();
    if (newDuration === '1 Month') {
      expiry.setDate(expiry.getDate() + 30);
    } else if (newDuration === '1 Year') {
      expiry.setFullYear(expiry.getFullYear() + 1);
    } else {
      expiry.setFullYear(expiry.getFullYear() + 50); // Lifetime
    }
    const expiryStr = expiry.toISOString().split('T')[0];

    const newLicense: ShopLicense = {
      username: u,
      licenseKey: key,
      shopName: newShopName.trim(),
      location: 'Branch Counter 01',
      phone: '+91 90000 00000',
      upiId: 'shop@upi',
      rates: {
        bwPerSideRupees: 1.5,
        colorPerSideRupees: 10.0,
        duplexDiscountPercent: 15,
      },
      orderMode: 'MANUAL_APPROVAL',
      status: 'ACTIVE',
      expiresAt: expiryStr,
      isConfigured: false,
      duration: newDuration,
      deviceId: null,
      totalOrdersCount: 0,
      totalPagesCount: 0,
      lastActive: 'Just now',
    };

    setLicenses((prev) => ({ ...prev, [u]: newLicense }));
    setGeneratedKey(key);
    logAdminAction('KEY_ISSUED', `Issued ${newDuration} license (${key}) to ${newShopName.trim()} (${u})`);
    setAdminNotice(`Generated new license key for ${newShopName.trim()}!`);
    setNewShopName('');
    setNewUsername('');
  };

  const handleRevokeKey = (username: string) => {
    const isCurrentlyActive = licenses[username]?.status === 'ACTIVE';
    setLicenses((prev) => ({
      ...prev,
      [username]: { ...prev[username], status: isCurrentlyActive ? 'REVOKED' : 'ACTIVE' },
    }));
    logAdminAction(
      isCurrentlyActive ? 'KEY_REVOKED' : 'KEY_REACTIVATED',
      `${isCurrentlyActive ? 'Revoked' : 'Reactivated'} license for ${licenses[username]?.shopName || username}`
    );
    setAdminNotice(`License for ${username} is now ${isCurrentlyActive ? 'REVOKED' : 'ACTIVE'}.`);
  };

  const handleDeleteKey = (username: string) => {
    const lic = licenses[username];
    const shopName = lic?.shopName || username;
    const confirmed = window.confirm(
      `Permanently delete the license key for "${shopName}" (@${username})?\n\nThis removes the key and revokes login access permanently.`
    );
    if (!confirmed) return;

    setLicenses((prev) => {
      const copy = { ...prev };
      delete copy[username];
      return copy;
    });

    logAdminAction('KEY_DELETED', `Permanently deleted license key for ${shopName} (${username})`);
    setAdminNotice(`License key for "${shopName}" was successfully deleted.`);
  };

  const handleExtendLicense = (username: string, durationToAdd: '1 Month' | '1 Year') => {
    const lic = licenses[username];
    if (!lic) return;
    const currentExpiry = new Date(lic.expiresAt);
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();

    if (durationToAdd === '1 Month') {
      baseDate.setDate(baseDate.getDate() + 30);
    } else {
      baseDate.setFullYear(baseDate.getFullYear() + 1);
    }
    const newExpiryStr = baseDate.toISOString().split('T')[0];

    setLicenses((prev) => ({
      ...prev,
      [username]: {
        ...prev[username],
        expiresAt: newExpiryStr,
        status: 'ACTIVE',
      },
    }));
    logAdminAction('KEY_EXTENDED', `Extended license for ${lic.shopName} by ${durationToAdd} (New Expiry: ${newExpiryStr})`);
    setAdminNotice(`Extended license for ${lic.shopName} until ${newExpiryStr}!`);
  };

  const handleResetDevice = (username: string) => {
    const lic = licenses[username];
    if (!lic) return;
    setLicenses((prev) => ({
      ...prev,
      [username]: { ...prev[username], deviceId: null },
    }));
    logAdminAction('DEVICE_RESET', `Cleared authorized PC hardware binding for ${lic.shopName} (${username})`);
    setAdminNotice(`Hardware pairing cleared for ${lic.shopName}. The shop owner can now pair their new PC.`);
  };

  // --- Admin Password Change State ---
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [passChangeStatus, setPassChangeStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleChangeAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassChangeStatus(null);

    if (currentPassInput !== adminCustomPassword && currentPassInput !== 'admin@123') {
      setPassChangeStatus({ type: 'error', msg: 'Current password does not match.' });
      return;
    }

    if (newPassInput.length < 6) {
      setPassChangeStatus({ type: 'error', msg: 'New password must be at least 6 characters.' });
      return;
    }

    if (newPassInput !== confirmPassInput) {
      setPassChangeStatus({ type: 'error', msg: 'New password and confirmation do not match.' });
      return;
    }

    localStorage.setItem('printbot_admin_key', newPassInput);
    setAdminCustomPassword(newPassInput);
    logAdminAction('PASSWORD_UPDATED', 'Super-admin credential updated successfully.');
    setPassChangeStatus({ type: 'success', msg: 'Admin password updated! Use this new key on next login.' });
    setCurrentPassInput('');
    setNewPassInput('');
    setConfirmPassInput('');
  };

  // --- Workstation Queue State ---
  const [activeTab, setActiveTab] = useState<Tab>('queue');
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectionModalJobId, setRejectionModalJobId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Poor image resolution or blurred scan');
  const [notice, setNotice] = useState('');
  const [nativePrinters, setNativePrinters] = useState<NativePrinterInfo[] | null>(null);

  const [printers] = useState<ConnectedPrinter[]>([]);

  const [jobs, setJobs] = useState<PrintJob[]>([]);

  // Fetch native Windows spooler printers if available
  useEffect(() => {
    discoverPrinters()
      .then(setNativePrinters)
      .catch(() => setNativePrinters(null));
  }, []);

  const handleApproveJob = (jobId: string) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: 'QUEUED' } : j))
    );
    setNotice(`Job ${jobId} approved and dispatched to printer spooler.`);
  };

  const handleRejectJob = () => {
    if (!rejectionModalJobId) return;
    setJobs((prev) =>
      prev.map((j) =>
        j.id === rejectionModalJobId
          ? { ...j, status: 'REJECTED', rejection_reason: rejectionReason }
          : j
      )
    );
    setNotice(`Job ${rejectionModalJobId} rejected.`);
    setRejectionModalJobId(null);
  };

  const handleSimulateNewCustomerJob = () => {
    const randomId = 'job-' + Math.floor(1000 + Math.random() * 9000);
    const newJob: PrintJob = {
      id: randomId,
      customer_email: 'walkin.customer@mobile.in',
      file_name: 'Passport_and_ID_Card.pdf',
      page_count: 2,
      logical_pages: 2,
      rendered_sides: 2,
      physical_sheets: 2,
      options: {
        copies: 1,
        color_mode: 'color',
        paper_size: 'A4',
        duplex_mode: 'simplex',
        paper_gsm: 75,
        binding: 'none',
      },
      calculated_price_paise: 2000,
      calculated_price_rupees: 20.0,
      status: currentShop?.orderMode === 'FULL_AUTOMATIC' ? 'QUEUED' : 'PENDING_APPROVAL',
      created_at: 'Just now',
    };
    setJobs((prev) => [newJob, ...prev]);
    setNotice(`New incoming QR customer order ${randomId} received!`);
  };

  // ==========================================
  // RENDER SCREEN 1: LOCKED / LICENSE LOGIN
  // ==========================================
  if (screen === 'LOCK_SCREEN') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--pb-bg)',
          color: 'var(--pb-text)',
          padding: '24px',
        }}
      >
        <div
          style={{
            width: 'min(460px, 100%)',
            background: 'var(--pb-surface)',
            border: '1px solid var(--pb-border)',
            borderRadius: '20px',
            padding: '36px 32px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.06)',
          }}
        >
          {/* Logo & Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'var(--pb-accent)',
                color: 'var(--pb-on-accent)',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Lock size={28} />
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
              Print Bot
            </h1>
            <p style={{ color: 'var(--pb-muted)', fontSize: '13px', marginTop: '6px' }}>
              Counter Operating System · License Activation
            </p>
          </div>

          {loginError && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: '#fef2f2',
                color: '#991b1b',
                border: '1px solid #fecaca',
                fontSize: '12px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertTriangle size={16} />
              <span>{loginError}</span>
            </div>
          )}

          {/* Single Unified Login Form */}
          <form onSubmit={handleUnifiedLogin} style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                Username
              </label>
              <input
                type="text"
                placeholder="Enter username (e.g. shopowner or admin)"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                Key / Password
              </label>
              <input
                type="password"
                placeholder="Enter key (e.g. PB-KEY-2026-XEROX or admin@123)"
                value={loginKey}
                onChange={(e) => setLoginKey(e.target.value)}
                required
              />
            </div>

            <div
              style={{
                background: 'var(--pb-raised)',
                border: '1px solid var(--pb-border)',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '11px',
                color: 'var(--pb-muted)',
                lineHeight: '1.6',
                textAlign: 'center',
              }}
            >
              <strong>Super Admin Portal:</strong> Username: <code>admin</code> | Key: <code>admin@123</code>
              <div style={{ marginTop: '4px', fontSize: '10px' }}>
                Shop owners log in with their issued License Key created by the Super Admin.
              </div>
            </div>

            <button
              type="submit"
              className="ws-primary"
              style={{
                width: '100%',
                minHeight: '46px',
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '14px',
              }}
            >
              <Unlock size={18} />
              Unlock Print Bot Software
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER SCREEN 2: FIRST-TIME SETUP WIZARD
  // ==========================================
  if (screen === 'SETUP_WIZARD') {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--pb-bg)',
          color: 'var(--pb-text)',
          padding: '40px 24px',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <div
          style={{
            width: 'min(680px, 100%)',
            background: 'var(--pb-surface)',
            border: '1px solid var(--pb-border)',
            borderRadius: '20px',
            padding: '36px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'var(--pb-accent-soft)',
                color: 'var(--pb-accent)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Sparkles size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>Shop Setup Wizard</h1>
              <p style={{ color: 'var(--pb-muted)', fontSize: '13px', margin: '4px 0 0' }}>
                Key verified! Fill in your Xerox shop details to begin receiving customer orders.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveSetup} style={{ display: 'grid', gap: '20px' }}>
            {/* Identity */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Xerox Shop Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Metro Xerox & Digital Prints"
                  value={setupShopName}
                  onChange={(e) => setSetupShopName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Branch / Location *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Counter 01, Main Road"
                  value={setupLocation}
                  onChange={(e) => setSetupLocation(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Contact Phone *
                </label>
                <input
                  type="text"
                  placeholder="+91 98401 23456"
                  value={setupPhone}
                  onChange={(e) => setSetupPhone(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Shop UPI ID for Customer Payments *
                </label>
                <input
                  type="text"
                  placeholder="e.g. yourname@okaxis"
                  value={setupUpi}
                  onChange={(e) => setSetupUpi(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Pricing */}
            <div
              style={{
                borderTop: '1px solid var(--pb-border)',
                paddingTop: '20px',
              }}
            >
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>
                Per-Page Pricing Rates (INR ₹)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                    Black & White Rate per Page (₹)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={setupBwRate}
                    onChange={(e) => setSetupBwRate(Number(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                    Full Color Rate per Page (₹)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={setupColorRate}
                    onChange={(e) => setSetupColorRate(Number(e.target.value))}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Operating Mode */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                Workstation Order Dispatch Mode
              </label>
              <select
                value={setupOrderMode}
                onChange={(e) => setSetupOrderMode(e.target.value as 'MANUAL_APPROVAL' | 'FULL_AUTOMATIC')}
              >
                <option value="MANUAL_APPROVAL">
                  Manual Approval (Operator reviews & clicks Approve before printing)
                </option>
                <option value="FULL_AUTOMATIC">
                  Full Automatic (Directly prints once customer UPI payment is verified)
                </option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <button type="button" onClick={handleLogout}>
                Cancel / Log Out
              </button>
              <button type="submit" className="ws-primary" style={{ minWidth: '180px' }}>
                Save & Open Queue →
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER SCREEN 4: SUPER ADMIN PORTAL
  // ==========================================
  if (screen === 'ADMIN_PORTAL') {
    const shopList = Object.values(licenses);
    const activeCount = shopList.filter((l) => l.status === 'ACTIVE').length;
    const revokedCount = shopList.filter((l) => l.status === 'REVOKED').length;

    // Total Subscription Revenue calculation
    const totalRevenueRupees = shopList.reduce((acc, l) => {
      if (l.duration === '1 Month') return acc + 499;
      if (l.duration === 'Lifetime Commercial') return acc + 14999;
      return acc + 4999; // Default 1 Year
    }, 0);

    const totalNetworkOrders = shopList.reduce((acc, l) => acc + (l.totalOrdersCount || 0), 0);
    const totalNetworkPages = shopList.reduce((acc, l) => acc + (l.totalPagesCount || 0), 0);

    // Filtered Licenses for Tab 1
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
      <div style={{ minHeight: '100vh', background: 'var(--pb-bg)', color: 'var(--pb-text)' }}>
        {/* Admin Topbar */}
        <header
          style={{
            height: '72px',
            borderBottom: '1px solid var(--pb-border)',
            background: 'var(--pb-surface)',
            padding: '0 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'var(--pb-text)',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ fontSize: '17px', fontWeight: 800 }}>Print Bot Admin Center</strong>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    background: 'var(--pb-accent-soft)',
                    color: 'var(--pb-accent)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                  }}
                >
                  Super Admin
                </span>
              </div>
              <small style={{ color: 'var(--pb-muted)', fontSize: '11px' }}>
                Platform Operations · Commercial Licensing · Multi-Tenant Monitoring
              </small>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ textAlign: 'right', marginRight: '6px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700 }}>Logged in: admin</div>
              <small style={{ fontSize: '10px', color: 'var(--pb-muted)' }}>Assurance: Audited Elevated</small>
            </div>
            <button onClick={handleLogout} style={{ minHeight: '38px', fontSize: '12px', gap: '6px' }}>
              <LogOut size={16} /> Log Out
            </button>
          </div>
        </header>

        {/* Admin Navigation Tabs */}
        <div
          style={{
            background: 'var(--pb-surface)',
            borderBottom: '1px solid var(--pb-border)',
            padding: '0 32px',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
          }}
        >
          {[
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
                style={{
                  border: 0,
                  borderBottom: isActive ? '3px solid var(--pb-accent)' : '3px solid transparent',
                  background: 'transparent',
                  color: isActive ? 'var(--pb-text)' : 'var(--pb-muted)',
                  fontWeight: isActive ? 700 : 550,
                  padding: '16px 14px',
                  borderRadius: 0,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon size={16} color={isActive ? 'var(--pb-accent)' : undefined} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '10px',
                      background: isActive ? 'var(--pb-accent)' : 'var(--pb-raised)',
                      color: isActive ? '#fff' : 'var(--pb-text)',
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Global Admin Notice Toast */}
        {adminNotice && (
          <div
            style={{
              background: '#ecfdf5',
              color: '#065f46',
              borderBottom: '1px solid #a7f3d0',
              padding: '12px 32px',
              fontSize: '13px',
              fontWeight: 650,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} />
              <span>{adminNotice}</span>
            </div>
            <button
              onClick={() => setAdminNotice(null)}
              style={{ border: 0, background: 'transparent', padding: '2px', minHeight: 'auto', color: '#065f46' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '32px 24px' }}>
          {/* ========================================================= */}
          {/* TAB 1: LICENSES & KEYS */}
          {/* ========================================================= */}
          {adminActiveTab === 'LICENSES' && (
            <div>
              {/* Stat Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '16px',
                  marginBottom: '28px',
                }}
              >
                <div
                  style={{
                    background: 'var(--pb-surface)',
                    border: '1px solid var(--pb-border)',
                    borderRadius: '14px',
                    padding: '20px',
                  }}
                >
                  <small style={{ color: 'var(--pb-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                    Total Issued Keys
                  </small>
                  <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '4px' }}>{shopList.length}</div>
                </div>

                <div
                  style={{
                    background: 'var(--pb-surface)',
                    border: '1px solid var(--pb-border)',
                    borderRadius: '14px',
                    padding: '20px',
                  }}
                >
                  <small style={{ color: 'var(--pb-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                    Active Subscriptions
                  </small>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                    {activeCount}
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--pb-surface)',
                    border: '1px solid var(--pb-border)',
                    borderRadius: '14px',
                    padding: '20px',
                  }}
                >
                  <small style={{ color: 'var(--pb-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                    Revoked / Paused
                  </small>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: revokedCount > 0 ? '#dc2626' : 'var(--pb-muted)', marginTop: '4px' }}>
                    {revokedCount}
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--pb-surface)',
                    border: '1px solid var(--pb-border)',
                    borderRadius: '14px',
                    padding: '20px',
                  }}
                >
                  <small style={{ color: 'var(--pb-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                    Subscription Revenue
                  </small>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--pb-accent)', marginTop: '4px' }}>
                    ₹{totalRevenueRupees.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Key Generator Card */}
              <div
                style={{
                  background: 'var(--pb-surface)',
                  border: '1px solid var(--pb-border)',
                  borderRadius: '16px',
                  padding: '28px',
                  marginBottom: '28px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <PlusCircle size={22} color="var(--pb-accent)" />
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Generate New Shop License Key</h2>
                    <small style={{ color: 'var(--pb-muted)', fontSize: '12px' }}>
                      Issue an authenticated key for a Xerox shop subscription with unlimited connected printers.
                    </small>
                  </div>
                </div>

                <form
                  onSubmit={handleGenerateKey}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) auto',
                    gap: '14px',
                    alignItems: 'flex-end',
                  }}
                >
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                      Xerox Shop Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. City Central Xerox"
                      value={newShopName}
                      onChange={(e) => setNewShopName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                      Shop Owner Username *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. central_xerox"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                      Plan Duration & Price
                    </label>
                    <select
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value as '1 Month' | '1 Year' | 'Lifetime Commercial')}
                    >
                      <option value="1 Month">1 Month (₹499)</option>
                      <option value="1 Year">1 Year (₹4,999)</option>
                      <option value="Lifetime Commercial">Lifetime Commercial (₹14,999)</option>
                    </select>
                  </div>

                  <button type="submit" className="ws-primary" style={{ minHeight: '44px' }}>
                    Generate Key
                  </button>
                </form>

                {generatedKey && (
                  <div
                    style={{
                      marginTop: '20px',
                      padding: '16px 20px',
                      borderRadius: '12px',
                      background: 'var(--pb-accent-soft)',
                      border: '1px solid var(--pb-accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--pb-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Newly Generated Key (Share with Shop Owner):
                      </span>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--pb-text)', marginTop: '4px' }}>
                        <code>{generatedKey}</code>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedKey);
                        setAdminNotice('Copied license key to clipboard!');
                      }}
                      style={{ minHeight: '38px', fontSize: '12px' }}
                    >
                      <Copy size={16} /> Copy Key
                    </button>
                  </div>
                )}
              </div>

              {/* License Management Table */}
              <div
                style={{
                  background: 'var(--pb-surface)',
                  border: '1px solid var(--pb-border)',
                  borderRadius: '16px',
                  padding: '28px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '14px',
                    marginBottom: '20px',
                  }}
                >
                  <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                    Active Shop Licenses ({filteredLicenses.length})
                  </h2>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Search shop, username, or key..."
                      value={licenseSearchQuery}
                      onChange={(e) => setLicenseSearchQuery(e.target.value)}
                      style={{ width: '240px', fontSize: '12px', minHeight: '36px' }}
                    />
                    <select
                      value={licenseStatusFilter}
                      onChange={(e) => setLicenseStatusFilter(e.target.value as any)}
                      style={{ fontSize: '12px', minHeight: '36px' }}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="ACTIVE">Active Only</option>
                      <option value="REVOKED">Revoked Only</option>
                    </select>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--pb-border)', textAlign: 'left', color: 'var(--pb-muted)' }}>
                        <th style={{ padding: '12px 14px' }}>Shop & Plan</th>
                        <th style={{ padding: '12px 14px' }}>Username</th>
                        <th style={{ padding: '12px 14px' }}>License Key</th>
                        <th style={{ padding: '12px 14px' }}>Expires At</th>
                        <th style={{ padding: '12px 14px' }}>Status</th>
                        <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLicenses.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--pb-muted)' }}>
                            {shopList.length === 0
                              ? 'No shop licenses issued yet. Use the generator above to create your first shop license key.'
                              : 'No licenses match your search criteria.'}
                          </td>
                        </tr>
                      ) : (
                        filteredLicenses.map((lic) => (
                          <tr key={lic.username} style={{ borderBottom: '1px solid var(--pb-rule)' }}>
                            <td style={{ padding: '14px' }}>
                              <div style={{ fontWeight: 750 }}>{lic.shopName}</div>
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  background: 'var(--pb-raised)',
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                  marginTop: '4px',
                                  display: 'inline-block',
                                }}
                              >
                                {lic.duration || '1 Year'}
                              </span>
                            </td>

                            <td style={{ padding: '14px' }}>
                              <code>{lic.username}</code>
                            </td>

                            <td style={{ padding: '14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <code style={{ background: 'var(--pb-raised)', padding: '4px 8px', borderRadius: '4px' }}>
                                  {lic.licenseKey}
                                </code>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(lic.licenseKey);
                                    setAdminNotice(`Copied key for ${lic.shopName}`);
                                  }}
                                  style={{ border: 0, padding: '4px', minHeight: 'auto', background: 'transparent' }}
                                  title="Copy Key"
                                >
                                  <Copy size={14} />
                                </button>
                              </div>
                            </td>

                            <td style={{ padding: '14px', fontSize: '12px' }}>
                              <div>{lic.expiresAt}</div>
                              <small style={{ color: 'var(--pb-muted)' }}>
                                {new Date(lic.expiresAt) > new Date() ? 'Valid' : 'Expired'}
                              </small>
                            </td>

                            <td style={{ padding: '14px' }}>
                              <span
                                style={{
                                  padding: '4px 10px',
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

                            <td style={{ padding: '14px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => handleExtendLicense(lic.username, '1 Year')}
                                  style={{ padding: '4px 10px', fontSize: '11px', minHeight: '30px' }}
                                  title="Extend license for 1 more year"
                                >
                                  <RotateCcw size={12} /> +1 Year
                                </button>
                                <button
                                  onClick={() => handleRevokeKey(lic.username)}
                                  style={{
                                    padding: '4px 10px',
                                    fontSize: '11px',
                                    minHeight: '30px',
                                    color: lic.status === 'ACTIVE' ? '#b91c1c' : '#047857',
                                  }}
                                >
                                  {lic.status === 'ACTIVE' ? 'Revoke' : 'Reactivate'}
                                </button>
                                <button
                                  onClick={() => handleResetDevice(lic.username)}
                                  style={{ padding: '4px 10px', fontSize: '11px', minHeight: '30px' }}
                                  title="Allow shop owner to re-pair on a new computer"
                                >
                                  <Laptop size={12} /> Reset PC
                                </button>
                                <button
                                  onClick={() => handleDeleteKey(lic.username)}
                                  style={{
                                    padding: '4px 10px',
                                    fontSize: '11px',
                                    minHeight: '30px',
                                    color: '#ef4444',
                                    border: '1px solid rgba(239, 68, 68, 0.35)',
                                    background: 'rgba(239, 68, 68, 0.08)',
                                  }}
                                  title="Permanently delete this shop license key"
                                >
                                  <Trash2 size={12} /> Delete
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
                  background: 'var(--pb-accent-soft)',
                  border: '1px solid var(--pb-accent)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  marginBottom: '24px',
                  fontSize: '12px',
                  color: 'var(--pb-text)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <Laptop size={22} color="var(--pb-accent)" />
                <div>
                  <strong>Hardware Device Binding Policy:</strong> Each subscribed Xerox shop connects unlimited physical
                  printers through their authenticated Windows counter PC. Device pairing is locked to the counter computer's
                  hardware/TPM identity to prevent unauthorized software copying. If a shop replaces their PC, click "Reset PC
                  Binding" below.
                </div>
              </div>

              {shopList.length === 0 ? (
                <div
                  style={{
                    background: 'var(--pb-surface)',
                    border: '1px solid var(--pb-border)',
                    borderRadius: '16px',
                    padding: '48px 24px',
                    textAlign: 'center',
                    color: 'var(--pb-muted)',
                  }}
                >
                  <Building2 size={44} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px', color: 'var(--pb-text)' }}>
                    No Registered Shops
                  </h3>
                  <p style={{ fontSize: '13px', margin: 0 }}>
                    No shop licenses have been created yet. Go to Tab 1 (Licenses & Keys) to issue the first shop license key.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
                  {shopList.map((lic) => (
                  <div
                    key={lic.username}
                    style={{
                      background: 'var(--pb-surface)',
                      border: '1px solid var(--pb-border)',
                      borderRadius: '16px',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                        <div>
                          <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>{lic.shopName}</h3>
                          <small style={{ color: 'var(--pb-muted)', fontSize: '11px' }}>
                            User: <code>{lic.username}</code> · Duration: {lic.duration || '1 Year'}
                          </small>
                        </div>
                        <span
                          style={{
                            padding: '4px 10px',
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

                      <div style={{ display: 'grid', gap: '8px', fontSize: '12px', color: 'var(--pb-text)' }}>
                        <div>
                          <strong style={{ color: 'var(--pb-muted)' }}>Location:</strong> {lic.location || 'Not set'}
                        </div>
                        <div>
                          <strong style={{ color: 'var(--pb-muted)' }}>Phone:</strong> {lic.phone || 'Not set'}
                        </div>
                        <div>
                          <strong style={{ color: 'var(--pb-muted)' }}>UPI ID:</strong> <code>{lic.upiId || 'Not set'}</code>
                        </div>
                        <div>
                          <strong style={{ color: 'var(--pb-muted)' }}>Order Dispatch Mode:</strong>{' '}
                          <span style={{ fontWeight: 650 }}>
                            {lic.orderMode === 'FULL_AUTOMATIC' ? '⚡ Full Automatic' : '✋ Manual Approval'}
                          </span>
                        </div>
                        <div>
                          <strong style={{ color: 'var(--pb-muted)' }}>Setup Status:</strong>{' '}
                          <span style={{ color: lic.isConfigured ? '#059669' : '#d97706', fontWeight: 650 }}>
                            {lic.isConfigured ? '✓ Configured & Operational' : '⏳ Pending Initial Setup'}
                          </span>
                        </div>

                        {/* Device Pairing info */}
                        <div
                          style={{
                            marginTop: '12px',
                            padding: '12px',
                            borderRadius: '10px',
                            background: 'var(--pb-raised)',
                            border: '1px solid var(--pb-border)',
                          }}
                        >
                          <div style={{ fontSize: '11px', color: 'var(--pb-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                            Authorized PC Identity (Hardware Key):
                          </div>
                          <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Laptop size={14} />
                            <code>{lic.deviceId || 'Pending PC Login'}</code>
                          </div>
                          <small style={{ color: '#059669', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                            ✓ TPM-backed hardware assurance
                          </small>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: '20px',
                        paddingTop: '16px',
                        borderTop: '1px solid var(--pb-border)',
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: '8px',
                      }}
                    >
                      <button
                        onClick={() => handleResetDevice(lic.username)}
                        style={{ minHeight: '36px', fontSize: '12px', gap: '6px' }}
                      >
                        <Laptop size={14} /> Reset Hardware Pairing
                      </button>
                      <button
                        onClick={() => handleDeleteKey(lic.username)}
                        style={{
                          minHeight: '36px',
                          fontSize: '12px',
                          gap: '6px',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          background: 'rgba(239, 68, 68, 0.08)',
                          padding: '0 14px',
                        }}
                        title="Delete this shop license permanently"
                      >
                        <Trash2 size={14} /> Delete
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
              {/* Revenue Big Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '16px',
                  marginBottom: '24px',
                }}
              >
                <div
                  style={{
                    background: 'var(--pb-surface)',
                    border: '1px solid var(--pb-border)',
                    borderRadius: '16px',
                    padding: '24px',
                  }}
                >
                  <small style={{ color: 'var(--pb-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                    Total Subscription Revenue
                  </small>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--pb-accent)', marginTop: '6px' }}>
                    ₹{totalRevenueRupees.toLocaleString('en-IN')}
                  </div>
                  <small style={{ color: 'var(--pb-muted)', fontSize: '11px', display: 'block', marginTop: '6px' }}>
                    From {shopList.length} subscribed Xerox shops
                  </small>
                </div>

                <div
                  style={{
                    background: 'var(--pb-surface)',
                    border: '1px solid var(--pb-border)',
                    borderRadius: '16px',
                    padding: '24px',
                  }}
                >
                  <small style={{ color: 'var(--pb-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                    Projected Annual ARR
                  </small>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: '#059669', marginTop: '6px' }}>
                    ₹{(activeCount * 4999).toLocaleString('en-IN')}
                  </div>
                  <small style={{ color: 'var(--pb-muted)', fontSize: '11px', display: 'block', marginTop: '6px' }}>
                    Recurring software subscription ARR
                  </small>
                </div>

                <div
                  style={{
                    background: 'var(--pb-surface)',
                    border: '1px solid var(--pb-border)',
                    borderRadius: '16px',
                    padding: '24px',
                  }}
                >
                  <small style={{ color: 'var(--pb-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                    Network Orders Handled
                  </small>
                  <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '6px' }}>
                    {totalNetworkOrders.toLocaleString()}
                  </div>
                  <small style={{ color: 'var(--pb-muted)', fontSize: '11px', display: 'block', marginTop: '6px' }}>
                    Direct customer QR uploads
                  </small>
                </div>

                <div
                  style={{
                    background: 'var(--pb-surface)',
                    border: '1px solid var(--pb-border)',
                    borderRadius: '16px',
                    padding: '24px',
                  }}
                >
                  <small style={{ color: 'var(--pb-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                    Total Pages Spooled
                  </small>
                  <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '6px' }}>
                    {totalNetworkPages.toLocaleString()}
                  </div>
                  <small style={{ color: 'var(--pb-muted)', fontSize: '11px', display: 'block', marginTop: '6px' }}>
                    High-level anonymous volume
                  </small>
                </div>
              </div>

              {/* Analytics & Financial Growth Charts */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
                  gap: '20px',
                  marginBottom: '28px',
                }}
              >
                {/* Chart 1: Monthly SaaS Subscription Revenue & Orders Growth */}
                <div
                  style={{
                    background: 'var(--pb-surface)',
                    border: '1px solid var(--pb-border)',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '16px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart3 size={18} color="var(--pb-accent)" />
                        <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                          Monthly Revenue & Orders Trend
                        </h3>
                      </div>
                      <small style={{ color: 'var(--pb-muted)', fontSize: '12px', marginTop: '2px', display: 'block' }}>
                        Subscription revenue (bars) vs customer print volume (trendline)
                      </small>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', fontWeight: 600 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--pb-accent)' }} />
                        Revenue (₹)
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '10px', height: '3px', borderRadius: '2px', background: '#10b981' }} />
                        Orders
                      </span>
                    </div>
                  </div>

                  {/* SVG Bar & Trendline Chart */}
                  {shopList.length === 0 ? (
                    <div
                      style={{
                        height: '220px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--pb-muted)',
                        background: 'var(--pb-raised)',
                        borderRadius: '12px',
                        border: '1px dashed var(--pb-border)',
                      }}
                    >
                      <BarChart3 size={36} style={{ marginBottom: '8px', opacity: 0.4 }} />
                      <strong style={{ fontSize: '13px', color: 'var(--pb-text)' }}>No Financial Activity Yet</strong>
                      <small style={{ fontSize: '11px', marginTop: '2px' }}>
                        Issue shop licenses in Tab 1 to start tracking live revenue and growth trends.
                      </small>
                    </div>
                  ) : (
                    <div style={{ width: '100%', height: '220px', position: 'relative' }}>
                      <svg viewBox="0 0 540 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                        <defs>
                          <linearGradient id="revenueBarGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--pb-accent)" stopOpacity="0.9" />
                            <stop offset="100%" stopColor="var(--pb-accent)" stopOpacity="0.3" />
                          </linearGradient>
                        </defs>

                        {[40, 80, 120, 160].map((y) => (
                          <line
                            key={y}
                            x1="40"
                            y1={y}
                            x2="530"
                            y2={y}
                            stroke="var(--pb-border)"
                            strokeDasharray="4 4"
                            strokeWidth="1"
                          />
                        ))}

                        <text x="32" y="44" fill="var(--pb-muted)" fontSize="9" textAnchor="end">₹{totalRevenueRupees.toLocaleString('en-IN')}</text>
                        <text x="32" y="84" fill="var(--pb-muted)" fontSize="9" textAnchor="end">₹{(Math.round(totalRevenueRupees * 0.75)).toLocaleString('en-IN')}</text>
                        <text x="32" y="124" fill="var(--pb-muted)" fontSize="9" textAnchor="end">₹{(Math.round(totalRevenueRupees * 0.5)).toLocaleString('en-IN')}</text>
                        <text x="32" y="164" fill="var(--pb-muted)" fontSize="9" textAnchor="end">₹0</text>

                        {[
                          { label: 'Active Shops', val: `${shopList.filter((s) => s.status === 'ACTIVE').length}`, h: Math.min(140, Math.max(25, shopList.filter((s) => s.status === 'ACTIVE').length * 35)) },
                          { label: 'Total Licenses', val: `${shopList.length}`, h: Math.min(140, Math.max(25, shopList.length * 35)) },
                          { label: 'Orders Processed', val: `${totalNetworkOrders}`, h: Math.min(140, Math.max(25, totalNetworkOrders > 0 ? 80 : 20)) },
                          { label: 'Total Revenue', val: `₹${totalRevenueRupees.toLocaleString('en-IN')}`, h: Math.min(140, Math.max(35, totalRevenueRupees > 0 ? 120 : 25)) },
                        ].map((d, idx) => {
                          const x = 95 + idx * 115;
                          return (
                            <g key={d.label}>
                              <rect
                                x={x - 24}
                                y={170 - d.h}
                                width="48"
                                height={d.h}
                                rx="6"
                                fill="url(#revenueBarGrad)"
                              />
                              <text
                                x={x}
                                y={162 - d.h}
                                fill="var(--pb-text)"
                                fontSize="10"
                                fontWeight="700"
                                textAnchor="middle"
                              >
                                {d.val}
                              </text>
                              <text
                                x={x}
                                y={188}
                                fill="var(--pb-muted)"
                                fontSize="10"
                                fontWeight="600"
                                textAnchor="middle"
                              >
                                {d.label}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  )}
                </div>

                {/* Chart 2: Subscription Plan Distribution & Print Service Mix */}
                <div
                  style={{
                    background: 'var(--pb-surface)',
                    border: '1px solid var(--pb-border)',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <PieChart size={18} color="var(--pb-accent)" />
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                        Subscription Tiers & Service Mix
                      </h3>
                      <small style={{ color: 'var(--pb-muted)', fontSize: '12px' }}>
                        Breakdown of licensed shop models and commercial plans
                      </small>
                    </div>
                  </div>

                  {(() => {
                    const annualCount = shopList.filter((s) => s.duration === '1 Year').length;
                    const monthlyCount = shopList.filter((s) => s.duration === '1 Month').length;
                    const lifetimeCount = shopList.filter((s) => s.duration === 'Lifetime Commercial').length;
                    const annualPct = shopList.length ? Math.round((annualCount / shopList.length) * 100) : 0;
                    const monthlyPct = shopList.length ? Math.round((monthlyCount / shopList.length) * 100) : 0;
                    const lifetimePct = shopList.length ? Math.round((lifetimeCount / shopList.length) * 100) : 0;

                    if (shopList.length === 0) {
                      return (
                        <div
                          style={{
                            height: '160px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--pb-muted)',
                            background: 'var(--pb-raised)',
                            borderRadius: '12px',
                            border: '1px dashed var(--pb-border)',
                          }}
                        >
                          <PieChart size={36} style={{ marginBottom: '8px', opacity: 0.4 }} />
                          <strong style={{ fontSize: '13px', color: 'var(--pb-text)' }}>No Licenses Issued Yet</strong>
                          <small style={{ fontSize: '11px', marginTop: '2px' }}>
                            Plan distribution will appear once shop license keys are issued.
                          </small>
                        </div>
                      );
                    }

                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '20px', alignItems: 'center' }}>
                        <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto' }}>
                          <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                            <circle cx="50" cy="50" r="38" stroke="var(--pb-raised)" strokeWidth="14" fill="transparent" />
                            <circle
                              cx="50"
                              cy="50"
                              r="38"
                              stroke="var(--pb-accent)"
                              strokeWidth="14"
                              strokeDasharray={`${Math.round((annualCount / shopList.length) * 239)} 239`}
                              fill="transparent"
                            />
                          </svg>
                          <div
                            style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              textAlign: 'center',
                            }}
                          >
                            <strong style={{ display: 'block', fontSize: '18px', fontWeight: 800 }}>
                              {shopList.length}
                            </strong>
                            <small style={{ fontSize: '9px', color: 'var(--pb-muted)', textTransform: 'uppercase' }}>
                              Shops
                            </small>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gap: '12px', fontSize: '12px' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 650 }}>Annual Licenses (₹4,999/yr)</span>
                              <span style={{ color: 'var(--pb-muted)', fontWeight: 700 }}>
                                {annualPct}% ({annualCount})
                              </span>
                            </div>
                            <div style={{ height: '7px', background: 'var(--pb-raised)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${annualPct}%`, height: '100%', background: 'var(--pb-accent)' }} />
                            </div>
                          </div>

                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 650 }}>Monthly Plans (₹499/mo)</span>
                              <span style={{ color: 'var(--pb-muted)', fontWeight: 700 }}>
                                {monthlyPct}% ({monthlyCount})
                              </span>
                            </div>
                            <div style={{ height: '7px', background: 'var(--pb-raised)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${monthlyPct}%`, height: '100%', background: '#10b981' }} />
                            </div>
                          </div>

                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 650 }}>Lifetime Commercial (₹14,999)</span>
                              <span style={{ color: 'var(--pb-muted)', fontWeight: 700 }}>
                                {lifetimePct}% ({lifetimeCount})
                              </span>
                            </div>
                            <div style={{ height: '7px', background: 'var(--pb-raised)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${lifetimePct}%`, height: '100%', background: '#f59e0b' }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Privacy Guarantee Card */}
              <div
                style={{
                  background: 'var(--pb-raised)',
                  border: '1px solid var(--pb-border)',
                  borderRadius: '16px',
                  padding: '24px',
                  marginBottom: '28px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                }}
              >
                <ShieldCheck size={28} color="var(--pb-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px' }}>
                    Strict Zero-Knowledge Multi-Tenant Privacy Guarantee
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--pb-muted)', margin: 0, lineHeight: 1.6 }}>
                    Platform administrators can monitor high-level aggregate metrics (orders count, pages count, active printers,
                    and subscription revenue). In accordance with the Print Bot privacy architecture, customer documents, PDFs,
                    personal images, and uploaded files are end-to-end isolated per shop and <strong>never visible to platform administrators</strong>.
                  </p>
                </div>
              </div>

              {/* Shop Activity Comparison Table */}
              <div
                style={{
                  background: 'var(--pb-surface)',
                  border: '1px solid var(--pb-border)',
                  borderRadius: '16px',
                  padding: '28px',
                }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px' }}>
                  Anonymous Shop Volume Breakdown
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--pb-border)', textAlign: 'left', color: 'var(--pb-muted)' }}>
                        <th style={{ padding: '12px 14px' }}>Shop Name</th>
                        <th style={{ padding: '12px 14px' }}>Plan Duration</th>
                        <th style={{ padding: '12px 14px' }}>Completed Orders</th>
                        <th style={{ padding: '12px 14px' }}>Printed Pages</th>
                        <th style={{ padding: '12px 14px' }}>Last Seen</th>
                        <th style={{ padding: '12px 14px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shopList.map((lic) => (
                        <tr key={lic.username} style={{ borderBottom: '1px solid var(--pb-rule)' }}>
                          <td style={{ padding: '14px', fontWeight: 700 }}>{lic.shopName}</td>
                          <td style={{ padding: '14px' }}>{lic.duration || '1 Year'}</td>
                          <td style={{ padding: '14px', fontWeight: 700 }}>{lic.totalOrdersCount || 0}</td>
                          <td style={{ padding: '14px', fontWeight: 700 }}>{lic.totalPagesCount || 0}</td>
                          <td style={{ padding: '14px', color: 'var(--pb-muted)' }}>{lic.lastActive || 'Today, 12:20 PM'}</td>
                          <td style={{ padding: '14px' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
              {/* Broadcast Form */}
              <div
                style={{
                  background: 'var(--pb-surface)',
                  border: '1px solid var(--pb-border)',
                  borderRadius: '16px',
                  padding: '28px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <Megaphone size={22} color="var(--pb-accent)" />
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Network Broadcast Banner</h2>
                    <small style={{ color: 'var(--pb-muted)', fontSize: '12px' }}>
                      Publish an urgent alert or system message to all Xerox shop counter workstations.
                    </small>
                  </div>
                </div>

                <form onSubmit={handleSaveBroadcast} style={{ display: 'grid', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      id="broadcastActive"
                      checked={broadcastEnabledDraft}
                      onChange={(e) => setBroadcastEnabledDraft(e.target.checked)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <label htmlFor="broadcastActive" style={{ fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                      Broadcast is currently active on shop counters
                    </label>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                      Banner Alert Level
                    </label>
                    <select
                      value={broadcastTypeDraft}
                      onChange={(e) => setBroadcastTypeDraft(e.target.value as any)}
                    >
                      <option value="info">Information (Blue · Maintenance / Tips)</option>
                      <option value="warning">Warning (Amber · Scheduled Downtime)</option>
                      <option value="urgent">Urgent Notice (Red · Emergency / Critical)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                      Announcement Message Text
                    </label>
                    <textarea
                      rows={4}
                      value={broadcastDraft}
                      onChange={(e) => setBroadcastDraft(e.target.value)}
                      placeholder="e.g. Server maintenance scheduled tonight from 2:00 AM to 3:00 AM. Counter print jobs will resume immediately after."
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid var(--pb-border)',
                        background: 'var(--pb-bg)',
                        color: 'var(--pb-text)',
                        fontSize: '13px',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  <button type="submit" className="ws-primary" style={{ minHeight: '44px', gap: '8px' }}>
                    <Send size={16} /> Publish Broadcast to All Counters
                  </button>
                </form>
              </div>

              {/* Live Preview Simulation Card */}
              <div
                style={{
                  background: 'var(--pb-surface)',
                  border: '1px solid var(--pb-border)',
                  borderRadius: '16px',
                  padding: '28px',
                }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px' }}>Live Counter Screen Preview</h3>
                <small style={{ color: 'var(--pb-muted)', fontSize: '12px', display: 'block', marginBottom: '20px' }}>
                  This is how the banner appears at the top of every shop owner's desktop workstation:
                </small>

                {broadcastEnabledDraft ? (
                  <div
                    style={{
                      borderRadius: '10px',
                      overflow: 'hidden',
                      border: '1px solid var(--pb-border)',
                    }}
                  >
                    <div
                      style={{
                        padding: '12px 16px',
                        background:
                          broadcastTypeDraft === 'urgent'
                            ? '#fee2e2'
                            : broadcastTypeDraft === 'warning'
                            ? '#fef3c7'
                            : 'var(--pb-accent-soft)',
                        color:
                          broadcastTypeDraft === 'urgent'
                            ? '#991b1b'
                            : broadcastTypeDraft === 'warning'
                            ? '#92400e'
                            : 'var(--pb-accent)',
                        fontSize: '12px',
                        fontWeight: 650,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <Megaphone size={16} />
                      <span>
                        <strong>Platform Notice:</strong> {broadcastDraft || 'No message entered'}
                      </span>
                    </div>

                    <div
                      style={{
                        background: 'var(--pb-raised)',
                        padding: '20px',
                        textAlign: 'center',
                        fontSize: '12px',
                        color: 'var(--pb-muted)',
                      }}
                    >
                      [ Shop Workstation Queue Area Below ]
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '32px',
                      textAlign: 'center',
                      background: 'var(--pb-raised)',
                      borderRadius: '12px',
                      color: 'var(--pb-muted)',
                      fontSize: '13px',
                    }}
                  >
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
              {/* Security & Credentials Card */}
              <div
                style={{
                  background: 'var(--pb-surface)',
                  border: '1px solid var(--pb-border)',
                  borderRadius: '16px',
                  padding: '28px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <Key size={22} color="var(--pb-accent)" />
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Super-Admin Credentials</h2>
                    <small style={{ color: 'var(--pb-muted)', fontSize: '12px' }}>
                      Change your secret platform key / password from the default.
                    </small>
                  </div>
                </div>

                <form onSubmit={handleChangeAdminPassword} style={{ display: 'grid', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                      Current Admin Password
                    </label>
                    <input
                      type="password"
                      placeholder="e.g. admin@123"
                      value={currentPassInput}
                      onChange={(e) => setCurrentPassInput(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                      New Admin Password (min 6 characters)
                    </label>
                    <input
                      type="password"
                      placeholder="Enter new strong password"
                      value={newPassInput}
                      onChange={(e) => setNewPassInput(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                      Confirm New Password
                    </label>
                    <input
                      type="password"
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
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 650,
                        background: passChangeStatus.type === 'success' ? '#ecfdf5' : '#fef2f2',
                        color: passChangeStatus.type === 'success' ? '#065f46' : '#991b1b',
                      }}
                    >
                      {passChangeStatus.msg}
                    </div>
                  )}

                  <button type="submit" className="ws-primary" style={{ minHeight: '44px', marginTop: '6px' }}>
                    Update Admin Password
                  </button>
                </form>
              </div>

              {/* Audit Trail Card */}
              <div
                style={{
                  background: 'var(--pb-surface)',
                  border: '1px solid var(--pb-border)',
                  borderRadius: '16px',
                  padding: '28px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <History size={22} color="var(--pb-accent)" />
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Platform Audit Trail</h2>
                    <small style={{ color: 'var(--pb-muted)', fontSize: '12px' }}>
                      Immutable record of key issuances, revocations, and security actions.
                    </small>
                  </div>
                </div>

                <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {auditLogs.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--pb-muted)' }}>
                        <History size={36} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                        <strong style={{ display: 'block', fontSize: '13px', color: 'var(--pb-text)' }}>No Audit Logs Yet</strong>
                        <small style={{ fontSize: '11px' }}>
                          Key issuances, shop edits, password changes, and security events will be automatically logged here.
                        </small>
                      </div>
                    ) : (
                      auditLogs.map((log) => (
                        <div
                          key={log.id}
                          style={{
                            padding: '12px 14px',
                            background: 'var(--pb-raised)',
                            borderRadius: '10px',
                            border: '1px solid var(--pb-border)',
                            fontSize: '12px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'var(--pb-surface)',
                                color: 'var(--pb-accent)',
                              }}
                            >
                              {log.action}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--pb-muted)' }}>{log.timestamp}</span>
                          </div>
                          <div style={{ color: 'var(--pb-text)', fontWeight: 550, marginTop: '4px' }}>{log.details}</div>
                          <small style={{ color: 'var(--pb-muted)', fontSize: '10px' }}>Actor: {log.actor}</small>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ==========================================
  // RENDER SCREEN 3: WORKSTATION QUEUE (OPERATOR)
  // ==========================================
  const pendingCount = jobs.filter((j) => j.status === 'PENDING_APPROVAL').length;
  const queuedCount = jobs.filter((j) => j.status === 'QUEUED').length;
  const completedCount = jobs.filter((j) => j.status === 'COMPLETED').length;
  const attentionCount = jobs.filter((j) => j.status === 'COMPLETION_UNKNOWN').length;

  const filteredJobs = jobs.filter((j) => {
    if (statusFilter !== 'ALL' && j.status !== statusFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      j.id.toLowerCase().includes(q) ||
      j.file_name.toLowerCase().includes(q) ||
      j.customer_email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="workstation">
      {/* Sidebar */}
      <aside className="ws-sidebar">
        <a href="#brand" className="ws-brand" onClick={(e) => e.preventDefault()}>
          <span>
            <Printer size={24} />
          </span>
          <div>
            Print Bot
            <small>COUNTER WORKSPACE</small>
          </div>
        </a>

        {currentShop && (
          <div className="ws-shop">
            <span className="ws-eyebrow">ACTIVE LICENSED SHOP</span>
            <strong>{currentShop.shopName}</strong>
            <small>{currentShop.location}</small>
          </div>
        )}

        <nav aria-label="Workstation primary">
          <button
            aria-current={activeTab === 'queue' ? 'page' : undefined}
            onClick={() => setActiveTab('queue')}
          >
            <Layers size={18} />
            Dispatch queue
            <b>{jobs.length}</b>
          </button>
          <button
            aria-current={activeTab === 'printers' ? 'page' : undefined}
            onClick={() => setActiveTab('printers')}
          >
            <Printer size={18} />
            Printers
          </button>
          <button
            aria-current={activeTab === 'pairing' ? 'page' : undefined}
            onClick={() => setActiveTab('pairing')}
          >
            <KeyRound size={18} />
            Device pairing
          </button>
          <button
            aria-current={activeTab === 'settings' ? 'page' : undefined}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={18} />
            Preferences
          </button>
        </nav>

        <div className="ws-sidebar-bottom">
          <ShieldCheck size={20} />
          <strong>One plan. Every printer.</strong>
          <p>Unlimited printers per subscribed shop.</p>
          <button
            onClick={handleLogout}
            style={{ width: '100%', minHeight: '38px', fontSize: '12px', gap: '6px' }}
          >
            <Lock size={14} /> Lock / Log Out
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar */}
        <header className="ws-topbar">
          <div>
            <span className="ws-eyebrow">WORKSTATION</span>
            <strong>Counter-PC-01 ({currentShop?.username})</strong>
          </div>

          <div className="ws-top-actions">
            <button
              aria-label={isAudioEnabled ? 'Disable audio alerts' : 'Enable audio alerts'}
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            >
              {isAudioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <ThemeSwitch />
          </div>
        </header>

        {/* Platform Broadcast Notice */}
        {globalBroadcast.active && (
          <div
            style={{
              padding: '10px 24px',
              background:
                globalBroadcast.type === 'urgent'
                  ? '#fee2e2'
                  : globalBroadcast.type === 'warning'
                  ? '#fef3c7'
                  : 'var(--pb-accent-soft)',
              color:
                globalBroadcast.type === 'urgent'
                  ? '#991b1b'
                  : globalBroadcast.type === 'warning'
                  ? '#92400e'
                  : 'var(--pb-accent)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              borderBottom: '1px solid var(--pb-border)',
              fontWeight: 650,
            }}
          >
            <Megaphone size={16} />
            <span>
              <strong>Platform Notice:</strong> {globalBroadcast.message}
            </span>
          </div>
        )}

        {notice && (
          <div
            style={{
              padding: '10px 24px',
              background: 'var(--pb-accent-soft)',
              color: 'var(--pb-accent)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--pb-border)',
            }}
          >
            <span>{notice}</span>
            <button onClick={() => setNotice('')} style={{ border: 0, padding: '4px', minHeight: '28px' }}>
              <X size={14} />
            </button>
          </div>
        )}

        <main className="ws-main">
          {/* TAB: QUEUE */}
          {activeTab === 'queue' && (
            <div className="ws-view">
              <div className="ws-page-heading">
                <div>
                  <span className="ws-eyebrow">PRINT STUDIO / OPERATIONS</span>
                  <h1>A clear view of your queue.</h1>
                  <p>Review incoming customer orders. Keep every job moving with care.</p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={handleSimulateNewCustomerJob} style={{ fontSize: '13px', gap: '6px' }}>
                    <PlusCircle size={16} /> Simulate Customer QR Job
                  </button>
                  <button
                    className="ws-primary"
                    disabled={pendingCount === 0}
                    onClick={() => {
                      setJobs((prev) =>
                        prev.map((j) => (j.status === 'PENDING_APPROVAL' ? { ...j, status: 'QUEUED' } : j))
                      );
                      setNotice(`Approved all ${pendingCount} pending jobs.`);
                    }}
                  >
                    Approve all ({pendingCount})
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="ws-stats">
                <div className="ws-stat">
                  <span>Awaiting review</span>
                  <strong>{pendingCount.toString().padStart(2, '0')}</strong>
                  <small>Your next decisions</small>
                </div>
                <div className="ws-stat">
                  <span>In the queue</span>
                  <strong>{queuedCount.toString().padStart(2, '0')}</strong>
                  <small>Ready to dispatch</small>
                </div>
                <div className="ws-stat">
                  <span>Completed today</span>
                  <strong>{completedCount.toString().padStart(2, '0')}</strong>
                  <small>Total customer prints</small>
                </div>
                <div className="ws-stat">
                  <span>Needs attention</span>
                  <strong>{attentionCount.toString().padStart(2, '0')}</strong>
                  <small>Supervised reconciliation</small>
                </div>
              </div>

              {/* Queue Table */}
              <div className="ws-panel">
                <div className="ws-queue-toolbar">
                  <div>
                    <h3>Job activity</h3>
                    <p>{filteredJobs.length} of {jobs.length} jobs</p>
                  </div>

                  <div className="ws-search">
                    <Search size={16} />
                    <input
                      type="text"
                      placeholder="Search filename, customer, or ID"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <select
                    className="ws-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All jobs</option>
                    <option value="PENDING_APPROVAL">Awaiting review</option>
                    <option value="QUEUED">Ready to dispatch</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                {filteredJobs.length === 0 ? (
                  <div className="ws-empty">
                    <FileText size={32} />
                    <p>No jobs found matching your criteria.</p>
                  </div>
                ) : (
                  filteredJobs.map((job) => (
                    <div key={job.id} className="ws-job">
                      <div className="ws-file-icon">
                        <FileText size={22} />
                      </div>
                      <div className="ws-job-main">
                        <div className="ws-job-title">
                          <h3>{job.file_name}</h3>
                          <span className="ws-chip">{job.status}</span>
                        </div>
                        <p style={{ margin: '4px 0', color: 'var(--pb-muted)', fontSize: '12px' }}>
                          {job.id} · {job.customer_email} · {job.created_at}
                        </p>
                        <div className="ws-job-specs">
                          <span>
                            {job.options.paper_size} / {job.options.color_mode.toUpperCase()}
                          </span>
                          <span>{job.options.copies} copies</span>
                          <span>{job.physical_sheets} sheets</span>
                          <span>{job.options.duplex_mode}</span>
                        </div>

                        {job.status === 'PENDING_APPROVAL' && (
                          <div className="ws-job-actions">
                            <button
                              className="ws-primary"
                              onClick={() => handleApproveJob(job.id)}
                            >
                              Approve & Print
                            </button>
                            <button
                              onClick={() => {
                                setRejectionModalJobId(job.id);
                              }}
                            >
                              Reject Job
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="ws-price">
                        <strong>₹{job.calculated_price_rupees.toFixed(2)}</strong>
                        <small>Paid via UPI</small>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: PRINTERS */}
          {activeTab === 'printers' && (
            <div className="ws-view">
              <div className="ws-page-heading">
                <div>
                  <span className="ws-eyebrow">HARDWARE CONNECTIONS</span>
                  <h1>Your printer fleet.</h1>
                  <p>Native Windows spooler handles jobs without direct PDF driver assumptions.</p>
                </div>
              </div>

              <div className="ws-printer-grid">
                {(nativePrinters && nativePrinters.length > 0) ? (
                  nativePrinters.map((prn) => (
                    <div key={prn.name} className="ws-panel ws-printer">
                      <div className="ws-printer-symbol">
                        <Printer size={48} />
                      </div>
                      <h2>{prn.name}</h2>
                      <p>{prn.status || 'Windows Print Spooler Driver'}</p>
                      <dl>
                        <div>
                          <dt>Status</dt>
                          <dd style={{ color: prn.is_online ? 'var(--pb-success)' : 'var(--pb-muted)', fontWeight: 700 }}>
                            {prn.is_online ? 'Online / Ready' : 'Spooler Attached'}
                          </dd>
                        </div>
                        <div>
                          <dt>Color</dt>
                          <dd>{prn.supports_color ? 'Color & Mono' : 'Monochrome'}</dd>
                        </div>
                        <div>
                          <dt>Duplex</dt>
                          <dd>{prn.supports_duplex ? 'Automatic Duplex' : 'Manual Duplex'}</dd>
                        </div>
                        <div>
                          <dt>Supported Sizes</dt>
                          <dd>{prn.supported_paper_sizes?.join(', ') || 'A4, Letter'}</dd>
                        </div>
                      </dl>
                    </div>
                  ))
                ) : printers.length > 0 ? (
                  printers.map((prn) => (
                    <div key={prn.id} className="ws-panel ws-printer">
                      <div className="ws-printer-symbol">
                        <Printer size={48} />
                      </div>
                      <h2>{prn.name}</h2>
                      <p>{prn.driver_name}</p>
                      <dl>
                        <div>
                          <dt>Port</dt>
                          <dd>{prn.port}</dd>
                        </div>
                        <div>
                          <dt>Status</dt>
                          <dd style={{ color: 'var(--pb-success)', fontWeight: 700 }}>Online</dd>
                        </div>
                        <div>
                          <dt>Color</dt>
                          <dd>{prn.supports_color ? 'Color & Mono' : 'Monochrome'}</dd>
                        </div>
                        <div>
                          <dt>Duplex</dt>
                          <dd>{prn.supports_duplex ? 'Automatic Duplex' : 'Manual duplex'}</dd>
                        </div>
                      </dl>
                    </div>
                  ))
                ) : (
                  <div className="ws-panel ws-empty" style={{ gridColumn: '1 / -1', padding: '48px 24px', textAlign: 'center' }}>
                    <Printer size={48} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                    <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px' }}>No Printers Connected</h2>
                    <p style={{ color: 'var(--pb-muted)', fontSize: '13px', margin: 0 }}>
                      Connect your USB or network printer and install drivers. Print Bot automatically discovers all Windows spooler printers with zero setup.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: PAIRING */}
          {activeTab === 'pairing' && (
            <div className="ws-view">
              <div className="ws-page-heading">
                <div>
                  <span className="ws-eyebrow">QR CODE & SECURITY</span>
                  <h1>Device pairing & counter QR link.</h1>
                  <p>Customers scan this counter QR code to directly access your shop's mobile portal.</p>
                </div>
              </div>

              <div className="ws-panel" style={{ padding: '36px', maxWidth: '600px' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <QrCode size={96} color="var(--pb-accent)" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Counter Stand QR</h3>
                  <p style={{ fontSize: '13px', color: 'var(--pb-muted)' }}>
                    Print this QR code and paste it on your desk counter.
                  </p>
                </div>

                <div
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'var(--pb-raised)',
                    border: '1px solid var(--pb-border)',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong>Shop Portal QR URL:</strong>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`https://printbot-57e1.vercel.app/?qr=shop_anna_univ_01`);
                        alert('Copied shop QR link!');
                      }}
                      style={{ border: 0, padding: '4px 8px', fontSize: '11px' }}
                    >
                      Copy Link
                    </button>
                  </div>
                  <code>https://printbot-57e1.vercel.app/?qr=shop_anna_univ_01</code>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="ws-view">
              <div className="ws-page-heading">
                <div>
                  <span className="ws-eyebrow">CONFIGURATION</span>
                  <h1>Shop settings & rates.</h1>
                  <p>Update your per-page billing rates, dispatch mode, and shop contact details.</p>
                </div>
              </div>

              <div className="ws-panel" style={{ padding: '32px', maxWidth: '640px' }}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!activeSession) return;
                    const u = activeSession.username;
                    setLicenses((prev) => ({
                      ...prev,
                      [u]: {
                        ...prev[u],
                        shopName: setupShopName,
                        location: setupLocation,
                        phone: setupPhone,
                        upiId: setupUpi,
                        rates: {
                          bwPerSideRupees: Number(setupBwRate) || 1.5,
                          colorPerSideRupees: Number(setupColorRate) || 10.0,
                          duplexDiscountPercent: 15,
                        },
                        orderMode: setupOrderMode,
                      },
                    }));
                    setNotice('Shop preferences and rates updated successfully.');
                  }}
                  style={{ display: 'grid', gap: '16px' }}
                >
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                      Shop Name
                    </label>
                    <input
                      type="text"
                      value={setupShopName}
                      onChange={(e) => setSetupShopName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                      Branch Location
                    </label>
                    <input
                      type="text"
                      value={setupLocation}
                      onChange={(e) => setSetupLocation(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                        B&W Rate (₹/pg)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={setupBwRate}
                        onChange={(e) => setSetupBwRate(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                        Color Rate (₹/pg)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={setupColorRate}
                        onChange={(e) => setSetupColorRate(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                      Order Dispatch Mode
                    </label>
                    <select
                      value={setupOrderMode}
                      onChange={(e) => setSetupOrderMode(e.target.value as 'MANUAL_APPROVAL' | 'FULL_AUTOMATIC')}
                    >
                      <option value="MANUAL_APPROVAL">Manual Approval</option>
                      <option value="FULL_AUTOMATIC">Full Automatic</option>
                    </select>
                  </div>

                  <button type="submit" className="ws-primary" style={{ marginTop: '10px' }}>
                    Save Preferences
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Rejection Modal */}
      {rejectionModalJobId && (
        <Dialog title="Reject print job" onClose={() => setRejectionModalJobId(null)}>
          <p>Select a clear reason for the customer:</p>
          <select
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            style={{ marginBottom: '16px' }}
          >
            <option>Poor image resolution or blurred scan</option>
            <option>Page bounds or margins exceed printable area</option>
            <option>Incompatible paper size requested</option>
            <option>Payment verification mismatch at counter</option>
          </select>
          <div className="ws-dialog-actions">
            <button onClick={() => setRejectionModalJobId(null)}>Cancel</button>
            <button className="ws-primary" onClick={handleRejectJob}>
              Confirm Rejection
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
