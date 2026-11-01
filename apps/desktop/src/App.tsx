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
    if (loginUsername.trim().toLowerCase() === 'admin') {
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

    // 1. Server-Verified Admin Authentication Check
    if (u === 'admin' || u.endsWith('@printbot.in')) {
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
            return;
          }
        } else if (loginRes.status === 403) {
          const errData = await loginRes.json().catch(() => ({}));
          if (errData.detail && errData.detail.includes('MFA_REQUIRED')) {
            setIsMfaRequired(true);
            setLoginError('MFA verification code required for Super Admin account.');
            return;
          }
        } else {
          // Backend is online and answered, but rejected the credentials
          const errData = await loginRes.json().catch(() => ({}));
          setLoginError(errData.detail || 'Invalid administrative credentials.');
          return;
        }
      } catch (adminErr) {
        isBackendOffline = true;
        console.warn('Backend admin auth unreachable:', adminErr);
      }

      // If backend server is offline or unreachable:
      if (isBackendOffline) {
        // Requirements 1, 2, 5, 6:
        // For development/testing builds only, allow local offline admin login using test credentials.
        // In production releases, __DEV_OFFLINE_ADMIN_ENABLED__ is false and dead-code eliminated.
        if (
          __DEV_OFFLINE_ADMIN_ENABLED__ &&
          u === __DEV_TEST_ADMIN_USER__ &&
          k === __DEV_TEST_ADMIN_PASS__
        ) {
          console.info('[Dev Auth] Backend unreachable. Authenticated via dev/test offline admin credentials.');
          setFailedAttempts(0);
          setLockoutUntil(null);
          setIsMfaRequired(false);
          setAdminMfaCode('');
          setActiveSession({
            role: 'ADMIN',
            username: 'admin (dev-offline)',
            token: 'dev_offline_admin_token',
          });
          setNotice('Logged in via offline development test admin.');
          return;
        }

        setLoginError('Authentication server offline or unreachable. Administrative login failed closed.');
        return;
      }
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

    if (!activeSession?.token) {
      setPassChangeStatus({ type: 'error', msg: 'Authenticated Super Admin session required.' });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
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

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to update password' }));
        setPassChangeStatus({ type: 'error', msg: err.detail || 'Current password incorrect.' });
        return;
      }

      logAdminAction('PASSWORD_UPDATED', 'Super-admin credential updated on server. Previous password invalidated.');
      setPassChangeStatus({ type: 'success', msg: 'Admin password updated on server! Previous password has been invalidated.' });
      setCurrentPassInput('');
      setNewPassInput('');
      setConfirmPassInput('');
    } catch {
      setPassChangeStatus({ type: 'error', msg: 'Unable to connect to authentication server.' });
    }
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
  const [theme, setTheme] = useState<string>(() => {
    try {
      return localStorage.getItem('printbot_theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('printbot_theme', theme);
  }, [theme]);

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

    // Filtered Applications for Tab 0
    const pendingAppCount = applications.filter((a) => a.status === 'PENDING').length;
    const approvedAppCount = applications.filter((a) => a.status === 'APPROVED').length;
    const rejectedAppCount = applications.filter((a) => a.status === 'REJECTED').length;

    const filteredApplications = applications.filter((app) => {
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
          {/* TAB 0: PILOT APPLICATIONS & CREDENTIAL GENERATOR */}
          {/* ========================================================= */}
          {adminActiveTab === 'APPLICATIONS' && (
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
                    Pending Applications
                  </small>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: pendingAppCount > 0 ? '#d97706' : 'var(--pb-text)', marginTop: '4px' }}>
                    {pendingAppCount}
                  </div>
                  <small style={{ color: 'var(--pb-muted)', fontSize: '11px' }}>Awaiting review &amp; provisioning</small>
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
                    Approved &amp; Active Shops
                  </small>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                    {approvedAppCount}
                  </div>
                  <small style={{ color: 'var(--pb-muted)', fontSize: '11px' }}>Credentials generated &amp; active</small>
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
                    Total Pilot Applications
                  </small>
                  <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '4px' }}>
                    {applications.length}
                  </div>
                  <small style={{ color: 'var(--pb-muted)', fontSize: '11px' }}>From website &amp; onboarding requests</small>
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
                    Subscription Entitlement
                  </small>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--pb-accent)', marginTop: '4px' }}>
                    Unlimited
                  </div>
                  <small style={{ color: 'var(--pb-muted)', fontSize: '11px' }}>Printers per subscribed shop</small>
                </div>
              </div>

              {/* Filter and Action Header */}
              <div
                style={{
                  background: 'var(--pb-surface)',
                  border: '1px solid var(--pb-border)',
                  borderRadius: '16px',
                  padding: '20px 24px',
                  marginBottom: '24px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 320px' }}>
                  <div style={{ position: 'relative', width: '100%', maxWidth: '420px' }}>
                    <Search
                      size={16}
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--pb-muted)' }}
                    />
                    <input
                      type="text"
                      placeholder="Search by shop name, city, phone or ID..."
                      value={appSearchQuery}
                      onChange={(e) => setAppSearchQuery(e.target.value)}
                      style={{ paddingLeft: '36px', width: '100%' }}
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
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          padding: '8px 14px',
                          borderRadius: '8px',
                          border: isSelected ? '1px solid var(--pb-accent)' : '1px solid var(--pb-border)',
                          background: isSelected ? 'var(--pb-accent)' : 'var(--pb-raised)',
                          color: isSelected ? '#fff' : 'var(--pb-text)',
                          cursor: 'pointer',
                        }}
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

                  <div style={{ width: '1px', height: '24px', background: 'var(--pb-border)', margin: '0 4px' }} />

                  {/* Cloud Live Sync Indicator */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '7px 12px',
                      borderRadius: '8px',
                      background: cloudSyncStatus === 'CONNECTED' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      color: cloudSyncStatus === 'CONNECTED' ? '#059669' : '#dc2626',
                      border: `1px solid ${cloudSyncStatus === 'CONNECTED' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
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
                      ? 'Connecting Cloud...'
                      : 'Cloud Offline'}
                  </div>

                  {/* Sync Button */}
                  <button
                    type="button"
                    onClick={() => fetchApplicationsFromCloud()}
                    disabled={isSyncing}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: 750,
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--pb-border)',
                      background: 'var(--pb-raised)',
                      color: 'var(--pb-text)',
                      cursor: isSyncing ? 'wait' : 'pointer',
                    }}
                    title="Poll Supabase Cloud for new submissions"
                  >
                    <RefreshCw size={13} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
                  </button>
                </div>
              </div>

              {/* Applications List */}
              {filteredApplications.length === 0 ? (
                <div
                  style={{
                    background: 'var(--pb-surface)',
                    border: '1px solid var(--pb-border)',
                    borderRadius: '16px',
                    padding: '60px 24px',
                    textAlign: 'center',
                  }}
                >
                  <UserCheck size={42} style={{ color: 'var(--pb-muted)', opacity: 0.5, margin: '0 auto 12px' }} />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px' }}>No Applications Found</h3>
                  <p style={{ color: 'var(--pb-muted)', fontSize: '13px', margin: 0, maxWidth: '420px', marginInline: 'auto' }}>
                    {appSearchQuery || appStatusFilter !== 'ALL'
                      ? 'No applications match your active search filter.'
                      : 'When print shop owners submit the pilot application form on the website, they will appear here for admin review, subscription modification, and login credential generation.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {filteredApplications.map((app) => {
                    const cleanPhone = app.contactNumber.replace(/\D/g, '');
                    const isPending = app.status === 'PENDING';
                    const isApproved = app.status === 'APPROVED';

                    return (
                      <div
                        key={app.id}
                        style={{
                          background: 'var(--pb-surface)',
                          border: isPending ? '2px solid rgba(217, 119, 6, 0.4)' : '1px solid var(--pb-border)',
                          borderRadius: '16px',
                          padding: '24px',
                          boxShadow: isPending ? '0 4px 20px -2px rgba(217, 119, 6, 0.08)' : undefined,
                        }}
                      >
                        {/* Header Row */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '12px',
                            borderBottom: '1px solid var(--pb-border)',
                            paddingBottom: '16px',
                            marginBottom: '18px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                background: isPending
                                  ? 'rgba(217, 119, 6, 0.12)'
                                  : isApproved
                                  ? 'rgba(5, 150, 105, 0.12)'
                                  : 'var(--pb-raised)',
                                color: isPending ? '#d97706' : isApproved ? '#059669' : 'var(--pb-muted)',
                                display: 'grid',
                                placeItems: 'center',
                              }}
                            >
                              <Building size={18} />
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>{app.shopName}</h3>
                                <code
                                  style={{
                                    fontSize: '11px',
                                    color: 'var(--pb-muted)',
                                    background: 'var(--pb-raised)',
                                    padding: '2px 6px',
                                    borderRadius: '6px',
                                  }}
                                >
                                  {app.id}
                                </code>
                              </div>
                              <small style={{ color: 'var(--pb-muted)', fontSize: '11.5px', marginTop: '2px', display: 'block' }}>
                                Applied: {new Date(app.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </small>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {isPending && (
                              <span
                                style={{
                                  background: '#fef3c7',
                                  color: '#b45309',
                                  border: '1px solid #fde68a',
                                  padding: '5px 12px',
                                  borderRadius: '20px',
                                  fontSize: '11.5px',
                                  fontWeight: 750,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                              >
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d97706' }} />
                                Pending Admin Review
                              </span>
                            )}
                            {isApproved && (
                              <span
                                style={{
                                  background: '#ecfdf5',
                                  color: '#047857',
                                  border: '1px solid #a7f3d0',
                                  padding: '5px 12px',
                                  borderRadius: '20px',
                                  fontSize: '11.5px',
                                  fontWeight: 750,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
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
                                  padding: '5px 12px',
                                  borderRadius: '20px',
                                  fontSize: '11.5px',
                                  fontWeight: 750,
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
                                color: 'var(--pb-muted)',
                                padding: '6px',
                                cursor: 'pointer',
                                borderRadius: '6px',
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Body 3-Column Grid */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                            gap: '20px',
                            alignItems: 'start',
                          }}
                        >
                          {/* Col 1: Shop & Contact */}
                          <div style={{ background: 'var(--pb-raised)', padding: '16px', borderRadius: '12px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--pb-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                              Shop Location &amp; Contact
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                              📍 {app.city}
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--pb-text)', marginBottom: '10px' }}>
                              📱 +91 {app.contactNumber}
                            </div>
                            <a
                              href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                                `Hello ${app.shopName}! We received your Print Bot shop pilot request from ${app.city}.`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 10px',
                                background: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0',
                                borderRadius: '6px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                textDecoration: 'none',
                              }}
                            >
                              <Send size={12} /> Chat on WhatsApp
                            </a>
                          </div>

                          {/* Col 2: Subscription Modifier (Admin Controls) */}
                          <div style={{ background: 'var(--pb-raised)', padding: '16px', borderRadius: '12px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--pb-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                              Subscription Plan (Admin Managed)
                            </div>
                            <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--pb-muted)', marginBottom: '4px' }}>
                              Configure / Modify Shop Plan:
                            </label>
                            <select
                              value={
                                app.plan.includes('Month')
                                  ? '1 Month'
                                  : app.plan.includes('Lifetime')
                                  ? 'Lifetime Commercial'
                                  : '1 Year'
                              }
                              onChange={(e) =>
                                handleModifyAppSubscription(
                                  app.id,
                                  e.target.value as '1 Month' | '1 Year' | 'Lifetime Commercial'
                                )
                              }
                              style={{
                                width: '100%',
                                padding: '8px 10px',
                                borderRadius: '8px',
                                border: '1px solid var(--pb-border)',
                                background: 'var(--pb-surface)',
                                color: 'var(--pb-text)',
                                fontSize: '12.5px',
                                fontWeight: 750,
                              }}
                            >
                              <option value="1 Year">1 Year Subscription — ₹4,999 (2 Mo Free)</option>
                              <option value="1 Month">1 Month Subscription — ₹499/mo</option>
                              <option value="Lifetime Commercial">Lifetime Commercial — ₹14,999</option>
                            </select>
                            <small style={{ display: 'block', marginTop: '6px', color: 'var(--pb-muted)', fontSize: '11px', lineHeight: 1.4 }}>
                              Admin can modify subscription anytime in the exe. Includes unlimited connected printers.
                            </small>
                          </div>

                          {/* Col 3: Credentials Generator & Actions */}
                          <div style={{ background: 'var(--pb-raised)', padding: '16px', borderRadius: '12px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--pb-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                              Workstation Access &amp; Credentials
                            </div>

                            {isPending && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleGenerateCredentialsFromApp(app)}
                                  className="ws-primary"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    padding: '10px 14px',
                                    fontSize: '13px',
                                    fontWeight: 750,
                                    borderRadius: '8px',
                                    width: '100%',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Sparkles size={16} />
                                  Generate Login Credentials
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectApp(app.id)}
                                  style={{
                                    padding: '6px 12px',
                                    fontSize: '11.5px',
                                    color: 'var(--pb-muted)',
                                    background: 'transparent',
                                    border: '1px solid var(--pb-border)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Decline Application
                                </button>
                              </div>
                            )}

                            {isApproved && (
                              <div>
                                <div
                                  style={{
                                    background: 'var(--pb-surface)',
                                    border: '1px solid var(--pb-border)',
                                    borderRadius: '8px',
                                    padding: '10px 12px',
                                    marginBottom: '10px',
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--pb-muted)' }}>Username:</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <code style={{ fontSize: '12px', fontWeight: 800 }}>{app.generatedUsername}</code>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(app.generatedUsername || '');
                                          setAdminNotice(`Copied username @${app.generatedUsername}`);
                                        }}
                                        style={{ background: 'transparent', border: 0, padding: '2px', cursor: 'pointer', color: 'var(--pb-muted)' }}
                                        title="Copy Username"
                                      >
                                        <Copy size={12} />
                                      </button>
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--pb-muted)' }}>License Key:</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <code style={{ fontSize: '12px', fontWeight: 800, color: 'var(--pb-accent)' }}>
                                        {app.generatedKey}
                                      </code>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(app.generatedKey || '');
                                          setAdminNotice(`Copied License Key ${app.generatedKey}`);
                                        }}
                                        style={{ background: 'transparent', border: 0, padding: '2px', cursor: 'pointer', color: 'var(--pb-muted)' }}
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
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    padding: '8px 12px',
                                    background: '#059669',
                                    color: '#fff',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    textDecoration: 'none',
                                    width: '100%',
                                    boxSizing: 'border-box',
                                  }}
                                >
                                  <Send size={13} /> Send Credentials on WhatsApp
                                </a>
                              </div>
                            )}

                            {app.status === 'REJECTED' && (
                              <div>
                                <small style={{ color: 'var(--pb-muted)', fontSize: '11.5px', display: 'block', marginBottom: '8px' }}>
                                  Application was declined.
                                </small>
                                <button
                                  type="button"
                                  onClick={() => handleGenerateCredentialsFromApp(app)}
                                  style={{
                                    padding: '6px 10px',
                                    fontSize: '11.5px',
                                    background: 'var(--pb-surface)',
                                    border: '1px solid var(--pb-border)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                  }}
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
                      placeholder="Enter current password"
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

        {/* Issued Credentials Modal */}
        {issuedCredsModal && (
          <Dialog
            title="Workstation Login Credentials Generated"
            onClose={() => setIssuedCredsModal(null)}
          >
            <div style={{ padding: '4px 0' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                  background: 'rgba(5, 150, 105, 0.1)',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  color: '#059669',
                }}
              >
                <CheckCircle2 size={24} />
                <div>
                  <strong style={{ display: 'block', fontSize: '14px' }}>
                    Access Provisioned for {issuedCredsModal.shopName}
                  </strong>
                  <span style={{ fontSize: '12px' }}>
                    Authentic credentials issued. The shop owner can now log into the desktop workstation.
                  </span>
                </div>
              </div>

              <div
                style={{
                  background: 'var(--pb-raised)',
                  border: '1px solid var(--pb-border)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '18px',
                }}
              >
                <div style={{ marginBottom: '14px' }}>
                  <small style={{ color: 'var(--pb-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                    Shop Owner Username
                  </small>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                    <code style={{ fontSize: '16px', fontWeight: 800 }}>{issuedCredsModal.username}</code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(issuedCredsModal.username);
                        setAdminNotice(`Copied username @${issuedCredsModal.username}`);
                      }}
                      style={{ minHeight: '32px', fontSize: '11px', gap: '4px' }}
                    >
                      <Copy size={13} /> Copy Username
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <small style={{ color: 'var(--pb-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                    Authentic Workstation License Key
                  </small>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                    <code style={{ fontSize: '16px', fontWeight: 800, color: 'var(--pb-accent)' }}>
                      {issuedCredsModal.key}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(issuedCredsModal.key);
                        setAdminNotice(`Copied License Key ${issuedCredsModal.key}`);
                      }}
                      style={{ minHeight: '32px', fontSize: '11px', gap: '4px' }}
                    >
                      <Copy size={13} /> Copy Key
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    borderTop: '1px solid var(--pb-border)',
                    paddingTop: '10px',
                  }}
                >
                  <span style={{ color: 'var(--pb-muted)' }}>Subscription Validity:</span>
                  <strong>{issuedCredsModal.duration} (Valid until {issuedCredsModal.expiry})</strong>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a
                  href={`https://wa.me/91${issuedCredsModal.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Hello *${issuedCredsModal.shopName}*! 🎉\n\nYour Print Bot Workstation access is approved.\n\n*Your Login Credentials:*\n👤 *Username:* ${issuedCredsModal.username}\n🔑 *License Key:* ${issuedCredsModal.key}\n📅 *Plan:* ${issuedCredsModal.duration} (Unlimited Connected Printers)\n\nLaunch Print Bot Workstation software and enter your Username & Key to get started!`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    background: '#059669',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 750,
                    textDecoration: 'none',
                  }}
                >
                  <Send size={15} /> Send Credentials via WhatsApp (+91 {issuedCredsModal.phone})
                </a>

                <button
                  type="button"
                  onClick={() => {
                    const fullText = `Print Bot Workstation Access Approved\nShop: ${issuedCredsModal.shopName}\nUsername: ${issuedCredsModal.username}\nLicense Key: ${issuedCredsModal.key}\nPlan: ${issuedCredsModal.duration}\nValid until: ${issuedCredsModal.expiry}`;
                    navigator.clipboard.writeText(fullText);
                    setAdminNotice('Copied complete credentials summary to clipboard!');
                  }}
                  style={{ width: '100%', minHeight: '38px', fontSize: '12px', justifyContent: 'center' }}
                >
                  <Copy size={14} /> Copy Full Invitation Summary
                </button>

                <button
                  type="button"
                  onClick={() => setIssuedCredsModal(null)}
                  style={{ width: '100%', minHeight: '38px', fontSize: '12px', justifyContent: 'center', border: 0, background: 'transparent' }}
                >
                  Done / Close
                </button>
              </div>
            </div>
          </Dialog>
        )}
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
