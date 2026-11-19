/**
 * Synthesizes a clean, pleasant multi-tone chime for incoming print orders
 * using the browser's native Web Audio API (zero external audio file dependencies).
 */
export function playOrderChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Friendly 3-tone ascending arpeggio: D5 (587.33Hz) -> A5 (880Hz) -> D6 (1174.66Hz)
    const notes = [
      { freq: 587.33, start: now + 0.0, duration: 0.18, gain: 0.35 },
      { freq: 880.0, start: now + 0.12, duration: 0.22, gain: 0.4 },
      { freq: 1174.66, start: now + 0.25, duration: 0.45, gain: 0.45 },
    ];

    notes.forEach(({ freq, start, duration, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      // Smooth attack and decay envelope to prevent popping/clicking
      gainNode.gain.setValueAtTime(0.001, start);
      gainNode.gain.linearRampToValueAtTime(gain, start + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration);
    });

    // Close audio context after chime finishes to release hardware audio handle
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1200);
  } catch (err) {
    // Audio context may be blocked by autoplay policies until user interacts
    console.debug('Order chime audio playback suppressed:', err);
  }
}
