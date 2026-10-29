import React, { useState, useMemo, useEffect } from 'react';
import { getInstallerConfig } from './utils/installer';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { TheProblem } from './components/TheProblem';
import { Intro } from './components/Intro';
import { HowItWorks } from './components/HowItWorks';
import { Features } from './components/Features';
import { Pricing } from './components/Pricing';
import { DownloadSection } from './components/DownloadSection';
import { Requirements } from './components/Requirements';
import { Faq } from './components/Faq';
import { CtaSection } from './components/CtaSection';
import { Footer } from './components/Footer';
import { PilotModal } from './components/PilotModal';
import { CustomerShopPortal } from './components/CustomerShopPortal';

export const App: React.FC = () => {
  const [shopId, setShopId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const qShop = params.get('shop') || params.get('qr');
    if (qShop) return qShop.trim().toLowerCase();

    const host = window.location.hostname.toLowerCase();
    const mainDomain = 'printbotak.vercel.app';
    if (host.endsWith(mainDomain) && host !== mainDomain && host !== `www.${mainDomain}`) {
      const sub = host.replace(`.${mainDomain}`, '');
      if (sub && sub !== 'www') return sub;
    }
    return null;
  });

  const installerConfig = useMemo(() => getInstallerConfig(), []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'request_pilot' | 'installer_info'>('request_pilot');
  const [preselectedPlan, setPreselectedPlan] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Staggered reveal observer for sections and cards
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -20px 0px',
      }
    );

    const revealElements = document.querySelectorAll('[data-reveal]');
    revealElements.forEach((el, index) => {
      (el as HTMLElement).style.transitionDelay = `${(index % 4) * 60}ms`;
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleDownloadClick = () => {
    if (installerConfig.status === 'available' && installerConfig.url) {
      window.location.assign(installerConfig.url);
    } else {
      setModalTab('installer_info');
      setIsModalOpen(true);
    }
  };

  const handleRequestAccessClick = (planName?: string) => {
    setModalTab('request_pilot');
    setPreselectedPlan(planName);
    setIsModalOpen(true);
  };

  if (shopId) {
    return (
      <CustomerShopPortal
        shopId={shopId}
        onBackToHome={() => {
          window.history.replaceState({}, '', '/');
          setShopId(null);
        }}
      />
    );
  }

  return (
    <div className="page-root">
      <Navbar
        installerConfig={installerConfig}
        onDownloadClick={handleDownloadClick}
        onRequestAccessClick={() => handleRequestAccessClick()}
      />

      <main id="main-content">
        <Hero
          installerConfig={installerConfig}
          onDownloadClick={handleDownloadClick}
          onRequestAccessClick={() => handleRequestAccessClick()}
        />

        <TheProblem />

        <Intro />

        <HowItWorks />

        <Features />

        <Pricing
          onRequestPilot={(plan) => handleRequestAccessClick(plan)}
        />

        <DownloadSection
          installerConfig={installerConfig}
          onDownloadClick={handleDownloadClick}
        />

        <Requirements />

        <Faq />

        <CtaSection
          installerConfig={installerConfig}
          onDownloadClick={handleDownloadClick}
          onRequestAccessClick={() => handleRequestAccessClick()}
        />
      </main>

      <Footer
        onRequestAccessClick={() => handleRequestAccessClick()}
      />

      <PilotModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        installerConfig={installerConfig}
        initialTab={modalTab}
        preselectedPlan={preselectedPlan}
      />
    </div>
  );
};

export default App;
