import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Printer,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowRight,
  Layers,
  Upload,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import {
  ActiveView,
  DocumentItem,
  Language,
  PlacedOrder,
  PrintOptions,
  ServerQuote,
  ShopSession,
} from './types';
import { getTranslation } from './locales';
import { Header } from './components/common/Header';
import { ShopRatesGrid } from './components/common/ShopRatesGrid';
import { BottomNav } from './components/common/BottomNav';
import { ServiceCatalog } from './components/services/ServiceCatalog';
import { FileUploadZone } from './components/print/FileUploadZone';
import { DocumentConfigurator } from './components/print/DocumentConfigurator';
import { DocumentPreview } from './components/print/DocumentPreview';
import { LivePriceBreakdown } from './components/print/LivePriceBreakdown';
import { CartView } from './components/cart/CartView';
import { CheckoutView } from './components/checkout/CheckoutView';
import { OrderTracker } from './components/tracking/OrderTracker';
import { CustomerDashboard } from './components/dashboard/CustomerDashboard';
import { PasswordUnlockModal } from './components/common/PasswordUnlockModal';
import {
  getStoredLanguage,
  setStoredLanguage,
  loadStoredOrders,
  saveOrderToStorage,
  updateStoredOrderStatus,
} from './utils/storage';
import {
  openShopSession,
  scanFile,
  quoteOrder,
  createOrder,
  createPaymentIntent,
  fetchOrderStatus,
  isApiConfigured,
  type CreateOrderPayload,
} from './api';
import { supabase } from './supabase';
import {
  resolveShopSlugFromUrl,
  loadShopProfile,
  subscribeToShopRealtime,
} from './utils/tenant';

const defaultShopSession: ShopSession = {
  session_token: 'shop-session-counter',
  shop_id: 'shop-counter',
  shop_name: 'Anna University Print & Xerox Stand',
  shop_slug: 'anna-univ-xerox',
  shop_address: 'Main Entrance Stand #2, Guindy Campus, Chennai',
  shop_phone: '+91 98401 23456',
  operating_hours: '08:00 AM – 09:30 PM (Mon–Sat)',
  rates: {
    bwPerSideRupees: 1.5,
    colorPerSideRupees: 10.0,
    duplexDiscountPercent: 15,
  },
  orderMode: 'FULL_AUTOMATIC',
  expires_at: new Date(Date.now() + 86400000).toISOString(),
};

export interface CustomerWebAppProps {
  initialShopId?: string;
  onBackToHome?: () => void;
}

export default function App({ initialShopId, onBackToHome }: CustomerWebAppProps = {}) {
  const [lang, setLang] = useState<Language>(getStoredLanguage);
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [printStep, setPrintStep] = useState<number>(1);
  const [files, setFiles] = useState<DocumentItem[]>([]);
  const [activeFileId, setActiveFileId] = useState<string>('');
  const [applyToAll, setApplyAll] = useState<boolean>(true);

  // Dynamically resolve shop slug from props, URL path route, or query parameter
  const resolvedSlug = useMemo(() => initialShopId?.trim().toLowerCase() || resolveShopSlugFromUrl(), [initialShopId]);
  const [session, setSession] = useState<ShopSession>(defaultShopSession);
  const [isResolvingShop, setIsResolvingShop] = useState<boolean>(Boolean(resolvedSlug));
  const [orders, setOrders] = useState<PlacedOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<PlacedOrder | null>(null);
  const [unlockingFileId, setUnlockingFileId] = useState<string | null>(null);
  const [quote, setQuote] = useState<ServerQuote | null>(null);
  const [quoteStatus, setQuoteStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [quoteError, setQuoteError] = useState('');

  const t = getTranslation(lang);

  // Enforce clean light mode across customer web portal
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
    try {
      localStorage.setItem('pb_theme', 'light');
      localStorage.setItem('printbot-theme-v1', 'light');
    } catch (_) {}
  }, []);

  // Sync language
  useEffect(() => {
    document.documentElement.lang = lang;
    setStoredLanguage(lang);
  }, [lang]);

  // Load orders from storage
  useEffect(() => {
    const loaded = loadStoredOrders(session.shop_id);
    setOrders(loaded);
  }, [session.shop_id]);

  // Dynamic Shop Resolution: load profile & subscribe to live rate updates from Desktop Workstation
  useEffect(() => {
    if (!resolvedSlug) return;
    document.title = `${resolvedSlug.toUpperCase()} • Touchless Print Counter`;
    let unsubRealtime: (() => void) | undefined;

    loadShopProfile(resolvedSlug).then((profile) => {
      if (!profile) {
        // Active shop does not exist in Supabase!
        // Immediately reload/redirect to main commercial website as requested
        if (onBackToHome) {
          onBackToHome();
        }
        window.location.replace('/');
        return;
      }
      setSession(profile);
      setIsResolvingShop(false);
      document.title = `${profile.shop_name} • Touchless Print Counter`;
    });

    unsubRealtime = subscribeToShopRealtime(resolvedSlug, (updated) => {
      setSession((prev) => ({
        ...prev,
        ...updated,
        rates: updated.rates ? { ...prev.rates, ...updated.rates } : prev.rates,
        services: updated.services !== undefined ? updated.services : prev.services,
      }));
    });

    return () => {
      if (unsubRealtime) unsubRealtime();
    };
  }, [resolvedSlug]);

  // Fallback: Resolve QR code from query parameter if present
  useEffect(() => {
    const qrParam = new URLSearchParams(window.location.search).get('qr');
    if (!qrParam || resolvedSlug) return;
    openShopSession(qrParam)
      .then((sess) => {
        setSession((prev) => ({
          ...prev,
          ...sess,
        }));
      })
      .catch(() => {
        // Fallback to counter defaults cleanly
      });
  }, [resolvedSlug]);

  useEffect(() => {
    if (files.length === 0) {
      setQuote(null);
      setQuoteStatus('idle');
      setQuoteError('');
      return;
    }

    setQuote(null);
    setQuoteStatus('loading');
    setQuoteError('');
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const calculateServerQuote = async () => {
        try {
          const fileQuotes = await Promise.all(files.map((file) => quoteOrder(
            file.pageCount || 1,
            {
              copies: file.options.copies,
              color_mode: file.options.colorMode,
              paper_size: file.options.paperSize,
              duplex_mode: file.options.duplex,
              paper_gsm: Number(file.options.paperGsm),
              binding: file.options.finishing,
              page_range: file.options.pageRange,
              pages_per_sheet: file.options.nup,
              orientation: file.options.orientation,
            },
            session.shop_slug,
          )));
          if (cancelled) return;

          const totalPaise = fileQuotes.reduce((sum, item) => sum + item.total_paise, 0);
          setQuote({
            total_paise: totalPaise,
            total_rupees: totalPaise / 100,
            total_logical_pages: fileQuotes.reduce((sum, item) => sum + item.total_logical_pages, 0),
            total_rendered_sides: fileQuotes.reduce((sum, item) => sum + item.total_rendered_sides, 0),
            total_physical_sheets: fileQuotes.reduce((sum, item) => sum + item.total_physical_sheets, 0),
            expires_at: fileQuotes.reduce(
              (earliest, item) => Date.parse(item.expires_at) < Date.parse(earliest) ? item.expires_at : earliest,
              fileQuotes[0].expires_at,
            ),
            quote_hash: fileQuotes.map((item) => item.quote_hash).join(':'),
          });
          setQuoteStatus('ready');
        } catch (error) {
          if (cancelled) return;
          setQuote(null);
          setQuoteStatus('error');
          setQuoteError(error instanceof Error ? error.message : 'Could not get a price from the shop server.');
        }
      };
      void calculateServerQuote();
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [files, session.session_token, session.shop_id]);

  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  const handleFilesAdded = (newFiles: DocumentItem[]) => {
    const updated = [...files, ...newFiles];
    setFiles(updated);
    if (!activeFileId && updated.length > 0) {
      setActiveFileId(updated[0].id);
    }
    // Advance to configure step automatically
    setPrintStep(2);
  };

  const handleRemoveFile = (id: string) => {
    const updated = files.filter((f) => f.id !== id);
    setFiles(updated);
    if (activeFileId === id) {
      setActiveFileId(updated.length > 0 ? updated[0].id : '');
    }
    if (updated.length === 0) {
      setPrintStep(1);
    }
  };

  const handleReorderFiles = (fromIndex: number, toIndex: number) => {
    setFiles((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
  };

  const handleUpdateOptions = (patch: Partial<PrintOptions>) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (applyToAll || f.id === activeFile?.id) {
          return {
            ...f,
            options: { ...f.options, ...patch },
          };
        }
        return f;
      })
    );
  };

  const handlePageCountChange = useCallback((fileId: string, pageCount: number) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.id === fileId && file.pageCount !== pageCount ? { ...file, pageCount } : file
      )
    );
  }, []);

  const handlePreparePaymentOrder = async (customerDetails: {
    customerName: string;
    customerPhone: string;
    notes: string;
  }) => {
    if (quoteStatus !== 'ready' || !quote) {
      throw new Error('Wait for the shop server to confirm the order price before paying.');
    }
    if (!files.length) {
      throw new Error('Add a document before starting payment.');
    }
    const firstFile = files[0];
    const cleanPhone = customerDetails.customerPhone.replace(/[^0-9]/g, '');
    const customerEmail = cleanPhone ? `${cleanPhone}@walkin.customer.in` : 'customer@walkin.in';
    const combinedFileName = files.length === 1 ? files[0].name : `${files[0].name} + ${files.length - 1} more (${files.length} documents)`;
    const totalSizeBytes = files.reduce((acc, f) => acc + (f.sizeBytes || f.source?.size || 1024), 0);
    const createPayload: CreateOrderPayload = {
      customer_email: customerEmail,
      customer_phone: customerDetails.customerPhone || undefined,
      file_name: combinedFileName,
      file_size_bytes: totalSizeBytes,
      page_count: quote.total_logical_pages || 1,
      options: {
        copies: firstFile.options.copies || 1,
        color_mode: firstFile.options.colorMode === 'color' ? 'color' : firstFile.options.colorMode === 'grayscale' ? 'grayscale' : 'bw',
        paper_size: firstFile.options.paperSize || 'A4',
        duplex_mode: firstFile.options.duplex === 'simplex' ? 'simplex' : firstFile.options.duplex === 'duplex_short' ? 'duplex_short' : 'duplex_long',
        paper_gsm: parseInt(firstFile.options.paperGsm || '75', 10) || 75,
        binding: firstFile.options.finishing || 'none',
        page_range: firstFile.options.pageRange || 'all',
        pages_per_sheet: firstFile.options.nup || 1,
      },
    };

    if (!isApiConfigured) {
      const razorpayKeyId = (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || 'rzp_test_Ts9MJsdti9RG2c';
      if (!razorpayKeyId) {
        throw new Error('Razorpay gateway is not configured for this shop.');
      }
      return {
        provider: 'RAZORPAY' as const,
        payment_intent_id: '',
        order_id: 'PB-' + Math.floor(10000 + Math.random() * 90000),
        shop_id: session.shop_id || session.shop_slug,
        amount_paise: quote.total_paise,
        currency: 'INR',
        client_secret: razorpayKeyId,
        test_mode: false,
      };
    }

    const serverJob = await createOrder(createPayload, session.session_token, session.shop_id);
    if (typeof serverJob?.id !== 'string' || !serverJob.id) {
      throw new Error('The server did not create a print order. No payment was started.');
    }
    if (
      !Number.isSafeInteger(serverJob.total_paise) ||
      serverJob.total_paise !== quote.total_paise
    ) {
      throw new Error('The server price does not match the amount shown. No payment was started; please contact the shop to update its pricing.');
    }
    return createPaymentIntent(serverJob.id, session.session_token, session.shop_id);
  };

  const handleConfirmOrder = async (details: {
    customerName: string;
    customerPhone: string;
    notes: string;
    paymentMethod: 'upi' | 'cash';
    paymentId?: string;
    orderId?: string;
  }) => {
    if (!quote || quoteStatus !== 'ready' || files.length !== 1) {
      alert('Wait for a server price and checkout one document at a time.');
      return;
    }

    const randomPin = String(Math.floor(1000 + Math.random() * 9000));
    let assignedOrderId = details.orderId || 'PB-' + Math.floor(10000 + Math.random() * 90000);

    const firstFile = files[0];
    const cleanPhone = details.customerPhone ? details.customerPhone.replace(/[^0-9]/g, '') : '';
    const customerEmail = cleanPhone ? `${cleanPhone}@walkin.customer.in` : 'customer@walkin.in';
    const targetShopId = (session.shop_slug || session.shop_id || 'ashwin').toLowerCase();

    // Safely convert all uploaded files to base64 so desktop workstation can view & print each file
    const itemsWithData = await Promise.all(
      files.map(async (f) => {
        let b64: string | undefined = undefined;
        if (f.source && f.source.size <= 3.5 * 1024 * 1024) {
          try {
            b64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = () => resolve('');
              reader.readAsDataURL(f.source as Blob);
            });
          } catch {}
        }
        return {
          name: f.name,
          fileSize: f.sizeBytes || f.source?.size || 1024,
          page_count: f.pageCount || 1,
          pageCount: f.pageCount || 1,
          copies: f.options.copies || 1,
          color_mode: f.options.colorMode === 'color' ? 'color' : 'bw',
          colorMode: f.options.colorMode === 'color' ? 'Color' : f.options.colorMode === 'grayscale' ? 'Grayscale' : 'B&W',
          sheets: Math.ceil((f.pageCount || 1) / (f.options.duplex === 'simplex' ? 1 : 2)) * (f.options.copies || 1),
          paper_size: f.options.paperSize || 'A4',
          paperSize: f.options.paperSize || 'A4',
          duplex_mode: f.options.duplex || 'simplex',
          duplexMode: f.options.duplex || 'simplex',
          finishing: f.options.finishing || 'none',
          paper_gsm: parseInt(f.options.paperGsm || '75', 10) || 75,
          paperGsm: parseInt(f.options.paperGsm || '75', 10) || 75,
          page_range: f.options.pageRange || 'all',
          pageRange: f.options.pageRange || 'all',
          file_data: b64,
          fileData: b64,
        };
      })
    );

    const combinedFileName = files.length === 1
      ? firstFile.name
      : `${firstFile.name} + ${files.length - 1} more (${files.length} documents)`;
    const totalSizeBytes = files.reduce((acc, f) => acc + (f.sizeBytes || f.source?.size || 1024), 0);

    const orderMeta = {
      orderId: assignedOrderId,
      pickupPin: randomPin,
      shopId: targetShopId,
      shopName: session.shop_name,
      shopPhone: session.shop_phone,
      shopAddress: session.shop_address,
      customerName: details.customerName || 'Walk-in Customer',
      customerPhone: details.customerPhone || '',
      customerEmail: customerEmail,
      fileName: combinedFileName,
      fileSize: totalSizeBytes,
      fileData: itemsWithData[0]?.fileData,
      pageCount: quote.total_logical_pages,
      copies: firstFile.options.copies || 1,
      colorMode: firstFile.options.colorMode === 'color' ? 'Color' : firstFile.options.colorMode === 'grayscale' ? 'Grayscale' : 'B&W',
      paperSize: firstFile.options.paperSize || 'A4',
      duplexMode: firstFile.options.duplex,
      finishing: firstFile.options.finishing || 'none',
      paperGsm: parseInt(firstFile.options.paperGsm || '75', 10) || 75,
      totalRupees: quote.total_rupees,
      totalSheets: quote.total_physical_sheets,
      totalLogicalPages: quote.total_logical_pages,
      paymentMethod: details.paymentMethod,
      paymentStatus: details.paymentId ? 'paid' : details.paymentMethod === 'upi' ? 'pending_verification' : 'pending_cash',
      paymentId: details.paymentId || null,
      notes: details.notes || '',
      status: 'PENDING_APPROVAL',
      placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      items: itemsWithData,
    };

    // Create the API job before writing the shared order row so both systems use the same ID.
    const createPayload: CreateOrderPayload = {
      customer_email: customerEmail,
      customer_phone: details.customerPhone || undefined,
      file_name: combinedFileName,
      file_size_bytes: totalSizeBytes,
      page_count: quote.total_logical_pages,
      options: {
        copies: firstFile.options.copies || 1,
        color_mode: firstFile.options.colorMode === 'color' ? 'color' : firstFile.options.colorMode === 'grayscale' ? 'grayscale' : 'bw',
        paper_size: firstFile.options.paperSize || 'A4',
        duplex_mode: firstFile.options.duplex === 'simplex' ? 'simplex' : firstFile.options.duplex === 'duplex_short' ? 'duplex_short' : 'duplex_long',
        paper_gsm: parseInt(firstFile.options.paperGsm || '75', 10) || 75,
        binding: firstFile.options.finishing || 'none',
        page_range: firstFile.options.pageRange || 'all',
        pages_per_sheet: firstFile.options.nup || 1,
      },
    };

    if (isApiConfigured && !details.orderId) {
      try {
        const serverJob = await createOrder(createPayload, session.session_token, session.shop_id);
        if (serverJob && serverJob.id) {
          assignedOrderId = serverJob.id;
        }
      } catch (apiError) {
        console.error('Configured Print Bot API order sync failed; the Supabase order record remains available.', apiError);
      }
    }
    orderMeta.orderId = assignedOrderId;

    // The workstation and customer tracker both use this row as the live order record.
    try {
      const orderRecord = {
        id: assignedOrderId,
        shop_name: targetShopId,
        city: combinedFileName,
        contact_number: details.customerPhone || '',
        plan: 'ORDER',
        status: 'ORDER_PENDING',
        generated_username: targetShopId,
        generated_key: randomPin,
        applied_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
        notes: JSON.stringify(orderMeta),
      };
      const { error: sbInsertErr } = await supabase.from('pilot_applications').insert(orderRecord);
      if (sbInsertErr) {
        console.warn('Supabase order insertion warning:', sbInsertErr);
      }
    } catch (sbEx) {
      console.warn('Supabase order submission exception:', sbEx);
    }

    const newOrder: PlacedOrder = {
      orderId: assignedOrderId,
      pickupPin: randomPin,
      shopId: session.shop_id,
      shopName: session.shop_name,
      shopPhone: session.shop_phone,
      shopAddress: session.shop_address,
      totalRupees: quote.total_rupees,
      totalSheets: quote.total_physical_sheets,
      totalLogicalPages: quote.total_logical_pages,
      paymentMethod: details.paymentMethod,
      paymentStatus: details.paymentId ? 'paid' : details.paymentMethod === 'upi' ? 'pending_verification' : 'pending_cash',
      paymentId: details.paymentId,
      status: details.paymentMethod === 'upi' && !details.paymentId ? 'PENDING_PAYMENT' : 'ORDER_RECEIVED',
      placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      items: itemsWithData,
      qrToken: 'printbot_token_' + assignedOrderId,
    };

    saveOrderToStorage(newOrder);
    setOrders((prev) => [newOrder, ...prev]);
    setActiveOrder(newOrder);
    setActiveView('tracking');
    setFiles([]);
    setActiveFileId('');
    setPrintStep(1);

    // Live Supabase subscription + fallback polling for order status changes
    const mapLiveStatusToClient = (rawStatus: string): PlacedOrder['status'] | null => {
      const s = rawStatus.toUpperCase();
      if (s === 'ORDER_QUEUED' || s === 'QUEUED' || s === 'SPOOL_SUBMITTED' || s === 'LEASED' || s === 'SPOOLING') return 'SPOOLING';
      if (s === 'ORDER_PRINTING' || s === 'PRINTING') return 'PRINTING';
      if (s === 'ORDER_COMPLETED' || s === 'COMPLETED' || s === 'READY_FOR_PICKUP' || s === 'COLLECTED') return 'READY_FOR_PICKUP';
      if (s === 'ORDER_REJECTED' || s === 'REJECTED') return 'CANCELLED';
      if (s === 'ORDER_PENDING' || s === 'PENDING' || s === 'PENDING_APPROVAL' || s === 'ORDER_RECEIVED') return 'ORDER_RECEIVED';
      return null;
    };

    const statusChannel = supabase
      .channel(`order_track_${assignedOrderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pilot_applications', filter: `id=eq.${assignedOrderId}` },
        (payload: any) => {
          const newStatus = payload.new?.status;
          if (newStatus) {
            const mapped = mapLiveStatusToClient(newStatus);
            if (mapped) {
              updateStoredOrderStatus(newOrder.shopId, assignedOrderId, mapped);
              setActiveOrder((curr) => (
                curr && curr.orderId === assignedOrderId
                  ? {
                      ...curr,
                      status: mapped,
                      paymentStatus:
                        newOrder.paymentMethod === 'upi' && ['SPOOLING', 'PRINTING', 'READY_FOR_PICKUP'].includes(mapped)
                          ? 'paid'
                          : curr.paymentStatus,
                    }
                  : curr
              ));
            }
          }
        }
      )
      .subscribe();

    const syncCurrentStatus = async () => {
      try {
        const { data: liveRow, error } = await supabase
          .from('pilot_applications')
          .select('status')
          .eq('id', assignedOrderId)
          .maybeSingle();

        if (error) {
          console.warn('Unable to refresh live order status; polling will continue.', error);
          return;
        }

        if (liveRow && liveRow.status) {
          const mapped = mapLiveStatusToClient(liveRow.status);
          if (mapped) {
            updateStoredOrderStatus(newOrder.shopId, assignedOrderId, mapped);
            setActiveOrder((curr) => (
              curr && curr.orderId === assignedOrderId
                ? {
                    ...curr,
                    status: mapped,
                    paymentStatus:
                      newOrder.paymentMethod === 'upi' && ['SPOOLING', 'PRINTING', 'READY_FOR_PICKUP'].includes(mapped)
                        ? 'paid'
                        : curr.paymentStatus,
                  }
                : curr
            ));
            if (mapped === 'READY_FOR_PICKUP' || mapped === 'CANCELLED') {
              clearInterval(pollInterval);
              supabase.removeChannel(statusChannel);
            }
          }
        }
      } catch (error) {
        console.warn('Unable to refresh live order status; polling will continue.', error);
      }
    };
    const pollInterval = setInterval(syncCurrentStatus, 3000);
    void syncCurrentStatus();

    setTimeout(() => {
      clearInterval(pollInterval);
      supabase.removeChannel(statusChannel);
    }, 600000);
  };

  const unlockingFile = files.find((f) => f.id === unlockingFileId);

  if (isResolvingShop) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          background: '#f8fafc',
          color: '#64748b',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            width: '34px',
            height: '34px',
            border: '3px solid #e2e8f0',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'pbSpin 0.75s linear infinite',
          }}
        />
        <span style={{ fontSize: '13.5px', fontWeight: 650, color: '#334155' }}>
          Verifying Active Shop Station...
        </span>
        <style>{`@keyframes pbSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="pb-app-shell">
      {/* Top Header */}
      <Header
        session={session}
        lang={lang}
        onLanguageChange={setLang}
        activeView={activeView}
        onNavigate={setActiveView}
        cartCount={files.length}
        t={t}
      />

      <main className="pb-main-content" id="main-content">
        <div className="pb-container">
          {/* Global Shop Rates Banner (Visible across all steps) */}
          {session.rates && (
            <div style={{ paddingTop: '14px' }}>
              <ShopRatesGrid rates={session.rates} t={t} shopName={session.shop_name} />
            </div>
          )}

          {/* VIEW: HOME / LANDING */}
          {activeView === 'home' && (
            <>
              {/* Hero Banner */}
              <section className="pb-hero-banner">
                <div className="pb-hero-card">
                  <div className="pb-hero-bg-decor" />
                  <div className="pb-hero-badge">
                    <Sparkles size={14} color="#60a5fa" />
                    <span>{session.shop_name}</span>
                  </div>
                  <h1 className="pb-hero-headline">{t.heroTitle}</h1>
                  <p className="pb-hero-lead">{t.heroSubtitle}</p>

                  <div className="pb-hero-actions">
                    <button
                      type="button"
                      className="pb-btn-primary"
                      onClick={() => {
                        setActiveView('print');
                        setPrintStep(1);
                      }}
                    >
                      <Upload size={18} />
                      <span>{t.startPrintingCta}</span>
                    </button>
                  </div>

                  <div className="pb-hero-features-bar">
                    <div className="pb-hero-feature-pill">
                      <ShieldCheck size={16} color="#34d399" />
                      <span>{t.noAppNeeded}</span>
                    </div>
                    <div className="pb-hero-feature-pill">
                      <CheckCircle2 size={16} color="#34d399" />
                      <span>{t.privacyAssured}</span>
                    </div>
                    <div className="pb-hero-feature-pill">
                      <Printer size={16} color="#34d399" />
                      <span>Direct Counter Spooler</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Service Discovery Catalog */}
              <ServiceCatalog
                t={t}
                rates={session.rates}
                services={session.services}
                onSelectService={(serviceKey, targetView) => {
                  setActiveView(targetView);
                  if (serviceKey === 'photo_print') {
                    // Preselect photo preset if user uploads
                    handleUpdateOptions({ photoPreset: 'passport_8up' });
                  } else if (serviceKey === 'binding_thesis') {
                    handleUpdateOptions({ finishing: 'spiral' });
                  }
                }}
              />

              {/* Quick Upload Dropzone directly on Home */}
              <div style={{ marginTop: '20px', marginBottom: '32px' }}>
                <div className="pb-section-header">
                  <h2 className="pb-section-title">{t.uploadTitle}</h2>
                  <p className="pb-section-subtitle">
                    Drop your PDF or image here for instant page count detection and quotes.
                  </p>
                </div>

                <FileUploadZone
                  files={files}
                  activeFileId={activeFileId}
                  onSetActiveFileId={setActiveFileId}
                  onFilesAdded={(newOnes) => {
                    handleFilesAdded(newOnes);
                    setActiveView('print');
                  }}
                  onRemoveFile={handleRemoveFile}
                  onReorderFiles={handleReorderFiles}
                  onClearAll={() => setFiles([])}
                  onPromptPasswordUnlock={setUnlockingFileId}
                  t={t}
                />
              </div>
            </>
          )}

          {/* VIEW: PRINT WIZARD (Upload -> Configure -> Review) */}
          {activeView === 'print' && (
            <div style={{ padding: '16px 0' }}>
              {/* Stepper */}
              <div className="pb-wizard-stepper">
                <button
                  type="button"
                  className={`pb-step-node ${printStep === 1 ? 'active' : printStep > 1 ? 'completed' : ''}`}
                  onClick={() => setPrintStep(1)}
                >
                  <span className="pb-step-number">1</span>
                  <span>{t.step1}</span>
                </button>
                <div className="pb-step-divider" />

                <button
                  type="button"
                  className={`pb-step-node ${printStep === 2 ? 'active' : printStep > 2 ? 'completed' : ''}`}
                  disabled={files.length === 0}
                  onClick={() => setPrintStep(2)}
                >
                  <span className="pb-step-number">2</span>
                  <span>{t.step2}</span>
                </button>
                <div className="pb-step-divider" />

                <button
                  type="button"
                  className={`pb-step-node ${printStep === 3 ? 'active' : ''}`}
                  disabled={files.length === 0}
                  onClick={() => setActiveView('checkout')}
                >
                  <span className="pb-step-number">3</span>
                  <span>{t.step3}</span>
                </button>
              </div>

              {/* Step 1: Upload */}
              {printStep === 1 && (
                <div>
                  <div className="pb-section-header">
                    <h2 className="pb-section-title">{t.uploadTitle}</h2>
                    <p className="pb-section-subtitle">{t.uploadFormats}</p>
                  </div>

                  <FileUploadZone
                    files={files}
                    activeFileId={activeFileId}
                    onSetActiveFileId={setActiveFileId}
                    onFilesAdded={handleFilesAdded}
                    onRemoveFile={handleRemoveFile}
                    onReorderFiles={handleReorderFiles}
                    onClearAll={() => setFiles([])}
                    onPromptPasswordUnlock={setUnlockingFileId}
                    t={t}
                  />

                  {files.length > 0 && (
                    <div style={{ marginTop: '24px', textAlign: 'right' }}>
                      <button
                        type="button"
                        className="pb-btn-primary"
                        onClick={() => setPrintStep(2)}
                      >
                        <span>{t.configTitle}</span>
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Configure & Live Quote */}
              {printStep === 2 && activeFile && (
                <div>
                  <div className="pb-section-header">
                    <h2 className="pb-section-title">{t.configTitle}</h2>
                    <p className="pb-section-subtitle">
                      Fine-tune color mode, sides, copies, and page range for each document.
                    </p>
                  </div>

                  <div className="pb-config-panel">
                    <DocumentConfigurator
                      files={files}
                      activeFile={activeFile}
                      onSetActiveFile={setActiveFileId}
                      applyToAll={applyToAll}
                      onToggleApplyToAll={setApplyAll}
                      onUpdateOptions={handleUpdateOptions}
                      t={t}
                      rates={session.rates}
                    />

                    <DocumentPreview
                      file={activeFile}
                      onPageCountChange={handlePageCountChange}
                      onPromptPasswordUnlock={setUnlockingFileId}
                    />

                    <LivePriceBreakdown
                      quote={quote}
                      quoteStatus={quoteStatus}
                      quoteError={quoteError}
                      fileCount={files.length}
                      onProceed={() => setActiveView('checkout')}
                      t={t}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: SERVICES */}
          {activeView === 'services' && (
            <div style={{ padding: '16px 0' }}>
              <ServiceCatalog
                t={t}
                rates={session.rates}
                services={session.services}
                onSelectService={(serviceKey, targetView) => {
                  setActiveView(targetView);
                }}
              />
            </div>
          )}

          {/* VIEW: CART */}
          {activeView === 'cart' && (
            <CartView
              files={files}
              quote={quote}
              quoteStatus={quoteStatus}
              quoteError={quoteError}
              onRemoveFile={handleRemoveFile}
              onClearCart={() => setFiles([])}
              onAddMoreFiles={() => {
                setActiveView('print');
                setPrintStep(1);
              }}
              onProceedToCheckout={() => setActiveView('checkout')}
              t={t}
            />
          )}

          {/* VIEW: CHECKOUT */}
          {activeView === 'checkout' && (
            <CheckoutView
              files={files}
              quote={quote}
              quoteStatus={quoteStatus}
              quoteError={quoteError}
              session={session}
              onPreparePaymentOrder={handlePreparePaymentOrder}
              onConfirmOrder={handleConfirmOrder}
              onBack={() => {
                setActiveView('print');
                setPrintStep(2);
              }}
              t={t}
            />
          )}

          {/* VIEW: TRACKING */}
          {activeView === 'tracking' && activeOrder && (
            <OrderTracker
              order={activeOrder}
              onPrintAnother={() => {
                setActiveView('print');
                setPrintStep(1);
              }}
              t={t}
            />
          )}

          {/* VIEW: CUSTOMER DASHBOARD & ORDERS */}
          {activeView === 'dashboard' && (
            <CustomerDashboard
              orders={orders}
              session={session}
              onSelectOrder={(ord) => {
                setActiveOrder(ord);
                setActiveView('tracking');
              }}
              onStartNewPrint={() => {
                setActiveView('print');
                setPrintStep(1);
              }}
              t={t}
            />
          )}
        </div>
      </main>

      {/* Password Unlock Modal */}
      {unlockingFile && (
        <PasswordUnlockModal
          isOpen={!!unlockingFileId}
          onClose={() => setUnlockingFileId(null)}
          fileName={unlockingFile.name}
          onUnlock={(pwd) => {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === unlockingFile.id
                  ? { ...f, isPasswordProtected: false, unlockedPassword: pwd }
                  : f
              )
            );
          }}
          t={t}
        />
      )}

      {/* Floating Action Bar (Sticky on Mobile when configuring) */}
      {files.length > 0 && activeView === 'print' && printStep === 2 && quote && (
        <aside className="pb-floating-action-bar" aria-label="Order quick action">
          <div className="pb-action-bar-summary">
            <span className="pb-action-bar-amount">₹{quote.total_rupees.toFixed(2)}</span>
            <span className="pb-action-bar-sheets">
              {quote.total_physical_sheets} {quote.total_physical_sheets === 1 ? 'sheet' : 'sheets'} ·{' '}
              {quote.total_logical_pages} pages
            </span>
          </div>

          <div className="pb-action-bar-btns">
            <button
              type="button"
              className="pb-btn-primary"
              style={{ minHeight: '44px', padding: '8px 18px' }}
              onClick={() => setActiveView('checkout')}
            >
              <span>{t.step3}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </aside>
      )}

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeView={activeView}
        onNavigate={(v) => {
          setActiveView(v);
          if (v === 'print' && files.length === 0) {
            setPrintStep(1);
          }
        }}
        cartCount={files.length}
        t={t}
      />
    </div>
  );
}
