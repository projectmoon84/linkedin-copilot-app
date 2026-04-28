/**
 * Animated — reusable motion wrappers
 *
 * These drop-in wrappers give consistent entrance/exit behaviour across the
 * whole app without repeating variant definitions everywhere.
 */
import { type ReactNode } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  pageVariants,
  cardVariants,
  listVariants,
  listItemVariants,
  fadeVariants,
  popVariants,
  bannerVariants,
  modalVariants,
  backdropVariants,
} from '@/lib/motion-variants'
import { cn } from '@/lib/utils'

// ─── Page transition wrapper ───────────────────────────────────────────────────
interface AnimatedPageProps {
  children: ReactNode
  className?: string
}

export function AnimatedPage({ children, className }: AnimatedPageProps) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Card reveal ───────────────────────────────────────────────────────────────
interface AnimatedCardProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function AnimatedCard({ children, className, delay = 0 }: AnimatedCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Staggered list ────────────────────────────────────────────────────────────
interface AnimatedListProps {
  children: ReactNode
  className?: string
}

export function AnimatedList({ children, className }: AnimatedListProps) {
  return (
    <motion.div
      variants={listVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Wrap each list item with this inside an AnimatedList */
export function AnimatedItem({ children, className }: AnimatedListProps) {
  return (
    <motion.div variants={listItemVariants} className={className}>
      {children}
    </motion.div>
  )
}

// ─── Fade only ─────────────────────────────────────────────────────────────────
export function AnimatedFade({ children, className }: AnimatedListProps) {
  return (
    <motion.div
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Pop / scale (empty states, success icons) ─────────────────────────────────
export function AnimatedPop({ children, className }: AnimatedListProps) {
  return (
    <motion.div
      variants={popVariants}
      initial="hidden"
      animate="visible"
      className={cn('flex flex-col items-center', className)}
    >
      {children}
    </motion.div>
  )
}

// ─── Banner slide (alerts, insights) ──────────────────────────────────────────
interface AnimatedBannerProps {
  children: ReactNode
  className?: string
  show: boolean
}

export function AnimatedBanner({ children, className, show }: AnimatedBannerProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          variants={bannerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Modal wrapper ─────────────────────────────────────────────────────────────
interface AnimatedModalProps {
  children: ReactNode
  className?: string
  show: boolean
  onClose?: () => void
}

export function AnimatedModal({ children, className, show, onClose }: AnimatedModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn('fixed z-50', className)}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Hover lift card ──────────────────────────────────────────────────────────
/** Wraps any element with a subtle lift + shadow on hover */
export function HoverCard({ children, className }: AnimatedListProps) {
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2, ease: [0.0, 0.0, 0.2, 1.0] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Animated presence (generic) ──────────────────────────────────────────────
export { AnimatePresence, motion }
