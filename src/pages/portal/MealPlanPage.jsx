import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, UtensilsCrossed } from 'lucide-react'

import { api, errorMessage } from '@/lib/api'
import { keys } from '@/lib/queryClient'
import { cn, DAY_LABELS, todayIndex } from '@/lib/utils'
import { Card, CardHeader, CardBody, EmptyState, ProgressBar, Skeleton } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageHeading } from '@/components/portal/PortalLayout'
import { toast } from '@/components/ui/Toast'

export default function MealPlanPage() {
  const qc = useQueryClient()
  const [day, setDay] = useState(todayIndex())
  const todayStr = new Date().toISOString().slice(0, 10)

  const { data: plan, isLoading } = useQuery({ queryKey: keys.mealPlan, queryFn: api.nutrition.plan })
  const { data: logs } = useQuery({
    queryKey: keys.mealLogs(todayStr),
    queryFn: () => api.nutrition.logs(todayStr),
  })

  const toggle = useMutation({
    mutationFn: api.nutrition.logMeal,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nutrition'] })
      qc.invalidateQueries({ queryKey: keys.dashboard })
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  if (isLoading) return <Skeleton className="h-96 w-full" />

  if (!plan) {
    return (
      <>
        <PageHeading eyebrow="Nutrition" title="Meal plan" />
        <Card>
          <CardBody>
            <EmptyState
              icon={UtensilsCrossed}
              title="No meal plan yet"
              description="Once your intake is in, Coach Auto builds your macros and a weekly plan around the food you actually like."
              action={
                <Button to="/portal/profile" size="sm">
                  Complete my intake
                </Button>
              }
            />
          </CardBody>
        </Card>
      </>
    )
  }

  const meals = plan.meals.filter((m) => m.day_of_week === day)
  const doneIds = new Set((logs ?? []).filter((l) => l.is_completed).map((l) => l.meal_id))
  const isToday = day === todayIndex()
  const eaten = meals.filter((m) => isToday && doneIds.has(m.id))

  const totals = eaten.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.calories,
      p: acc.p + m.protein_g,
      c: acc.c + m.carbs_g,
      f: acc.f + m.fat_g,
    }),
    { kcal: 0, p: 0, c: 0, f: 0 },
  )

  return (
    <>
      <PageHeading
        eyebrow={`${plan.phase} phase`}
        title="Meal plan"
        action={
          <span className="text-lg font-bold text-brand-500">
            {totals.kcal} / {plan.calorie_target} kcal
          </span>
        }
      />

      {/* Day tabs */}
      <div className="mb-6 grid grid-cols-4 gap-2 sm:grid-cols-7">
        {DAY_LABELS.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setDay(index)}
            aria-current={day === index ? 'true' : undefined}
            className={cn(
              'rounded-lg border py-2.5 font-display text-sm font-bold tracking-wider uppercase transition',
              day === index
                ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                : 'border-ink-700 bg-ink-800 text-chalk-400 hover:border-ink-600',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <Card className="mb-6">
        <CardHeader title="Daily totals" />
        <CardBody className="grid gap-4 sm:grid-cols-3">
          <ProgressBar label="Protein" value={totals.p} target={plan.protein_target_g} tone="blue" />
          <ProgressBar label="Carbs" value={totals.c} target={plan.carb_target_g} tone="green" />
          <ProgressBar label="Fat" value={totals.f} target={plan.fat_target_g} tone="amber" />
        </CardBody>
      </Card>

      <ul className="space-y-4">
        {meals.map((meal) => {
          const done = isToday && doneIds.has(meal.id)
          return (
            <li key={meal.id}>
              <Card className="p-4 sm:p-5">
                <div className="flex items-start gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-ink-700 text-xl">
                    {meal.icon ?? '🍽️'}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-chalk-50">{meal.name}</p>
                    <p className="text-xs text-chalk-500">{meal.serve_time?.slice(0, 5)}</p>
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {meal.items.map((item) => (
                        <li
                          key={item.id}
                          className="rounded border border-ink-600 bg-ink-850 px-2 py-1 text-xs text-chalk-400"
                        >
                          {item.label}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-chalk-50">{meal.calories}</p>
                    <p className="font-display text-[10px] tracking-widest text-chalk-500 uppercase">
                      kcal
                    </p>
                    <p className="mt-1 text-[11px] text-chalk-500">
                      <span className="text-signal-blue">{meal.protein_g}p</span>{' '}
                      <span className="text-signal-green">{meal.carbs_g}c</span>{' '}
                      <span className="text-signal-amber">{meal.fat_g}f</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={!isToday || toggle.isPending}
                    onClick={() =>
                      toggle.mutate({ meal_id: meal.id, log_date: todayStr, is_completed: !done })
                    }
                    aria-pressed={done}
                    aria-label={done ? `Mark ${meal.name} as not eaten` : `Mark ${meal.name} as eaten`}
                    className={cn(
                      'grid size-8 shrink-0 place-items-center rounded-md border transition disabled:opacity-40',
                      done
                        ? 'border-signal-green bg-signal-green text-white'
                        : 'border-ink-600 text-chalk-500 hover:border-chalk-500',
                    )}
                  >
                    <Check className="size-4" />
                  </button>
                </div>
              </Card>
            </li>
          )
        })}
      </ul>

      {!isToday && (
        <p className="mt-4 text-center text-xs text-chalk-500">
          You can only tick meals off on the current day.
        </p>
      )}
    </>
  )
}
