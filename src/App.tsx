import React, { useState, useMemo, useEffect } from 'react';
import { getInstallerConfig } from './utils/installer';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Intro } from './components/Intro';
import { HowItWorks } from './components/HowItWorks';
import { Features } from './components/Features';
import { DownloadSection } from './components/DownloadSection';
import { Requirements } from './components/Requirements';
import { Faq } from './components/Faq';
import { CtaSection } from './components/CtaSection';
import { Footer } from './components/Footer';
import { InstallerModal } from './components/InstallerModal';

export const App: React.FC = () => {
  const installerConfig = useMemo(() => getInstallerConfig(), []);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      // Set slight stagger delay for smooth cascading
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
      setIsModalOpen(true);
    }
  };

  return (
    <div className="page-root">
      <Navbar
        installerConfig={installerConfig}
        onDownloadClick={handleDownloadClick}
      />

      <main id="main-content">
        <Hero
          installerConfig={installerConfig}
          onDownloadClick={handleDownloadClick}
        />

        <Intro />

        <HowItWorks />

        <Features />

        <DownloadSection
          installerConfig={installerConfig}
          onDownloadClick={handleDownloadClick}
        />

        <Requirements />

        <Faq />

        <CtaSection
          installerConfig={installerConfig}
          onDownloadClick={handleDownloadClick}
        />
      </main>

      <Footer />

      <InstallerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

export default App;
