import {
  Apple,
  CalendarCheck,
  Dumbbell,
  LineChart,
  MessageSquare,
  MonitorPlay,
  Moon,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Section, SectionHeading, motion, fadeUp } from '@/components/ui/Section'
import { api } from '@/lib/api'
import { keys } from '@/lib/queryClient'

const LEVEL_LABEL = { level_1: 'Level 1', level_2: 'Level 2', level_3: 'Level 3' }

function priceSentence(programs) {
  const list = Array.isArray(programs) ? programs : (programs?.items ?? [])
  const tiers = [...list]
    .sort((a, b) => String(a.level).localeCompare(String(b.level)))
    .filter((p) => LEVEL_LABEL[p.level] && Number.isFinite(p.price_cents))
    .map((p) => `${LEVEL_LABEL[p.level]} is $${(p.price_cents / 100).toFixed(0)}/${p.billing_period ?? 'month'}`)
  const lock = 'Clients who join now keep their rate for as long as their coaching runs.'
  return tiers.length ? `${tiers.join(', ')}. ${lock}` : lock
}

const FEATURES = [
  {
    icon: Dumbbell,
    title: 'Your training program',
    body: 'Sets, rep ranges and rest written for your level, with the weights you hit last time shown beside each movement.',
  },
  {
    icon: MonitorPlay,
    title: 'Full exercise video library',
    body: 'Every movement in your plan carries a demonstration and a coaching cue, so form is never guesswork.',
  },
  {
    icon: Apple,
    title: 'Meal plan and macro targets',
    body: 'A seven-day plan with calories and macros set from your own numbers, and a tick-off list to keep you honest.',
  },
  {
    icon: LineChart,
    title: 'Weight, tape and photos',
    body: 'Chest, waist and hips tracked over time. Check-in photos stay private to you and your coach.',
  },
  {
    icon: Moon,
    title: 'Sleep and cardio tracking',
    body: 'Log your nights and your sessions as you go. Recovery is read alongside your lifts, not ignored.',
  },
  {
    icon: MessageSquare,
    title: 'Direct access to your coach',
    body: 'Message Coach Auto from inside the portal, or book a call when something needs talking through.',
  },
]

export function Included() {
  const { data: programs } = useQuery({ queryKey: keys.programs, queryFn: api.site.programs })

  return (
    <Section id="included">
      <SectionHeading
        eyebrow="What you get"
        title="Included at"
        accent="every level"
        description="The level sets how many days a week you train. Everything below comes with all three."
        align="center"
      />

      <motion.ul
        variants={fadeUp}
        className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <li
            key={title}
            className="group rounded-xl border border-ink-600 bg-ink-800 p-6 transition-colors duration-200 hover:border-brand-500/40"
          >
            <span className="grid size-11 place-items-center rounded-lg border border-ink-600 bg-ink-850 text-brand-500 transition-colors duration-200 group-hover:border-brand-500/40">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-lg text-white">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-chalk-400">{body}</p>
          </li>
        ))}
      </motion.ul>

      <motion.p
        variants={fadeUp}
        className="mx-auto mt-12 flex max-w-2xl items-center justify-center gap-2 rounded-xl border border-ink-600 bg-ink-850 px-6 py-4 text-center text-sm text-chalk-400"
      >
        <CalendarCheck className="size-4 shrink-0 text-brand-500" aria-hidden="true" />
        {priceSentence(programs)}
      </motion.p>
    </Section>
  )
}