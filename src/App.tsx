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
import { ArrowLeft, Home, Download, RefreshCw } from 'lucide-react';
import { DOWNLOAD_CONFIG, triggerInstallerDownload } from './config/download';
import './website.css';

const CustomerWebApp = lazy(() => import('./customer-web/App'));

export const App: React.FC = () => {
  // Normalize current path from window.location
  const [currentPath, setCurrentPath] = useState<string>(() => {
    // If QR parameter exists in query, start in customer mode
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('qr')) {
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
      if (searchParams.has('qr')) {
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

  // If in Customer Mode (e.g. /customer or ?qr=...)
  if (currentPath === '/customer' || currentPath.startsWith('/customer/')) {
    const shopSlug = resolveShopSlugFromUrl() || 'test1';
    return (
      <div className="min-h-screen bg-[#090B0F] text-slate-100 flex flex-col">
        {/* Top return bar */}
        <div className="bg-[#0E131F] border-b border-white/[0.1] px-4 py-2 flex items-center justify-between text-xs">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Print Bot Official Site</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Shop Counter Preview: <strong>{shopSlug}</strong></span>
            <button
              onClick={() => {
                triggerInstallerDownload();
                setDownloadModalOpen(true);
              }}
              className="px-2.5 py-1 bg-brand-blue hover:bg-blue-600 text-white rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Get Windows Workstation</span>
            </button>
          </div>
        </div>

        {/* Customer Web Application */}
        <div className="flex-1">
          <Suspense
            fallback={
              <div className="min-h-[500px] flex flex-col items-center justify-center gap-3 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-brand-400" />
                <span className="text-sm font-medium">Initializing Customer Upload Portal...</span>
              </div>
            }
          >
            <CustomerWebApp initialShopId={shopSlug} />
          </Suspense>
        </div>

        <DownloadModal 
          isOpen={downloadModalOpen} 
          onClose={() => setDownloadModalOpen(false)} 
        />
      </div>
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
