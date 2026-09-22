import { useEffect, useRef, useState } from 'react'
import { m as motion, useInView, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import { REVEAL_FAILSAFE_MS, fadeUp, inView, inViewProps, stagger } from '@/lib/motion'
import { skipEntranceAnimation } from '@/lib/ssr'

export function Container({ className, children }) {
  return <div className={cn('mx-auto w-full max-w-7xl px-5 sm:px-8', className)}>{children}</div>
}

export function useReveal() {
  const ref = useRef(null)
  const reducedMotion = useReducedMotion()
  // Prerendered content is already on screen: never hide it to fade it back.
  const [alreadyPainted] = useState(skipEntranceAnimation)
  const observed = useInView(ref, { once: true, amount: 0 })
  const [failsafe, setFailsafe] = useState(false)

  // If the observer never fires (print, some crawlers, odd layouts), reveal
  // anyway after a moment so content can never stay invisible. The state is
  // only set from the timer callback, never synchronously in the effect.
  useEffect(() => {
    if (reducedMotion || alreadyPainted) return undefined
    const timer = setTimeout(() => setFailsafe(true), REVEAL_FAILSAFE_MS)
    return () => clearTimeout(timer)
  }, [reducedMotion, alreadyPainted])

  const still = reducedMotion || alreadyPainted
  const visible = still || observed || failsafe
  return [ref, { initial: still ? false : 'hidden', animate: visible ? 'visible' : 'hidden' }]
}

export function Section({ id, tone = 'base', className, children }) {
  const [revealRef, reveal] = useReveal()

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
        <motion.div ref={revealRef} variants={stagger()} initial={reveal.initial} animate={reveal.animate}>
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
  // Each page needs exactly one <h1> (its main topic, for search engines and
  // screen readers). Pass as="h1" on the page's top heading.
  as: Heading = 'h2',
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

      <Heading className="text-balance text-4xl leading-[0.95] sm:text-5xl lg:text-6xl">
        <span className="block text-white">{title}</span>
        {accent && <span className="block text-brand-500 text-glow-brand">{accent}</span>}
      </Heading>

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

export { motion, fadeUp, inView, inViewProps, stagger }