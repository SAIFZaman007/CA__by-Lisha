import { useParams, useNavigate, Link } from 'react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, Check } from 'lucide-react'
import { Section, motion, fadeUp } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { Skeleton, EmptyState } from '@/components/ui/Card'
import { CtaForm } from '@/components/sections/CtaForm'
import { api, errorMessage } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { toast } from '@/components/ui/Toast'
import { useSeo } from '@/lib/seo'
import { trackEvent } from '@/lib/analytics'
import { breadcrumbSchema, programSchema } from '@/lib/structuredData'

function price(cents) {
  if (typeof cents !== 'number' || Number.isNaN(cents)) return '—'
  return `$${(cents / 100).toFixed(0)}`
}

export default function ProgramDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const authStatus = useAuth((s) => s.status)

  const {
    data: program,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['program', slug],
    queryFn: () => api.site.program(slug),
    enabled: Boolean(slug),
    retry: (count, failure) => failure?.response?.status !== 404 && count < 3,
  })

  const subscribe = useMutation({
    mutationFn: () => api.billing.checkout(program.id),
    onSuccess: (session) => {
      window.location.href = session.url
    },
    onError: (failure) => toast.error(errorMessage(failure, 'Could not start checkout.')),
  })

  function handleSubscribeClick() {
    if (authStatus !== 'authenticated') {
      navigate('/login', { state: { from: `/programs/${slug}` } })
      return
    }
    trackEvent('begin_checkout', {
      currency: 'USD',
      value: (program.price_cents ?? 0) / 100,
      items: [{ item_id: program.slug, item_name: program.name, price: (program.price_cents ?? 0) / 100 }],
    })
    subscribe.mutate()
  }

  useSeo({
    title: program ? `${program.name} — Online Coaching Programme` : 'Coaching programme',
    description: program
      ? [
          program.tagline && program.tagline.replace(/[.!?]?$/, '.'),
          `${program.days_per_week} training days a week, a meal plan, exercise videos and weekly coach reviews.`,
          `${price(program.price_cents)}/month.`,
        ]
          .filter(Boolean)
          .join(' ')
      : 'Online strength coaching programme from Coach Auto at Autonomy Health and Fitness.',
    path: `/programs/${slug}`,
    image: program?.image_url,
    // Only for a programme that actually loaded: a 404 slug must not be
    // described to crawlers as a purchasable service.
    noIndex: isError,
    jsonLd: program
      ? {
          '@context': 'https://schema.org',
          '@graph': [
            programSchema(program),
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Programmes', path: '/programs' },
              { name: program.name, path: `/programs/${program.slug}` },
            ]),
          ],
        }
      : undefined,
  })

  let body

  if (isLoading) {
    body = <Skeleton className="h-100" />
  } else if (isError || !program) {
    const notFound = error?.response?.status === 404
    body = (
      <EmptyState
        title={notFound ? 'That programme does not exist' : 'That programme did not load'}
        description={
          notFound
            ? 'It may have been renamed. Have a look at the current levels.'
            : 'Something went wrong on our side. The full list of levels is still available.'
        }
        action={<Button to="/programs">See all programmes</Button>}
      />
    )
  } else {
    const features = program.features ?? []

    body = (
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

            {features.length > 0 && (
              <>
                <h2 className="mt-12 text-2xl">What is included</h2>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-chalk-200">
                      <Check className="mt-0.5 size-4 shrink-0 text-brand-500" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <aside className="h-fit rounded-xl border border-ink-600 bg-ink-800 p-7 lg:sticky lg:top-28">
            <p>
              <span className="font-display text-4xl font-bold text-brand-500">
                {price(program.price_cents)}
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
            <Button
              onClick={handleSubscribeClick}
              loading={subscribe.isPending}
              variant="outline"
              fullWidth
              size="lg"
              className="mt-3"
            >
              Subscribe now
            </Button>
          </aside>
        </div>
      </motion.div>
    )
  }

  return (
    <>
      <Section className="pt-36">{body}</Section>
      <CtaForm />
    </>
  )
}