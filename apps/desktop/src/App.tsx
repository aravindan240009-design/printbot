import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Printer,
  Layers,
  KeyRound,
  Settings,
  Search,
  FileText,
  Eye,
  EyeOff,
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
  Building2,
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
  PieChart,
  Globe
} from 'lucide-react';
import { ThemeProvider, ThemeSwitch, MotionSurface, PaperScene, PrinterScene, useGsapStagger } from '@xerox/ui';
import { discoverPrinters, bindWorkstation, getWorkstationDeviceIdentity, type NativePrinterInfo } from './native';
import { supabase } from './supabase';
import QRCode from 'qrcode';
import { DesktopShell, type Tab } from './components/DesktopShell';
import { LockScreen } from './components/LockScreen';
import { SetupWizard } from './components/SetupWizard';
import { QueueView } from './components/QueueView';
import { PrintersView } from './components/PrintersView';
import { ServicesView } from './components/ServicesView';
import { WebsiteView } from './components/WebsiteView';
import { SettingsView } from './components/SettingsView';
import { JobRejectModal, ServiceEditModal } from './components/Modals';
import { AdminPortal } from './components/AdminPortal';

const API_BASE = ((import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');

// --- Models & Contracts ---

export interface ShopServiceItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priceDisplay: string;
  badge?: string;
  turnaround?: string;
  features: string[];
  hasDiscount?: boolean;
  discountNote?: string;
}

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
    photoRate?: number;
    stapleRate?: number;
    spiralRate?: number;
    hardBoundRate?: number;
    cardRate?: number;
  };
  services?: ShopServiceItem[];
  orderMode: 'MANUAL_APPROVAL' | 'FULL_AUTOMATIC';
  status: 'ACTIVE' | 'REVOKED';
  expiresAt: string;
  isConfigured: boolean;
  duration?: '1 Month' | '1 Year' | 'Lifetime Commercial';
  deviceId?: string | null;
  deviceToken?: string | null;
  appId?: string;
  totalOrdersCount?: number;
  totalPagesCount?: number;
  lastActive?: string;
}

export interface PilotApplication {
  id: string;
  shopName: string;
  city: string;
  contactNumber: string;
  plan: '1 Month' | '1 Year' | 'Lifetime Commercial' | string;
  appliedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  generatedUsername?: string;
  generatedKey?: string;
  approvedAt?: string;
  notes?: string;
}

export function mapSupabaseRowToApp(row: any): PilotApplication {
  return {
    id: row.id,
    shopName: row.shop_name || 'Unnamed Shop',
    city: row.city || '',
    contactNumber: row.contact_number || '',
    plan: row.plan || '1 Year',
    appliedAt: row.applied_at || new Date().toISOString(),
    status: (row.status as 'PENDING' | 'APPROVED' | 'REJECTED') || 'PENDING',
    generatedUsername: row.generated_username || undefined,
    generatedKey: row.generated_key || undefined,
    approvedAt: row.approved_at || undefined,
    notes: row.notes || undefined,
  };
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
    | 'JOB_APPROVED'
    | 'LOGIN_LOCKOUT';
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
  if (!localStorage.getItem('printbot_clean_v5')) {
    localStorage.removeItem('printbot_licenses');
    localStorage.removeItem('printbot_audit_logs');
    localStorage.removeItem('printbot_pilot_requests');
    localStorage.setItem('printbot_clean_v5', 'true');
  }
} catch {}

const INITIAL_LICENSES: Record<string, ShopLicense> = {};

type AppScreen = 'LOCK_SCREEN' | 'SETUP_WIZARD' | 'WORKSTATION' | 'ADMIN_PORTAL';

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
    token?: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('printbot_session');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // Authoritative server-side verification of active Super Admin sessions (fails closed in production)
  useEffect(() => {
    if (activeSession?.role === 'ADMIN') {
      // In dev/test builds, retain offline admin session without requiring remote verification
      if (__DEV_OFFLINE_ADMIN_ENABLED__ && activeSession.token === 'dev_offline_admin_token') {
        return;
      }

      if (!activeSession.token) {
        // Client-side state without verified server token -> fail closed
        setActiveSession(null);
        localStorage.removeItem('printbot_session');
        return;
      }
      fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${activeSession.token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Unauthorized');
          return res.json();
        })
        .then((data) => {
          if (!data.user?.is_superadmin) {
            setActiveSession(null);
            localStorage.removeItem('printbot_session');
          }
        })
        .catch(() => {
          setActiveSession(null);
          localStorage.removeItem('printbot_session');
        });
    }
  }, [activeSession?.token, activeSession?.role]);

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

  // --- Admin Security & MFA State ---
  const [isMfaRequired, setIsMfaRequired] = useState(false);
  const [adminMfaCode, setAdminMfaCode] = useState('');

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

  // --- Unified Lock Screen Form State ---
  const [loginUsername, setLoginUsername] = useState('');
  const [loginKey, setLoginKey] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null);

  // Auto-uppercase and key formatting helper (preserve password case for admin)
  const handleKeyChange = (val: string) => {
    const u = loginUsername.trim().toLowerCase();
    if (u === 'admin' || u.endsWith('@printbot.in') || u.includes('admin') || u === 'superadmin') {
      setLoginKey(val);
      return;
    }
    let formatted = val.toUpperCase();
    if (formatted.startsWith('PBKEY') && !formatted.startsWith('PB-KEY-')) {
      formatted = formatted.replace(/^PBKEY/, 'PB-KEY-');
    } else if (formatted.startsWith('PB-KEY') && !formatted.startsWith('PB-KEY-') && formatted.length > 6) {
      formatted = formatted.replace(/^PB-KEY/, 'PB-KEY-');
    }
    setLoginKey(formatted);
  };

  const handleUnifiedLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutUntil && new Date() < lockoutUntil) {
      setLoginError(`System locked due to failed attempts. Please wait ${Math.ceil((lockoutUntil.getTime() - Date.now()) / 1000)}s.`);
      return;
    }
    setLoginError('');
    const u = loginUsername.trim().toLowerCase();
    const k = loginKey.trim();

    // 1. Super Admin Authentication Check
    if (u === 'admin' || u.endsWith('@printbot.in') || u === 'superadmin') {
      let isBackendOffline = false;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const loginRes = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: u,
            password: k,
            totp_code: adminMfaCode.trim() || undefined,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (loginRes.ok) {
          const authData = await loginRes.json();
          if (authData.user && authData.user.is_superadmin) {
            setFailedAttempts(0);
            setLockoutUntil(null);
            setIsMfaRequired(false);
            setAdminMfaCode('');
            setActiveSession({
              role: 'ADMIN',
              username: authData.user.email || 'admin',
              token: authData.session_token,
            });
            logAdminAction('ADMIN_LOGIN', `Super Admin authenticated via server (${u})`);
            return;
          }
        } else if (loginRes.status === 403) {
          const errData = await loginRes.json().catch(() => ({}));
          if (errData.detail && errData.detail.includes('MFA_REQUIRED')) {
            setIsMfaRequired(true);
            setLoginError('MFA verification code required for Super Admin account.');
            return;
          }
        }
      } catch (adminErr) {
        isBackendOffline = true;
      }

      // Standalone desktop / local master password check (offline fallback)
      const storedMasterPass = localStorage.getItem('printbot_admin_master_password') || 'admin@123';
      const devOfflineUser = typeof __DEV_TEST_ADMIN_USER__ !== 'undefined' ? __DEV_TEST_ADMIN_USER__ : 'admin';
      const devOfflinePass = typeof __DEV_TEST_ADMIN_PASS__ !== 'undefined' ? __DEV_TEST_ADMIN_PASS__ : 'admin@123';

      if (k === storedMasterPass || k === devOfflinePass || k === 'admin@123') {
        setFailedAttempts(0);
        setLockoutUntil(null);
        setIsMfaRequired(false);
        setAdminMfaCode('');
        setActiveSession({
          role: 'ADMIN',
          username: u || 'admin',
          token: 'local_master_admin_session_token',
        });
        logAdminAction('ADMIN_LOGIN', `Super Admin logged in (${u})`);
        return;
      }

      setFailedAttempts((prev) => {
        const next = prev + 1;
        if (next >= 5) {
          setLockoutUntil(new Date(Date.now() + 60000));
        }
        return next;
      });
      setLoginError('Invalid administrative master password. (Default is admin@123)');
      return;
    }

    // 2. Local Workstation Shop License Check (Licenses issued on this machine by the Super Admin)
    const localLicense = licenses[u] || Object.values(licenses).find((l) => l.username.toLowerCase() === u);
    if (localLicense && localLicense.licenseKey.trim().toUpperCase() === k.toUpperCase()) {
      if (localLicense.status === 'REVOKED') {
        setLoginError('This license key has been revoked by the Admin.');
        return;
      }
      if (localLicense.expiresAt && localLicense.expiresAt !== 'LIFETIME') {
        const exp = new Date(localLicense.expiresAt);
        if (!isNaN(exp.getTime()) && exp < new Date()) {
          setLoginError('This license key has expired. Please contact the Admin to renew.');
          return;
        }
      }

      try {
        const devIdentity = await getWorkstationDeviceIdentity();
        const devToken = localLicense.deviceToken || `devtoken:${u}:${devIdentity.device_id}:${Math.floor(Date.now() / 1000) + 86400 * 365}:station_local_auth`;
        await bindWorkstation(devToken);
        setLicenses((prev) => ({
          ...prev,
          [u]: {
            ...prev[u],
            deviceId: devIdentity.device_id,
            deviceToken: devToken,
          },
        }));
      } catch (bindErr) {
        console.warn('Local workstation pairing note:', bindErr);
      }

      setFailedAttempts(0);
      setLockoutUntil(null);
      setActiveSession({ role: 'SHOP_OWNER', username: u });
      return;
    }

    // 3. Authoritative Server-Side Licence Validation Flow against Canonical Database
    try {
      const devIdentity = await getWorkstationDeviceIdentity();

      const { data: authRes, error: rpcErr } = await supabase.rpc('validate_shop_license', {
        p_username: u,
        p_license_key: k.trim().toUpperCase(),
        p_device_id: devIdentity.device_id,
        p_hardware_hash: devIdentity.hardware_hash,
      });

      if (!rpcErr && authRes && authRes.success) {
        const canonicalUsername = authRes.slug || u;
        const newLic: ShopLicense = {
          username: canonicalUsername,
          appId: authRes.shop_id,
          licenseKey: k.toUpperCase(),
          shopName: authRes.shop_name || 'Print Shop',
          location: authRes.city || '',
          phone: authRes.contact_phone || '',
          upiId: `${canonicalUsername}@upi`,
          rates: {
            bwPerSideRupees: (authRes.rates && authRes.rates.bwRate) ? Number(authRes.rates.bwRate) : 1.5,
            colorPerSideRupees: (authRes.rates && authRes.rates.colorRate) ? Number(authRes.rates.colorRate) : 10.0,
            duplexDiscountPercent: 15,
          },
          orderMode: authRes.order_mode || 'MANUAL_APPROVAL',
          status: 'ACTIVE',
          expiresAt: authRes.is_lifetime ? 'LIFETIME' : (authRes.expires_at ? authRes.expires_at.split('T')[0] : 'EXPIRED'),
          isConfigured: true,
          duration: authRes.is_lifetime ? 'Lifetime Commercial' : (authRes.plan || '1 Year'),
          deviceId: devIdentity.device_id,
          deviceToken: authRes.device_token || null,
          totalOrdersCount: 0,
          totalPagesCount: 0,
          lastActive: 'Authenticated via Canonical Server RPC',
        };

        setLicenses((prev) => ({
          ...prev,
          [u]: newLic,
          [canonicalUsername]: newLic,
        }));
        setFailedAttempts(0);
        setLockoutUntil(null);

        if (authRes.device_token) {
          try {
            await bindWorkstation(authRes.device_token);
          } catch (bindErr) {
            console.warn('Workstation pairing warning:', bindErr);
          }
        }

        setActiveSession({ role: 'SHOP_OWNER', username: canonicalUsername });
        return;
      }
    } catch (err) {
      console.warn('Server-side RPC authentication check error:', err);
    }

    // 4. Cloud Database Fallback (pilot_applications table)
    try {
      const { data: cloudApp, error } = await supabase
        .from('pilot_applications')
        .select('*')
        .or(`generated_username.ilike.${u},shop_name.ilike.${u}`)
        .eq('status', 'APPROVED')
        .maybeSingle();

      if (!error && cloudApp && cloudApp.generated_key?.trim().toUpperCase() === k.toUpperCase()) {
        const app = mapSupabaseRowToApp(cloudApp);
        let duration: '1 Month' | '1 Year' | 'Lifetime Commercial' = '1 Year';
        if (typeof app.plan === 'string') {
          if (app.plan.includes('Month') || app.plan === '1 Month') duration = '1 Month';
          else if (app.plan.includes('Lifetime') || app.plan === 'Lifetime Commercial') duration = 'Lifetime Commercial';
        }
        const expiry = new Date();
        if (duration === '1 Month') expiry.setDate(expiry.getDate() + 30);
        else if (duration === '1 Year') expiry.setFullYear(expiry.getFullYear() + 1);
        else expiry.setFullYear(expiry.getFullYear() + 50);

        const devIdentity = await getWorkstationDeviceIdentity();
        const devToken = `devtoken:${u}:${devIdentity.device_id}:${Math.floor(Date.now() / 1000) + 86400 * 365}:cloud_auth`;
        try {
          await bindWorkstation(devToken);
        } catch {}

        let parsedBw = 1.5;
        let parsedColor = 10.0;
        let parsedDuplex = 15;
        let parsedPhoto = 30.0;
        let parsedStaple = 5.0;
        let parsedSpiral = 40.0;
        let parsedHard = 150.0;
        let parsedCard = 15.0;
        let parsedOrderMode: 'MANUAL_APPROVAL' | 'FULL_AUTOMATIC' = 'MANUAL_APPROVAL';
        let parsedServices: ShopServiceItem[] | undefined = undefined;
        if (cloudApp.notes) {
          try {
            const p = typeof cloudApp.notes === 'string' ? JSON.parse(cloudApp.notes) : cloudApp.notes;
            if (p.services && Array.isArray(p.services)) parsedServices = p.services;
            if (p.bwRate !== undefined) parsedBw = Number(p.bwRate);
            if (p.colorRate !== undefined) parsedColor = Number(p.colorRate);
            if (p.duplexDiscountPercent !== undefined) parsedDuplex = Number(p.duplexDiscountPercent);
            if (p.photoRate !== undefined) parsedPhoto = Number(p.photoRate);
            if (p.stapleRate !== undefined) parsedStaple = Number(p.stapleRate);
            if (p.spiralRate !== undefined) parsedSpiral = Number(p.spiralRate);
            if (p.hardBoundRate !== undefined) parsedHard = Number(p.hardBoundRate);
            if (p.cardRate !== undefined) parsedCard = Number(p.cardRate);
            if (p.orderMode) parsedOrderMode = p.orderMode;
          } catch {}
        }

        const newLic: ShopLicense = {
          username: u,
          appId: app.id,
          licenseKey: k.toUpperCase(),
          shopName: app.shopName,
          location: app.city || 'Counter 01',
          phone: app.contactNumber.startsWith('+91') ? app.contactNumber : `+91 ${app.contactNumber}`,
          upiId: `${u}@upi`,
          rates: {
            bwPerSideRupees: parsedBw,
            colorPerSideRupees: parsedColor,
            duplexDiscountPercent: parsedDuplex,
            photoRate: parsedPhoto,
            stapleRate: parsedStaple,
            spiralRate: parsedSpiral,
            hardBoundRate: parsedHard,
            cardRate: parsedCard,
          },
          services: parsedServices,
          orderMode: parsedOrderMode,
          status: 'ACTIVE',
          expiresAt: expiry.toISOString().split('T')[0],
          isConfigured: true,
          duration: duration,
          deviceId: devIdentity.device_id,
          deviceToken: devToken,
          totalOrdersCount: 0,
          totalPagesCount: 0,
          lastActive: 'Authenticated via Cloud Application',
        };

        setLicenses((prev) => ({ ...prev, [u]: newLic }));
        setFailedAttempts(0);
        setLockoutUntil(null);
        setActiveSession({ role: 'SHOP_OWNER', username: u });
        return;
      }
    } catch (cloudErr) {
      console.warn('Cloud application check error:', cloudErr);
    }

    // Increment failed attempts and lockout if needed
    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);
    if (nextAttempts >= 5) {
      const lockUntil = new Date(Date.now() + 60000);
      setLockoutUntil(lockUntil);
      logAdminAction('LOGIN_LOCKOUT', `Brute-force lockout triggered for "${u || 'unknown'}" after 5 failed attempts`);
      setLoginError('Too many failed attempts. Login locked for 60 seconds.');
    } else {
      setLoginError(`Invalid Username or Key. (${5 - nextAttempts} attempts remaining before temporary lockout)`);
    }
  };

  const handleLogout = () => {
    setActiveSession(null);
    setLoginError('');
  };

  // --- Shop Configuration State (Auto-filled by License Key & Managed in Settings) ---
  const [setupShopName, setSetupShopName] = useState(currentShop?.shopName || '');
  const [setupLocation, setSetupLocation] = useState(currentShop?.location || '');
  const [setupPhone, setSetupPhone] = useState(currentShop?.phone || '');
  const [setupOrderMode, setSetupOrderMode] = useState<'MANUAL_APPROVAL' | 'FULL_AUTOMATIC'>(
    currentShop?.orderMode || 'MANUAL_APPROVAL'
  );

  // --- Dedicated Services Catalog State ---
  const DEFAULT_SHOP_SERVICES: ShopServiceItem[] = [
    {
      id: 'srv_doc_print',
      title: 'Document Print & Xerox',
      description: 'Black & white or vibrant color printing for notes, forms, certificates, and reports.',
      category: 'docs',
      priceDisplay: '₹1.50 / page',
      turnaround: 'Instant Counter Print',
      badge: 'Most Popular',
      features: ['A4, A3, Legal, Letter', 'Black & White or Color', 'Single or Double-sided'],
      hasDiscount: false,
      discountNote: '',
    },
    {
      id: 'srv_photo_print',
      title: 'Passport & Photo Prints',
      description: '8-up passport photos, 4x6 glossy prints, and double-sided ID cards.',
      category: 'photo',
      priceDisplay: '₹30.00 / 8-sheet',
      turnaround: 'High Gloss Finish',
      badge: 'Studio Quality',
      features: ['8-Up Passport Photo Grid', 'ID Card Front & Back on 1 page', '220 GSM Premium Glossy Card'],
      hasDiscount: false,
      discountNote: '',
    },
    {
      id: 'srv_binding',
      title: 'Project & Thesis Binding',
      description: 'Corner stapling, durable spiral binding, or executive gold-embossed hard covers.',
      category: 'binding',
      priceDisplay: 'From +₹5.00',
      turnaround: '5–15 mins',
      badge: 'Thesis Grade',
      features: ['Corner Staple (+₹5)', 'Spiral Coil with OHP Sheet (+₹40)', 'Executive Hard Bound (+₹150)'],
      hasDiscount: false,
      discountNote: '',
    },
    {
      id: 'srv_heavy_card',
      title: 'Certificates & Heavy Card',
      description: 'Crisp printing on 100 GSM Bond and 220 GSM Ivory cardstock for diplomas and official documents.',
      category: 'docs',
      priceDisplay: 'From ₹15.00',
      turnaround: 'Archival Grade',
      badge: 'Non-Smudge',
      features: ['220 GSM Heavy Ivory Card', 'High-density pigment toner', 'No ink bleed or smudge'],
      hasDiscount: false,
      discountNote: '',
    },
  ];

  const [shopServices, setShopServices] = useState<ShopServiceItem[]>(() => {
    try {
      const saved = localStorage.getItem('printbot_custom_services');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SHOP_SERVICES;
  });

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceFormTitle, setServiceFormTitle] = useState('');
  const [serviceFormCategory, setServiceFormCategory] = useState('docs');
  const [serviceFormPrice, setServiceFormPrice] = useState('');
  const [serviceFormTurnaround, setServiceFormTurnaround] = useState('Instant Counter Print');
  const [serviceFormBadge, setServiceFormBadge] = useState('');
  const [serviceFormDesc, setServiceFormDesc] = useState('');
  const [serviceFormFeatures, setServiceFormFeatures] = useState('');
  const [serviceFormHasDiscount, setServiceFormHasDiscount] = useState(false);
  const [serviceFormDiscountNote, setServiceFormDiscountNote] = useState('');
  const [servicesCategoryFilter, setServicesCategoryFilter] = useState('all');
  const [isPublishingServices, setIsPublishingServices] = useState(false);

  // Automatically pre-fill all configuration details from active License Key
  useEffect(() => {
    if (currentShop) {
      if (currentShop.shopName) setSetupShopName(currentShop.shopName);
      if (currentShop.location) setSetupLocation(currentShop.location);
      if (currentShop.phone) setSetupPhone(currentShop.phone);
      if (currentShop.orderMode) setSetupOrderMode(currentShop.orderMode);
      if (currentShop.services && currentShop.services.length > 0) {
        setShopServices(currentShop.services);
      } else {
        try {
          const saved = localStorage.getItem(`printbot_custom_services_${currentShop.username}`);
          if (saved) setShopServices(JSON.parse(saved));
        } catch {}
      }
    }
  }, [currentShop]);

  const handlePublishServices = async (servicesToPublish: ShopServiceItem[]) => {
    setIsPublishingServices(true);
    try {
      const u = activeSession?.username || currentShop?.username || 'shop';
      setShopServices(servicesToPublish);
      try {
        localStorage.setItem('printbot_custom_services', JSON.stringify(servicesToPublish));
        localStorage.setItem(`printbot_custom_services_${u}`, JSON.stringify(servicesToPublish));
      } catch {}

      setLicenses((prev) => {
        const existing = prev[u] || currentShop;
        if (!existing) return prev;
        const updated = { ...existing, services: servicesToPublish };
        return {
          ...prev,
          [u]: updated,
          ...(currentShop?.username ? { [currentShop.username.toLowerCase()]: updated } : {}),
          ...(currentShop?.shopName ? { [currentShop.shopName.toLowerCase()]: updated } : {}),
        };
      });

      const shopName = currentShop?.shopName || u;
      const notesPayload = JSON.stringify({
        services: servicesToPublish,
        orderMode: setupOrderMode,
        updatedAt: new Date().toISOString(),
      });

      let updated = false;
      if (currentShop?.appId) {
        const { data, error } = await supabase
          .from('pilot_applications')
          .update({ notes: notesPayload })
          .eq('id', currentShop.appId)
          .select();
        if (!error && data && data.length > 0) updated = true;
      }

      if (!updated) {
        const orFilter = `generated_username.ilike.${u},shop_name.ilike.${shopName}`;
        await supabase
          .from('pilot_applications')
          .update({ notes: notesPayload })
          .or(orFilter);
      }

      setNotice('Services published successfully! Live instantly on customer web portal.');
    } catch (err) {
      console.warn('Failed to sync services to cloud:', err);
      setNotice('Services saved locally (cloud sync offline).');
    } finally {
      setIsPublishingServices(false);
    }
  };

  const [platformDomain] = useState<string>(() => {
    return (
      localStorage.getItem('printbot_platform_domain') ||
      (import.meta.env.VITE_PLATFORM_DOMAIN as string) ||
      'printbotak.vercel.app'
    );
  });

  const [websiteQrDataUrl, setWebsiteQrDataUrl] = useState<string>('');
  useEffect(() => {
    const shopSlug = (currentShop?.shopName || currentShop?.username || 'shop')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '');
    const cleanDomain = platformDomain.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    const shopWebUrl = `https://${cleanDomain}/${shopSlug}`;
    QRCode.toDataURL(shopWebUrl, { width: 280, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
      .then(setWebsiteQrDataUrl)
      .catch((err) => console.warn('QR code generation error:', err));
  }, [currentShop?.shopName, currentShop?.username, platformDomain]);

  const handleSaveSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    const u = activeSession.username;
    setLicenses((prev) => ({
      ...prev,
      [u]: {
        ...prev[u],
        shopName: setupShopName || prev[u]?.shopName || 'My Xerox Shop',
        location: setupLocation || prev[u]?.location || 'Counter 01',
        phone: setupPhone || prev[u]?.phone || '+91 99999 99999',
        isConfigured: true,
      },
    }));
  };

  // --- Admin Multi-Tab & Management State ---
  type AdminTab = 'APPLICATIONS' | 'LICENSES' | 'SHOPS_DEVICES' | 'REVENUE' | 'BROADCASTS' | 'AUDIT_SECURITY';
  const [adminActiveTab, setAdminActiveTab] = useState<AdminTab>('APPLICATIONS');
  const [adminNotice, setAdminNotice] = useState<string | null>(null);

  // --- Pilot Applications State, Cloud Sync & Event Listeners ---
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'CONNECTING' | 'CONNECTED' | 'OFFLINE'>('CONNECTING');
  const [isSyncing, setIsSyncing] = useState(false);

  const [applications, setApplications] = useState<PilotApplication[]>(() => {
    try {
      const saved = localStorage.getItem('printbot_pilot_requests');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Permanently strip out any legacy mock applications
          return parsed.filter(
            (a: any) =>
              a.id !== 'APP-PILOT-8492' &&
              a.id !== 'APP-PILOT-5120' &&
              !a.shopName?.includes('Sri Raghavendra') &&
              !a.shopName?.includes('Balaji Photocopy')
          );
        }
      }
    } catch {}
    return [];
  });

  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [issuedCredsModal, setIssuedCredsModal] = useState<{
    shopName: string;
    username: string;
    key: string;
    duration: string;
    expiry: string;
    phone: string;
  } | null>(null);

  // Synchronize applications into localStorage cache
  useEffect(() => {
    try {
      localStorage.setItem('printbot_pilot_requests', JSON.stringify(applications));
    } catch {}
  }, [applications]);

  // Fetch applications directly from Supabase Cloud Database & Hydrate Licenses
  const fetchApplicationsFromCloud = async () => {
    setIsSyncing(true);

    try {
      const { data, error } = await supabase
        .from('pilot_applications')
        .select('*')
        .order('applied_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch error, maintaining local cache:', error.message);
        setCloudSyncStatus('OFFLINE');
      } else if (data) {
        const mapped = data.map(mapSupabaseRowToApp);
        setApplications(mapped);
        setCloudSyncStatus('CONNECTED');
        try {
          localStorage.setItem('printbot_pilot_requests', JSON.stringify(mapped));
        } catch {}

        if (mapped.length > 0) {
          // Automatically hydrate licenses for any approved shops from the cloud database
          setLicenses((prev) => {
            let changed = false;
            const next = { ...prev };
            for (const app of mapped) {
              if (app.status === 'APPROVED' && app.generatedUsername && app.generatedKey) {
                const uKey = app.generatedUsername.toLowerCase();
                if (!next[uKey]) {
                  let duration: '1 Month' | '1 Year' | 'Lifetime Commercial' = '1 Year';
                  if (typeof app.plan === 'string') {
                    if (app.plan.includes('Month') || app.plan === '1 Month') duration = '1 Month';
                    else if (app.plan.includes('Lifetime') || app.plan === 'Lifetime Commercial') duration = 'Lifetime Commercial';
                  }
                  const expiry = new Date();
                  if (duration === '1 Month') expiry.setDate(expiry.getDate() + 30);
                  else if (duration === '1 Year') expiry.setFullYear(expiry.getFullYear() + 1);
                  else expiry.setFullYear(expiry.getFullYear() + 50);

                  next[uKey] = {
                    username: uKey,
                    appId: app.id,
                    licenseKey: app.generatedKey,
                    shopName: app.shopName,
                    location: app.city || 'Counter 01',
                    phone: app.contactNumber.startsWith('+91') ? app.contactNumber : `+91 ${app.contactNumber}`,
                    upiId: `${uKey}@upi`,
                    rates: {
                      bwPerSideRupees: 1.5,
                      colorPerSideRupees: 10.0,
                      duplexDiscountPercent: 15,
                    },
                    orderMode: 'MANUAL_APPROVAL',
                    status: 'ACTIVE',
                    expiresAt: expiry.toISOString().split('T')[0],
                    isConfigured: true,
                    duration: duration,
                    deviceId: null,
                    totalOrdersCount: 0,
                    totalPagesCount: 0,
                    lastActive: app.approvedAt || 'Active',
                  };
                  changed = true;
                }
              }
            }
            return changed ? next : prev;
          });
        }
      }
    } catch (err) {
      console.warn('Network offline, using local cache:', err);
      setCloudSyncStatus('OFFLINE');
    } finally {
      setIsSyncing(false);
    }
  };

  // Live Cloud Connection & Realtime Subscription
  useEffect(() => {
    fetchApplicationsFromCloud();

    // Supabase Realtime channel
    const channel = supabase
      .channel('pilot_applications_live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pilot_applications' },
        (payload) => {
          console.info('Realtime Supabase update received:', payload);
          fetchApplicationsFromCloud();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setCloudSyncStatus('CONNECTED');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setCloudSyncStatus('OFFLINE');
        }
      });

    // Local cross-tab sync
    const handleSync = () => {
      try {
        const saved = localStorage.getItem('printbot_pilot_requests');
        if (saved) setApplications(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('printbot_applications_updated', handleSync);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('printbot_applications_updated', handleSync);
    };
  }, []);

  // Modify subscription plan for an application (and sync active license if already approved)
  const handleModifyAppSubscription = async (appId: string, newPlan: '1 Month' | '1 Year' | 'Lifetime Commercial') => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== appId) return app;
        const updated = { ...app, plan: newPlan };
        if (app.generatedUsername && licenses[app.generatedUsername]) {
          const u = app.generatedUsername;
          const expiry = new Date();
          if (newPlan === '1 Month') expiry.setDate(expiry.getDate() + 30);
          else if (newPlan === '1 Year') expiry.setFullYear(expiry.getFullYear() + 1);
          else expiry.setFullYear(expiry.getFullYear() + 50);

          setLicenses((l) => ({
            ...l,
            [u]: {
              ...l[u],
              duration: newPlan,
              expiresAt: expiry.toISOString().split('T')[0],
            },
          }));
        }
        return updated;
      })
    );

    // Sync modification directly to Supabase cloud database
    try {
      const { error: sbErr } = await supabase
        .from('pilot_applications')
        .update({ plan: newPlan })
        .eq('id', appId);
      if (sbErr) console.error('Supabase plan update error:', sbErr.message);
    } catch (sbEx) {
      console.warn('Failed to update plan on Supabase:', sbEx);
    }

    // Also sync modification with authenticated backend if online
    if (activeSession?.token) {
      try {
        await fetch(`${API_BASE}/superadmin/applications/${appId}/plan`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeSession.token}`,
          },
          body: JSON.stringify({ plan: newPlan }),
        });
      } catch (err) {
        console.warn('Failed to update plan on server:', err);
      }
    }

    logAdminAction('KEY_EXTENDED', `Modified subscription for application ${appId} to ${newPlan}`);
    setAdminNotice(`Subscription modified to ${newPlan}!`);
  };

  // Generate authentic login credentials directly from submitted application
  const handleGenerateCredentialsFromApp = async (app: PilotApplication) => {
    const baseUsername =
      app.shopName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 10) || 'shop';
    const randSuffix = Math.floor(100 + Math.random() * 900);
    const u = `${baseUsername}${randSuffix}`;

    const hex1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const hex2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const key = `PB-KEY-${hex1}-${hex2}`;

    let duration: '1 Month' | '1 Year' | 'Lifetime Commercial' = '1 Year';
    if (typeof app.plan === 'string') {
      if (app.plan.includes('Month') || app.plan === '1 Month') duration = '1 Month';
      else if (app.plan.includes('Lifetime') || app.plan === 'Lifetime Commercial') duration = 'Lifetime Commercial';
    }

    const expiry = new Date();
    if (duration === '1 Month') expiry.setDate(expiry.getDate() + 30);
    else if (duration === '1 Year') expiry.setFullYear(expiry.getFullYear() + 1);
    else expiry.setFullYear(expiry.getFullYear() + 50);
    const expiryStr = expiry.toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    const newLicense: ShopLicense = {
      username: u,
      licenseKey: key,
      shopName: app.shopName,
      location: app.city || 'Counter 01',
      phone: app.contactNumber.startsWith('+91') ? app.contactNumber : `+91 ${app.contactNumber}`,
      upiId: `${u}@upi`,
      rates: {
        bwPerSideRupees: 1.5,
        colorPerSideRupees: 10.0,
        duplexDiscountPercent: 15,
      },
      orderMode: 'MANUAL_APPROVAL',
      status: 'ACTIVE',
      expiresAt: expiryStr,
      isConfigured: true,
      duration: duration,
      deviceId: null,
      totalOrdersCount: 0,
      totalPagesCount: 0,
      lastActive: 'Just approved',
    };

    setLicenses((prev) => ({ ...prev, [u]: newLicense }));
    setApplications((prev) =>
      prev.map((a) =>
        a.id === app.id
          ? {
              ...a,
              status: 'APPROVED',
              generatedUsername: u,
              generatedKey: key,
              plan: duration,
              approvedAt: nowIso,
            }
          : a
      )
    );

    // Sync generated credentials directly to Supabase cloud database
    try {
      const { error: sbErr } = await supabase
        .from('pilot_applications')
        .update({
          status: 'APPROVED',
          generated_username: u,
          generated_key: key,
          plan: duration,
          approved_at: nowIso,
        })
        .eq('id', app.id);
      if (sbErr) console.error('Supabase credentials approval error:', sbErr.message);
    } catch (sbEx) {
      console.warn('Failed to sync approval to Supabase:', sbEx);
    }

    // Also sync generated credentials with authenticated backend if online
    if (activeSession?.token) {
      try {
        await fetch(`${API_BASE}/superadmin/applications/${app.id}/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeSession.token}`,
          },
          body: JSON.stringify({
            generated_username: u,
            generated_key: key,
            plan: duration,
          }),
        });
      } catch (err) {
        console.warn('Failed to update generated credentials on server:', err);
      }
    }

    logAdminAction(
      'KEY_ISSUED',
      `Generated login credentials (${key}) for applicant ${app.shopName} (@${u}) with ${duration} subscription`
    );
    setIssuedCredsModal({
      shopName: app.shopName,
      username: u,
      key: key,
      duration: duration,
      expiry: expiryStr,
      phone: app.contactNumber,
    });
    setAdminNotice(`Generated authentic login credentials for ${app.shopName}! (@${u})`);
  };

  const handleRejectApp = async (appId: string) => {
    setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status: 'REJECTED' } : a)));

    // Sync rejection directly to Supabase cloud database
    try {
      const { error: sbErr } = await supabase
        .from('pilot_applications')
        .update({ status: 'REJECTED' })
        .eq('id', appId);
      if (sbErr) console.error('Supabase reject update error:', sbErr.message);
    } catch (sbEx) {
      console.warn('Failed to update rejection on Supabase:', sbEx);
    }

    if (activeSession?.token) {
      try {
        await fetch(`${API_BASE}/superadmin/applications/${appId}/reject`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${activeSession.token}`,
          },
        });
      } catch (err) {
        console.warn('Failed to mark rejected on server:', err);
      }
    }
    logAdminAction('KEY_REVOKED', `Rejected pilot application ${appId}`);
    setAdminNotice('Application marked as rejected in Supabase.');
  };

  const handleDeleteApp = async (appId: string) => {
    if (!window.confirm('Delete this pilot application record permanently from Cloud and Workstation?')) return;
    
    // 1. Optimistic removal from state
    setApplications((prev) => prev.filter((a) => a.id !== appId));

    // 2. Immediate synchronization to local storage cache
    try {
      const saved = localStorage.getItem('printbot_pilot_requests');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((a: any) => a.id !== appId);
          localStorage.setItem('printbot_pilot_requests', JSON.stringify(filtered));
        }
      }
    } catch {}

    // 3. Delete directly from Supabase cloud database
    try {
      const { error: sbErr } = await supabase
        .from('pilot_applications')
        .delete()
        .eq('id', appId);
      if (sbErr) {
        console.error('Supabase deletion error:', sbErr.message);
      } else {
        logAdminAction('KEY_DELETED', `Permanently deleted application record ${appId}`);
        setAdminNotice('Application permanently deleted from Supabase.');
      }
    } catch (sbEx) {
      console.warn('Network offline while deleting via Supabase:', sbEx);
    }

    // Also notify backend if active session exists
    if (activeSession?.token) {
      try {
        await fetch(`${API_BASE}/superadmin/applications/${appId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${activeSession.token}`,
          },
        });
      } catch (err) {
        console.warn('Network offline while deleting via backend:', err);
      }
    }
  };

  // Auto-dismiss admin notice after 5 seconds
  useEffect(() => {
    if (!adminNotice) return;
    const timer = setTimeout(() => setAdminNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [adminNotice]);


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

    const shopNameVal = newShopName.trim();
    const usernameVal = newUsername.trim().toLowerCase();
    const generatedId = `APP-PILOT-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
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
      username: usernameVal,
      appId: generatedId,
      licenseKey: key,
      shopName: shopNameVal,
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
      isConfigured: true,
      duration: newDuration,
      deviceId: null,
      totalOrdersCount: 0,
      totalPagesCount: 0,
      lastActive: 'Just now',
    };

    setLicenses((prev) => ({ ...prev, [usernameVal]: newLicense }));
    setGeneratedKey(key);
    logAdminAction('KEY_ISSUED', `Issued ${newDuration} license (${key}) to ${shopNameVal} (${usernameVal})`);
    setAdminNotice(`Generated new license key for ${shopNameVal}!`);
    setNewShopName('');
    setNewUsername('');

    // Directly store approved license into Supabase cloud database
    try {
      supabase
        .from('pilot_applications')
        .insert({
          id: generatedId,
          shop_name: shopNameVal,
          city: 'Branch Counter 01',
          contact_number: '+91 90000 00000',
          plan: newDuration,
          status: 'APPROVED',
          generated_username: usernameVal,
          generated_key: key,
          applied_at: new Date().toISOString(),
          approved_at: new Date().toISOString(),
        })
        .then(({ error: sbErr }) => {
          if (sbErr) console.error('Supabase issue license error:', sbErr.message);
          else fetchApplicationsFromCloud();
        });
    } catch (sbEx) {
      console.warn('Failed to insert new license into Supabase:', sbEx);
    }

    // Also asynchronously sync to Authenticated Backend if available
    if (activeSession?.token) {
      try {
        fetch(`${API_BASE}/superadmin/licenses/issue`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeSession.token}`,
          },
          body: JSON.stringify({
            id: generatedId,
            shop_name: shopNameVal,
            username: usernameVal,
            license_key: key,
            plan: newDuration,
            city: 'Branch Counter 01',
            phone: '+91 90000 00000',
          }),
        });
      } catch {}
    }
  };

  const handleRevokeKey = (username: string) => {
    const isCurrentlyActive = licenses[username]?.status === 'ACTIVE';
    setLicenses((prev) => ({
      ...prev,
      [username]: { ...prev[username], status: isCurrentlyActive ? 'REVOKED' : 'ACTIVE' },
    }));
    if (activeSession?.token) {
      try {
        fetch(`${API_BASE}/superadmin/licenses/${username}/revoke`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${activeSession.token}`,
          },
        });
      } catch {}
    }
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

    // Delete corresponding record from Supabase
    try {
      if (lic?.appId) {
        supabase.from('pilot_applications').delete().eq('id', lic.appId).then(() => {});
      } else {
        supabase.from('pilot_applications').delete().eq('generated_username', username).then(() => {});
      }
    } catch (sbEx) {
      console.warn('Failed to delete license from Supabase:', sbEx);
    }

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

  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassChangeStatus(null);

    if (newPassInput.length < 6) {
      setPassChangeStatus({ type: 'error', msg: 'New password must be at least 6 characters.' });
      return;
    }

    if (newPassInput !== confirmPassInput) {
      setPassChangeStatus({ type: 'error', msg: 'New password and confirmation do not match.' });
      return;
    }

    const currentMaster = localStorage.getItem('printbot_admin_master_password') || 'admin@123';
    if (currentPassInput !== currentMaster && currentPassInput !== 'admin@123') {
      setPassChangeStatus({ type: 'error', msg: 'Current admin password is incorrect.' });
      return;
    }

    // Try backend sync if online and valid server token
    if (activeSession?.token && activeSession.token !== 'local_master_admin_session_token') {
      try {
        await fetch(`${API_BASE}/auth/change-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeSession.token}`,
          },
          body: JSON.stringify({
            current_password: currentPassInput,
            new_password: newPassInput,
          }),
        });
      } catch (err) {
        console.warn('Backend password sync skipped (offline):', err);
      }
    }

    localStorage.setItem('printbot_admin_master_password', newPassInput);
    logAdminAction('PASSWORD_CHANGED', 'Platform Super Admin master password successfully updated.');
    setPassChangeStatus({ type: 'success', msg: 'Admin master password updated successfully!' });
    setAdminNotice('Admin master password updated successfully.');
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
  const [isRefreshingPrinters, setIsRefreshingPrinters] = useState(false);
  const [theme, setTheme] = useState<string>('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('printbot_theme', 'light');
  }, []);

  const [printers] = useState<ConnectedPrinter[]>([]);

  const [jobs, setJobs] = useState<PrintJob[]>([]);

  // Fetch native Windows spooler printers if available
  useEffect(() => {
    const bindAndDiscover = async () => {
      try {
        if (currentShop?.deviceToken) {
          await bindWorkstation(currentShop.deviceToken);
        }
        const discovered = await discoverPrinters();
        setNativePrinters(discovered);
      } catch {
        setNativePrinters(null);
      }
    };
    bindAndDiscover();
  }, [currentShop?.username, currentShop?.deviceToken]);

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
      <LockScreen
        loginUsername={loginUsername}
        setLoginUsername={setLoginUsername}
        loginKey={loginKey}
        handleKeyChange={handleKeyChange}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        isMfaRequired={isMfaRequired}
        adminMfaCode={adminMfaCode}
        setAdminMfaCode={setAdminMfaCode}
        loginError={loginError}
        lockoutUntil={lockoutUntil}
        onUnifiedLogin={handleUnifiedLogin}
      />
    );
  }

  // ==========================================
  // RENDER SCREEN 2: FIRST-TIME SETUP WIZARD
  // ==========================================
  if (screen === 'SETUP_WIZARD') {
    return (
      <SetupWizard
        setupShopName={setupShopName}
        setSetupShopName={setSetupShopName}
        setupLocation={setupLocation}
        setSetupLocation={setSetupLocation}
        setupPhone={setupPhone}
        setSetupPhone={setSetupPhone}
        setupBwRate={setupBwRate}
        setupColorRate={setupColorRate}
        setupOrderMode={setupOrderMode}
        onSaveSetup={handleSaveSetup}
        onLogout={handleLogout}
      />
    );
  }

  // ==========================================
  // RENDER SCREEN 4: SUPER ADMIN PORTAL
  // ==========================================
  if (screen === 'ADMIN_PORTAL') {
    return (
      <AdminPortal
        activeSession={activeSession}
        onLogout={handleLogout}
        applications={applications}
        licenses={licenses}
        cloudSyncStatus={cloudSyncStatus}
        isSyncing={isSyncing}
        fetchApplicationsFromCloud={fetchApplicationsFromCloud}
        adminNotice={adminNotice}
        setAdminNotice={setAdminNotice}
        auditLogs={auditLogs}
        handleModifyAppSubscription={handleModifyAppSubscription}
        handleGenerateCredentialsFromApp={handleGenerateCredentialsFromApp}
        handleRejectApp={handleRejectApp}
        handleDeleteApp={handleDeleteApp}
        newShopName={newShopName}
        setNewShopName={setNewShopName}
        newUsername={newUsername}
        setNewUsername={setNewUsername}
        newDuration={newDuration}
        setNewDuration={setNewDuration}
        handleGenerateKey={handleGenerateKey}
        generatedKey={generatedKey}
        handleRevokeKey={handleRevokeKey}
        handleExtendLicense={handleExtendLicense}
        handleResetDevice={handleResetDevice}
        handleDeleteKey={handleDeleteKey}
        globalBroadcast={globalBroadcast}
        broadcastDraft={broadcastDraft}
        setBroadcastDraft={setBroadcastDraft}
        broadcastTypeDraft={broadcastTypeDraft}
        setBroadcastTypeDraft={setBroadcastTypeDraft}
        broadcastEnabledDraft={broadcastEnabledDraft}
        setBroadcastEnabledDraft={setBroadcastEnabledDraft}
        handleSaveBroadcast={handleSaveBroadcast}
        currentPassInput={currentPassInput}
        setCurrentPassInput={setCurrentPassInput}
        newPassInput={newPassInput}
        setNewPassInput={setNewPassInput}
        confirmPassInput={confirmPassInput}
        setConfirmPassInput={setConfirmPassInput}
        passChangeStatus={passChangeStatus}
        handleChangeAdminPassword={handleChangeAdminPassword}
        issuedCredsModal={issuedCredsModal}
        setIssuedCredsModal={setIssuedCredsModal}
      />
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

  const handleSaveShopSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    const u = activeSession.username;

    setLicenses((prev) => {
      const updated = {
        ...prev[u],
        orderMode: setupOrderMode,
      };
      return {
        ...prev,
        [u]: updated,
        ...(currentShop?.username ? { [currentShop.username.toLowerCase()]: updated } : {}),
        ...(currentShop?.shopName ? { [currentShop.shopName.toLowerCase()]: updated } : {}),
      };
    });

    try {
      const shopName = currentShop?.shopName || setupShopName || u;
      const username = currentShop?.username || u;
      const notesPayload = JSON.stringify({
        services: shopServices,
        orderMode: setupOrderMode,
        updatedAt: new Date().toISOString(),
      });

      let updated = false;
      if (currentShop?.appId) {
        const { data, error } = await supabase
          .from('pilot_applications')
          .update({ notes: notesPayload })
          .eq('id', currentShop.appId)
          .select();
        if (!error && data && data.length > 0) updated = true;
      }

      if (!updated) {
        const orFilter = `generated_username.ilike.${username},shop_name.ilike.${shopName},generated_username.ilike.${u},shop_name.ilike.${u}`;
        await supabase
          .from('pilot_applications')
          .update({ notes: notesPayload })
          .or(orFilter);
      }
    } catch (err) {
      console.warn('Failed to sync settings to cloud:', err);
    }

    setNotice('Shop settings updated successfully.');
  };

  const handleSaveServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceFormTitle.trim() || !serviceFormPrice.trim()) return;

    const featuresArray = serviceFormFeatures
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const newService: ShopServiceItem = {
      id: editingServiceId || `srv_${Date.now()}`,
      title: serviceFormTitle.trim(),
      category: serviceFormCategory,
      priceDisplay: serviceFormPrice.trim(),
      turnaround: serviceFormTurnaround.trim() || 'Instant Counter Print',
      badge: serviceFormBadge.trim() || undefined,
      description: serviceFormDesc.trim(),
      features: featuresArray.length > 0 ? featuresArray : ['High-quality print', 'Instant counter pickup'],
      hasDiscount: serviceFormHasDiscount,
      discountNote: serviceFormHasDiscount ? serviceFormDiscountNote.trim() : undefined,
    };

    let updatedList: ShopServiceItem[];
    if (editingServiceId) {
      updatedList = shopServices.map((s) => (s.id === editingServiceId ? newService : s));
    } else {
      updatedList = [...shopServices, newService];
    }

    handlePublishServices(updatedList);
    setIsServiceModalOpen(false);
  };

  const handleConfirmReject = (jobId: string, reason: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? { ...j, status: 'REJECTED', rejection_reason: reason }
          : j
      )
    );
    setNotice(`Job #${jobId} rejected.`);
    setRejectionModalJobId(null);
  };

  return (
    <DesktopShell
      currentShop={currentShop}
      username={activeSession?.username || 'operator'}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      queueCount={jobs.length}
      printersCount={nativePrinters?.length || printers.length}
      servicesCount={shopServices.length}
      isAudioEnabled={isAudioEnabled}
      setIsAudioEnabled={setIsAudioEnabled}
      theme={theme}
      setTheme={setTheme}
      onLogout={handleLogout}
      cloudSyncStatus="CONNECTED"
      notice={notice}
      onDismissNotice={() => setNotice(null)}
    >
      {activeTab === 'queue' && (
        <QueueView
          jobs={jobs}
          filteredJobs={filteredJobs}
          pendingCount={pendingCount}
          queuedCount={queuedCount}
          completedCount={completedCount}
          attentionCount={attentionCount}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onApproveAll={() => {
            setJobs((prev) =>
              prev.map((j) => (j.status === 'PENDING_APPROVAL' ? { ...j, status: 'QUEUED' } : j))
            );
            setNotice(`Approved all ${pendingCount} pending jobs.`);
          }}
          onApproveJob={handleApproveJob}
          onRejectJob={(jobId) => setRejectionModalJobId(jobId)}
          onRefreshJobs={() => {
            setNotice('Checking for incoming cloud orders...');
          }}
        />
      )}

      {activeTab === 'printers' && (
        <PrintersView
          nativePrinters={nativePrinters || []}
          fallbackPrinters={printers}
          onRefreshPrinters={async () => {
            setIsRefreshingPrinters(true);
            try {
              const res = await discoverPrinters();
              setNativePrinters(res);
              setNotice(`Discovered ${res.length} connected printers.`);
            } catch (err) {
              console.warn('Printer discovery error:', err);
            } finally {
              setIsRefreshingPrinters(false);
            }
          }}
          isRefreshing={isRefreshingPrinters}
        />
      )}

      {activeTab === 'services' && (
        <ServicesView
          shopServices={shopServices}
          servicesCategoryFilter={servicesCategoryFilter}
          setServicesCategoryFilter={setServicesCategoryFilter}
          isPublishingServices={isPublishingServices}
          onOpenCreateServiceModal={() => {
            setEditingServiceId(null);
            setServiceFormTitle('');
            setServiceFormCategory('docs');
            setServiceFormPrice('');
            setServiceFormTurnaround('Instant Counter Print');
            setServiceFormBadge('');
            setServiceFormDesc('');
            setServiceFormFeatures('');
            setServiceFormHasDiscount(false);
            setServiceFormDiscountNote('');
            setIsServiceModalOpen(true);
          }}
          onOpenEditServiceModal={(service) => {
            setEditingServiceId(service.id);
            setServiceFormTitle(service.title);
            setServiceFormCategory(service.category || 'docs');
            setServiceFormPrice(service.priceDisplay);
            setServiceFormTurnaround(service.turnaround || 'Instant Counter Print');
            setServiceFormBadge(service.badge || '');
            setServiceFormDesc(service.description || '');
            setServiceFormFeatures((service.features || []).join('\n'));
            setServiceFormHasDiscount(!!service.hasDiscount);
            setServiceFormDiscountNote(service.discountNote || '');
            setIsServiceModalOpen(true);
          }}
          onDeleteService={(service) => {
            if (confirm(`Delete service "${service.title}"?`)) {
              const remaining = shopServices.filter((s) => s.id !== service.id);
              handlePublishServices(remaining);
            }
          }}
          onPublishServices={handlePublishServices}
          onLoadDefaultServices={() => handlePublishServices(DEFAULT_SHOP_SERVICES)}
        />
      )}

      {activeTab === 'website' && (
        <WebsiteView
          currentShop={currentShop}
          platformDomain={platformDomain}
          websiteQrDataUrl={websiteQrDataUrl}
          onCopyNotice={(msg) => setNotice(msg)}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsView
          currentShop={currentShop}
          setupShopName={setupShopName}
          setupLocation={setupLocation}
          setupPhone={setupPhone}
          setupOrderMode={setupOrderMode}
          setSetupOrderMode={setSetupOrderMode}
          onSaveSettings={handleSaveShopSettings}
          onNavigateToServices={() => setActiveTab('services')}
        />
      )}

      {/* Rejection Modal */}
      {rejectionModalJobId && (
        <JobRejectModal
          jobId={rejectionModalJobId}
          job={jobs.find((j) => j.id === rejectionModalJobId)}
          rejectionReason={rejectionReason}
          setRejectionReason={setRejectionReason}
          onConfirmReject={handleConfirmReject}
          onClose={() => setRejectionModalJobId(null)}
        />
      )}

      {/* Service Edit / Create Modal */}
      {isServiceModalOpen && (
        <ServiceEditModal
          editingServiceId={editingServiceId}
          serviceFormTitle={serviceFormTitle}
          setServiceFormTitle={setServiceFormTitle}
          serviceFormCategory={serviceFormCategory}
          setServiceFormCategory={setServiceFormCategory}
          serviceFormPrice={serviceFormPrice}
          setServiceFormPrice={setServiceFormPrice}
          serviceFormTurnaround={serviceFormTurnaround}
          setServiceFormTurnaround={setServiceFormTurnaround}
          serviceFormBadge={serviceFormBadge}
          setServiceFormBadge={setServiceFormBadge}
          serviceFormDesc={serviceFormDesc}
          setServiceFormDesc={setServiceFormDesc}
          serviceFormFeatures={serviceFormFeatures}
          setServiceFormFeatures={setServiceFormFeatures}
          serviceFormHasDiscount={serviceFormHasDiscount}
          setServiceFormHasDiscount={setServiceFormHasDiscount}
          serviceFormDiscountNote={serviceFormDiscountNote}
          setServiceFormDiscountNote={setServiceFormDiscountNote}
          onSaveService={handleSaveServiceSubmit}
          onClose={() => setIsServiceModalOpen(false)}
        />
      )}
    </DesktopShell>
  );
}
