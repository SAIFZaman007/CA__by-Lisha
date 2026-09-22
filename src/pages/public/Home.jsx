import { Hero } from '@/components/sections/Hero'
import { Programs } from '@/components/sections/Programs'
import { Included } from '@/components/sections/Included'
import { Approach } from '@/components/sections/Approach'
import { Nutrition } from '@/components/sections/Nutrition'
import { Results } from '@/components/sections/Results'
import { Faq } from '@/components/sections/Faq'
import { CtaForm } from '@/components/sections/CtaForm'
import { Calculators } from '@/components/sections/Calculators'
import { Section, SectionHeading } from '@/components/ui/Section'
import { useSeo } from '@/lib/seo'
import { faqSchema } from '@/lib/structuredData'
import { FAQS } from '@/data/site'

export default function Home() {
  useSeo({
    // No per-page title: the home page uses SITE.defaultTitle, which carries
    // every brand name people search for (Coach Auto, Autonomy Health & Fitness).
    description:
      'Coach Auto by Autonomy Health & Fitness: online strength, bodybuilding and nutrition coaching. Personalised programmes, meal plans and weekly progress reviews.',
    path: '/',
    jsonLd: faqSchema(FAQS),
  })

  return (
    <>
      <Hero />
      <Programs />
      <Included />
      <Approach />
      <Nutrition />

      <Section id="calculator" tone="deep">
        <SectionHeading
          eyebrow="Free tools"
          title="Work out your numbers"
          description="Start with an estimate of what you should be eating and burning. Your coach refines it once training begins."
          align="center"
        />
        <div className="mt-10">
          <Calculators />
        </div>
      </Section>

      <Results />
      <Faq />
      <CtaForm />
    </>
  )
}