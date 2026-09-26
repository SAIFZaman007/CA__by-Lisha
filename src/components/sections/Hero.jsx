import { ArrowRight, Play, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Picture } from '@/components/ui/Picture'
import { Container } from '@/components/ui/Section'
import { SITE, STATS } from '@/data/site'

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
 *
 * Performance (PageSpeed mobile was 60):
 * - No animation library here. The hero is the first paint and the Largest
 *   Contentful Paint; it now animates with CSS only (`.hero-rise`), and only
 *   `transform` — never starting from `opacity: 0`, which is what used to push
 *   LCP back until the JavaScript animation had finished.
 * - The portrait is a responsive AVIF/WebP `<picture>` (≈35–80 KB on a phone)
 *   instead of a 2.6 MB PNG, and is preloaded from index.html.
 */
// The coach's name if the site shows it (SITE.coach.name may be blanked to
// keep it off the site), otherwise the brand.
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
        {/* Red bloom anchored behind the portrait, tying the photo to the brand. */}
        <div className="bloom-brand absolute top-1/4 -right-24 hidden size-130 rounded-full blur-2xl lg:block" />
      </div>

      <Container className="relative">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* --- Copy ------------------------------------------------------ */}
          <div>
            {/* The brand names live INSIDE the <h1>. The page's main heading is
                one of the strongest relevance signals a search engine reads,
                and the slogan alone ("Built on discipline…") told Google
                nothing about who this is. Same visual as the old eyebrow line —
                only the semantics changed. */}
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
              every level. A programme written for you, a meal plan that fits your week, and a
              coach reading your numbers every single week.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button to="/contact" size="lg">
                Start coaching
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <Button to="/programs" variant="outline" size="lg">
                See the programmes
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
                // Eager (it is the desktop LCP), but not "high": on a phone the
                // portrait sits below the headline, and a high-priority 80 KB
                // image there competes with the text that is the mobile LCP.
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

            {/* Floating proof chip. Sits over the frame on wide screens only, so
                it never overlaps the subject's face on a phone. */}
            <div className="mt-4 rounded-xl border border-ink-600 bg-ink-850/90 p-4 backdrop-blur lg:absolute lg:-bottom-8 lg:-left-8 lg:mt-0 lg:w-56">
              <p className="font-display text-2xl font-bold text-brand-500">Weekly</p>
              <p className="mt-1 text-xs leading-snug text-chalk-400">
                Every log and check-in reviewed by a person, then the programme adjusted.
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