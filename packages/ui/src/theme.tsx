'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { Sun, Moon } from 'lucide-react';
import { StudioBackdrop } from './components/PrintBotLogo';

type Theme = 'light' | 'dark';
const storageKey = 'printbot-theme-v1';
const valid = (value: string | null): Theme => value === 'dark' ? 'dark' : 'light';
const ThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void }>({ theme: 'light', setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, updateTheme] = useState<Theme>('light');
  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let target: HTMLButtonElement | null = null;
    const clear = () => {
      if (target) { target.removeAttribute('data-regal-hover'); target.style.removeProperty('--magnet-x'); target.style.removeProperty('--magnet-y'); }
      target = null;
    };
    const pointer = (event: PointerEvent) => {
      if (!fine.matches || reduced.matches) { clear(); return; }
      const button = (event.target as Element)?.closest?.('button.primary,button.pb-button-primary,button.customer-primary,button.ws-primary') as HTMLButtonElement | null;
      if (button !== target) clear();
      if (!button || button.disabled) return;
      target = button;
      const rect = button.getBoundingClientRect();
      button.dataset.regalHover = 'true';
      button.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`);
      button.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`);
      button.style.setProperty('--magnet-x', `${Math.max(-4, Math.min(4, (event.clientX - rect.left - rect.width / 2) * .08))}px`);
      button.style.setProperty('--magnet-y', `${Math.max(-4, Math.min(4, (event.clientY - rect.top - rect.height / 2) * .08))}px`);
    };
    window.addEventListener('pointermove', pointer);
    window.addEventListener('blur', clear);
    document.addEventListener('pointerleave', clear);
    return () => { clear(); window.removeEventListener('pointermove', pointer); window.removeEventListener('blur', clear); document.removeEventListener('pointerleave', clear); };
  }, []);
  useEffect(() => {
    let preference: Theme = 'light';
    try {
      const params = new URLSearchParams(window.location.search);
      const queryTheme = params.get('theme');
      if (queryTheme === 'light' || queryTheme === 'dark') {
        preference = queryTheme;
        localStorage.setItem(storageKey, queryTheme);
      } else {
        const stored = localStorage.getItem(storageKey);
        preference = stored ? valid(stored) : 'light';
      }
    } catch { /* Privacy mode */ }
    const apply = () => {
      const dark = preference === 'dark';
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', dark);
      updateTheme(preference);
    };
    const change = (event: Event) => { preference = (event as CustomEvent<Theme>).detail; apply(); };
    const sync = (event: StorageEvent) => { if (event.key === storageKey || event.key === null) { preference = valid(event.newValue); apply(); } };
    apply();
    window.addEventListener('printbot-theme', change);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('printbot-theme', change);
      window.removeEventListener('storage', sync);
    };
  }, []);
  const setTheme = (value: Theme) => {
    try { localStorage.setItem(storageKey, value); } catch { /* Still works without persistence */ }
    window.dispatchEvent(new CustomEvent('printbot-theme', { detail: value }));
  };
  return <ThemeContext.Provider value={{ theme, setTheme }}><MotionConfig reducedMotion="user"><div className="pb-theme-root"><StudioBackdrop />{children}</div></MotionConfig></ThemeContext.Provider>;
}

export function ThemeSwitch() {
  const { theme, setTheme } = useContext(ThemeContext);
  return <div className="pb-theme-switch" role="group" aria-label="Appearance">
    {([{ value: 'light', Icon: Sun, label: 'Light' }, { value: 'dark', Icon: Moon, label: 'Dark' }] as const).map(({ value, Icon, label }) =>
      <button id={`theme-btn-${value}`} key={value} type="button" aria-label={`${label} theme`} aria-pressed={theme === value} title={`${label} theme`} onClick={() => setTheme(value)}><Icon size={16} aria-hidden="true" /><span>{label}</span></button>
    )}
  </div>;
}
