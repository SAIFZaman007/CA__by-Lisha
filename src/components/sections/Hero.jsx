import * as motionLib from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Section'
import { STATS } from '@/data/site'
import { EASE } from '@/lib/motion'

const { motion } = motionLib

/**
 * The hero opens on the coach herself, mid-session, in her own gym — the most
 * characteristic thing in this subject's world. The headline is set in three
 * hard lines so the eye lands on "results" last.
 */
export function Hero() {
  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden pt-24">
      {/* Background photograph */}
      <div className="absolute inset-0">
        <img
          src="/images/hero-coach-auto.jpg"
          alt="Coach Auto training in the gym"
          className="size-full object-cover object-center"
          width="720"
          height="976"
          fetchPriority="high"
          decoding="async"
        />
        {/* Two gradients rather than one flat scrim: keeps detail in the photo
            on the right while the copy stays legible on the left. */}
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/85 to-ink-950/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-transparent to-ink-950/70" />
      </div>

      <Container className="relative z-10">
        <div className="max-w-2xl py-16">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="mb-6 flex items-center gap-3"
          >
            <span className="h-0.5 w-10 bg-brand-500" aria-hidden="true" />
            <span className="eyebrow text-chalk-200">Autonomy Health &amp; Fitness</span>
          </motion.div>

          <h1 className="text-balance text-5xl leading-[0.92] sm:text-6xl lg:text-7xl">
            {['Built on', 'discipline.', 'Delivered', 'with results.'].map((line, index) => (
              <motion.span
                key={line}
                className="block"
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 + index * 0.09, ease: EASE }}
              >
                <span className={index === 1 ? 'text-brand-500' : 'text-white'}>{line}</span>
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
            className="mt-7 max-w-xl text-base leading-relaxed text-chalk-200 sm:text-lg"
          >
            Online strength and bodybuilding coaching for lifters at every level. A programme
            written for you, a meal plan that fits your week, and a coach reading your numbers
            every single week.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: EASE }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Button to="/contact" size="lg">
              Start coaching
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            <Button to="/programs" variant="outline" size="lg">
              See the programmes
            </Button>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-14 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-ink-600/70 pt-9 sm:grid-cols-4"
          >
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block font-display text-3xl font-bold text-brand-500 sm:text-4xl">
                    {stat.value}
                  </span>
                  <span className="mt-1 block text-xs leading-snug text-chalk-400">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>
      </Container>
    </section>
  )
}
