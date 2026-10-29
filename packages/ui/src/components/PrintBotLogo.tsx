'use client';
import type { CSSProperties } from 'react';

/** Original folded-paper monogram. SVG scales cleanly from favicon to workstation. */
export function PrintBotLogo({ size = 44, className = '', style }: { size?: number; className?: string; style?: CSSProperties }) {
  return <svg className={`pb-logo ${className}`} width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Print Bot" style={style}>
    <rect x="1" y="1" width="46" height="46" rx="13" fill="var(--pb-logo-ground, #25211b)"/>
    <path d="M15 12.5H29L35 18.5V33.5H21L15 27.5V12.5Z" stroke="var(--pb-logo-ink, #d9bd8c)" strokeWidth="1.65" strokeLinejoin="round"/>
    <path d="M29 12.5V18.5H35M15 21H27V36H13V21H15Z" fill="var(--pb-logo-ground, #25211b)" stroke="var(--pb-logo-ink, #d9bd8c)" strokeWidth="1.65" strokeLinejoin="round"/>
    <path d="M17 27H23M17 31H21" stroke="var(--pb-logo-ink, #d9bd8c)" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="35.5" cy="29" r="1.5" fill="var(--pb-logo-ink, #d9bd8c)"/>
  </svg>;
}

export function StudioBackdrop() {
  return <div className="pb-studio-backdrop" aria-hidden="true" />;
}
