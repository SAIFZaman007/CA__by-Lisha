import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ArrowRight, Flame, Moon, Timer, TrendingDown } from 'lucide-react'

import { api } from '@/lib/api'
import { keys } from '@/lib/queryClient'
import { useAuth } from '@/store/auth'
import { formatWeight, formatDelta, kgToLb, pct, DAY_LABELS, todayIndex } from '@/lib/utils'
import { Card, CardHeader, CardBody, Ring, ProgressBar, Skeleton, EmptyState } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageHeading } from '@/components/portal/PortalLayout'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function WeekStrip({ week }) {
  const today = todayIndex()
  // Monday-first dates for the current week.
  const monday = new Date()
  monday.setDate(monday.getDate() - today)

  return (
    <Card>
      <CardHeader
        title="This week"
        action={<span className="text-xs text-chalk-500">{week} training days</span>}
      />
      <CardBody>
        <ol className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {DAY_LABELS.map((label, index) => {
            const date = new Date(monday)
            date.setDate(monday.getDate() + index)
            const isToday = index === today
            return (
              <li
                key={label}
                aria-current={isToday ? 'date' : undefined}
                className={`rounded-lg border py-3 text-center transition ${
                  isToday
                    ? 'border-brand-500 bg-brand-500/10'
                    : 'border-ink-700 bg-ink-850'
                }`}
              >
                <span
                  className={`block font-display text-[11px] font-bold tracking-widest uppercase ${
                    isToday ? 'text-brand-500' : 'text-chalk-500'
                  }`}
                >
                  {label}
                </span>
                <span className="mt-1 block text-sm font-semibold text-chalk-50">
                  {date.getDate()}
                </span>
              </li>
            )
          })}
        </ol>
      </CardBody>
    </Card>
  )
}

function MetricCard({ label, value, sub, subTone = 'muted', icon: Icon, children }) {
  const toneClass =
    subTone === 'good'
      ? 'text-signal-green'
      : subTone === 'brand'
        ? 'text-brand-500'
        : 'text-chalk-500'

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-[11px] font-bold tracking-widest text-chalk-500 uppercase">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold text-chalk-50">{value}</p>
          {sub && <p className={`mt-1 text-xs ${toneClass}`}>{sub}</p>}
        </div>
        {Icon && <Icon className="size-4 shrink-0 text-chalk-500" aria-hidden="true" />}
      </div>
      {children && <div className="mt-3 h-12">{children}</div>}
    </Card>
  )
}

export default function Dashboard() {
  const units = useAuth((s) => s.user?.profile?.unit_system ?? 'imperial')

  const { data, isLoading } = useQuery({ queryKey: keys.dashboard, queryFn: api.dashboard.get })
  const { data: nutrition } = useQuery({
    queryKey: keys.nutritionToday,
    queryFn: api.nutrition.today,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    )
  }

  const trend = (data?.weight_trend ?? []).map((point) => ({
    date: point.label,
    value: units === 'imperial' ? kgToLb(point.value) : point.value,
  }))

  const workoutPct = pct(data?.workouts_done_this_week, data?.weekly_workout_target)
  const caloriePct = pct(nutrition?.calories_eaten, nutrition?.calorie_target)
  const proteinPct = pct(nutrition?.protein_g, nutrition?.protein_target_g)

  return (
    <>
      <PageHeading
        eyebrow={greeting()}
        title={`${data?.greeting_name ?? 'Your'} dashboard`}
        action={
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-md border border-brand-500/40 bg-brand-500/10 px-2.5 py-1.5 font-semibold text-brand-500">
              Week {data?.program_week} of {data?.program_total_weeks}
            </span>
            <span className="rounded-md border border-ink-600 px-2.5 py-1.5 text-chalk-400">
              {data?.level?.replace('level_', 'Level ')}
            </span>
          </div>
        }
      />

      <div className="space-y-6">
        <WeekStrip week={data?.weekly_workout_target ?? 3} />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Current weight"
            value={formatWeight(data?.current_weight_kg, units)}
            sub={
              data?.weight_change_kg != null
                ? `${formatDelta(units === 'imperial' ? kgToLb(data.weight_change_kg) : data.weight_change_kg)} ${units === 'imperial' ? 'lbs' : 'kg'} since start`
                : 'Log your first weigh-in'
            }
            subTone={data?.weight_change_kg < 0 ? 'good' : 'muted'}
            icon={TrendingDown}
          >
            {trend.length > 1 && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fill="url(#weightFill)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </MetricCard>

          <MetricCard
            label="Calories today"
            value={nutrition?.calories_eaten?.toLocaleString() ?? '0'}
            sub={
              nutrition?.calorie_target
                ? `${Math.max(nutrition.calorie_target - (nutrition.calories_eaten ?? 0), 0)} to go`
                : 'No target set'
            }
            subTone="brand"
            icon={Flame}
          />

          <MetricCard
            label="Workouts done"
            value={`${data?.workouts_done_this_week ?? 0} / ${data?.weekly_workout_target ?? 3}`}
            sub="This week"
            subTone={workoutPct >= 100 ? 'good' : 'muted'}
            icon={Timer}
          />

          <MetricCard
            label="Sleep last night"
            value={data?.sleep_last_night_hours ? `${data.sleep_last_night_hours} hrs` : '—'}
            sub={
              data?.sleep_last_night_hours
                ? `${data.cardio_minutes_this_week} min cardio this week`
                : 'Log last night to start tracking'
            }
            subTone="muted"
            icon={Moon}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Today's training */}
          <Card className="lg:col-span-2">
            <CardHeader
              title="Today's training"
              action={
                data?.today_day_id ? (
                  <Button to="/portal/workout" size="sm">
                    Start workout
                  </Button>
                ) : null
              }
            />
            <CardBody>
              {data?.today_day_id ? (
                <p className="text-sm text-chalk-400">
                  Your session is ready. Open it to see the movements, your prescribed sets and
                  the weights you hit last time.
                </p>
              ) : (
                <EmptyState
                  title="Rest day"
                  description="Nothing is scheduled today. Recovery is where the adaptation happens — eat to target and get your sleep in."
                  action={
                    <Button to="/portal/workout" variant="subtle" size="sm">
                      View the full week
                    </Button>
                  }
                />
              )}
            </CardBody>
          </Card>

          {/* Weekly rings */}
          <Card>
            <CardHeader title="Weekly progress" />
            <CardBody>
              <div className="grid grid-cols-3 gap-2">
                <Ring
                  percent={workoutPct}
                  label="Workouts"
                  sublabel={`${data?.workouts_done_this_week ?? 0} / ${data?.weekly_workout_target ?? 3}`}
                  tone="green"
                />
                <Ring
                  percent={caloriePct}
                  label="Calories"
                  sublabel={`${nutrition?.calories_eaten ?? 0} / ${nutrition?.calorie_target ?? 0}`}
                  tone="brand"
                />
                <Ring
                  percent={proteinPct}
                  label="Protein"
                  sublabel={`${nutrition?.protein_g ?? 0} / ${nutrition?.protein_target_g ?? 0}g`}
                  tone="blue"
                />
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Sleep & cardio summary */}
          <Card>
            <CardHeader
              title="Sleep & cardio"
              action={
                <Link
                  to="/portal/sleep-cardio"
                  className="flex items-center gap-1 text-xs font-semibold text-brand-500 hover:underline"
                >
                  Log today <ArrowRight className="size-3" />
                </Link>
              }
            />
            <CardBody className="space-y-4">
              <ProgressBar
                label="Cardio this week"
                value={data?.cardio_minutes_this_week ?? 0}
                target={data?.cardio_target_minutes ?? 150}
                tone="brand"
              />
              <p className="text-xs leading-relaxed text-chalk-500">
                Enter your sleep each morning and your cardio after each session. Your coach reads
                both alongside your training to spot when recovery is slipping.
              </p>
            </CardBody>
          </Card>

          {/* Coach note */}
          <Card>
            <CardHeader
              title="From your coach"
              action={
                data?.unread_messages > 0 ? (
                  <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[11px] font-bold text-white">
                    {data.unread_messages} new
                  </span>
                ) : null
              }
            />
            <CardBody>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-3"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-500 text-xs font-bold text-white">
                  CA
                </span>
                <div className="min-w-0">
                  <p className="font-display text-xs font-bold tracking-widest text-brand-500 uppercase">
                    Coach Auto
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-chalk-400">
                    {data?.unread_messages > 0
                      ? 'You have a new message waiting. Open your thread to read it.'
                      : 'Message me any time with questions about your program, your form or your food.'}
                  </p>
                  <Button to="/portal/messages" variant="subtle" size="sm" className="mt-3">
                    Open messages
                  </Button>
                </div>
              </motion.div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}
