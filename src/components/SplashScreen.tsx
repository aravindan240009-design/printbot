import { useEffect, useState, useCallback } from 'react';
import { PrintBotLogo } from '../../packages/ui/src/components/PrintBotLogo';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

interface SplashScreenProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

const BOOT_STAGES = [
  { at: 20, text: 'Connecting winspool.drv native printer bridge...' },
  { at: 45, text: 'Loading Canon, Xerox, HP & Konica driver profiles...' },
  { at: 70, text: 'Configuring sub-second QR mobile session engine...' },
  { at: 90, text: 'Enforcing zero-leakage shop tenant boundaries...' },
  { at: 100, text: 'Counter operating system ready. Welcome to Print Bot.' },
];

export function SplashScreen({ onComplete, forceShow = false }: SplashScreenProps) {
  const [visible, setVisible] = useState(() => {
    if (forceShow) return true;
    try {
      return !sessionStorage.getItem('printbot_splash_viewed');
    } catch {
      return true;
    }
  });

  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);
  const [statusText, setStatusText] = useState('Powering counter workstation...');
  const [runKey, setRunKey] = useState(0);

  useEffect(() => {
    if (forceShow) {
      setVisible(true);
      setFading(false);
      setProgress(0);
      setRunKey((k) => k + 1);
    }
  }, [forceShow]);

  const finish = useCallback(() => {
    setFading(true);
    try {
      sessionStorage.setItem('printbot_splash_viewed', 'true');
    } catch {
      // ignore
    }
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 550);
    return () => clearTimeout(timer);
  }, [onComplete]);

  useEffect(() => {
    if (!visible) return;

    const startTime = Date.now();
    const duration = 2200; // 2.2s cinematic luxury intro

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      const currentStage = BOOT_STAGES.find((s) => pct <= s.at) || BOOT_STAGES[BOOT_STAGES.length - 1];
      setStatusText(currentStage.text);

      if (pct >= 100) {
        clearInterval(timer);
        setTimeout(() => {
          finish();
        }, 350);
      }
    }, 30);

    return () => {
      clearInterval(timer);
    };
  }, [visible, runKey, finish]);

  if (!visible) return null;

  return (
    <div
      className={`splash-overlay ${fading ? 'splash-fading' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Print Bot system initializing"
    >
      <div className="splash-backdrop" />
      <div className="splash-ambient-glow" />

      <div className="splash-container">
        {/* Animated Brand Emblem */}
        <div className="splash-emblem-wrap">
          <div className="splash-emblem-ring" />
          <div className="splash-emblem-core">
            <PrintBotLogo size={64} />
          </div>
        </div>

        {/* Title & Tagline */}
        <div className="splash-identity">
          <h1 className="splash-title">
            printbot<span className="splash-dot">®</span>
          </h1>
          <p className="splash-subtitle">
            <Sparkles size={13} className="splash-sparkle" />
            THE COUNTER OPERATING SYSTEM FOR INDIAN PRINT SHOPS
          </p>
        </div>

        {/* Precision Progress Bar */}
        <div className="splash-progress-block">
          <div className="splash-bar-track">
            <div
              className="splash-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="splash-telemetry">
            <span className="splash-status-line">
              <span className="splash-pulse" />
              {statusText}
            </span>
            <span className="splash-pct">{progress}%</span>
          </div>
        </div>

        {/* Value Highlights Pill */}
        <div className="splash-pills">
          <span><CheckCircle2 size={12} /> Unlimited Printers</span>
          <span><CheckCircle2 size={12} /> 0% Page Cut</span>
          <span><CheckCircle2 size={12} /> winspool.drv Native</span>
        </div>

        {/* Skip button for instant entry */}
        <button
          type="button"
          className="splash-skip-btn"
          onClick={finish}
          aria-label="Skip splash screen and enter site"
        >
          Enter Counter <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
