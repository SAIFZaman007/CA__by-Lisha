import { useSeo } from '@/lib/seo'
import { faqSchema, breadcrumbSchema } from '@/lib/structuredData'
import { Section, SectionHeading } from '@/components/ui/Section'
import { Calculators } from '@/components/sections/Calculators'
import { Button } from '@/components/ui/Button'

const TOOL_FAQS = [
  {
    question: 'How many calories should I eat to lose fat?',
    answer:
      'Most people lose fat steadily on about 20% below their maintenance calories. The calculator here works out your maintenance from the Mifflin-St Jeor formula and your training days, then applies that deficit. Treat it as a starting point and adjust after two weeks based on what the scale and your measurements do.',
  },
  {
    question: 'Is BMI accurate for people who lift weights?',
    answer:
      'Often not. BMI only compares your weight to your height, so it cannot tell muscle from fat. Trained lifters frequently read as overweight while carrying low body fat. Use tape measurements and photos alongside it rather than treating it as a verdict.',
  },
  {
    question: 'How much protein do I need to build muscle?',
    answer:
      'Between 1.8 and 2.2 grams per kilogram of bodyweight covers almost everyone training seriously. The calculator sets protein at the top of that range during a cut, because protein is what protects lean mass when calories are low.',
  },
  {
    question: 'How many calories does cardio burn?',
    answer:
      'It depends on the activity, how hard you go and how much you weigh. The cardio calculator estimates it from the average energy cost of each activity and your bodyweight. A heart-rate monitor or fitness watch will give you a closer figure for your own body.',
  },
]

export default function ToolsPage() {
  useSeo({
    title: 'Free Calorie, Macro & BMI Calculators',
    description:
      'Free fitness calculators from Coach Auto: work out your daily calorie target and macros with the Mifflin-St Jeor formula, check your BMI, and estimate calories burned in cardio.',
    path: '/tools',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Calculators', path: '/tools' },
        ]),
        faqSchema(TOOL_FAQS),
      ],
    },
  })

  return (
    <>
      <Section tone="raised">
        <SectionHeading
          eyebrow="Free tools"
          title="Calorie, macro & BMI calculators"
          description="The same calculators your coach uses to set your targets. Free to use, no account needed."
          align="center"
        />
        <div className="mt-12">
          <Calculators />
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Common questions" title="Getting the numbers right" />
        <dl className="mt-10 grid gap-8 lg:grid-cols-2">
          {TOOL_FAQS.map(({ question, answer }) => (
            <div key={question}>
              <dt className="font-display text-xl font-bold text-chalk-50 uppercase">{question}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-chalk-400">{answer}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-14 rounded-xl border border-ink-700 bg-ink-850 p-8 text-center">
          <h3 className="text-2xl">Want these numbers set for you?</h3>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-chalk-400">
            Coaching clients get their targets written into a meal plan, reviewed every week, and
            adjusted as their weight and measurements change.
          </p>
          <Button to="/programs" size="lg" className="mt-6">
            See coaching programs
          </Button>
        </div>
      </Section>
    </>
  )
}
