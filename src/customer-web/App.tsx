import React, { useState, useEffect, useMemo } from 'react';
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
  TimedBooking,
} from './types';
import { getTranslation } from './locales';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { ServiceCatalog } from './components/services/ServiceCatalog';
import { FileUploadZone } from './components/print/FileUploadZone';
import { DocumentConfigurator } from './components/print/DocumentConfigurator';
import { LivePriceBreakdown } from './components/print/LivePriceBreakdown';
import { CartView } from './components/cart/CartView';
import { CheckoutView } from './components/checkout/CheckoutView';
import { OrderTracker } from './components/tracking/OrderTracker';
import { CustomerDashboard } from './components/dashboard/CustomerDashboard';
import { TimedBookingView } from './components/timed/TimedBookingView';
import { PasswordUnlockModal } from './components/common/PasswordUnlockModal';
import { calculateDocumentQuote } from './utils/pricing';
import {
  getStoredTheme,
  setStoredTheme,
  getStoredLanguage,
  setStoredLanguage,
  loadStoredOrders,
  saveOrderToStorage,
  updateStoredOrderStatus,
} from './utils/storage';
import { openShopSession, scanFile } from './api';
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
  const [theme, setTheme] = useState<'light' | 'dark'>(getStoredTheme);
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [printStep, setPrintStep] = useState<number>(1);
  const [files, setFiles] = useState<DocumentItem[]>([]);
  const [activeFileId, setActiveFileId] = useState<string>('');
  const [applyToAll, setApplyAll] = useState<boolean>(true);

  // Dynamically resolve shop slug from props, subdomain, query, or path route
  const resolvedSlug = useMemo(() => initialShopId?.trim().toLowerCase() || resolveShopSlugFromUrl(), [initialShopId]);
  const [session, setSession] = useState<ShopSession>(() => {
    if (resolvedSlug) {
      const clean = resolvedSlug.toLowerCase();
      const fallbackTitle =
        clean.charAt(0).toUpperCase() + clean.slice(1) + ' Print & Xerox Stand';
      return {
        ...defaultShopSession,
        shop_id: clean,
        shop_slug: clean,
        shop_name: fallbackTitle,
      };
    }
    return defaultShopSession;
  });
  const [orders, setOrders] = useState<PlacedOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<PlacedOrder | null>(null);
  const [unlockingFileId, setUnlockingFileId] = useState<string | null>(null);

  const t = getTranslation(lang);

  // Sync theme to root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    setStoredTheme(theme);
  }, [theme]);

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
      setSession(profile);
      document.title = `${profile.shop_name} • Touchless Print Counter`;
    });

    unsubRealtime = subscribeToShopRealtime(resolvedSlug, (updated) => {
      setSession((prev) => ({
        ...prev,
        ...updated,
        rates: updated.rates ? { ...prev.rates, ...updated.rates } : prev.rates,
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

  // Compute live quote based on files & shop's customized pricing rates
  const quote = useMemo(() => {
    if (files.length === 0) return null;
    return calculateDocumentQuote(files, session.rates);
  }, [files, session.rates]);

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

  const handleConfirmOrder = (details: {
    customerName: string;
    customerPhone: string;
    notes: string;
    paymentMethod: 'upi' | 'cash';
  }) => {
    if (!quote || files.length === 0) return;

    const randomPin = String(Math.floor(1000 + Math.random() * 9000));
    const randomOrderId = 'PB-' + Math.floor(10000 + Math.random() * 90000);

    const newOrder: PlacedOrder = {
      orderId: randomOrderId,
      pickupPin: randomPin,
      shopId: session.shop_id,
      shopName: session.shop_name,
      shopPhone: session.shop_phone,
      shopAddress: session.shop_address,
      totalRupees: quote.total_rupees,
      totalSheets: quote.total_physical_sheets,
      totalLogicalPages: quote.total_logical_pages,
      paymentMethod: details.paymentMethod,
      paymentStatus: details.paymentMethod === 'upi' ? 'paid' : 'pending_cash',
      status: 'ORDER_RECEIVED',
      placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      items: files.map((f) => ({
        name: f.name,
        copies: f.options.copies,
        colorMode: f.options.colorMode === 'color' ? 'Color' : f.options.colorMode === 'grayscale' ? 'Grayscale' : 'B&W',
        sheets: Math.ceil((f.pageCount || 1) / (f.options.duplex === 'simplex' ? 1 : 2)) * f.options.copies,
        paperSize: f.options.paperSize,
        finishing: f.options.finishing,
      })),
      qrToken: 'printbot_token_' + randomOrderId,
    };

    saveOrderToStorage(newOrder);
    setOrders((prev) => [newOrder, ...prev]);
    setActiveOrder(newOrder);
    setActiveView('tracking');
    setFiles([]);
    setActiveFileId('');
    setPrintStep(1);

    // Simulate printer workstation state progression
    setTimeout(() => {
      updateStoredOrderStatus(newOrder.shopId, newOrder.orderId, 'SPOOLING');
      setActiveOrder((curr) => (curr ? { ...curr, status: 'SPOOLING' } : curr));
    }, 4000);

    setTimeout(() => {
      updateStoredOrderStatus(newOrder.shopId, newOrder.orderId, 'PRINTING');
      setActiveOrder((curr) => (curr ? { ...curr, status: 'PRINTING' } : curr));
    }, 8000);

    setTimeout(() => {
      updateStoredOrderStatus(newOrder.shopId, newOrder.orderId, 'READY_FOR_PICKUP');
      setActiveOrder((curr) => (curr ? { ...curr, status: 'READY_FOR_PICKUP' } : curr));
    }, 14000);
  };

  const handleTimedBooking = (booking: TimedBooking) => {
    const randomOrderId = 'TB-' + Math.floor(10000 + Math.random() * 90000);
    const newOrder: PlacedOrder = {
      orderId: randomOrderId,
      pickupPin: booking.bookingCode.replace('TX-', ''),
      shopId: session.shop_id,
      shopName: session.shop_name,
      totalRupees: 0,
      totalSheets: booking.estimatedPages,
      totalLogicalPages: booking.estimatedPages,
      paymentMethod: 'cash',
      paymentStatus: 'pending_cash',
      status: 'ORDER_RECEIVED',
      placedAt: `${booking.slotDate} at ${booking.slotTime}`,
      items: [
        {
          name: `Timed Slot: ${booking.serviceType.replace('_', ' ').toUpperCase()}`,
          copies: 1,
          colorMode: 'Flexible',
          sheets: booking.estimatedPages,
          paperSize: 'A4',
          finishing: 'None',
        },
      ],
      qrToken: booking.bookingCode,
      timedBooking: booking,
    };

    saveOrderToStorage(newOrder);
    setOrders((prev) => [newOrder, ...prev]);
  };

  const unlockingFile = files.find((f) => f.id === unlockingFileId);

  return (
    <div className="pb-app-shell">
      {/* Top Header */}
      <Header
        session={session}
        lang={lang}
        onLanguageChange={setLang}
        theme={theme}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        activeView={activeView}
        onNavigate={setActiveView}
        cartCount={files.length}
        t={t}
      />

      <main className="pb-main-content" id="main-content">
        <div className="pb-container">
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
                    <button
                      type="button"
                      className="pb-btn-secondary"
                      onClick={() => setActiveView('timed_booking')}
                    >
                      <Clock size={18} />
                      <span>{t.navBookSlot}</span>
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
                    />

                    <LivePriceBreakdown
                      quote={quote}
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
                onSelectService={(serviceKey, targetView) => {
                  setActiveView(targetView);
                }}
              />
            </div>
          )}

          {/* VIEW: TIMED BOOKING */}
          {activeView === 'timed_booking' && (
            <TimedBookingView
              session={session}
              onBookingConfirmed={handleTimedBooking}
              t={t}
            />
          )}

          {/* VIEW: CART */}
          {activeView === 'cart' && (
            <CartView
              files={files}
              quote={quote}
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
              session={session}
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
