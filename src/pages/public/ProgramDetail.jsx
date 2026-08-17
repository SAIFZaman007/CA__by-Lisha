import { useParams, Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Check } from 'lucide-react'
import { Section, motion, fadeUp } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { Skeleton, EmptyState } from '@/components/ui/Card'
import { CtaForm } from '@/components/sections/CtaForm'
import { api } from '@/lib/api'
import { useSeo } from '@/lib/seo'

export default function ProgramDetail() {
  const { slug } = useParams()
  const { data: program, isLoading, isError } = useQuery({
    queryKey: ['program', slug],
    queryFn: () => api.site.program(slug),
  })

  useSeo({
    title: program?.name ?? 'Coaching programme',
    description:
      program?.description ??
      'Online strength coaching programme from Coach Auto at Autonomy Health and Fitness.',
    path: `/programs/${slug}`,
    jsonLd: program
      ? {
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: program.name,
          description: program.description,
          serviceType: 'Online strength coaching',
          provider: { '@type': 'Organization', name: 'Autonomy Health and Fitness' },
          offers: {
            '@type': 'Offer',
            price: (program.price_cents / 100).toFixed(2),
            priceCurrency: 'USD',
          },
        }
      : undefined,
  })

  if (isLoading) {
    return (
      <Section className="pt-36">
        <Skeleton className="h-[400px]" />
      </Section>
    )
  }

  if (isError || !program) {
    return (
      <Section className="pt-36">
        <EmptyState
          title="That programme does not exist"
          description="It may have been renamed. Have a look at the current levels."
          action={<Button to="/programs">See all programmes</Button>}
        />
      </Section>
    )
  }

  return (
    <>
      <Section className="pt-36">
        <motion.div variants={fadeUp}>
          <Link
            to="/programs"
            className="mb-8 inline-flex items-center gap-2 text-sm text-chalk-400 transition-colors hover:text-brand-500"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            All programmes
          </Link>

          <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="eyebrow text-brand-500">{program.days_per_week} days per week</p>
              <h1 className="mt-3 text-4xl sm:text-5xl lg:text-6xl">{program.name}</h1>
              <p className="mt-4 text-lg text-chalk-400">{program.tagline}</p>
              <p className="mt-8 max-w-2xl leading-relaxed text-chalk-200">{program.description}</p>

              <h2 className="mt-12 text-2xl">What is included</h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {program.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-chalk-200">
                    <Check className="mt-0.5 size-4 shrink-0 text-brand-500" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <aside className="h-fit rounded-xl border border-ink-600 bg-ink-800 p-7 lg:sticky lg:top-28">
              <p>
                <span className="font-display text-4xl font-bold text-brand-500">
                  ${(program.price_cents / 100).toFixed(0)}
                </span>
                <span className="ml-2 text-sm text-chalk-500">/ {program.billing_period}</span>
              </p>
              <dl className="mt-6 space-y-3 border-t border-ink-600 pt-5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-chalk-500">Training days</dt>
                  <dd className="text-white">{program.days_per_week} per week</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-chalk-500">Session length</dt>
                  <dd className="text-white">~{program.session_minutes} min</dd>
                </div>
                {program.best_for && (
                  <div>
                    <dt className="text-chalk-500">Best for</dt>
                    <dd className="mt-1 text-white">{program.best_for}</dd>
                  </div>
                )}
              </dl>
              <Button to="/contact" fullWidth size="lg" className="mt-7">
                Apply for this level
              </Button>
            </aside>
          </div>
        </motion.div>
      </Section>

      <CtaForm />
    </>
  )
}
