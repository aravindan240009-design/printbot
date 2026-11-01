import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { DownloadModal } from './components/DownloadModal';
import { HomePage } from './pages/HomePage';
import { FeaturesPage } from './pages/FeaturesPage';
import { DownloadPage } from './pages/DownloadPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';
import { resolveShopSlugFromUrl } from './customer-web/utils/tenant';
import { RefreshCw } from 'lucide-react';
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
    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has('qr') || searchParams.has('shop')) {
        setCurrentPath('/customer');
        return;
      }
      setCurrentPath(window.location.pathname || '/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    setCurrentPath(path);
    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
  const activeShopSlug = detectedShopSlug || 'testcase';

  // Synchronize document title when on official commercial site
  useEffect(() => {
    if (!shouldRenderCustomerWeb) {
      document.title = 'Print Bot — Desktop Printing and Shop Manager for Windows';
    }
  }, [shouldRenderCustomerWeb]);

  // Render Customer Web Platform if visiting a shop URL path or customer path
  if (shouldRenderCustomerWeb) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#090B0F] flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-brand-400" />
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
    <div className="min-h-screen bg-[#090B0F] text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Sticky Glass Navbar */}
      <Navbar 
        currentPath={currentPath} 
        navigate={navigate} 
        onOpenDownloadModal={() => setDownloadModalOpen(true)}
      />

      {/* Main Page Content */}
      <main className="flex-1">
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
        {currentPath === '/download' && (
          <DownloadPage 
            onOpenDownloadModal={() => setDownloadModalOpen(true)} 
          />
        )}
        {currentPath === '/about' && (
          <AboutPage 
            navigate={navigate} 
            onOpenDownloadModal={() => setDownloadModalOpen(true)} 
          />
        )}
        {currentPath === '/contact' && (
          <ContactPage />
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
        onOpenDownloadModal={() => setDownloadModalOpen(true)}
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
