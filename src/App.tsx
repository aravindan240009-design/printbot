import React, { useState, useEffect, useLayoutEffect, useRef, Suspense, lazy } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { DownloadModal } from './components/DownloadModal';
import { HomePage } from './pages/HomePage';
import { FeaturesPage } from './pages/FeaturesPage';
import { DownloadPage } from './pages/DownloadPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { BecomePartnerPage } from './pages/BecomePartnerPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';
import { resolveShopSlugFromUrl } from './customer-web/utils/tenant';
import { RefreshCw } from 'lucide-react';
import { useScrollReveal } from './hooks/useScrollReveal';
import './website.css';

const CustomerWebApp = lazy(() => import('./customer-web/App'));

export const App: React.FC = () => {
  // Normalize current path from window.location
  const [currentPath, setCurrentPath] = useState<string>(() => {
    // If QR parameter exists in query, start in customer mode
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('qr') || searchParams.has('shop')) {
      return '/customer';
    }
    const path = window.location.pathname;
    return path || '/';
  });

  const [downloadModalOpen, setDownloadModalOpen] = useState(false);

  // Sync with browser back/forward history
  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has('qr') || searchParams.has('shop')) {
        setCurrentPath('/customer');
        return;
      }
      setCurrentPath(window.location.pathname || '/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentPath]);

  const navigate = (path: string) => {
    setCurrentPath(path);
    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // URL Path & Shop Resolution:
  // Detects if the user is accessing a shop customer portal via URL path (e.g. /testcase, /shop/testcase)
  // or query parameter (?shop=testcase, ?qr=testcase)
  const detectedShopSlug = resolveShopSlugFromUrl();
  const isCustomerExplicitPath = 
    currentPath === '/customer' || 
    currentPath.startsWith('/customer/') || 
    currentPath.startsWith('/shop/') ||
    currentPath.startsWith('/s/');

  const shouldRenderCustomerWeb = Boolean(detectedShopSlug) || isCustomerExplicitPath;
  const activeShopSlug = detectedShopSlug || '';
  const mainRef = useRef<HTMLElement>(null);
  const enablePageReveals = !shouldRenderCustomerWeb && currentPath !== '/';
  useScrollReveal(mainRef, currentPath, enablePageReveals, enablePageReveals);

  // Synchronize document title and theme when switching between customer portal and commercial site
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.style.colorScheme = 'light';
    document.documentElement.style.backgroundColor = shouldRenderCustomerWeb ? '#f8fafc' : '#ffffff';
    document.body.style.backgroundColor = shouldRenderCustomerWeb ? '#f8fafc' : '#ffffff';
    document.body.style.color = '#111827';
    if (!shouldRenderCustomerWeb) {
      document.title = 'Print Bot — Desktop Printing and Shop Manager for Windows';
    }
  }, [shouldRenderCustomerWeb]);

  if (import.meta.env.VITE_PRINTBOT_TEST_MODE === 'true') {
    return (
      <Suspense fallback={<div role="status">Loading isolated test checkout…</div>}>
        <CustomerWebApp
          initialShopId={String(import.meta.env.VITE_PRINTBOT_TEST_SHOP_SLUG || 'test-print-shop')}
        />
      </Suspense>
    );
  }

  // Render Customer Web Platform if visiting a shop URL path or customer path
  if (shouldRenderCustomerWeb) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-sm font-medium">Initializing Customer Upload Portal...</span>
          </div>
        }
      >
        <CustomerWebApp initialShopId={activeShopSlug} onBackToHome={() => navigate('/')} />
      </Suspense>
    );
  }

  // Render Official Commercial Website
  return (
    <div className="marketing-site min-h-screen flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Sticky Glass Navbar */}
      <Navbar 
        currentPath={currentPath} 
        navigate={navigate} 
        onOpenDownloadModal={() => setDownloadModalOpen(true)}
      />

      {/* Main Page Content */}
      <main ref={mainRef} className="flex-1">
        {currentPath === '/' && (
          <HomePage 
            navigate={navigate} 
            onOpenDownloadModal={() => setDownloadModalOpen(true)} 
          />
        )}
        {currentPath === '/features' && (
          <FeaturesPage 
            navigate={navigate} 
            onOpenDownloadModal={() => setDownloadModalOpen(true)} 
          />
        )}
        {currentPath === '/download' && <DownloadPage />}
        {currentPath === '/about' && (
          <AboutPage 
            navigate={navigate} 
            onOpenDownloadModal={() => setDownloadModalOpen(true)} 
          />
        )}
        {(currentPath === '/partner' || currentPath === '/become-a-partner') && (
          <BecomePartnerPage 
            navigate={navigate}
            onOpenDownloadModal={() => setDownloadModalOpen(true)}
          />
        )}
        {currentPath === '/contact' && (
          <ContactPage navigate={navigate} />
        )}
        {currentPath === '/privacy' && (
          <PrivacyPolicyPage />
        )}
        {currentPath === '/terms' && (
          <TermsPage />
        )}
      </main>

      {/* Global Comprehensive Footer */}
      <Footer 
        navigate={navigate}
      />

      {/* Download Modal Triggered across all pages */}
      <DownloadModal 
        isOpen={downloadModalOpen} 
        onClose={() => setDownloadModalOpen(false)} 
      />
    </div>
  );
};

export default App;
