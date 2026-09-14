import { useEffect, useRef, useState } from 'react'
import * as motionLib from 'motion/react'
import { cn } from '@/lib/utils'
import { REVEAL_FAILSAFE_MS, fadeUp, inView, stagger } from '@/lib/motion'

const { motion, useInView, useReducedMotion } = motionLib

export function Container({ className, children }) {
  return <div className={cn('mx-auto w-full max-w-7xl px-5 sm:px-8', className)}>{children}</div>
}

export function useReveal() {
  const ref = useRef(null)
  const reducedMotion = useReducedMotion()
  const observed = useInView(ref, { once: true, amount: 0 })
  const [failsafe, setFailsafe] = useState(false)

  useEffect(() => {
    if (reducedMotion) {
      setFailsafe(true)
      return undefined
    }
    const timer = setTimeout(() => setFailsafe(true), REVEAL_FAILSAFE_MS)
    return () => clearTimeout(timer)
  }, [reducedMotion])

  return {
    ref,
    initial: reducedMotion ? false : 'hidden',
    animate: observed || failsafe ? 'visible' : 'hidden',
  }
}

export function Section({ id, tone = 'base', className, children }) {
  const reveal = useReveal()

  return (
    <section
      id={id}
      className={cn(
        'py-20 sm:py-28',
        tone === 'raised' && 'bg-ink-850',
        tone === 'deep' && 'bg-ink-950',
        className,
      )}
    >
      <Container>
        <motion.div ref={reveal.ref} variants={stagger()} initial={reveal.initial} animate={reveal.animate}>
          {children}
        </motion.div>
      </Container>
    </section>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  accent,
  description,
  align = 'left',
  className,
}) {
  return (
    <motion.div
      variants={fadeUp}
      className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center', className)}
    >
      {eyebrow && (
        <div className={cn('mb-4 flex items-center gap-3', align === 'center' && 'justify-center')}>
          <span className="h-0.5 w-8 bg-brand-500" aria-hidden="true" />
          <span className="eyebrow">{eyebrow}</span>
        </div>
      )}

      <h2 className="text-balance text-4xl leading-[0.95] sm:text-5xl lg:text-6xl">
        <span className="block text-white">{title}</span>
        {accent && <span className="block text-brand-500 text-glow-brand">{accent}</span>}
      </h2>

      {description && (
        <p
          className={cn(
            'mt-5 text-base leading-relaxed text-chalk-400 sm:text-lg',
            align === 'center' && 'mx-auto',
          )}
        >
          {description}
        </p>
      )}
    </motion.div>
  )
}

export { motion, fadeUp, inView, stagger }