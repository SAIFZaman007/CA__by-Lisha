import { ArrowRight, Play, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Picture } from '@/components/ui/Picture'
import { Container } from '@/components/ui/Section'
import { SITE, STATS } from '@/data/site'

const COACH_NAME = SITE.coach?.name || SITE.brand

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[92vh] items-center overflow-hidden pt-28 pb-16 lg:pt-32">
      {/* --- Ambient background ------------------------------------------- */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <Picture
          name="hero-ambient"
          alt=""
          sizes="100vw"
          className="block size-full"
          imgClassName="size-full scale-110 object-cover opacity-40"
          fetchPriority="low"
        />
        <div className="absolute inset-0 bg-ink-950/70" />
        <div className="absolute inset-0 bg-linear-to-b from-ink-950/90 via-transparent to-ink-900" />
        <div className="bg-grid absolute inset-0 opacity-60" />
        <div className="bloom-brand absolute top-1/4 -right-24 hidden size-130 rounded-full blur-2xl lg:block" />
      </div>

      <Container className="relative">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* --- Copy ------------------------------------------------------ */}
          <div>
            <h1 className="text-balance text-5xl leading-[0.92] sm:text-6xl xl:text-7xl">
              <span className="hero-rise mb-6 flex items-center gap-3 leading-normal">
                <span className="h-0.5 w-10 shrink-0 bg-brand-500" aria-hidden="true" />
                <span className="eyebrow text-chalk-200">
                  {SITE.brand} <span aria-hidden="true">·</span> Autonomy Fitness
                </span>
              </span>
              {[
                { line: 'Built on', accent: false },
                { line: 'discipline.', accent: true },
                { line: 'Delivered', accent: false },
                { line: 'with results.', accent: false },
              ].map(({ line, accent }, index) => (
                <span
                  key={line}
                  className="hero-rise block"
                  style={{ animationDelay: `${60 + index * 70}ms` }}
                >
                  <span className={accent ? 'text-brand-500 text-glow-brand' : 'text-white'}>
                    {line}
                  </span>
                  {/* Invisible at the end of a block line, but keeps the words
                      apart in the text a crawler extracts ("Built on
                      discipline.", not "Built ondiscipline."). */}{' '}
                </span>
              ))}
            </h1>

            <p className="mt-7 max-w-xl text-base leading-relaxed text-chalk-200 sm:text-lg">
              Online strength and bodybuilding coaching from certified coach{' '}
              <strong className="font-semibold text-white">{COACH_NAME}</strong>, for lifters at
              every level. A program written for you, a meal plan that fits your week, and a
              coach reading your numbers every single week.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button to="/contact" size="lg">
                Start coaching
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <Button to="/programs" variant="outline" size="lg">
                See the programs
              </Button>
            </div>

            <p className="mt-6 flex items-center gap-2 text-xs text-chalk-500">
              <ShieldCheck className="size-4 text-brand-500" aria-hidden="true" />
              No lock-in contract. Cancel any time before your next billing date.
            </p>
          </div>

          {/* --- Portrait -------------------------------------------------- */}
          <div className="hero-rise relative mx-auto w-full max-w-md lg:max-w-none">
            {/* Offset red frame — one flourish, echoing the brand rule. */}
            <div
              className="absolute -inset-3 -z-10 rounded-2xl border border-brand-500/30"
              aria-hidden="true"
            />

            <figure className="relative aspect-4/5 overflow-hidden rounded-2xl border border-ink-600 shadow-2xl shadow-black/60">
              <Picture
                name="hero-portrait"
                alt={`${COACH_NAME}, strength coach and founder of ${SITE.brand}, training in her gym`}
                sizes="(min-width: 1024px) 40vw, (min-width: 480px) 448px, 92vw"
                priority

                fetchPriority="auto"
                className="block size-full"
                imgClassName="size-full object-cover object-[center_20%]"
              />
              <div
                className="absolute inset-0 bg-linear-to-t from-ink-950/70 via-transparent to-transparent"
                aria-hidden="true"
              />

              <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5">
                <span>
                  <span className="block font-display text-lg font-bold tracking-wide text-white">
                    {COACH_NAME}
                  </span>
                  <span className="block text-xs text-chalk-400">
                    {SITE.brand} · Certified coach
                  </span>
                </span>
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-500/90 text-white">
                  <Play className="size-4 fill-current" aria-hidden="true" />
                </span>
              </figcaption>
            </figure>

            <div className="mt-4 rounded-xl border border-ink-600 bg-ink-850/90 p-4 backdrop-blur lg:absolute lg:-bottom-8 lg:-left-8 lg:mt-0 lg:w-56">
              <p className="font-display text-2xl font-bold text-brand-500">Weekly</p>
              <p className="mt-1 text-xs leading-snug text-chalk-400">
                Every log and check-in reviewed by a person, then the program adjusted.
              </p>
            </div>
          </div>
        </div>

        {/* --- Stats ------------------------------------------------------- */}
        <dl
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
        </dl>
      </Container>
    </section>
  )
}