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
  Sparkles
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

// Pre-seeded licenses
const INITIAL_LICENSES: Record<string, ShopLicense> = {
  shopowner: {
    username: 'shopowner',
    licenseKey: 'PB-KEY-2026-XEROX',
    shopName: 'Anna University Quick Xerox',
    location: 'Guindy Counter 01, Chennai',
    phone: '+91 98401 23456',
    upiId: 'quickxerox@okaxis',
    rates: {
      bwPerSideRupees: 1.5,
      colorPerSideRupees: 10.0,
      duplexDiscountPercent: 15,
    },
    orderMode: 'MANUAL_APPROVAL',
    status: 'ACTIVE',
    expiresAt: '2027-12-31',
    isConfigured: true,
  },
};

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

  // --- Unified Lock Screen Form State ---
  const [loginUsername, setLoginUsername] = useState('');
  const [loginKey, setLoginKey] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleUnifiedLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const u = loginUsername.trim().toLowerCase();
    const k = loginKey.trim();

    // 1. Admin Authentication Check
    if (u === 'admin' && k === 'admin@123') {
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

  // --- Admin Portal State (Key Generator) ---
  const [newShopName, setNewShopName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newDuration, setNewDuration] = useState('1 Year');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName.trim() || !newUsername.trim()) return;

    const u = newUsername.trim().toLowerCase();
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randomHex2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const key = `PB-KEY-${randomHex}-${randomHex2}`;

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
      expiresAt: '2027-12-31',
      isConfigured: false,
    };

    setLicenses((prev) => ({ ...prev, [u]: newLicense }));
    setGeneratedKey(key);
    setNewShopName('');
    setNewUsername('');
  };

  const handleRevokeKey = (username: string) => {
    setLicenses((prev) => ({
      ...prev,
      [username]: { ...prev[username], status: prev[username].status === 'ACTIVE' ? 'REVOKED' : 'ACTIVE' },
    }));
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

  const [printers] = useState<ConnectedPrinter[]>([
    {
      id: 'prn-canon-ir3530',
      name: 'Canon imageRUNNER ADV C3530i (Color Production)',
      driver_name: 'Canon Generic Plus UFR II',
      port: '192.168.1.150',
      online: true,
      supports_color: true,
      supports_duplex: true,
      supported_sizes: ['A4', 'A3', 'Legal', 'Letter'],
    },
    {
      id: 'prn-hp-m404dn',
      name: 'HP LaserJet Pro M404dn (Mono Workhorse)',
      driver_name: 'HP LaserJet Pro M404-M405 PCL-6',
      port: 'USB001',
      online: true,
      supports_color: false,
      supports_duplex: true,
      supported_sizes: ['A4', 'Letter', 'Legal'],
    },
    {
      id: 'prn-virtual-pdf',
      name: 'Microsoft Print to PDF (Virtual Native Proof)',
      driver_name: 'Microsoft Print To PDF',
      port: 'PORTPROMPT:',
      online: true,
      supports_color: true,
      supports_duplex: false,
      supported_sizes: ['A4', 'Letter'],
    },
  ]);

  const [jobs, setJobs] = useState<PrintJob[]>([
    {
      id: 'job-9841',
      customer_email: 'ramesh.kumar@annauniv.edu',
      file_name: 'Engineering_Drawings_A3.pdf',
      page_count: 8,
      logical_pages: 8,
      rendered_sides: 8,
      physical_sheets: 8,
      options: {
        copies: 1,
        color_mode: 'color',
        paper_size: 'A3',
        duplex_mode: 'simplex',
        paper_gsm: 80,
        binding: 'none',
      },
      calculated_price_paise: 20000,
      calculated_price_rupees: 200.0,
      status: 'REJECTED',
      rejection_reason: 'Poor image resolution or blurred scan',
      created_at: '2026-10-25 10:14',
    },
    {
      id: 'job-9842',
      customer_email: 'priya.s@annauniv.edu',
      file_name: 'Semester_Project_Report_Final.pdf',
      page_count: 42,
      logical_pages: 42,
      rendered_sides: 42,
      physical_sheets: 21,
      options: {
        copies: 1,
        color_mode: 'bw',
        paper_size: 'A4',
        duplex_mode: 'duplex_long',
        paper_gsm: 75,
        binding: 'spiral',
      },
      calculated_price_paise: 9550,
      calculated_price_rupees: 95.5,
      status: 'QUEUED',
      created_at: '2026-10-25 10:30',
    },
    {
      id: 'job-9843',
      customer_email: 'walkin.karthik@gmail.com',
      file_name: 'ak_resume.pdf',
      page_count: 2,
      logical_pages: 4,
      rendered_sides: 4,
      physical_sheets: 4,
      options: {
        copies: 2,
        color_mode: 'bw',
        paper_size: 'A4',
        duplex_mode: 'simplex',
        paper_gsm: 75,
        binding: 'none',
      },
      calculated_price_paise: 600,
      calculated_price_rupees: 6.0,
      status: 'PENDING_APPROVAL',
      created_at: '2026-10-25 10:45',
    },
  ]);

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
              }}
            >
              <strong>Default Access:</strong>
              <div style={{ marginTop: '4px' }}>
                • <strong>Shop Owner:</strong> Username: <code>shopowner</code> | Key: <code>PB-KEY-2026-XEROX</code>
              </div>
              <div>
                • <strong>Platform Admin:</strong> Username: <code>admin</code> | Key: <code>admin@123</code>
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
                  placeholder="e.g. Anna University Quick Xerox"
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
                  placeholder="e.g. Guindy Counter 01, Chennai"
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'var(--pb-text)',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '16px' }}>Print Bot Admin Center</strong>
              <small style={{ color: 'var(--pb-muted)', fontSize: '11px' }}>
                Platform Super Admin · License Issuance & Management
              </small>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                borderRadius: '20px',
                background: 'var(--pb-accent-soft)',
                color: 'var(--pb-accent)',
                fontWeight: 700,
              }}
            >
              Logged in: admin
            </span>
            <button onClick={handleLogout} style={{ minHeight: '38px', fontSize: '12px' }}>
              <LogOut size={16} /> Log Out
            </button>
          </div>
        </header>

        {/* Admin Content */}
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
          {/* Key Generator Form */}
          <div
            style={{
              background: 'var(--pb-surface)',
              border: '1px solid var(--pb-border)',
              borderRadius: '16px',
              padding: '28px',
              marginBottom: '32px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <PlusCircle size={22} color="var(--pb-accent)" />
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                Generate New Shop License Key
              </h2>
            </div>

            <form
              onSubmit={handleGenerateKey}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) auto', gap: '14px', alignItems: 'flex-end' }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Xerox Shop Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. SRM Campus Xerox"
                  value={newShopName}
                  onChange={(e) => setNewShopName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Shop Owner Username
                </label>
                <input
                  type="text"
                  placeholder="e.g. srm_xerox"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Duration
                </label>
                <select value={newDuration} onChange={(e) => setNewDuration(e.target.value)}>
                  <option>1 Month</option>
                  <option>1 Year</option>
                  <option>Lifetime Commercial</option>
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
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--pb-muted)', textTransform: 'uppercase' }}>
                    Newly Generated License Key (Copy and send to Shop Owner):
                  </span>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--pb-text)', marginTop: '4px' }}>
                    <code>{generatedKey}</code>
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedKey);
                    alert('License Key copied to clipboard!');
                  }}
                  style={{ minHeight: '38px', fontSize: '12px' }}
                >
                  <Copy size={16} /> Copy Key
                </button>
              </div>
            )}
          </div>

          {/* Active Licenses Table */}
          <div
            style={{
              background: 'var(--pb-surface)',
              border: '1px solid var(--pb-border)',
              borderRadius: '16px',
              padding: '28px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 18px' }}>
              Active Shop Licenses ({Object.keys(licenses).length})
            </h2>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--pb-border)', textAlign: 'left', color: 'var(--pb-muted)' }}>
                    <th style={{ padding: '12px 16px' }}>Shop Name</th>
                    <th style={{ padding: '12px 16px' }}>Username</th>
                    <th style={{ padding: '12px 16px' }}>License Key</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(licenses).map((lic) => (
                    <tr key={lic.username} style={{ borderBottom: '1px solid var(--pb-rule)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 700 }}>{lic.shopName}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <code>{lic.username}</code>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <code style={{ background: 'var(--pb-raised)', padding: '4px 8px', borderRadius: '4px' }}>
                          {lic.licenseKey}
                        </code>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
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
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          onClick={() => handleRevokeKey(lic.username)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '11px',
                            minHeight: '32px',
                            color: lic.status === 'ACTIVE' ? '#b91c1c' : '#047857',
                          }}
                        >
                          {lic.status === 'ACTIVE' ? 'Revoke Key' : 'Reactivate Key'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
                {printers.map((prn) => (
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
                        <dd>{prn.supports_color ? 'Color & Mono' : 'Monochrome only'}</dd>
                      </div>
                      <div>
                        <dt>Duplex</dt>
                        <dd>{prn.supports_duplex ? 'Automatic Duplex' : 'Manual duplex'}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
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
