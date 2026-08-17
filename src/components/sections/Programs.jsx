import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as motionLib from 'motion/react'
import { Check, ArrowRight } from 'lucide-react'
import { Section, SectionHeading, motion, fadeUp } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Card'
import { Figure } from '@/components/ui/Figure'
import { api } from '@/lib/api'
import { keys } from '@/lib/queryClient'
import { cn } from '@/lib/utils'

const { AnimatePresence } = motionLib

const TAB_LABEL = { level_1: 'Level 1', level_2: 'Level 2', level_3: 'Level 3' }

export function Programs() {
  const { data: programs, isLoading } = useQuery({
    queryKey: keys.programs,
    queryFn: api.site.programs,
  })
  const [active, setActive] = useState(0)

  if (isLoading) {
    return (
      <Section id="programs" tone="raised">
        <SectionHeading eyebrow="Coaching programmes" title="Three levels." accent="One standard." />
        <Skeleton className="mt-10 h-96 w-full" />
      </Section>
    )
  }

  if (!programs?.length) return null
  const program = programs[active] ?? programs[0]
  const price = (program.price_cents / 100).toFixed(0)

  return (
    <Section id="programs" tone="raised">
      <SectionHeading
        eyebrow="Coaching programmes"
        title="Three levels."
        accent="One standard."
        description="You start where your training history puts you and move up when Coach Auto assesses you are ready — not before."
      />

      {/* Tabs */}
      <motion.div variants={fadeUp} className="mt-10 flex flex-wrap gap-2" role="tablist" aria-label="Coaching levels">
        {programs.map((item, index) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={index === active}
            aria-controls={`program-panel-${item.slug}`}
            onClick={() => setActive(index)}
            className={cn(
              'rounded-md border px-5 py-2.5 font-display text-sm font-semibold uppercase tracking-widest transition-colors',
              index === active
                ? 'border-brand-500 bg-brand-500 text-white'
                : 'border-ink-600 text-chalk-400 hover:border-ink-500 hover:text-white',
            )}
          >
            {TAB_LABEL[item.level] ?? item.name}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={program.id}
          id={`program-panel-${program.slug}`}
          role="tabpanel"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_1fr]"
        >
          <div className="rounded-xl border border-ink-600 bg-ink-800 p-7 sm:p-9">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl sm:text-3xl">{program.name}</h3>
                <p className="mt-2 text-sm text-chalk-400">{program.tagline}</p>
              </div>
              {!program.is_accepting_clients && (
                <span className="rounded-full border border-signal-amber/40 bg-signal-amber/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-signal-amber">
                  Waitlist
                </span>
              )}
            </div>

            <p className="mt-5 text-sm leading-relaxed text-chalk-400">{program.description}</p>

            <ul className="mt-7 space-y-3">
              {program.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-chalk-200">
                  <Check className="mt-0.5 size-4 shrink-0 text-brand-500" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-ink-600 pt-6">
              <p>
                <span className="font-display text-3xl font-bold text-brand-500">${price}</span>
                <span className="ml-1.5 text-sm text-chalk-500">/ {program.billing_period}</span>
              </p>
              <Button to="/contact">
                Apply for this level
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 self-start">
            <Detail label="Training days" value={`${program.days_per_week} / week`} />
            <Detail label="Session length" value={`${program.session_minutes} min`} />
            <Detail label="Best for" value={program.best_for ?? '—'} span />

            {/* Portrait source shown at a portrait ratio. The old fixed-height
                landscape box cropped the subject down to a horizontal band. */}
            <Figure
              src={`/images/coach-auto-gym-${active + 1}.png`}
              alt={`Coach Auto training — ${program.name}`}
              ratio="portrait"
              focus="upper"
              width={1000}
              height={1333}
              className="col-span-2"
              caption="Every session is written by hand, then reviewed against what you actually lifted."
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </Section>
  )
}

function Detail({ label, value, span }) {
  return (
    <div className={cn('rounded-xl border border-ink-600 bg-ink-850 p-5', span && 'col-span-2')}>
      <p className="font-display text-[11px] font-semibold uppercase tracking-widest text-chalk-500">
        {label}
      </p>
      <p className="mt-2 font-display text-lg text-white">{value}</p>
    </div>
  )
}