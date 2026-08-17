import { useSeo } from '@/lib/seo'
import { Section } from '@/components/ui/Section'
import { SITE } from '@/data/site'

const UPDATED = 'August 2026'

/**
 * Privacy and terms. These are a starting draft written around how the
 * platform actually handles data — they are not legal advice, and should be
 * reviewed by a solicitor before launch, particularly the health-data and
 * refund clauses.
 */
const DOCS = {
  privacy: {
    title: 'Privacy policy',
    description:
      'How Coach Auto collects, stores and protects your personal and health information.',
    intro:
      'Coaching means handling information about your body. This page sets out exactly what is collected, why, who can see it, and how to get it deleted.',
    sections: [
      {
        heading: 'What we collect',
        body: [
          'Account details: your name, email address and password. Passwords are stored as Argon2id hashes and are never readable, including by your coach.',
          'Health and fitness data you enter: height, weight, tape measurements, training logs, meal adherence, sleep entries and cardio sessions.',
          'Check-in photos, if you choose to upload them. Photos are optional; coaching works without them, though progress is harder to assess.',
          'Technical data needed to run the service: IP address and browser type in server logs, kept for security and troubleshooting.',
        ],
      },
      {
        heading: 'Why we collect it',
        body: [
          'To write and adjust your training program and meal plan.',
          'To show you your own progress over time in the client portal.',
          'To let your coach review your check-ins and respond to your messages.',
          'We do not sell your data, share it with advertisers, or use it to train machine-learning models.',
        ],
      },
      {
        heading: 'Who can see your data',
        body: [
          'You, and Coach Auto. Nobody else has access to your measurements, photos or logs.',
          'Check-in photos are served only to your signed-in account through an authenticated request. They are not public URLs, are never indexed by search engines, and location metadata is stripped from every image on upload.',
          'Testimonials on the public site are published only with the client\'s explicit written permission, using first name and last initial.',
        ],
      },
      {
        heading: 'How long it is kept',
        body: [
          'Your data is kept while your account is open, so your history stays intact between coaching blocks.',
          'You can ask for your account and all associated data to be deleted at any time by emailing ' +
            SITE.email +
            '. Deletion is permanent and removes your logs, measurements and photos.',
        ],
      },
      {
        heading: 'Your rights',
        body: [
          'You can request a copy of everything held about you, ask for corrections, or ask for deletion.',
          'Requests are answered within 30 days. Email ' + SITE.email + ' to make one.',
        ],
      },
      {
        heading: 'Cookies',
        body: [
          'One essential cookie keeps you signed in. It is HttpOnly, meaning scripts cannot read it, and it exists solely to maintain your session.',
          'If website analytics are enabled, they are configured to measure page traffic only and never to identify individuals.',
        ],
      },
    ],
  },
  terms: {
    title: 'Terms of service',
    description: 'The terms you agree to when you use Coach Auto coaching services.',
    intro:
      'Plain terms for a coaching service. By creating an account or buying coaching from ' +
      SITE.business +
      ', you agree to what follows.',
    sections: [
      {
        heading: 'Health disclaimer',
        body: [
          'Coach Auto provides fitness coaching, not medical care. Nothing on this site or in the client portal is medical advice, diagnosis or treatment.',
          'Speak to your doctor before starting any new training or nutrition program, particularly if you are pregnant, managing a medical condition, taking medication, or returning from injury.',
          'Stop training and seek medical attention if you experience chest pain, dizziness, faintness or unusual shortness of breath.',
          'The calculators give population-level estimates for healthy adults. They cannot account for your individual medical circumstances.',
        ],
      },
      {
        heading: 'What coaching includes',
        body: [
          'A training program written for your level, a meal plan with macro targets, access to the exercise video library, weekly review of your check-ins, and direct messaging with your coach.',
          'Coaching is delivered online. It does not include in-person training, physiotherapy, medical supervision, or prescription of any supplement or medication.',
        ],
      },
      {
        heading: 'Your responsibilities',
        body: [
          'Give accurate information at intake, including injuries and medical conditions. A program written on inaccurate information can put you at risk.',
          'Train within your capability and stop if something hurts. You are responsible for your own safety in the gym.',
          'Keep your login details to yourself. Your account is for one person.',
        ],
      },
      {
        heading: 'Payment and cancellation',
        body: [
          'Coaching is billed monthly in advance. You can cancel at any time before your next billing date and keep access until the end of the period you have paid for.',
          'Clients who joined at an earlier price keep that price for as long as their coaching runs without a break.',
          'Programs are written specifically for you, so part-months are not refunded once a block has been delivered.',
        ],
      },
      {
        heading: 'Intellectual property',
        body: [
          'Your program, meal plan and the exercise library remain the property of ' +
            SITE.business +
            '. They are licensed for your personal use and may not be resold or redistributed.',
        ],
      },
      {
        heading: 'Ending coaching',
        body: [
          'Either side can end coaching with reasonable notice. Accounts may be closed for abusive conduct toward the coach, or for sharing paid material.',
          'You can export or request a copy of your own data at any time before closing your account.',
        ],
      },
    ],
  },
}

export default function LegalPage({ doc }) {
  const content = DOCS[doc] ?? DOCS.privacy

  useSeo({
    title: content.title,
    description: content.description,
    path: `/${doc}`,
  })

  return (
    <Section tone="raised">
      <div className="max-w-3xl">
        <p className="eyebrow mb-3">Legal</p>
        <h1 className="text-4xl sm:text-5xl">{content.title}</h1>
        <p className="mt-3 text-sm text-chalk-500">Last updated {UPDATED}</p>
        <p className="mt-6 text-lg leading-relaxed text-chalk-400">{content.intro}</p>

        <div className="mt-12 space-y-10">
          {content.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-2xl">{section.heading}</h2>
              <ul className="mt-4 space-y-3">
                {section.body.map((paragraph) => (
                  <li key={paragraph} className="flex gap-3 text-sm leading-relaxed text-chalk-400">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                    <span>{paragraph}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-12 border-t border-ink-700 pt-6 text-sm text-chalk-500">
          Questions about this policy? Email{' '}
          <a href={`mailto:${SITE.email}`} className="text-brand-500 hover:underline">
            {SITE.email}
          </a>
          .
        </p>
      </div>
    </Section>
  )
}
