import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'motion/react';
import { Sparkles } from 'lucide-react';

export function PrintArtwork({ variant = 'arch' }: { variant?: 'arch' | 'orbit' }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.svg
      className={'print-artwork artwork-' + variant}
      viewBox="0 0 440 540"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={variant === 'arch' ? 'Champagne architectural arches on textured ivory art paper' : 'Gold orbital linework on an obsidian art print'}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <defs>
        <pattern id={'grain-' + variant} width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r=".45" fill={variant === 'arch' ? '#a99470' : '#dfc79a'} opacity=".22" />
        </pattern>
        <linearGradient id={'foil-' + variant} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={variant === 'arch' ? '#c4a675' : '#edd6a6'} />
          <stop offset="50%" stopColor={variant === 'arch' ? '#8a6e3d' : '#caa16b'} />
          <stop offset="100%" stopColor={variant === 'arch' ? '#dfc89d' : '#f9ebcb'} />
        </linearGradient>
      </defs>

      <rect width="440" height="540" fill={variant === 'arch' ? '#eae1cf' : '#191817'} />
      <rect width="440" height="540" fill={'url(#grain-' + variant + ')'} />

      <text x="34" y="48" fill={variant === 'arch' ? '#514533' : '#cdb58c'} fontSize="10" fontFamily="sans-serif" letterSpacing="3">
        PRINT BOT — THE IMPRESSION SERIES
      </text>

      {variant === 'arch' ? (
        <g className="svg-arches" fill="none" stroke={`url(#foil-${variant})`} strokeWidth="1.3">
          {Array.from({ length: 13 }, (_, i) => (
            <motion.path
              key={i}
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              d={`M ${67 + i * 10} 405 V ${235 + i * 3} A ${153 - i * 10} ${153 - i * 10} 0 0 1 ${373 - i * 10} ${235 + i * 3} V 405`}
            />
          ))}
        </g>
      ) : (
        <motion.g
          className="svg-orbits"
          fill="none"
          stroke={`url(#foil-${variant})`}
          strokeWidth="1.1"
          animate={{ rotate: hovered ? [0, 360] : [0, 360] }}
          transition={{ duration: hovered ? 18 : 65, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '220px 275px' }}
        >
          {Array.from({ length: 16 }, (_, i) => (
            <ellipse
              key={i}
              cx="220"
              cy="275"
              rx={65 + i * 6}
              ry={150 - i * 5}
              transform={`rotate(${i * 11.25} 220 275)`}
              opacity={0.45 + (i % 3) * 0.25}
            />
          ))}
        </motion.g>
      )}

      <text x="34" y="472" fill={variant === 'arch' ? '#29251f' : '#eee4d0'} fontSize="35" fontFamily="Georgia,serif">
        {variant === 'arch' ? 'Form & feeling.' : 'Beyond ordinary.'}
      </text>
      <text x="36" y="506" fill={variant === 'arch' ? '#685c49' : '#b8a990'} fontSize="9" fontFamily="sans-serif" letterSpacing="1.8">
        IDEAS, BEAUTIFULLY REALIZED.
      </text>
    </motion.svg>
  );
}

export function LuxuryEditorial() {
  const photoRef = useRef<HTMLDivElement>(null);
  const [isPhotoHovered, setIsPhotoHovered] = useState(false);

  // 3D Perspective Tilt on Mouse Movement
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateXSpring = useSpring(useTransform(y, [-0.5, 0.5], [7, -7]), { stiffness: 250, damping: 25 });
  const rotateYSpring = useSpring(useTransform(x, [-0.5, 0.5], [-7, 7]), { stiffness: 250, damping: 25 });
  const glareX = useSpring(useTransform(x, [-0.5, 0.5], [0, 100]), { stiffness: 250, damping: 25 });
  const glareY = useSpring(useTransform(y, [-0.5, 0.5], [0, 100]), { stiffness: 250, damping: 25 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!photoRef.current) return;
    const rect = photoRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / rect.width - 0.5;
    const mouseY = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsPhotoHovered(false);
  };

  return (
    <section className="editorial-section shell section-space" aria-labelledby="editorial-title">
      {/* Section Heading with Staggered Word Reveal */}
      <motion.div
        className="section-heading"
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 id="editorial-title">
          <span className="editorial-line-mask">
            <motion.span
              initial={{ y: '100%', opacity: 0 }}
              whileInView={{ y: '0%', opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: 'inline-block' }}
            >
              Digital precision.
            </motion.span>
          </span>
          <br />
          <span className="serif-note">
            <motion.span
              initial={{ y: '100%', opacity: 0 }}
              whileInView={{ y: '0%', opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: 'inline-block' }}
            >
              A tangible feeling.
            </motion.span>
          </span>
        </h2>
        <motion.p
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          For the things worth holding.
          <br />
          And the people who bring them to life.
        </motion.p>
      </motion.div>

      {/* Main Editorial Layout */}
      <div className="editorial-layout">
        {/* Left: 3D Interactive Parallax Photo Frame */}
        <motion.figure
          className="editorial-photo"
          ref={photoRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsPhotoHovered(true)}
          onMouseLeave={handleMouseLeave}
          style={{
            perspective: 1200,
            transformStyle: 'preserve-3d',
          }}
          initial={{ opacity: 0, scale: 0.94, y: 40 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="photo-window"
            style={{
              rotateX: rotateXSpring,
              rotateY: rotateYSpring,
              transformStyle: 'preserve-3d',
              position: 'relative',
              boxShadow: isPhotoHovered
                ? '0 35px 80px -15px rgba(121, 45, 71, 0.28), 0 0 0 1px rgba(226, 193, 139, 0.4)'
                : '0 25px 60px -20px rgba(0, 0, 0, 0.18)',
              transition: 'box-shadow 0.4s ease',
            }}
          >
            {/* Specular Glare Overlay */}
            <motion.div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 3,
                pointerEvents: 'none',
                opacity: isPhotoHovered ? 0.35 : 0,
                transition: 'opacity 0.4s ease',
                background: useTransform(
                  [glareX, glareY],
                  ([gx, gy]) =>
                    `radial-gradient(circle at ${gx}% ${gy}%, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 65%)`
                ),
              }}
            />

            {/* High-Resolution Architectural Print Studio Image */}
            <picture>
              <source srcSet="/assets/editorial-tangible-craft.jpg" type="image/jpeg" />
              <img
                src="/assets/editorial-tangible-craft.jpg"
                alt="Bespoke architectural design and print studio table with freshly printed folios, thesis prints, and business cards"
                loading="lazy"
                decoding="async"
                width="1536"
                height="1024"
                style={{
                  transform: isPhotoHovered ? 'scale(1.06)' : 'scale(1.02)',
                  transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                  objectFit: 'cover',
                  width: '100%',
                  height: '100%',
                }}
              />
            </picture>

            {/* Floating 3D Stamp Badge */}
            <motion.div
              style={{
                position: 'absolute',
                bottom: '18px',
                right: '18px',
                zIndex: 4,
                transform: 'translateZ(30px)',
                background: 'rgba(33, 18, 25, 0.88)',
                color: '#edd5a6',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(226, 193, 139, 0.35)',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
              }}
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles size={14} style={{ color: '#e2c18b' }} />
              <span>Architectural Print Studio · 1200 DPI Native</span>
            </motion.div>
          </motion.div>

          <figcaption style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', fontSize: '11px', color: 'var(--muted)' }}>
            <span style={{ fontWeight: 600 }}>Beautiful in the details.</span>
            <span>Concept imagery · Print Bot studio</span>
          </figcaption>
        </motion.figure>

        {/* Right: Editorial Typography & Micro-Interactions */}
        <motion.div
          className="editorial-copy"
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Animated 3D Floating Monogram */}
          <motion.span
            className="studio-mark"
            aria-hidden="true"
            whileHover={{ scale: 1.1, rotateZ: 5, color: '#f3e1b8' }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            style={{ display: 'inline-block', cursor: 'pointer' }}
          >
            pb.
          </motion.span>

          <h3>
            Not just another page.
            <br />
            Someone’s next big thing.
          </h3>

          <p>
            A portfolio. A first business card. The proposal that opens a door. Every print begins with a little ambition. Give it the care it deserves.
          </p>

          <motion.a
            className="text-link"
            href="#experience"
            whileHover={{ x: 6 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 650, marginTop: '20px' }}
          >
            <span>Explore a more thoughtful workflow</span>
            <span style={{ transition: 'transform 0.2s ease' }}>↗</span>
          </motion.a>
        </motion.div>
      </div>

      {/* Bottom Art Gallery Showcase with Interactive Vector Line Animations */}
      <div className="art-gallery">
        <motion.figure
          className="art-print print-ivory"
          initial={{ opacity: 0, y: 50, rotate: -8 }}
          whileInView={{ opacity: 1, y: 0, rotate: -5 }}
          viewport={{ once: true, margin: '-40px' }}
          whileHover={{ rotate: 0, y: -12, scale: 1.03 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <PrintArtwork />
          <figcaption>
            <span>Considered from every angle.</span>
            <span>Fine details. Lasting impact.</span>
          </figcaption>
        </motion.figure>

        <motion.div
          className="gallery-statement"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          <p>
            Made to move
            <br />
            <em>ideas forward.</em>
          </p>

          <svg className="signature-path" viewBox="0 0 240 90" fill="none" aria-hidden="true">
            <motion.path
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2.2, ease: 'easeInOut', delay: 0.3 }}
              d="M10 65C70-20 115 5 82 62S41 95 85 51 151 17 131 60 105 82 163 43 206 31 180 64C172 75 193 69 229 48"
              stroke="currentColor"
              strokeWidth="1.8"
            />
          </svg>
          <span>Every detail has a purpose.</span>
        </motion.div>

        <motion.figure
          className="art-print print-obsidian"
          initial={{ opacity: 0, y: 50, rotate: 8 }}
          whileInView={{ opacity: 1, y: 25, rotate: 5 }}
          viewport={{ once: true, margin: '-40px' }}
          whileHover={{ rotate: 0, y: -12, scale: 1.03 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <PrintArtwork variant="orbit" />
          <figcaption>
            <span>Beyond the expected.</span>
            <span>Your ideas, in a new dimension.</span>
          </figcaption>
        </motion.figure>
      </div>
    </section>
  );
}
