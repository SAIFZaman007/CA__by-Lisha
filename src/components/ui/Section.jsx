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
/**
 * Section heading.
 *
 * `title` renders in white and `accent` continues it in brand red on its own
 * line. Splitting the headline this way — rather than embedding markup in a
 * string — keeps the copy translatable and means every section emphasises the
 * same way. Passing only `title` leaves the heading plain.
 */
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