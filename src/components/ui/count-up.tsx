import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  end: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
  decimals?: number
  format?: (value: number) => string
}

export function CountUp({ end, duration = 600, prefix = '', suffix = '', className, decimals = 0, format }: CountUpProps) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)
  const previousRef = useRef(0)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      previousRef.current = end
      rafRef.current = requestAnimationFrame(() => setValue(end))

      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
      }
    }

    const start = performance.now()
    const from = previousRef.current
    const delta = end - from

    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(from + delta * eased)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        previousRef.current = end
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [duration, end])

  const display = format
    ? format(value)
    : value.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })

  return (
    <span className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  )
}
