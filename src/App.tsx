import { Suspense, lazy, useEffect, useState } from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  Printer,
  ScanLine,
  ShieldCheck,
  Check,
  Plus,
  Minus,
  Menu,
  X,
  MoveUpRight,
  Monitor,
  RotateCcw,
  Pause,
  Play,
  Sun,
  Moon,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { PrintBotLogo } from '../packages/ui/src/components/PrintBotLogo';
import { LuxuryEditorial } from './components/LuxuryEditorial';
import { FloatingDecorations } from './components/FloatingDecorations';
import { InteractiveExperience } from './components/InteractiveExperience';
import { MarqueeShowcase } from './components/MarqueeShowcase';
import { ShopRoiCalculator } from './components/ShopRoiCalculator';
import { AutopilotControl } from './components/AutopilotControl';
import { TypingClosingSection } from './components/TypingClosingSection';
import { SplashScreen } from './components/SplashScreen';
import { SubscriptionModal } from './components/SubscriptionModal';
import { RealisticPrinterFallback } from './components/RealisticPrinterFallback';
import { getInstallerConfig } from './utils/installer';

const PrinterScene = lazy(() => import('./components/PrecisionPrinter'));

export default function App() {
  const [menu, setMenu] = useState(false);
  const [siteTheme, setSiteTheme] = useState<'light' | 'dark'>(() =>
    document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
  );

  useEffect(() => {
    document.documentElement.dataset.theme = siteTheme;
    document.documentElement.style.colorScheme = siteTheme;
    try {
      localStorage.setItem('printbot-theme-v1', siteTheme);
    } catch {
      // ignore
    }
  }, [siteTheme]);

  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [dialog, setDialog] = useState(false);
  const [printed, setPrinted] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [splashForce, setSplashForce] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.motion = motionPaused ? 'paused' : 'playing';
    return () => {
      delete document.documentElement.dataset.motion;
    };
  }, [motionPaused]);

  const [webgl, setWebgl] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (media.matches) return false;
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      return Boolean(gl && window.innerWidth > 640);
    } catch {
      return false;
    }
  });
  const [faq, setFaq] = useState<number | null>(0);
  const installer = getInstallerConfig();

  // Scroll to top on launch or reload
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () =>
      setWebgl(
        !media.matches &&
          innerWidth > 640 &&
          !('connection' in navigator && (navigator as Navigator & { connection?: { saveData: boolean } }).connection?.saveData)
      );
    update();
    media.addEventListener('change', update);
    window.addEventListener('resize', update);

    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      media.removeEventListener('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const download = () => {
    if (installer.url) window.location.assign(installer.url);
    else setDialog(true);
  };

  return (
    <>
      {/* Luxury Animated Splash Screen */}
      <SplashScreen forceShow={splashForce} onComplete={() => setSplashForce(false)} />

      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      {/* Sticky Navigation Bar */}
      <header className="landing-sticky-header">
        <div className="navigation shell">
          <a className="brand" href="#" aria-label="Print Bot home">
            <PrintBotLogo size={40} />
            printbot<span className="brand-dot">®</span>
          </a>

          <nav aria-label="Main navigation" className={menu ? 'nav-links open' : 'nav-links'}>
            <a href="#experience" onClick={() => setMenu(false)}>
              The experience
            </a>
            <a href="#control" onClick={() => setMenu(false)}>
              Built for your shop
            </a>
            <a href="#pricing" onClick={() => setMenu(false)}>
              One simple plan
            </a>
          </nav>

          <button className="nav-cta" onClick={() => setDialog(true)}>
            Let’s talk print <ArrowUpRight size={16} />
          </button>

          <button
            className="landing-theme-switch"
            aria-label={siteTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            onClick={() => setSiteTheme(siteTheme === 'dark' ? 'light' : 'dark')}
          >
            {siteTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            className="menu-toggle"
            aria-label={menu ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content">
        <FloatingDecorations />

        {/* Hero Section */}
        <section className="hero shell" aria-labelledby="hero-heading">
          <div className="hero-copy">
            <p className="intro-line">
              <span /> Less counter chaos. More possibility.
            </p>
            <h1 id="hero-heading" aria-label="Big ideas. Beautifully printed.">
              <span className="hero-line">
                <span>Big ideas.</span>
              </span>
              <span className="hero-line">
                <span>Beautifully</span>
              </span>
              <span className="hero-line accent-line">
                <span>printed.</span>
              </span>
            </h1>
            <p className="hero-description">
              Your print shop, one step ahead. From a customer’s phone to your printer—one seamless,
              thoughtfully automated experience.
            </p>
            <div className="hero-actions">
              <button className="button lime" onClick={() => setDialog(true)}>
                Meet your new print partner <ArrowUpRight size={19} />
              </button>
              <a className="text-link" href="#experience">
                Explore the experience <ArrowRight size={17} />
              </a>
            </div>
            <div className="hero-note">
              <Monitor size={15} /> Built for Windows <span>·</span> Made for Indian print shops
            </div>
          </div>

          {/* Hero Art Scene: Photorealistic 3D Printer (CLEAN & RING-FREE) */}
          <div className="hero-art">
            <div className="art-caption">
              <span className="signal" /> Your next chapter. In print.
            </div>

            <div className="scene">
              {webgl ? (
                <Suspense fallback={<RealisticPrinterFallback printing={printed} paused={motionPaused} />}>
                  <PrinterScene
                    printing={printed}
                    paused={motionPaused}
                    soundEnabled={soundEnabled}
                    onFailure={() => setWebgl(false)}
                  />
                </Suspense>
              ) : (
                <RealisticPrinterFallback printing={printed} paused={motionPaused} />
              )}
            </div>

            <div className="scene-label">
              <span>Designed around your workflow.</span>
              <span>
                Ready when you are <span className="signal" />
              </span>
            </div>

            {/* Clear, balanced controls */}
            <div className="hero-art-controls">
              <button
                type="button"
                className="hero-control-btn primary"
                onClick={() => {
                  setPrinted(!printed);
                  setMotionPaused(false);
                }}
                aria-pressed={printed}
              >
                {printed ? <RotateCcw size={15} /> : <Printer size={15} />}
                <span>{printed ? 'Print another impression' : 'Make an impression'}</span>
                <ArrowUpRight size={15} />
              </button>

              <div className="hero-control-group">
                <button
                  type="button"
                  className="hero-icon-btn"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? 'Mute printer mechanical audio' : 'Enable printer mechanical audio'}
                  aria-label={soundEnabled ? 'Mute printer audio' : 'Enable printer audio'}
                >
                  {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>

                <button
                  type="button"
                  className="hero-icon-btn"
                  onClick={() => setMotionPaused(!motionPaused)}
                  title={motionPaused ? 'Resume site animations' : 'Pause site animations'}
                  aria-label={motionPaused ? 'Resume site animations' : 'Pause site animations'}
                  aria-pressed={motionPaused}
                >
                  {motionPaused ? <Play size={16} /> : <Pause size={16} />}
                </button>
              </div>
            </div>

            <span className="art-coordinate">Precision in motion. An automatic printing illustration.</span>
          </div>

          <div className="hero-bottom">
            <span>One connected workflow. Endless possibilities.</span>
            <a href="#experience">
              Scroll to discover <span>↓</span>
            </a>
          </div>
        </section>

        {/* Capability Strip */}
        <div className="capability-strip">
          <div className="shell">
            <span>
              <ScanLine /> Scan. Upload. Print.
            </span>
            <span>
              <ShieldCheck /> Your shop. Your data.
            </span>
            <span>
              <Printer /> Unlimited printers.
            </span>
            <span>
              <Check /> No app needed.
            </span>
          </div>
        </div>

        <LuxuryEditorial />
        <InteractiveExperience />
        <MarqueeShowcase />

        {/* Order Mode Control Section */}
        <AutopilotControl />

        {/* Small Details Section */}
        <section className="details-section shell section-space" data-reveal>
          <div className="section-heading">
            <h2>
              Small details.
              <br />
              A big difference.
            </h2>
            <p>
              Thoughtful where it matters.
              <br />
              Powerful where you need it.
            </p>
          </div>
          <div className="detail-list">
            {[
              {
                title: 'Your identity, on every interaction.',
                text: 'Your logo, local language, pricing and preferences. A customer experience that feels like your shop.',
                tag: 'Unmistakably yours',
              },
              {
                title: 'More printers. Same plan.',
                text: 'Connect compatible printers without a per-printer software fee. Route work around the way your counter runs.',
                tag: 'Built to grow',
              },
              {
                title: 'Privacy is part of the process.',
                text: 'Shop-scoped access, private documents and configurable retention. Separate shops stay separate.',
                tag: 'Protected by design',
              },
            ].map((d) => (
              <article key={d.title}>
                <span className="detail-tag">{d.tag}</span>
                <h3>{d.title}</h3>
                <p>{d.text}</p>
                <MoveUpRight size={26} />
              </article>
            ))}
          </div>
        </section>

        {/* Shop ROI & Paise Calculator */}
        <ShopRoiCalculator />

        {/* Pricing Section */}
        <section id="pricing" className="pricing-section shell" data-reveal>
          <div>
            <h2>
              One plan.
              <br />
              The whole possibility.
            </h2>
            <p>All features. Unlimited printers. No software commission on the pages you print.</p>
            <div className="billing-switch" role="group" aria-label="Billing interval">
              <button aria-pressed={billing === 'monthly'} onClick={() => setBilling('monthly')}>
                Monthly
              </button>
              <button aria-pressed={billing === 'annual'} onClick={() => setBilling('annual')}>
                Annual
              </button>
            </div>
            <p className="billing-copy" aria-live="polite">
              {billing === 'monthly'
                ? 'A monthly subscription (₹1,499/mo) to the complete Print Bot experience. Cancel anytime.'
                : 'The complete Print Bot plan billed annually (₹14,990/yr — 2 Months Free + 2 Acrylic QR Standees).'}
            </p>
          </div>
          <div className="plan-content">
            <span>The complete Print Bot plan</span>
            <ul>
              <li>
                <Check />
                Unlimited compatible printers
              </li>
              <li>
                <Check />
                Customer QR & mobile web experience
              </li>
              <li>
                <Check />
                Automatic or manual order approval
              </li>
              <li>
                <Check />
                Shop branding, pricing & preferences
              </li>
              <li>
                <Check />
                Windows workstation & shop management
              </li>
            </ul>
            <button className="button dark" onClick={() => setDialog(true)}>
              Let’s build your better counter <ArrowUpRight size={19} />
            </button>
            <small>Subscription, customer receipts and payment-provider fees are separate.</small>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="faq-section shell section-space" data-reveal>
          <h2>
            A few things
            <br />
            you might be wondering.
          </h2>
          <div className="faqs">
            {[
              {
                q: 'Will it work with my printers?',
                a: 'Print Bot uses a Windows workstation and compatible printer drivers. Specific models, paper sizes, finishing and duplex options require validation. Real-printer certification is a pilot gate; universal compatibility is not promised.',
              },
              {
                q: 'Do my customers need an app?',
                a: 'No. Customers scan your shop-specific QR and use their mobile browser. No mandatory login is required. English and Tamil are the initial languages, with Hindi support in scope.',
              },
              {
                q: 'Can I still accept cash?',
                a: 'Yes, when enabled for your shop. Cash and unverified payments never bypass the configured approval and payment policy.',
              },
              {
                q: 'Can I download Print Bot today?',
                a: 'Public installer availability depends on the configured release. Device pairing, shop login and an active subscription are required for authorized use. Production signing and hardware validation remain release gates.',
              },
            ].map((f, i) => (
              <div className="faq" key={f.q}>
                <button
                  aria-expanded={faq === i}
                  aria-controls={'faq-' + i}
                  onClick={() => setFaq(faq === i ? null : i)}
                >
                  {f.q}
                  {faq === i ? <Minus size={19} /> : <Plus size={19} />}
                </button>
                <div id={'faq-' + i} hidden={faq !== i}>
                  <p>{f.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Acoustic Mechanical Typewriter Closing Section */}
        <TypingClosingSection onDownload={download} />
      </main>

      {/* Footer */}
      <footer className="shell footer">
        <a className="brand" href="#">
          <PrintBotLogo size={40} />
          printbot<span className="brand-dot">®</span>
        </a>
        <p>Good print. Better business.</p>
        <button
          type="button"
          className="splash-replay-link"
          onClick={() => setSplashForce(true)}
          style={{ background: 'none', border: 'none', color: '#c5a66d', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Replay Intro
        </button>
        <span>© {new Date().getFullYear()} Print Bot</span>
        <a href="#main-content">Back to top ↑</a>
      </footer>

      {/* High-Converting Subscription Dialogue Modal */}
      <SubscriptionModal
        isOpen={dialog}
        onClose={() => setDialog(false)}
        initialPlan={billing}
      />
    </>
  );
}
