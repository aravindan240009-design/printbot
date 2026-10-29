import React, { useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'motion/react';
import { Printer, Zap, ShieldCheck, ShieldAlert } from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  detail: string;
  pages: number;
  sheets: number;
  cost: number;
}

const ORDERS: OrderItem[] = [
  {
    id: 'PB-101',
    name: 'Project proposal.pdf',
    detail: 'A4 · Black & white · Duplex',
    pages: 42,
    sheets: 21,
    cost: 63,
  },
  {
    id: 'PB-102',
    name: 'Brand portfolio.pdf',
    detail: 'A4 · Colour · 1 copy',
    pages: 12,
    sheets: 12,
    cost: 120,
  },
  {
    id: 'PB-103',
    name: 'Workshop notes.pdf',
    detail: 'A4 · Black & white · 4 copies',
    pages: 8,
    sheets: 4,
    cost: 32,
  },
];

export function AutopilotControl() {
  const [mode, setMode] = useState<'automatic' | 'manual'>('automatic');
  const [activeOrderId, setActiveOrderId] = useState<string>('PB-101');
  const [dispatchedId, setDispatchedId] = useState<string | null>(null);

  // 3D Card Tilt Tracking on Queue Card
  const cardRef = useRef<HTMLDivElement>(null);
  const [isCardHovered, setIsCardHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateXSpring = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), { stiffness: 300, damping: 25 });
  const rotateYSpring = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), { stiffness: 300, damping: 25 });
  const glareX = useSpring(useTransform(mouseX, [-0.5, 0.5], [10, 90]), { stiffness: 300, damping: 25 });
  const glareY = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, 90]), { stiffness: 300, damping: 25 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsCardHovered(false);
  };

  const handleSimulatedDispatch = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDispatchedId(id);
    setTimeout(() => setDispatchedId(null), 2500);
  };

  return (
    <section id="control" className="control-section">
      <div className="shell control-grid section-space" data-reveal>
        {/* Left Column: Typographic Controls */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 style={{ letterSpacing: '-2px' }}>
            <span style={{ display: 'block' }}>On autopilot.</span>
            <span style={{ display: 'block', color: 'var(--lime)', fontStyle: 'italic', fontFamily: 'Playfair, Georgia, serif' }}>
              Or in your hands.
            </span>
          </h2>
          <p style={{ marginTop: '16px', fontSize: '15px', color: 'var(--muted)', lineHeight: '1.7' }}>
            Your counter, your call. Choose the order mode that fits the way you work.
          </p>

          {/* Luxury Morphing Mode Switcher */}
          <div
            className="mode-switch"
            role="group"
            aria-label="Explore order modes"
            style={{
              position: 'relative',
              display: 'inline-flex',
              padding: '6px',
              borderRadius: '12px',
              marginTop: '28px',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.2)',
            }}
          >
            {/* Sliding Spring Pill */}
            <button
              type="button"
              aria-pressed={mode === 'automatic'}
              onClick={() => setMode('automatic')}
              style={{
                position: 'relative',
                zIndex: 2,
                minHeight: '44px',
                padding: '0 24px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                transition: 'color 0.25s ease',
                color: mode === 'automatic' ? 'var(--ground)' : 'inherit',
              }}
            >
              {mode === 'automatic' && (
                <motion.div
                  layoutId="activeModePill"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '8px',
                    background: 'var(--lime)',
                    boxShadow: '0 4px 16px rgba(226, 193, 139, 0.4)',
                    zIndex: -1,
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              Full automatic
            </button>

            <button
              type="button"
              aria-pressed={mode === 'manual'}
              onClick={() => setMode('manual')}
              style={{
                position: 'relative',
                zIndex: 2,
                minHeight: '44px',
                padding: '0 24px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                transition: 'color 0.25s ease',
                color: mode === 'manual' ? 'var(--ground)' : 'inherit',
              }}
            >
              {mode === 'manual' && (
                <motion.div
                  layoutId="activeModePill"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '8px',
                    background: 'var(--lime)',
                    boxShadow: '0 4px 16px rgba(226, 193, 139, 0.4)',
                    zIndex: -1,
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              Manual approval
            </button>
          </div>

          {/* Dynamic Explainer Text with AnimatePresence */}
          <div style={{ minHeight: '68px', marginTop: '18px' }}>
            <AnimatePresence mode="wait">
              {mode === 'automatic' ? (
                <motion.p
                  key="auto-text"
                  className="mode-explainer"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 600 }}
                >
                  <Zap size={16} />
                  <span>Eligible, compatible jobs with verified payment move into your print workflow without staff approval.</span>
                </motion.p>
              ) : (
                <motion.p
                  key="manual-text"
                  className="mode-explainer"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d97706', fontWeight: 600 }}
                >
                  <ShieldAlert size={16} />
                  <span>Staff approve or reject every submitted job. You keep the final say before printing.</span>
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <small style={{ display: 'block', color: 'var(--muted)', marginTop: '8px', fontSize: '11px' }}>
            Demo selector only. Real mode changes require authorized, audited shop access.
          </small>
        </motion.div>

        {/* Right Column: 3D Holographic Tilt Queue Card */}
        <motion.div
          ref={cardRef}
          className="queue"
          data-ui
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsCardHovered(true)}
          onMouseLeave={handleMouseLeave}
          style={{
            rotateX: rotateXSpring,
            rotateY: rotateYSpring,
            transformStyle: 'preserve-3d',
            perspective: 1200,
            position: 'relative',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: isCardHovered
              ? '0 30px 80px -10px rgba(0, 0, 0, 0.4), 0 0 0 1.5px rgba(226, 193, 139, 0.35)'
              : '0 20px 60px rgba(0, 0, 0, 0.25)',
            transition: 'box-shadow 0.4s ease',
          }}
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Specular Glare Shine Overlay */}
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              pointerEvents: 'none',
              opacity: isCardHovered ? 0.35 : 0,
              transition: 'opacity 0.35s ease',
              background: useTransform(
                [glareX, glareY],
                ([gx, gy]) =>
                  `radial-gradient(circle at ${gx}% ${gy}%, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 60%)`
              ),
            }}
          />

          {/* Top Bar with Live Indicator */}
          <div className="queue-header" style={{ transform: 'translateZ(20px)' }}>
            <div className="queue-mark">
              <Printer size={19} />
            </div>
            <span style={{ fontWeight: 650 }}>Your counter. Connected.</span>
            <span className="queue-status" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                  display: 'inline-block',
                }}
              />
              Live Dispatch Engine
            </span>
          </div>

          {/* Queue Headline with Radar Pulse Signal */}
          <div className="queue-title" style={{ transform: 'translateZ(25px)' }}>
            <h3>
              A clear head.
              <br />
              A clearer queue.
            </h3>
            <div style={{ position: 'relative', width: '12px', height: '12px' }}>
              <span className="signal" />
              <motion.span
                style={{
                  position: 'absolute',
                  inset: '-4px',
                  borderRadius: '50%',
                  border: '1.5px solid var(--lime)',
                }}
                animate={{ scale: [1, 2.2], opacity: [0.8, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Staggered Order Queue Items */}
          <div style={{ transform: 'translateZ(15px)' }}>
            {ORDERS.map((order, idx) => {
              const isSelected = activeOrderId === order.id;
              const isDispatched = dispatchedId === order.id;

              // Dynamic badge according to mode and order
              let badgeText = '';
              let badgeColor = '';
              let badgeBg = '';

              if (idx === 0) {
                if (mode === 'automatic') {
                  badgeText = isDispatched ? '✓ Sent to winspool.drv' : '⚡ Fast-track dispatch';
                  badgeColor = '#10b981';
                  badgeBg = 'rgba(16, 185, 129, 0.15)';
                } else {
                  badgeText = isDispatched ? '✓ Approved by shop' : '✋ Awaiting owner review';
                  badgeColor = '#f59e0b';
                  badgeBg = 'rgba(245, 158, 11, 0.15)';
                }
              } else if (idx === 1) {
                badgeText = '✓ Payment verified (UPI)';
                badgeColor = '#10b981';
                badgeBg = 'rgba(16, 185, 129, 0.12)';
              } else {
                badgeText = '⏳ Awaiting counter cash';
                badgeColor = '#e2c18b';
                badgeBg = 'rgba(226, 193, 139, 0.12)';
              }

              return (
                <motion.div
                  key={order.id}
                  className="queue-item"
                  onClick={() => setActiveOrderId(order.id)}
                  whileHover={{ x: 6, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  whileTap={{ scale: 0.99 }}
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
                    borderLeft: isSelected ? '3px solid var(--lime)' : '3px solid transparent',
                    background: isSelected ? 'rgba(226, 193, 139, 0.06)' : 'transparent',
                    transition: 'border-left 0.2s, background 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        display: 'grid',
                        placeItems: 'center',
                        color: 'var(--lime)',
                        fontWeight: 700,
                        fontSize: '11px',
                      }}
                    >
                      PDF
                    </div>
                    <div>
                      <strong style={{ fontSize: '13px', display: 'block', color: '#f3e5d2' }}>
                        {order.name}
                      </strong>
                      <small style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        {order.detail} · {order.sheets} physical sheets
                      </small>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={badgeText}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.25 }}
                        style={{
                          fontSize: '11px',
                          fontWeight: 650,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          color: badgeColor,
                          background: badgeBg,
                          border: `1px solid ${badgeColor}33`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        {badgeText}
                      </motion.span>
                    </AnimatePresence>

                    {idx === 0 && (
                      <motion.button
                        type="button"
                        onClick={(e) => handleSimulatedDispatch(e, order.id)}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.94 }}
                        style={{
                          background: mode === 'automatic' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: mode === 'automatic' ? '#10b981' : '#f59e0b',
                          border: `1px solid ${mode === 'automatic' ? '#10b981' : '#f59e0b'}55`,
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {mode === 'automatic' ? 'Spool' : 'Approve'}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Card Footer with Policy Note */}
          <div className="queue-footer" style={{ transform: 'translateZ(20px)' }}>
            <ShieldCheck size={16} style={{ color: 'var(--lime)' }} />
            <span>Cash and unverified jobs follow your approval policy. Never automatic reprint.</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
