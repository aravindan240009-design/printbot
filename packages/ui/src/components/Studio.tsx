'use client';
import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Printer } from 'lucide-react';
import { ThemeSwitch } from '../theme';

export function MotionSurface({ children, className, transitionKey = 'surface' }: { children: React.ReactNode; className?: string; transitionKey?: string | number }) {
  const reduced = useReducedMotion();
  return <motion.div key={transitionKey} className={className} initial={reduced ? false : { opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .6, ease: [.16, 1, .3, 1] }}>{children}</motion.div>;
}

export function StudioHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return <header className="pb-header"><a className="pb-brand" href="#main"><span className="pb-brand-icon"><Printer size={23} /></span><span><strong>{title}</strong>{subtitle && <small>{subtitle}</small>}</span></a><div className="pb-header-actions">{children}<ThemeSwitch /></div></header>;
}

export { PrinterScene as PaperScene } from './PrinterScene';
