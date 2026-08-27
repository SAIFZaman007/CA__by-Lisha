import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { CalendarCheck, Mail, MessageSquare } from 'lucide-react'
import { InstagramIcon } from '@/components/ui/icons'

import { api, errorMessage } from '@/lib/api'
import { useSeo } from '@/lib/seo'
import { breadcrumbSchema } from '@/lib/structuredData'
import { Section, SectionHeading } from '@/components/ui/Section'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Field'
import { SITE } from '@/data/site'
import { toast } from '@/components/ui/Toast'

function BookingForm() {
  const [done, setDone] = useState(false)
  // Earliest bookable slot is tomorrow. The lazy initialiser reads the clock
  // once on mount, so render itself stays pure.
  const [earliest] = useState(() =>
    new Date(Date.now() + 86_400_000).toISOString().slice(0, 16),
  )
  const { register, handleSubmit, formState: { errors } } = useForm()

  const book = useMutation({
    mutationFn: api.site.createBooking,
    onSuccess: () => setDone(true),
    onError: (error) => toast.error(errorMessage(error)),
  })

  if (done) {
    return (
      <div className="py-6 text-center">
        <CalendarCheck className="mx-auto size-10 text-signal-green" aria-hidden="true" />
        <p className="mt-4 font-display text-xl text-chalk-50 uppercase">Request sent</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-chalk-400">
          Coach Auto will confirm your slot by email. If the time no longer works, just reply to
          that email and suggest another.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit((values) =>
        book.mutate({
          name: values.name.trim(),
          email: values.email.trim(),
          phone: values.phone || null,
          preferred_at: new Date(values.preferred_at).toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          topic: values.topic || null,
        }),
      )}
      className="space-y-4"
      noValidate
    >
      <Input
        label="Your name"
        error={errors.name?.message}
        {...register('name', { required: 'Enter your name.' })}
      />
      <Input
        label="Email"
        type="email"
        error={errors.email?.message}
        {...register('email', { required: 'Enter your email address.' })}
      />
      <Input label="Phone (optional)" type="tel" {...register('phone')} />
      <Input
        label="Preferred date and time"
        type="datetime-local"
        min={earliest || undefined}
        hint={`Times are read in your own timezone (${Intl.DateTimeFormat().resolvedOptions().timeZone}).`}
        error={errors.preferred_at?.message}
        {...register('preferred_at', { required: 'Pick a date and time.' })}
      />
      <Textarea
        label="What would you like to talk about?"
        rows={3}
        placeholder="Your goals, your training history, anything you want to ask before starting."
        {...register('topic')}
      />
      <Button type="submit" fullWidth loading={book.isPending}>
        Request this time
      </Button>
    </form>
  )
}

export default function ContactPage() {
  useSeo({
    title: 'Contact Coach Auto',
    description:
      'Book a chat with Coach Auto or send a message. Online strength and nutrition coaching from Autonomy Health and Fitness.',
    path: '/contact',
    jsonLd: breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Contact', path: '/contact' },
    ]),
  })

  return (
    <Section tone="raised">
      <SectionHeading
        eyebrow="Get in touch"
        title="Talk to Coach Auto"
        description="Book a time to chat, or send a message and get a reply within one business day."
        align="center"
      />

      <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_minmax(0,420px)]">
        <div className="space-y-5">
          <Card>
            <CardBody>
              <Mail className="size-6 text-brand-500" aria-hidden="true" />
              <h3 className="mt-4 text-xl">Email</h3>
              <p className="mt-1.5 text-sm text-chalk-400">
                Questions about programs, pricing or whether coaching suits you.
              </p>
              <a
                href={`mailto:${SITE.email}`}
                className="mt-3 inline-block text-sm font-medium text-brand-500 hover:underline"
              >
                {SITE.email}
              </a>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <InstagramIcon className="size-6 text-brand-500" aria-hidden="true" />
              <h3 className="mt-4 text-xl">Instagram</h3>
              <p className="mt-1.5 text-sm text-chalk-400">
                The account is private. Click through and request to follow — Coach Auto approves
                clients and prospective clients.
              </p>
              <a
                href={SITE.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm font-medium text-brand-500 hover:underline"
              >
                {SITE.instagramHandle}
              </a>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <MessageSquare className="size-6 text-brand-500" aria-hidden="true" />
              <h3 className="mt-4 text-xl">Already a client?</h3>
              <p className="mt-1.5 text-sm text-chalk-400">
                Message your coach directly from inside the portal — it keeps your questions
                attached to your program.
              </p>
              <Button to="/portal/messages" variant="subtle" size="sm" className="mt-4">
                Open my messages
              </Button>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader title="Book a chat" />
          <CardBody>
            <BookingForm />
          </CardBody>
        </Card>
      </div>
    </Section>
  )
}
