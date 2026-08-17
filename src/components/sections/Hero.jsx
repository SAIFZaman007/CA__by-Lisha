import * as motionLib from 'motion/react'
import { ArrowRight, Play, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Section'
import { STATS } from '@/data/site'
import { EASE } from '@/lib/motion'

const { motion } = motionLib

/**
 * Split editorial hero.
 *
 * The previous version stretched a 720×976 phone photo across the full viewport.
 * At 1920px wide that is a ~0.7MP image covering 2MP of screen, upscaled and
 * cropped to a slice — which is what made it read as amateur no matter how the
 * gradients were tuned.
 *
 * This layout works with the photography instead of against it: the portrait is
 * shown at its native 4:5 in a framed card at the size it can actually support,
 * from the highest-resolution source available (1570×2160). A heavily blurred
 * copy provides the ambient backdrop, where low resolution costs nothing because
 * it is out of focus by design. The result is a composition that looks
 * deliberate rather than an image that has been forced.
 */
export function Hero() {
  return (
    <section className="relative isolate flex min-h-[92vh] items-center overflow-hidden pt-28 pb-16 lg:pt-32">
      {/* --- Ambient background ------------------------------------------- */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <img
          src="/images/hero-ambient.jpg"
          alt=""
          className="size-full scale-110 object-cover opacity-40"
          width="960"
          height="540"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-ink-950/70" />
        <div className="absolute inset-0 bg-linear-to-b from-ink-950/90 via-transparent to-ink-900" />
        <div className="bg-grid absolute inset-0 opacity-60" />
        {/* Red bloom anchored behind the portrait, tying the photo to the brand. */}
        <div className="bloom-brand absolute top-1/4 -right-24 hidden size-130 rounded-full blur-2xl lg:block" />
      </div>

      <Container className="relative">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* --- Copy ------------------------------------------------------ */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="mb-6 flex items-center gap-3"
            >
              <span className="h-0.5 w-10 bg-brand-500" aria-hidden="true" />
              <span className="eyebrow text-chalk-200">Autonomy Health &amp; Fitness</span>
            </motion.div>

            <h1 className="text-balance text-5xl leading-[0.92] sm:text-6xl xl:text-7xl">
              {[
                { line: 'Built on', accent: false },
                { line: 'discipline.', accent: true },
                { line: 'Delivered', accent: false },
                { line: 'with results.', accent: false },
              ].map(({ line, accent }, index) => (
                <motion.span
                  key={line}
                  className="block"
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 + index * 0.09, ease: EASE }}
                >
                  <span className={accent ? 'text-brand-500 text-glow-brand' : 'text-white'}>
                    {line}
                  </span>
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

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.75 }}
              className="mt-6 flex items-center gap-2 text-xs text-chalk-500"
            >
              <ShieldCheck className="size-4 text-brand-500" aria-hidden="true" />
              No lock-in contract. Cancel any time before your next billing date.
            </motion.p>
          </div>

          {/* --- Portrait -------------------------------------------------- */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: EASE }}
            className="relative mx-auto w-full max-w-md lg:max-w-none"
          >
            {/* Offset red frame — one flourish, echoing the brand rule. */}
            <div
              className="absolute -inset-3 -z-10 rounded-2xl border border-brand-500/30"
              aria-hidden="true"
            />

            <figure className="relative aspect-4/5 overflow-hidden rounded-2xl border border-ink-600 shadow-2xl shadow-black/60">
              <img
                src="/images/hero-portrait.png"
                alt="Coach Auto training in her gym"
                className="size-full object-cover object-[center_20%]"
                width="1200"
                height="1500"
                fetchPriority="high"
                decoding="async"
              />
              <div
                className="absolute inset-0 bg-linear-to-t from-ink-950/70 via-transparent to-transparent"
                aria-hidden="true"
              />

              <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5">
                <span>
                  <span className="block font-display text-lg font-bold tracking-wide text-white">
                    Coach Auto
                  </span>
                  <span className="block text-xs text-chalk-400">
                    Certified coach
                  </span>
                </span>
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-500/90 text-white">
                  <Play className="size-4 fill-current" aria-hidden="true" />
                </span>
              </figcaption>
            </figure>

            {/* Floating proof chip. Sits over the frame on wide screens only, so
                it never overlaps the subject's face on a phone. */}
            <div className="mt-4 rounded-xl border border-ink-600 bg-ink-850/90 p-4 backdrop-blur lg:absolute lg:-bottom-8 lg:-left-8 lg:mt-0 lg:w-56">
              <p className="font-display text-2xl font-bold text-brand-500">Weekly</p>
              <p className="mt-1 text-xs leading-snug text-chalk-400">
                Every log and check-in reviewed by a person, then the programme adjusted.
              </p>
            </div>
          </motion.div>
        </div>

        {/* --- Stats ------------------------------------------------------- */}
        <motion.dl
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.85 }}
          className="mt-16 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-ink-600/70 pt-9 sm:grid-cols-4 lg:mt-20"
        >
          {STATS.map((stat) => (
            <div key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <span className="block font-display text-3xl font-bold text-brand-500 sm:text-4xl">
                  {stat.value}
                </span>
                <span className="mt-1 block text-xs leading-snug text-chalk-400">{stat.label}</span>
              </dd>
            </div>
          ))}
        </motion.dl>
      </Container>
    </section>
  )
}