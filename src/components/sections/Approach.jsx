import { Section, SectionHeading, motion, fadeUp } from '@/components/ui/Section'
import { PROCESS } from '@/data/site'

/**
 * The four stages are a genuine sequence — assessment has to precede the
 * programme, and the review loop only exists because the work came first — so
 * numbering them carries real information rather than decorating the list.
 */
export function Approach() {
  return (
    <Section id="approach">
      <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <SectionHeading
            eyebrow="How coaching works"
            title="Coaching built from the inside out"
            description="No template plans. Coach Auto assesses where you are, writes the work, and reads what comes back every week."
          />

          <motion.ol variants={fadeUp} className="mt-10 space-y-8">
            {PROCESS.map((item, index) => (
              <li key={item.step} className="flex gap-5">
                <span
                  className="mt-1 shrink-0 font-display text-sm font-bold tabular-nums text-brand-500"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="border-l border-ink-600 pl-5">
                  <h3 className="text-lg text-white">{item.step}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-chalk-400">{item.detail}</p>
                </div>
              </li>
            ))}
          </motion.ol>
        </div>

        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4 self-center">
          <img
            src="/images/coach-auto-gym-1.jpg"
            alt="Coach Auto training in the gym"
            className="col-span-1 h-full max-h-96 w-full rounded-xl border border-ink-600 object-cover"
            loading="lazy"
            width="900"
            height="1238"
          />
          <div className="grid gap-4">
            <img
              src="/images/coach-auto-gym-3.jpg"
              alt="Coach Auto between working sets"
              className="h-full w-full rounded-xl border border-ink-600 object-cover"
              loading="lazy"
              width="900"
              height="1466"
            />
            <div className="rounded-xl border border-ink-600 bg-ink-800 p-5">
              <p className="font-display text-3xl font-bold text-brand-500">Weekly</p>
              <p className="mt-1 text-xs leading-snug text-chalk-400">
                Every log and check-in is reviewed, then the programme is adjusted.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  )
}
