import { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowUpRight, Volume2, VolumeX, Sparkles, CheckCircle2 } from 'lucide-react';

interface TypingClosingProps {
  onDownload: () => void;
}

const PHRASES = [
  'great impressions.',
  'zero wasted sheets.',
  'queues disappear.',
  'every print count.',
  'counters effortless.',
  'printing beautiful.',
];

export function TypingClosingSection({ onDownload }: TypingClosingProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Audio Context safely on user gesture or first sound
  const getAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtxRef.current = new AudioCtxClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  // Synthesize mechanical typewriter click sound
  const playTypewriterClick = useCallback((isSpace: boolean = false) => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // 1. Noise burst for mechanical key impact
      const bufferSize = ctx.sampleRate * 0.025; // 25ms
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      // Slight pitch variance per key for organic realism
      filter.frequency.value = isSpace ? 800 : 1800 + (Math.random() * 600 - 300);
      filter.Q.value = 3.5;

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(isSpace ? 0.08 : 0.14, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.024);

      whiteNoise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.025);

      // 2. Subtle tone click transient
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isSpace ? 280 : 540 + Math.random() * 80, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.018);

      oscGain.gain.setValueAtTime(0.06, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.019);
    } catch {
      // Audio autoplay policy fallback
    }
  }, [soundEnabled, getAudioContext]);

  // Synthesize carriage return bell / metallic finish chime
  const playCarriageChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      // High harmonic chime
      osc1.frequency.setValueAtTime(1760, now); // A6
      osc2.frequency.setValueAtTime(2640, now); // E7

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } catch {}
  }, [soundEnabled, getAudioContext]);

  // Main Typing Engine
  useEffect(() => {
    const currentTarget = PHRASES[phraseIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      if (displayedText.length < currentTarget.length) {
        // Typing next character with organic human timing
        const char = currentTarget.charAt(displayedText.length);
        const typingSpeed = 55 + Math.random() * 45; // 55-100ms
        timeout = setTimeout(() => {
          setDisplayedText(currentTarget.slice(0, displayedText.length + 1));
          playTypewriterClick(char === ' ');
        }, typingSpeed);
      } else {
        // Finished typing full phrase: play carriage chime
        playCarriageChime();
        // Pause to let user read
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, 2400);
      }
    } else {
      if (displayedText.length > 0) {
        // Backspacing quickly
        const deleteSpeed = 30 + Math.random() * 20;
        timeout = setTimeout(() => {
          setDisplayedText(currentTarget.slice(0, displayedText.length - 1));
          playTypewriterClick();
        }, deleteSpeed);
      } else {
        // Done deleting: advance to next phrase
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, phraseIndex, playTypewriterClick, playCarriageChime]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) {
      getAudioContext();
      playCarriageChime();
    }
  };

  const handleCtaClick = () => {
    getAudioContext();
    playCarriageChime();
    onDownload();
  };

  return (
    <section className="typing-closing-section shell" aria-label="Interactive Closing Section">
      {/* Top Header Tag */}
      <div className="closing-eyebrow-row">
        <span className="closing-badge">
          <Sparkles size={13} className="sparkle-icon" /> A BETTER DAY AT THE COUNTER STARTS HERE
        </span>

        {/* Audio Toggle Pill */}
        <button
          type="button"
          className={`sound-toggle-pill ${soundEnabled ? 'sound-active' : ''}`}
          onClick={toggleSound}
          aria-label={soundEnabled ? 'Disable mechanical typewriter sound' : 'Enable mechanical typewriter sound'}
          title="Toggle mechanical typing sound effects"
        >
          {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          <span>Sound: {soundEnabled ? 'ON' : 'MUTED'}</span>
        </button>
      </div>

      {/* Main Animated Typewriter Headline */}
      <h2 className="typing-headline" aria-live="polite">
        <span className="typing-prefix">Let’s make</span>
        <br />
        <span className="typing-target">
          <span className="typing-text">{displayedText}</span>
          <span className={`typing-caret ${isDeleting ? 'caret-deleting' : ''}`} aria-hidden="true" />
        </span>
      </h2>

      {/* Phrase Indicators */}
      <div className="phrase-indicators" aria-hidden="true">
        {PHRASES.map((_, i) => (
          <span
            key={i}
            className={`phrase-dot ${i === phraseIndex ? 'dot-active' : ''}`}
            onClick={() => {
              setDisplayedText('');
              setIsDeleting(false);
              setPhraseIndex(i);
            }}
          />
        ))}
      </div>

      {/* Primary Animated CTA */}
      <div className="closing-cta-wrapper">
        <button
          type="button"
          className="closing-cta-btn button lime"
          onClick={handleCtaClick}
          aria-label="Explore the Windows workstation"
        >
          <span>Explore the Windows workstation</span>
          <ArrowUpRight size={19} className="cta-arrow" />
        </button>
      </div>

      {/* Subtitle Guarantee */}
      <p className="closing-footer-note">
        <CheckCircle2 size={13} className="note-check" />
        One shop. One connected experience. A whole new rhythm.
      </p>
    </section>
  );
}
