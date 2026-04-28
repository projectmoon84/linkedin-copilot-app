/**
 * Motion Variants — centralised animation system
 *
 * All durations, easings, spring configs and reusable variants live here.
 * Import from this file so the whole app feels coherent.
 */

// ─── Easing curves ─────────────────────────────────────────────────────────────
// Based on Material Design / iOS motion principles
export const ease = {
  /** Fast start, gentle landing — for elements entering the screen */
  out: [0.0, 0.0, 0.2, 1.0] as const,
  /** Slow start, fast exit — for elements leaving the screen */
  in: [0.4, 0.0, 1.0, 1.0] as const,
  /** Smooth throughout — for repositioning */
  inOut: [0.4, 0.0, 0.2, 1.0] as const,
  /** Overshoot bounce — for emphatic reveals */
  spring: [0.175, 0.885, 0.32, 1.275] as const,
  /** Snappy linear — only for progress bars */
  linear: [0, 0, 1, 1] as const,
}

// ─── Duration tokens ───────────────────────────────────────────────────────────
export const duration = {
  instant: 0.08,
  fast: 0.15,
  base: 0.25,
  moderate: 0.35,
  slow: 0.5,
  xslow: 0.7,
}

// ─── Spring configs ────────────────────────────────────────────────────────────
export const spring = {
  /** Snappy, high-frequency. Button presses, small UI chrome. */
  snappy: { type: 'spring' as const, stiffness: 400, damping: 30, mass: 1 },
  /** Responsive, balanced. Most layout transitions. */
  responsive: { type: 'spring' as const, stiffness: 300, damping: 28, mass: 1 },
  /** Gentle, editorial. Page-level, card reveals. */
  gentle: { type: 'spring' as const, stiffness: 200, damping: 26, mass: 1 },
  /** Wobbly, playful. Empty states, success states. */
  wobbly: { type: 'spring' as const, stiffness: 180, damping: 12, mass: 1 },
}

// ─── Shared page/route transition variant ─────────────────────────────────────
export const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.moderate, ease: ease.out },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: duration.fast, ease: ease.in },
  },
}

// ─── Card / surface reveal ─────────────────────────────────────────────────────
export const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.moderate, ease: ease.out },
  },
}

// ─── Staggered list container ──────────────────────────────────────────────────
export const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
}

/** Each child in a staggered list */
export const listItemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.moderate, ease: ease.out },
  },
}

// ─── Modal / dialog ────────────────────────────────────────────────────────────
export const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: spring.responsive,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 4,
    transition: { duration: duration.fast, ease: ease.in },
  },
}

export const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.base, ease: ease.out } },
  exit: { opacity: 0, transition: { duration: duration.fast, ease: ease.in } },
}

// ─── Banner / toast slide ──────────────────────────────────────────────────────
export const bannerVariants = {
  hidden: { opacity: 0, y: -12, scaleY: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scaleY: 1,
    transition: spring.responsive,
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: duration.fast, ease: ease.in },
  },
}

// ─── Fade only ─────────────────────────────────────────────────────────────────
export const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.base, ease: ease.out } },
  exit: { opacity: 0, transition: { duration: duration.fast, ease: ease.in } },
}

// ─── Scale pop (for empty states / success) ───────────────────────────────────
export const popVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: spring.wobbly,
  },
}

// ─── Sidebar nav item ──────────────────────────────────────────────────────────
export const navItemVariants = {
  hidden: { opacity: 0, x: -6 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: duration.base, ease: ease.out },
  },
}

// ─── Staggered nav container ───────────────────────────────────────────────────
export const navContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.1,
    },
  },
}

// ─── Slide in from right (composer drawer etc.) ───────────────────────────────
export const slideInRightVariants = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: spring.responsive,
  },
  exit: {
    opacity: 0,
    x: 16,
    transition: { duration: duration.fast, ease: ease.in },
  },
}

// ─── Number counter helper ─────────────────────────────────────────────────────
/** Easing function for CountUp: ease-out-cubic */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}
