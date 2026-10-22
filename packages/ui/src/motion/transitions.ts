/**
 * Motion Engineering Utilities for Xerox PrintFlow UI
 * Built on Motion for React with automatic Reduced-Motion compliance
 */

export const springPhysics = {
  snappy: { type: 'spring', stiffness: 400, damping: 30 },
  smooth: { type: 'spring', stiffness: 260, damping: 20 },
  gentle: { type: 'spring', stiffness: 180, damping: 24 },
  bouncy: { type: 'spring', stiffness: 350, damping: 15 },
};

export const pageFade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: springPhysics.smooth },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

export const modalScale = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: springPhysics.snappy },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.12 } },
};

export const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.015, y: -2, transition: springPhysics.snappy },
  tap: { scale: 0.985, y: 0, transition: { duration: 0.05 } },
};

export const staggeredList = {
  animate: {
    transition: {
      staggerChildren: 0.04,
    },
  },
};

export const staggeredItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: springPhysics.smooth },
};

/**
 * Returns accessible variants that gracefully degrade when reduced motion is preferred.
 */
export function getAccessibleVariants(variants: any, prefersReducedMotion: boolean) {
  if (!prefersReducedMotion) return variants;

  // Flatten motion: replace translation/scale with subtle opacity fade
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.15 } },
    exit: { opacity: 0, transition: { duration: 0.1 } },
  };
}
