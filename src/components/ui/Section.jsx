import * as motionLib from 'motion/react'
import { cn } from '@/lib/utils'
import { fadeUp, inView, stagger } from '@/lib/motion'

const { motion } = motionLib

export function Container({ className, children }) {
  return <div className={cn('mx-auto w-full max-w-7xl px-5 sm:px-8', className)}>{children}</div>
}

/**
 * A page section with the shared scroll reveal already wired up.
 * `tone="raised"` lifts the background one step for alternating bands.
 */
export function Section({ id, tone = 'base', className, children }) {
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
        <motion.div variants={stagger()} {...inView}>
          {children}
        </motion.div>
      </Container>
    </section>
  )
}

/**
 * Section heading. The eyebrow carries a red stress line — the one repeated
 * flourish on the site, echoing a loaded bar.
 */
export function SectionHeading({ eyebrow, title, description, align = 'left', className }) {
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
      <h2 className="text-balance text-4xl sm:text-5xl lg:text-6xl">{title}</h2>
      {description && (
        <p className="mt-5 text-base leading-relaxed text-chalk-400 sm:text-lg">{description}</p>
      )}
    </motion.div>
  )
}

export { motion, fadeUp, inView, stagger }
