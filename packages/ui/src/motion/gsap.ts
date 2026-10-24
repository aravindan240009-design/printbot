'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export interface GsapStaggerOptions {
  selector?: string;
  stagger?: number;
  duration?: number;
  y?: number;
  delay?: number;
  ease?: string;
}

/**
 * Hook to animate staggered child elements using GSAP with automatic reduced-motion detection.
 */
export function useGsapStagger<T extends HTMLElement = HTMLDivElement>(
  options: GsapStaggerOptions = {}
) {
  const containerRef = useRef<T>(null);
  const {
    selector = '> *',
    stagger = 0.08,
    duration = 0.6,
    y = 20,
    delay = 0,
    ease = 'power2.out',
  } = options;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let targets: Element[] = [];
    try {
      if (!selector || selector === '> *') {
        targets = Array.from(el.children);
      } else if (selector.startsWith('>')) {
        const sub = selector.slice(1).trim();
        targets = Array.from(el.children).filter(child => {
          try {
            return child.matches(sub);
          } catch {
            return true;
          }
        });
      } else {
        targets = Array.from(el.querySelectorAll(selector));
      }
    } catch {
      targets = Array.from(el.children);
    }
    if (!targets.length) return;

    const ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        gsap.fromTo(
          targets,
          { opacity: 0 },
          { opacity: 1, duration: 0.25, stagger: 0.04, delay, ease: 'none' }
        );
      } else {
        gsap.fromTo(
          targets,
          { opacity: 0, y },
          { opacity: 1, y: 0, duration, stagger, delay, ease }
        );
      }
    }, el);

    return () => ctx.revert();
  }, [selector, stagger, duration, y, delay, ease]);

  return containerRef;
}

/**
 * Hook to smoothly animate a number using GSAP easing.
 */
export function useGsapCounter(
  targetValue: number,
  options: { duration?: number; decimals?: number } = {}
) {
  const elementRef = useRef<HTMLElement>(null);
  const { duration = 0.8, decimals = 0 } = options;
  const valueRef = useRef({ val: 0 });

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      el.textContent = targetValue.toFixed(decimals);
      valueRef.current.val = targetValue;
      return;
    }

    const ctx = gsap.context(() => {
      gsap.to(valueRef.current, {
        val: targetValue,
        duration,
        ease: 'power3.out',
        onUpdate: () => {
          if (el) {
            el.textContent = valueRef.current.val.toFixed(decimals);
          }
        },
      });
    });

    return () => ctx.revert();
  }, [targetValue, duration, decimals]);

  return elementRef;
}

/**
 * Hook to apply an Awwwards-style magnetic pull effect to interactive elements on hover.
 */
export function useGsapMagnetic<T extends HTMLElement = HTMLButtonElement>(strength = 0.35) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const onMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);
      gsap.to(el, {
        x: x * strength,
        y: y * strength,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    const onMouseLeave = () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.4)',
      });
    };

    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', onMouseLeave);

    return () => {
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseleave', onMouseLeave);
      gsap.killTweensOf(el);
    };
  }, [strength]);

  return ref;
}

/**
 * 3D Parallax tilt effect for showcase cards.
 */
export function useGsapCardTilt<T extends HTMLElement = HTMLDivElement>(maxTilt = 6) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const onMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(el, {
        rotateY: x * maxTilt * 2,
        rotateX: -y * maxTilt * 2,
        transformPerspective: 900,
        duration: 0.35,
        ease: 'power1.out',
      });
    };

    const onMouseLeave = () => {
      gsap.to(el, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.6,
        ease: 'power2.out',
      });
    };

    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', onMouseLeave);

    return () => {
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseleave', onMouseLeave);
      gsap.killTweensOf(el);
    };
  }, [maxTilt]);

  return ref;
}
