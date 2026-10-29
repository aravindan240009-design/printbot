import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PrintBotLogo } from '../../packages/ui/src/components/PrintBotLogo';
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2, Cpu, HardDrive, Radio } from 'lucide-react';

interface SplashScreenProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

interface BootStage {
  at: number;
  code: string;
  text: string;
  diode: 'green' | 'gold' | 'blue';
}

const BOOT_STAGES: BootStage[] = [
  { at: 18, code: 'SYS_BRIDGE', text: 'Connecting winspool.drv native printer bridge...', diode: 'gold' },
  { at: 42, code: 'FLEET_INIT', text: 'Querying Canon, Xerox, HP & Konica driver profiles...', diode: 'blue' },
  { at: 68, code: 'QR_SESSION', text: 'Configuring sub-second mobile QR guest handshake...', diode: 'gold' },
  { at: 88, code: 'TENANT_SEC', text: 'Enforcing zero-leakage PostgreSQL RLS tenant walls...', diode: 'green' },
  { at: 100, code: 'SYS_READY', text: 'Counter operating system ready. Welcome to Print Bot.', diode: 'green' },
];

// Lightweight synthesized luxury haptic audio using Web Audio API
function playHapticTick(freq = 640, duration = 0.04) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.4, ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.045, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // AudioContext blocked by browser policy prior to user interaction
  }
}

function playCompletionChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    [523.25, 659.25, 783.99, 1046.5].forEach((note, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + i * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note, start);

      gain.gain.setValueAtTime(0.04, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.35);
    });
  } catch {
    // ignore
  }
}

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
  const [activeStage, setActiveStage] = useState<BootStage>(BOOT_STAGES[0]);
  const [runKey, setRunKey] = useState(0);
  const lastSoundStage = useRef<number>(-1);

  useEffect(() => {
    if (forceShow) {
      setVisible(true);
      setFading(false);
      setProgress(0);
      setActiveStage(BOOT_STAGES[0]);
      lastSoundStage.current = -1;
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
    }, 600);
    return () => clearTimeout(timer);
  }, [onComplete]);

  useEffect(() => {
    if (!visible) return;

    const startTime = Date.now();
    const duration = 3200; // 3.2s luxury cinematic initialization

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      const stageIndex = BOOT_STAGES.findIndex((s) => pct <= s.at);
      const matchedStage = stageIndex !== -1 ? BOOT_STAGES[stageIndex] : BOOT_STAGES[BOOT_STAGES.length - 1];
      setActiveStage(matchedStage);

      // Play subtle tick on stage change
      if (stageIndex !== lastSoundStage.current && stageIndex !== -1) {
        lastSoundStage.current = stageIndex;
        playHapticTick(550 + stageIndex * 70, 0.05);
      }

      if ((window as unknown as { __FREEZE_SPLASH__?: boolean }).__FREEZE_SPLASH__) {
        return;
      }

      if (pct >= 100) {
        clearInterval(timer);
        playCompletionChime();
        setTimeout(() => {
          if (!(window as unknown as { __FREEZE_SPLASH__?: boolean }).__FREEZE_SPLASH__) {
            finish();
          }
        }, 1800);
      }
    }, 28);

    return () => clearInterval(timer);
  }, [visible, runKey, finish]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={`splash-overlay ${fading ? 'splash-fading' : ''}`}
        role="status"
        aria-live="polite"
        aria-label="Print Bot system initializing"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.03 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Realistic Architectural Print Room Backdrop with Subtle Cinematic Zoom */}
        <div className="splash-backdrop-layer">
          <motion.div
            className="splash-backdrop-photo"
            animate={{ scale: [1, 1.05] }}
            transition={{ duration: 10, ease: 'easeOut' }}
            style={{
              backgroundImage: "url('/assets/print-room-dark.webp')",
              backgroundSize: 'cover',
              backgroundPosition: 'center 40%',
            }}
          />
          <div className="splash-backdrop-scrim" />
        </div>

        {/* Ambient Warm Golden Optical Bloom */}
        <div className="splash-ambient-glow" />

        {/* Floating Golden Micro-Particles */}
        <div className="splash-particles-container" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <motion.span
              key={i}
              className="splash-particle"
              style={{
                left: `${10 + (i * 7.5)}%`,
                top: `${20 + (i * 5.5)}%`,
                width: `${2 + (i % 3)}px`,
                height: `${2 + (i % 3)}px`,
              }}
              animate={{
                y: [0, -35, 0],
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.4, 1],
              }}
              transition={{
                duration: 3.5 + (i % 4),
                repeat: Infinity,
                delay: i * 0.25,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Central Master Glass Card */}
        <motion.div
          className="splash-container"
          initial={{ scale: 0.92, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Hardware Diagnostic Top Header */}
          <div className="splash-hardware-header">
            <div className="splash-hardware-diodes">
              <span className="diode diode-green" title="Winspool Native Spooler Online">
                <i />
              </span>
              <span className="diode diode-gold" title="Tenant Isolation Active">
                <i />
              </span>
              <span className="diode diode-blue" title="PCL6/Raster Engine Online">
                <i />
              </span>
            </div>
            <div className="splash-hardware-meta">
              <Radio size={11} className="splash-radio-icon" />
              <span>PRINT BOT OS v2.4 · SPOOL SECURE</span>
            </div>
          </div>

          {/* Animated Brand Emblem with Concentric Technical Gauges */}
          <div className="splash-emblem-wrap">
            {/* Outer Technical Compass Dial */}
            <motion.div
              className="splash-dial-ring"
              animate={{ rotate: 360 }}
              transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
            >
              <span className="dial-mark mark-n">0°</span>
              <span className="dial-mark mark-e">90°</span>
              <span className="dial-mark mark-s">180°</span>
              <span className="dial-mark mark-w">270°</span>
            </motion.div>

            {/* Inner Counter-Rotating Dash Ring */}
            <motion.div
              className="splash-emblem-ring"
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            />

            {/* Core Emblem with Precision Logo and Laser Scanning Beam */}
            <motion.div
              className="splash-emblem-core"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              {/* Virtual Golden Laser Sweep Beam */}
              <motion.div
                className="splash-core-laser"
                animate={{ top: ['-20%', '120%'] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <PrintBotLogo size={64} />
            </motion.div>
          </div>

          {/* Brand Identity & Metallic Foil Shimmer */}
          <div className="splash-identity">
            <h1 className="splash-title">
              <span className="splash-gold-foil">printbot</span>
              <span className="splash-dot">®</span>
            </h1>
            <p className="splash-subtitle">
              <Sparkles size={13} className="splash-sparkle" />
              THE COUNTER OPERATING SYSTEM FOR INDIAN PRINT SHOPS
            </p>
          </div>

          {/* Precision Hardware Telemetry & Progress Bar */}
          <div className="splash-progress-block">
            {/* Live Technical Diagnostic Feed */}
            <div className="splash-telemetry-feed">
              <span className="splash-feed-code">[{activeStage.code}]</span>
              <span className="splash-status-line">
                <span className={`splash-pulse pulse-${activeStage.diode}`} />
                {activeStage.text}
              </span>
            </div>

            {/* Track with Glowing Laser Spark Tip */}
            <div className="splash-bar-track">
              <motion.div
                className="splash-bar-fill"
                style={{ width: `${progress}%` }}
              >
                <div className="splash-bar-spark" />
              </motion.div>
            </div>

            {/* Metric Footer */}
            <div className="splash-telemetry-footer">
              <span className="splash-mem-stat">
                <Cpu size={12} /> BUFFER: 64MB RAW EMF
              </span>
              <span className="splash-pct">{progress}%</span>
            </div>
          </div>

          {/* Value Verification Pills */}
          <div className="splash-pills">
            <span className="splash-pill">
              <CheckCircle2 size={13} className="text-emerald" /> Unlimited Printers
            </span>
            <span className="splash-pill">
              <ShieldCheck size={13} className="text-gold" /> 0% Page Cut
            </span>
            <span className="splash-pill">
              <HardDrive size={13} className="text-emerald" /> winspool.drv Native
            </span>
          </div>

          {/* Luxury Interactive Entry Button */}
          <motion.button
            type="button"
            className={`splash-skip-btn ${progress >= 100 ? 'splash-skip-ready' : ''}`}
            onClick={finish}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            aria-label="Skip splash screen and enter site"
          >
            <span>Enter Counter</span>
            <ArrowRight size={14} />
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
