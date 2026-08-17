import { Check } from 'lucide-react'
import { Section, SectionHeading, motion, fadeUp } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'

const POINTS = [
  'Macro targets set from your bodyweight, level and phase',
  'A full week of meals, not a list of foods to figure out yourself',
  'Portions in cups and ounces — no kitchen scale required',
  'Tick meals off as you eat them and watch the day add up',
  'Adjusted at every check-in as your weight moves',
]

const SAMPLE = [
  { name: 'Morning Power Bowl', time: '7:00 AM', kcal: 494, p: 42, c: 55, f: 12, done: true },
  { name: 'Pre-Workout Meal', time: '12:00 PM', kcal: 418, p: 38, c: 48, f: 8, done: true },
  { name: 'Post-Workout Shake', time: '3:30 PM', kcal: 356, p: 50, c: 30, f: 4, done: false },
  { name: 'Dinner', time: '7:00 PM', kcal: 475, p: 45, c: 40, f: 15, done: false },
]

export function Nutrition() {
  return (
    <Section id="nutrition" tone="raised">
      <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <SectionHeading
            eyebrow="Nutrition"
            title="Nutrition &amp; meal plans"
            description="Training is only half of it. Your plan tells you what to eat, how much, and when — then tracks whether you actually did."
          />
          <motion.ul variants={fadeUp} className="mt-8 space-y-3.5">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm text-chalk-200">
                <Check className="mt-0.5 size-4 shrink-0 text-brand-500" aria-hidden="true" />
                {point}
              </li>
            ))}
          </motion.ul>
          <motion.div variants={fadeUp} className="mt-9">
            <Button to="/contact">Get your meal plan</Button>
          </motion.div>
        </div>

        {/* A real slice of the portal, so visitors see what they are buying. */}
        <motion.div variants={fadeUp} className="rounded-xl border border-ink-600 bg-ink-800 p-5 sm:p-6">
          <div className="flex items-baseline justify-between border-b border-ink-600 pb-4">
            <p className="font-display text-xs font-semibold uppercase tracking-widest text-chalk-400">
              Monday · Cut phase
            </p>
            <p className="font-display text-lg font-bold text-brand-500">1743 / 2140 kcal</p>
          </div>

          <div className="mt-4 space-y-3">
            {SAMPLE.map((meal) => (
              <div
                key={meal.name}
                className="flex items-center justify-between gap-4 rounded-lg border border-ink-600 bg-ink-850 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{meal.name}</p>
                  <p className="text-xs text-chalk-500">{meal.time}</p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <div className="hidden text-right text-[11px] leading-tight sm:block">
                    <span className="text-signal-blue">{meal.p}g</span>{' '}
                    <span className="text-signal-green">{meal.c}g</span>{' '}
                    <span className="text-signal-amber">{meal.f}g</span>
                    <span className="block text-chalk-500">{meal.kcal} kcal</span>
                  </div>
                  <span
                    className={
                      meal.done
                        ? 'flex size-6 items-center justify-center rounded-md bg-signal-green/20 text-signal-green'
                        : 'flex size-6 items-center justify-center rounded-md border border-ink-500 text-ink-500'
                    }
                    aria-label={meal.done ? 'Logged' : 'Not yet logged'}
                  >
                    {meal.done && <Check className="size-3.5" aria-hidden="true" />}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-[11px] text-chalk-500">
            Example plan — yours is built around your targets.
          </p>
        </motion.div>
      </div>
    </Section>
  )
}
