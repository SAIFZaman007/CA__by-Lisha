import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Section, SectionHeading, motion, fadeUp } from '@/components/ui/Section'
import { FAQS } from '@/data/site'
import { cn } from '@/lib/utils'


export function Faq() {
  const [open, setOpen] = useState(0)

  return (
    <Section id="faq" tone="raised">
      <SectionHeading
        eyebrow="Questions"
        title="Before you start"
        description="The things people ask before their first block of coaching."
        align="center"
      />

      <motion.dl variants={fadeUp} className="mx-auto mt-10 max-w-3xl divide-y divide-ink-600 border-y border-ink-600">
        {FAQS.map((faq, index) => {
          const isOpen = open === index
          return (
            <div key={faq.question}>
              <dt>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left"
                >
                  <span className="font-display text-base uppercase tracking-wide text-white sm:text-lg">
                    {faq.question}
                  </span>
                  <Plus
                    className={cn(
                      'size-4 shrink-0 text-brand-500 transition-transform duration-300',
                      isOpen && 'rotate-45',
                    )}
                    aria-hidden="true"
                  />
                </button>
              </dt>

              <dd
                id={`faq-answer-${index}`}
                className={cn(
                  'grid transition-[grid-template-rows,opacity,visibility] duration-300 ease-out motion-reduce:transition-none',
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'invisible grid-rows-[0fr] opacity-0',
                )}
              >
                <div className="overflow-hidden">
                  <p className="pb-6 pr-10 text-sm leading-relaxed text-chalk-400">{faq.answer}</p>
                </div>
              </dd>
            </div>
          )
        })}
      </motion.dl>
    </Section>
  )
}