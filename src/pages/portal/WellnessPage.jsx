import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Activity, Moon, Plus, Trash2, Watch } from 'lucide-react'

import { api, errorMessage } from '@/lib/api'
import { keys } from '@/lib/queryClient'
import { useAuth } from '@/store/auth'
import { pct } from '@/lib/utils'
import { Card, CardHeader, CardBody, EmptyState, ProgressBar, Skeleton } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea, ToggleGroup } from '@/components/ui/Field'
import { PageHeading } from '@/components/portal/PortalLayout'
import { toast } from '@/components/ui/Toast'

const today = () => new Date().toISOString().slice(0, 10)

const QUALITY = [
  { value: '1', label: 'Poor' },
  { value: '2', label: 'Broken' },
  { value: '3', label: 'OK' },
  { value: '4', label: 'Good' },
  { value: '5', label: 'Great' },
]

/** Hours between two clock times, rolling past midnight. */
function hoursBetween(bedtime, wake) {
  if (!bedtime || !wake) return null
  const [bh, bm] = bedtime.split(':').map(Number)
  const [wh, wm] = wake.split(':').map(Number)
  let minutes = wh * 60 + wm - (bh * 60 + bm)
  if (minutes <= 0) minutes += 24 * 60
  return Math.round((minutes / 60) * 100) / 100
}

// ---------------------------------------------------------------------------

function SleepForm() {
  const qc = useQueryClient()
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: { log_date: today(), bedtime: '22:30', wake_time: '06:30', quality: '4', note: '' },
  })

  const bedtime = watch('bedtime')
  const wake = watch('wake_time')
  const computed = hoursBetween(bedtime, wake)

  const save = useMutation({
    mutationFn: api.wellness.logSleep,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wellness'] })
      qc.invalidateQueries({ queryKey: keys.dashboard })
      toast.success('Sleep logged.')
      reset({ ...watch(), note: '' })
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  return (
    <form
      onSubmit={handleSubmit((values) =>
        save.mutate({
          log_date: values.log_date,
          bedtime: values.bedtime,
          wake_time: values.wake_time,
          hours_slept: hoursBetween(values.bedtime, values.wake_time) ?? 0,
          quality: Number(values.quality),
          note: values.note || null,
        }),
      )}
      className="space-y-4"
      noValidate
    >
      <Input
        label="Night of"
        type="date"
        max={today()}
        error={errors.log_date?.message}
        {...register('log_date', { required: 'Pick a date.' })}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Bedtime" type="time" {...register('bedtime', { required: true })} />
        <Input label="Woke up" type="time" {...register('wake_time', { required: true })} />
      </div>

      {/* Derived rather than typed — one less thing to get wrong at 6am. */}
      <div className="rounded-md border border-ink-600 bg-ink-850 px-4 py-3">
        <p className="font-display text-[11px] font-bold tracking-widest text-chalk-500 uppercase">
          Time asleep
        </p>
        <p className="mt-0.5 text-2xl font-bold text-chalk-50">
          {computed != null ? `${computed} hrs` : '—'}
        </p>
      </div>

      <Select label="How did you sleep?" {...register('quality')}>
        {QUALITY.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      <Textarea
        label="Notes (optional)"
        rows={2}
        placeholder="Woke twice, late caffeine…"
        {...register('note')}
      />

      <Button type="submit" fullWidth loading={save.isPending}>
        Save sleep
      </Button>
      <p className="text-center text-xs text-chalk-500">
        Logging the same night again updates it rather than adding a duplicate.
      </p>
    </form>
  )
}

function CardioForm({ activityTypes }) {
  const qc = useQueryClient()
  const [manualCalories, setManualCalories] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      log_date: today(),
      activity_type: 'walking',
      duration_minutes: 30,
      intensity: 'moderate',
      distance_km: '',
      avg_heart_rate: '',
      calories_burned: '',
      source: 'manual',
    },
  })

  const save = useMutation({
    mutationFn: api.wellness.logCardio,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wellness'] })
      qc.invalidateQueries({ queryKey: keys.dashboard })
      toast.success('Cardio logged.')
      reset()
      setManualCalories(false)
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const numberOrNull = (value) => (value === '' || value == null ? null : Number(value))

  return (
    <form
      onSubmit={handleSubmit((values) =>
        save.mutate({
          log_date: values.log_date,
          activity_type: values.activity_type,
          duration_minutes: Number(values.duration_minutes),
          intensity: values.intensity,
          distance_km: numberOrNull(values.distance_km),
          avg_heart_rate: numberOrNull(values.avg_heart_rate),
          calories_burned: manualCalories ? numberOrNull(values.calories_burned) : null,
          source: manualCalories ? 'watch' : 'manual',
        }),
      )}
      className="space-y-4"
      noValidate
    >
      <Input
        label="Date"
        type="date"
        max={today()}
        error={errors.log_date?.message}
        {...register('log_date', { required: 'Pick a date.' })}
      />

      <Select label="Activity" {...register('activity_type')}>
        {(activityTypes ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Minutes"
          type="number"
          inputMode="numeric"
          min={1}
          max={1440}
          error={errors.duration_minutes?.message}
          {...register('duration_minutes', {
            required: 'How long was it?',
            min: { value: 1, message: 'At least one minute.' },
          })}
        />
        <Select label="Intensity" {...register('intensity')}>
          <option value="low">Easy</option>
          <option value="moderate">Moderate</option>
          <option value="high">Hard</option>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Distance (km)"
          type="number"
          step="0.01"
          inputMode="decimal"
          placeholder="Optional"
          {...register('distance_km')}
        />
        <Input
          label="Avg heart rate"
          type="number"
          inputMode="numeric"
          placeholder="Optional"
          {...register('avg_heart_rate')}
        />
      </div>

      {/* Coach Auto recommends a fitness watch, but nobody is forced to own one:
          leave this off and the server estimates the burn from bodyweight. */}
      <div className="rounded-md border border-ink-600 bg-ink-850 p-3">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={manualCalories}
            onChange={(event) => setManualCalories(event.target.checked)}
            className="mt-0.5 size-4 accent-[var(--color-brand-500)]"
          />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-sm font-medium text-chalk-50">
              <Watch className="size-3.5" aria-hidden="true" />
              I have a calorie reading from my watch
            </span>
            <span className="mt-0.5 block text-xs text-chalk-500">
              Leave this off and we'll estimate the burn from your bodyweight and the activity.
            </span>
          </span>
        </label>

        {manualCalories && (
          <Input
            label="Calories burned"
            type="number"
            inputMode="numeric"
            className="mt-3"
            {...register('calories_burned')}
          />
        )}
      </div>

      <Button type="submit" fullWidth loading={save.isPending}>
        <Plus className="size-4" /> Add cardio session
      </Button>
    </form>
  )
}

// ---------------------------------------------------------------------------

function SleepChart({ data, target }) {
  if (!data?.length) {
    return (
      <EmptyState
        icon={Moon}
        title="No sleep logged yet"
        description="Add last night on the left and your pattern will build here over the next two weeks."
      />
    )
  }

  const chart = data.map((row) => ({
    day: new Date(row.date).toLocaleDateString('en-US', { weekday: 'short' }),
    hours: row.hours,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chart} margin={{ top: 8, right: 4, bottom: 0, left: -24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#26262b" vertical={false} />
        <XAxis dataKey="day" tick={{ fill: '#74747e', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fill: '#74747e', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          domain={[0, 12]}
        />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          contentStyle={{
            background: '#141417',
            border: '1px solid #26262b',
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value) => [`${value} hrs`, 'Slept']}
        />
        <ReferenceLine
          y={target}
          stroke="#e5202c"
          strokeDasharray="4 4"
          label={{ value: 'Target', fill: '#e5202c', fontSize: 10, position: 'right' }}
        />
        <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
          {chart.map((row, index) => (
            <Cell key={index} fill={row.hours >= target ? '#22c55e' : '#3a3a42'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function CardioList({ rows, activityLabel }) {
  const qc = useQueryClient()
  const remove = useMutation({
    mutationFn: api.wellness.deleteCardio,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wellness'] })
      toast.success('Session removed.')
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  if (!rows?.length) {
    return (
      <EmptyState
        icon={Activity}
        title="No cardio logged yet"
        description="Walks count. Add your first session and it will show up here."
      />
    )
  }

  return (
    <ul className="divide-y divide-ink-700">
      {rows.map((row) => (
        <li key={row.id} className="flex items-center gap-3 py-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink-700">
            <Activity className="size-4 text-brand-500" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-chalk-50">
              {activityLabel(row.activity_type)}
              {row.source === 'watch' && (
                <span className="ml-2 text-[11px] text-chalk-500">· from watch</span>
              )}
            </p>
            <p className="text-xs text-chalk-500">
              {new Date(row.log_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}{' '}
              · {row.duration_minutes} min · {row.intensity}
              {row.distance_km ? ` · ${row.distance_km} km` : ''}
            </p>
          </div>
          <span className="shrink-0 text-sm font-semibold text-brand-500">
            {row.calories_burned ?? '—'} kcal
          </span>
          <button
            type="button"
            onClick={() => remove.mutate(row.id)}
            aria-label={`Delete ${activityLabel(row.activity_type)} session`}
            className="shrink-0 rounded p-1.5 text-chalk-500 transition hover:text-brand-500"
          >
            <Trash2 className="size-4" />
          </button>
        </li>
      ))}
    </ul>
  )
}

// ---------------------------------------------------------------------------

export default function WellnessPage() {
  const [tab, setTab] = useState('sleep')
  const profile = useAuth((s) => s.user?.profile)

  const { data: summary, isLoading } = useQuery({
    queryKey: keys.wellnessSummary(7),
    queryFn: () => api.wellness.summary(7),
  })
  const { data: trends } = useQuery({
    queryKey: keys.wellnessTrends(14),
    queryFn: () => api.wellness.trends(14),
  })
  const { data: cardioRows } = useQuery({
    queryKey: keys.cardio(30),
    queryFn: () => api.wellness.cardio(30),
  })
  const { data: activityTypes } = useQuery({
    queryKey: keys.activityTypes,
    queryFn: api.wellness.activityTypes,
    staleTime: Infinity,
  })

  const activityLabel = useMemo(() => {
    const map = new Map((activityTypes ?? []).map((t) => [t.value, t.label]))
    return (value) => map.get(value) ?? value
  }, [activityTypes])

  const sleepTarget = Number(profile?.sleep_target_hours ?? 8)

  return (
    <>
      <PageHeading eyebrow="Daily tracking" title="Sleep & cardio" />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="p-4">
            <p className="font-display text-[11px] font-bold tracking-widest text-chalk-500 uppercase">
              Average sleep
            </p>
            <p className="mt-1.5 text-2xl font-bold text-chalk-50">
              {summary?.avg_sleep_hours ?? 0} hrs
            </p>
            <p className="mt-1 text-xs text-chalk-500">
              Target {sleepTarget} hrs · {summary?.nights_logged ?? 0} nights logged
            </p>
          </Card>

          <Card className="p-4">
            <p className="font-display text-[11px] font-bold tracking-widest text-chalk-500 uppercase">
              Sleep quality
            </p>
            <p className="mt-1.5 text-2xl font-bold text-chalk-50">
              {summary?.avg_sleep_quality ? `${summary.avg_sleep_quality} / 5` : '—'}
            </p>
            <p className="mt-1 text-xs text-chalk-500">Your own rating, last 7 days</p>
          </Card>

          <Card className="p-4">
            <p className="font-display text-[11px] font-bold tracking-widest text-chalk-500 uppercase">
              Cardio minutes
            </p>
            <p className="mt-1.5 text-2xl font-bold text-chalk-50">
              {summary?.cardio_minutes ?? 0}
            </p>
            <p className="mt-1 text-xs text-signal-green">
              {pct(summary?.cardio_minutes, summary?.cardio_target_minutes)}% of your{' '}
              {summary?.cardio_target_minutes ?? 150} min target
            </p>
          </Card>

          <Card className="p-4">
            <p className="font-display text-[11px] font-bold tracking-widest text-chalk-500 uppercase">
              Cardio burn
            </p>
            <p className="mt-1.5 text-2xl font-bold text-chalk-50">
              {(summary?.cardio_calories ?? 0).toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-chalk-500">
              {summary?.cardio_sessions ?? 0} sessions
              {summary?.top_activity ? ` · mostly ${activityLabel(summary.top_activity)}` : ''}
            </p>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
        {/* Entry column */}
        <Card>
          <div className="flex gap-1 border-b border-ink-700 p-2" role="tablist">
            {[
              { id: 'sleep', label: 'Sleep', icon: Moon },
              { id: 'cardio', label: 'Cardio', icon: Activity },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2.5 font-display text-sm font-bold tracking-wider uppercase transition ${
                  tab === id
                    ? 'bg-brand-500 text-white'
                    : 'text-chalk-400 hover:bg-ink-700 hover:text-chalk-50'
                }`}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
          <CardBody>{tab === 'sleep' ? <SleepForm /> : <CardioForm activityTypes={activityTypes} />}</CardBody>
        </Card>

        {/* Review column */}
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Last 14 nights"
              action={<span className="text-xs text-chalk-500">Green = target met</span>}
            />
            <CardBody>
              <SleepChart data={trends?.sleep} target={sleepTarget} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="This week's cardio" />
            <CardBody className="space-y-4">
              <ProgressBar
                value={summary?.cardio_minutes ?? 0}
                target={summary?.cardio_target_minutes ?? 150}
                tone="brand"
                label="Minutes against target"
              />
              {trends?.cardio_by_type?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {trends.cardio_by_type.map((row) => (
                    <span
                      key={row.activity_type}
                      className="rounded-full border border-ink-600 px-2.5 py-1 text-xs text-chalk-400"
                    >
                      {activityLabel(row.activity_type)} · {row.minutes} min
                    </span>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Recent sessions" />
            <CardBody>
              <CardioList rows={cardioRows} activityLabel={activityLabel} />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}
