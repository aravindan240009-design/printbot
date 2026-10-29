'use client';
import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { PrintBotLogo } from './PrintBotLogo';
import { ThemeSwitch } from '../theme';

export function MotionSurface({ children, className, transitionKey = 'surface' }: { children: React.ReactNode; className?: string; transitionKey?: string | number }) {
  const reduced = useReducedMotion();
  return <motion.div key={transitionKey} className={className} initial={reduced ? false : { opacity: 0, y: 14, rotateX: 1.5 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: reduced ? 0 : .42, ease: [.16, 1, .3, 1] }}>{children}</motion.div>;
}

export function StudioHeader({
  title,
  subtitle,
  children,
  hideBrandIcon = false,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  hideBrandIcon?: boolean;
}) {
  return (
    <header className={`pb-header ${hideBrandIcon ? 'pb-header-minimal' : ''}`}>
      <div className="pb-header-left">
        {!hideBrandIcon ? (
          <a className="pb-brand" href="#main">
            <span className="pb-brand-icon">
              <PrintBotLogo size={44} />
            </span>
            <span>
              <strong>{title}</strong>
              {subtitle && <small>{subtitle}</small>}
            </span>
          </a>
        ) : (
          <div className="pb-context-title">
            <span className="pb-context-name">{title}</span>
            {subtitle && <span className="pb-context-subtitle">{subtitle}</span>}
          </div>
        )}
      </div>
      <div className="pb-header-actions">
        {children}
        <ThemeSwitch />
      </div>
    </header>
  );
}

export { PrinterScene as PaperScene } from './PrinterScene';
