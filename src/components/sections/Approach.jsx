import { CheckCircle2, MessageSquare, Repeat } from 'lucide-react'
import { Section, SectionHeading, motion, fadeUp } from '@/components/ui/Section'
import { Figure } from '@/components/ui/Figure'
import { PROCESS } from '@/data/site'

/**
 * The four stages are a genuine sequence — assessment has to precede the
 * programme, and the review loop only exists because the work came first — so
 * numbering them carries real information rather than decorating the list.
 *
 * The right column previously mixed a full-height image with a shorter stacked
 * column, which left a dead rectangle underneath. Both photographs now share one
 * ratio and the supporting cards sit beneath the pair, so the grid resolves.
 */
export function Approach() {
  return (
    <Section id="approach">
      <div className="grid gap-14 lg:grid-cols-2 lg:items-stretch lg:gap-20">
        <div>
          <SectionHeading
            eyebrow="How coaching works"
            title="Coaching built"
            accent="from the inside out"
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

        {/* A flex column, not a stack with `self-start`. The photo pair takes the
            leftover height (`flex-1`), so this column finishes level with the
            process list beside it however long that list grows. */}
        <motion.div variants={fadeUp} className="flex flex-col gap-4">
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-4">
            <Figure
              src="/images/coach-auto-gym-1.png"
              alt="Coach Auto mid-session in her gym"
              ratio="fill"
              focus="upper"
              width={1000}
              height={1333}
            />
            <Figure
              src="/images/coach-auto-gym-3.png"
              alt="Coach Auto between working sets"
              ratio="fill"
              focus="upper"
              width={1000}
              height={1333}
            />
          </div>

          {/* Three short proof cards, each answering a question people actually
              ask before signing up. Fixed height, so all the slack goes to the
              photographs above. */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Repeat,
                stat: 'Weekly',
                copy: 'Every log and check-in reviewed, then the programme adjusted.',
              },
              {
                icon: MessageSquare,
                stat: '1 day',
                copy: 'Typical reply time on messages to your coach.',
              },
              {
                icon: CheckCircle2,
                stat: 'By hand',
                copy: 'No generated plans. A person writes every block.',
              },
            ].map(({ icon: Icon, stat, copy }) => (
              <div key={stat} className="rounded-xl border border-ink-600 bg-ink-800 p-5">
                <Icon className="size-5 text-brand-500" aria-hidden="true" />
                <p className="mt-3 font-display text-xl font-bold text-white">{stat}</p>
                <p className="mt-1 text-xs leading-snug text-chalk-400">{copy}</p>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </Section>
  )
}