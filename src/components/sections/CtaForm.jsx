import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from '@/components/ui/Toast'
import { Check, Lock, Mail } from 'lucide-react'
import { InstagramIcon } from '@/components/ui/icons'
import { Container, motion, fadeUp, inView, stagger } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Field'
import { api, errorMessage } from '@/lib/api'
import { SITE } from '@/data/site'

const schema = z.object({
  full_name: z.string().min(2, 'Tell Coach Auto what to call you.'),
  email: z.email('Enter an email address that works.'),
  phone: z.string().max(40).optional().or(z.literal('')),
  level_interest: z.enum(['level_1', 'level_2', 'level_3']).optional().or(z.literal('')),
  primary_goal: z.string().max(120).optional().or(z.literal('')),
  message: z.string().max(2000).optional().or(z.literal('')),
  consent_marketing: z.boolean().optional(),
  website: z.string().max(200).optional(), // honeypot
})

const NEXT_STEPS = [
  {
    title: 'You send your details',
    detail: 'Thirty seconds. Nothing you need to prepare or look up first.',
  },
  {
    title: 'Coach Auto reads them',
    detail: 'A real assessment of which level fits your training history — not a template reply.',
  },
  {
    title: 'You get an honest answer',
    detail: 'Including if coaching is not right for you yet. Within one business day.',
  },
]

const PROMISES = [
  'A reply within one business day',
  'An honest read on which level fits you',
  'No pressure, no automated sales sequence',
]

export function CtaForm({ heading = 'Ready to start your transformation?' }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { level_interest: '', consent_marketing: false, website: '' },
  })

  const mutation = useMutation({
    mutationFn: (values) =>
      api.site.createLead({
        ...values,
        phone: values.phone || null,
        level_interest: values.level_interest || null,
        primary_goal: values.primary_goal || null,
        message: values.message || null,
      }),
    onSuccess: (data) => {
      toast.success(data.message ?? 'Your details are with Coach Auto.')
      reset()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  return (
    <section id="start" className="relative overflow-hidden py-20 sm:py-28">
      <div className="absolute inset-0">
        <img
          src="/images/coach-auto-gym-2.jpg"
          alt=""
          className="size-full object-cover object-center opacity-25"
          loading="lazy"
          width="900"
          height="1373"
        />
        <div className="absolute inset-0 bg-linear-to-r from-ink-950 via-ink-950/95 to-ink-950/80" />
      </div>

      <Container className="relative z-10">
        <motion.div variants={stagger()} {...inView} className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <motion.div variants={fadeUp}>
            <div className="mb-4 flex items-center gap-3">
              <span className="h-0.5 w-8 bg-brand-500" aria-hidden="true" />
              <span className="eyebrow">Start here</span>
            </div>
            <h2 className="text-balance text-4xl sm:text-5xl lg:text-6xl">{heading}</h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-chalk-400">
              Send your details and Coach Auto will come back with an honest assessment of where
              to start and what the first block would look like.
            </p>

            <ul className="mt-8 space-y-3">
              {PROMISES.map((promise) => (
                <li key={promise} className="flex items-center gap-3 text-sm text-chalk-200">
                  <Check className="size-4 shrink-0 text-brand-500" aria-hidden="true" />
                  {promise}
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-col gap-3 text-sm sm:flex-row sm:gap-6">
              <a
                href={`mailto:${SITE.email}`}
                className="inline-flex items-center gap-2 text-chalk-400 transition-colors hover:text-brand-500"
              >
                <Mail className="size-4" aria-hidden="true" />
                {SITE.email}
              </a>
              <a
                href={SITE.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-chalk-400 transition-colors hover:text-brand-500"
              >
                <InstagramIcon className="size-4" aria-hidden="true" />
                {SITE.instagramHandle}
              </a>
            </div>

            {/* This column used to end here, leaving a tall empty rectangle beside
                the form. Setting out what happens after submitting fills it with
                the thing a hesitant visitor most wants to know. */}
            <div className="mt-10 rounded-xl border border-ink-600 bg-ink-900/70 p-6 backdrop-blur">
              <h3 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-white">
                What happens next
              </h3>
              <ol className="mt-5 space-y-5">
                {NEXT_STEPS.map((step, index) => (
                  <li key={step.title} className="flex gap-4">
                    <span
                      className="grid size-7 shrink-0 place-items-center rounded-full border border-brand-500/40 bg-brand-500/10 font-display text-xs font-bold text-brand-500"
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-white">{step.title}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-chalk-400">
                        {step.detail}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>

              <p className="mt-6 flex items-start gap-2 border-t border-ink-600 pt-5 text-xs leading-relaxed text-chalk-500">
                <Lock className="mt-0.5 size-3.5 shrink-0 text-chalk-500" aria-hidden="true" />
                Your details go to Coach Auto only. No mailing list, no third parties, and you can
                ask for them to be deleted at any time.
              </p>
            </div>
          </motion.div>

          <motion.div variants={fadeUp}>
            <form
              onSubmit={handleSubmit((values) => mutation.mutate(values))}
              noValidate
              className="space-y-4 rounded-xl border border-ink-600 bg-ink-800/95 p-6 backdrop-blur sm:p-8"
            >
              <h3 className="font-display text-lg uppercase tracking-wide text-white">
                Get a coaching call
              </h3>

              <Input label="Full name" required {...register('full_name')} error={errors.full_name?.message} />
              <Input
                label="Email address"
                type="email"
                required
                autoComplete="email"
                placeholder="you@email.com"
                {...register('email')}
                error={errors.email?.message}
              />
              <Input
                label="Phone (optional)"
                type="tel"
                autoComplete="tel"
                {...register('phone')}
                error={errors.phone?.message}
              />
              <Select label="Level you are interested in" {...register('level_interest')}>
                <option value="">Not sure — help me choose</option>
                <option value="level_1">Level 1 — Beginner, 3 days</option>
                <option value="level_2">Level 2 — Intermediate, 4 days</option>
                <option value="level_3">Level 3 — Advanced, 5–6 days</option>
              </Select>
              <Input
                label="Your main goal"
                placeholder="Lose fat, build strength, prep for stage…"
                {...register('primary_goal')}
                error={errors.primary_goal?.message}
              />
              <Textarea
                label="Anything Coach Auto should know?"
                rows={5}
                placeholder="Training history, injuries, schedule…"
                {...register('message')}
              />

              {/* Bots fill this in; people never see it. */}
              <div className="absolute left-[-9999px]" aria-hidden="true">
                <label htmlFor="website">Leave this field empty</label>
                <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
              </div>

              <label className="flex cursor-pointer items-start gap-3 text-xs text-chalk-400">
                <input
                  type="checkbox"
                  {...register('consent_marketing')}
                  className="mt-0.5 size-4 shrink-0 rounded border-ink-500 bg-ink-850 accent-brand-500"
                />
                Send me occasional training and nutrition tips. You can stop this at any time.
              </label>

              <Button type="submit" fullWidth size="lg" loading={mutation.isPending}>
                Send my details
              </Button>
            </form>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  )
}