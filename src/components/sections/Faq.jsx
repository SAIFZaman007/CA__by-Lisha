import { useState } from 'react'
import * as motionLib from 'motion/react'
import { Plus } from 'lucide-react'
import { Section, SectionHeading, motion, fadeUp } from '@/components/ui/Section'
import { FAQS } from '@/data/site'
import { cn } from '@/lib/utils'

const { AnimatePresence } = motionLib

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
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.dd
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28 }}
                    className="overflow-hidden"
                  >
                    <p className="pb-6 pr-10 text-sm leading-relaxed text-chalk-400">{faq.answer}</p>
                  </motion.dd>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </motion.dl>
    </Section>
  )
}
