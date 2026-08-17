import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { ArrowRight, Check } from 'lucide-react'
import { Section, SectionHeading, motion, fadeUp } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Card'
import { CtaForm } from '@/components/sections/CtaForm'
import { api } from '@/lib/api'
import { keys } from '@/lib/queryClient'
import { useSeo, breadcrumbSchema } from '@/lib/seo'

export default function ProgramsPage() {
  useSeo({
    title: 'Coaching Programmes — Beginner to Advanced',
    description:
      'Three online strength coaching levels: Level 1 trains three days a week, Level 2 four days, Level 3 five to six. Each includes a meal plan, exercise videos and weekly coach reviews.',
    path: '/programs',
    jsonLd: breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Programmes', path: '/programs' },
    ]),
  })

  const { data: programs, isLoading } = useQuery({
    queryKey: keys.programs,
    queryFn: api.site.programs,
  })

  return (
    <>
      <Section className="pt-36">
        <SectionHeading
          eyebrow="Coaching programmes"
          title="Choose the level that matches your training"
          description="Every level runs the same coaching standard — the difference is how many days a week you train and how much volume your body can recover from."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {isLoading
            ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-[520px]" />)
            : programs?.map((program) => (
                <motion.article
                  key={program.id}
                  variants={fadeUp}
                  className="flex flex-col rounded-xl border border-ink-600 bg-ink-800 p-7"
                >
                  <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">
                    {program.days_per_week} days / week
                  </p>
                  <h2 className="mt-3 text-2xl">{program.name}</h2>
                  <p className="mt-2 text-sm text-chalk-400">{program.tagline}</p>

                  <p className="mt-5">
                    <span className="font-display text-3xl font-bold text-white">
                      ${(program.price_cents / 100).toFixed(0)}
                    </span>
                    <span className="ml-1.5 text-sm text-chalk-500">/ {program.billing_period}</span>
                  </p>

                  <ul className="mt-6 grow space-y-2.5">
                    {program.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-chalk-200">
                        <Check className="mt-0.5 size-4 shrink-0 text-brand-500" aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-7 space-y-3">
                    <Button to="/contact" fullWidth>
                      Apply now
                    </Button>
                    <Link
                      to={`/programs/${program.slug}`}
                      className="flex items-center justify-center gap-1.5 text-xs font-medium text-chalk-400 transition-colors hover:text-brand-500"
                    >
                      Full programme detail
                      <ArrowRight className="size-3" aria-hidden="true" />
                    </Link>
                  </div>
                </motion.article>
              ))}
        </div>

        <motion.p variants={fadeUp} className="mt-10 text-sm text-chalk-500">
          Prices are held for existing clients. If rates rise later, you keep the rate you
          started on.
        </motion.p>
      </Section>

      <CtaForm heading="Not sure which level?" />
    </>
  )
}
