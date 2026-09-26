import { Award, HeartPulse, ShieldCheck, Users } from 'lucide-react'

import { useSeo } from '@/lib/seo'
import { breadcrumbSchema, profilePageSchema } from '@/lib/structuredData'
import { useState } from 'react'
import { Section, SectionHeading, motion, fadeUp, inViewProps, stagger } from '@/components/ui/Section'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Picture } from '@/components/ui/Picture'
import { KEYWORDS, SITE, PROCESS } from '@/data/site'

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Technique before load',
    body: 'Nobody adds weight until the pattern is right. Every movement in your program has a video, and your coach reviews your form before progressing you.',
  },
  {
    icon: HeartPulse,
    title: 'Recovery counts as training',
    body: 'Sleep and cardio are logged alongside your lifts. When recovery slips, your program is adjusted rather than pushed harder.',
  },
  {
    icon: Users,
    title: 'You move up when you are ready',
    body: 'Level 2 is earned by assessment, not by time served. Beginners stay on three days a week until technique and recovery can carry a fourth.',
  },
  {
    icon: Award,
    title: 'Coached, not automated',
    body: 'A real coach writes your program and reads your check-ins. The software is here to keep the record straight, not to replace the coaching.',
  },
]

export default function AboutPage() {
  const [reveal] = useState(inViewProps)
  useSeo({
    title: SITE.coach?.name
      ? `${SITE.coach.name} — Online Strength & Bodybuilding Coach`
      : 'About Coach Auto',
    description:
      'Meet Lisha Chesson, the certified strength and bodybuilding coach behind Coach Auto (Autonomy Health and Fitness), coaching clients online worldwide.',
    path: '/about',
    type: 'profile',
    keywords: KEYWORDS.about,
    // Organization/WebSite/Person arrive with every page (lib/seo.js); this
    // page adds that it IS her profile, which is what Google's ProfilePage
    // type exists to say.
    jsonLd: [
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'About', path: '/about' },
      ]),
      profilePageSchema(),
    ].filter(Boolean),
  })

  return (
    <>
      <Section tone="raised">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <motion.p variants={fadeUp} className="eyebrow mb-3">
              About {SITE.brand} · {SITE.alternateNames[0]}
            </motion.p>
            {/* Her name is the heading: this is the page a search for
                "Lisha Chesson" should land on, and the <h1> is where a search
                engine looks first to decide what a page is about. */}
            <motion.h1 variants={fadeUp} className="text-4xl sm:text-6xl">
              {SITE.coach?.name ? (
                <>
                  Meet {SITE.coach.name}.{' '}
                  <span className="text-brand-500">Coaching built from the inside out.</span>
                </>
              ) : (
                <>
                  Coaching built from{' '}
                  <span className="text-brand-500">the inside out.</span>
                </>
              )}
            </motion.h1>
            <motion.div variants={fadeUp} className="mt-6 space-y-4 text-chalk-400">
              <p className="text-lg leading-relaxed">
                Coach Auto is the online coaching arm of {SITE.business} — known to many
                simply as Autonomy Fitness. It exists for people
                who want to get strong properly — with a program written for them, food they can
                actually stick to, and someone reading their progress every week.
              </p>
              {SITE.coach?.name && (
                <p className="leading-relaxed">
                  Coach Auto is founded and run by{' '}
                  <strong className="text-chalk-100">{SITE.coach.name}</strong>, a{' '}
                  {SITE.coach.jobTitle.toLowerCase()}. She writes every programme and meal plan
                  herself and reads every client check-in — the coach you message is the coach
                  who wrote your plan.
                </p>
              )}
              <p className="leading-relaxed">
                Coaching is delivered entirely online, which means the standard does not depend on
                living near a particular gym. Your program, your meal plan, your measurements,
                your photos, your sleep and your cardio all live in one portal, and your coach
                works from the same record you do.
              </p>
              <p className="leading-relaxed">
                Every client starts with an assessment — height, weight, tape measurements and
                starting photos — because a program written without that is a guess. From there
                you are placed at Level 1, 2 or 3 based on what your training age and recovery can
                actually carry.
              </p>
            </motion.div>
          </div>

          {/* --- Certification Visual (Hero style) ----------------------- */}
          <motion.div
            variants={fadeUp}
            className="relative isolate mx-auto w-full max-w-md lg:max-w-none"
          >
            {/* Red bloom anchored behind the certificate, echoing the Hero section */}
            <div
              className="bloom-brand pointer-events-none absolute -inset-6 -z-20 rounded-full blur-2xl opacity-50"
              aria-hidden="true"
            />

            {/* Offset red frame — echoing Hero section style */}
            <div
              className="pointer-events-none absolute -inset-3.5 -z-10 rounded-2xl border-2 border-brand-500/50 shadow-lg shadow-brand-500/10"
              aria-hidden="true"
            />

            <figure className="relative aspect-970/775 overflow-hidden border border-ink-600 shadow-2xl shadow-black/60">
              <Picture
                name="certification"
                alt={`${SITE.coach?.name || 'Coach Auto'} — CPD-accredited Strength & Bodybuilding Coach certificate`}
                sizes="(min-width: 1024px) 45vw, 92vw"
                priority
                className="block size-full"
                imgClassName="size-full object-cover"
              />
            </figure>
          </motion.div>
        </div>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="How we work"
          title="Four things that do not bend"
          description="The coaching philosophy behind every program written here."
        />
        <motion.ul
          {...reveal}
          variants={stagger()}
          className="mt-10 grid gap-5 sm:grid-cols-2"
        >
          {VALUES.map(({ icon: Icon, title, body }) => (
            <motion.li key={title} variants={fadeUp}>
              <Card className="h-full">
                <CardBody>
                  <Icon className="size-6 text-brand-500" aria-hidden="true" />
                  <h3 className="mt-4 text-xl">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-chalk-400">{body}</p>
                </CardBody>
              </Card>
            </motion.li>
          ))}
        </motion.ul>
      </Section>

      <Section tone="raised">
        <SectionHeading
          eyebrow="The process"
          title="What happens after you sign up"
        />
        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS.map((item, index) => (
            <li key={item.step} className="relative">
              <span className="font-display text-5xl font-bold text-[#66666e]" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-2 text-lg">{item.step}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-chalk-400">{item.detail}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 text-center">
          <Button to="/programs" size="lg">
            See the programs
          </Button>
        </div>
      </Section>
    </>
  )
}