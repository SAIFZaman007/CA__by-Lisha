import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'motion/react'
import { Check, ChevronDown, Dumbbell, PlayCircle, Plus } from 'lucide-react'

import { api, errorMessage } from '@/lib/api'
import { keys } from '@/lib/queryClient'
import { useAuth } from '@/store/auth'
import { cn, kgToLb, lbToKg, todayIndex } from '@/lib/utils'
import { Card, CardHeader, CardBody, EmptyState, Skeleton } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageHeading } from '@/components/portal/PortalLayout'
import { toast } from '@/components/ui/Toast'

/** One prescribed movement, with its set log expanded underneath. */
function ExerciseRow({ item, index, session, units, onLogSet }) {
  const [open, setOpen] = useState(index === 0)
  const logged = (session?.sets ?? []).filter((s) => s.day_exercise_id === item.id)
  const { exercise } = item

  return (
    <li className="border-b border-ink-700 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-ink-850/60"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-ink-700 font-display text-sm font-bold text-brand-500">
          {index + 1}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-chalk-50">
            {exercise.name}
          </span>
          <span className="block truncate text-xs text-chalk-500">
            {exercise.target_muscle}
            {exercise.secondary_muscles?.length ? `, ${exercise.secondary_muscles.join(', ')}` : ''}
          </span>
        </span>

        <span className="hidden shrink-0 items-center gap-5 text-center sm:flex">
          {[
            [item.sets, 'sets'],
            [item.rep_range, 'reps'],
            [`${item.rest_seconds}s`, 'rest'],
          ].map(([value, label]) => (
            <span key={label}>
              <span className="block text-sm font-bold text-chalk-50">{value}</span>
              <span className="block font-display text-[10px] tracking-widest text-chalk-500 uppercase">
                {label}
              </span>
            </span>
          ))}
        </span>

        {logged.length > 0 && (
          <span className="shrink-0 rounded-full bg-signal-green/15 px-2 py-0.5 text-[11px] font-semibold text-signal-green">
            {logged.length} logged
          </span>
        )}

        <ChevronDown
          className={cn('size-4 shrink-0 text-chalk-500 transition-transform', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 px-4 pb-5">
              {item.coach_note && (
                <p className="rounded-md border-l-2 border-brand-500 bg-brand-500/8 px-3 py-2 text-sm text-chalk-200">
                  {item.coach_note}
                </p>
              )}

              {exercise.video_url && (
                <a
                  href={exercise.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-brand-500 hover:underline"
                >
                  <PlayCircle className="size-4" /> Watch the demonstration
                </a>
              )}

              <div>
                <p className="mb-2 font-display text-[11px] font-bold tracking-widest text-chalk-500 uppercase">
                  Log sets
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: item.sets }).map((_, setIndex) => {
                    const setNumber = setIndex + 1
                    const record = logged.find((s) => s.set_number === setNumber)
                    return (
                      <SetChip
                        key={setNumber}
                        setNumber={setNumber}
                        record={record}
                        units={units}
                        disabled={!session}
                        onSave={(payload) =>
                          onLogSet({ day_exercise_id: item.id, set_number: setNumber, ...payload })
                        }
                      />
                    )
                  })}
                </div>
                {!session && (
                  <p className="mt-2 text-xs text-chalk-500">
                    Start the session to log your sets.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}

/** A single set: tap to open, type weight and reps, tap save. */
function SetChip({ setNumber, record, units, disabled, onSave }) {
  // `draft` is null when not editing. Seeding it on open rather than syncing
  // from props in an effect keeps the logged value as the single source of truth.
  const [draft, setDraft] = useState(null)

  const displayWeight =
    record?.weight_kg == null
      ? ''
      : String(units === 'imperial' ? kgToLb(record.weight_kg) : record.weight_kg)
  const displayReps = record?.reps == null ? '' : String(record.reps)
  const done = Boolean(record)

  if (draft === null) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setDraft({ weight: displayWeight, reps: displayReps })}
        className={cn(
          'min-w-[84px] rounded-md border px-3 py-2 text-center transition disabled:opacity-40',
          done
            ? 'border-signal-green/50 bg-signal-green/10'
            : 'border-ink-600 bg-ink-850 hover:border-ink-500',
        )}
      >
        <span className="block font-display text-[10px] font-bold tracking-widest text-chalk-500 uppercase">
          Set {setNumber}
        </span>
        <span className={cn('block text-sm font-bold', done ? 'text-signal-green' : 'text-chalk-500')}>
          {done ? `${displayWeight || '—'}×${displayReps || '—'}` : '—'}
        </span>
      </button>
    )
  }

  const commit = () => {
    onSave({
      weight_kg:
        draft.weight === ''
          ? null
          : units === 'imperial'
            ? lbToKg(Number(draft.weight))
            : Number(draft.weight),
      reps: draft.reps === '' ? null : Number(draft.reps),
    })
    setDraft(null)
  }

  return (
    <span className="flex items-center gap-1 rounded-md border border-brand-500 bg-ink-850 p-1">
      <input
        type="number"
        inputMode="decimal"
        step="0.5"
        value={draft.weight}
        onChange={(e) => setDraft((d) => ({ ...d, weight: e.target.value }))}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        placeholder={units === 'imperial' ? 'lbs' : 'kg'}
        aria-label={`Set ${setNumber} weight`}
        className="w-16 bg-transparent px-2 py-1 text-sm text-chalk-50 focus:outline-none"
        autoFocus
      />
      <span className="text-chalk-500">×</span>
      <input
        type="number"
        inputMode="numeric"
        value={draft.reps}
        onChange={(e) => setDraft((d) => ({ ...d, reps: e.target.value }))}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        placeholder="reps"
        aria-label={`Set ${setNumber} reps`}
        className="w-14 bg-transparent px-2 py-1 text-sm text-chalk-50 focus:outline-none"
      />
      <button
        type="button"
        aria-label={`Save set ${setNumber}`}
        onClick={commit}
        className="grid size-7 place-items-center rounded bg-brand-500 text-white"
      >
        <Check className="size-4" />
      </button>
    </span>
  )
}

export default function WorkoutPage() {
  const qc = useQueryClient()
  const units = useAuth((s) => s.user?.profile?.unit_system ?? 'imperial')
  const [activeDayId, setActiveDayId] = useState(null)

  const { data: plan, isLoading } = useQuery({
    queryKey: keys.workoutPlan,
    queryFn: api.workouts.plan,
  })
  const { data: sessions } = useQuery({
    queryKey: keys.sessions(7),
    queryFn: () => api.workouts.sessions(7),
  })

  // Default to whichever day matches today, else the first day of the block.
  const days = useMemo(() => plan?.days ?? [], [plan])
  const defaultDay = useMemo(() => {
    const match = days.find((d) => d.day_of_week === todayIndex())
    return match?.id ?? days[0]?.id ?? null
  }, [days])
  const dayId = activeDayId ?? defaultDay
  const day = days.find((d) => d.id === dayId)

  const todayStr = new Date().toISOString().slice(0, 10)
  const session = (sessions ?? []).find((s) => s.day_id === dayId && s.session_date === todayStr)

  const start = useMutation({
    mutationFn: () => api.workouts.startSession({ day_id: dayId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workouts'] })
      toast.success('Session started. Log each set as you go.')
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const logSet = useMutation({
    mutationFn: (payload) => api.workouts.logSet(session.id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workouts'] }),
    onError: (error) => toast.error(errorMessage(error)),
  })

  const finish = useMutation({
    mutationFn: () =>
      api.workouts.updateSession(session.id, { status: 'completed' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workouts'] })
      qc.invalidateQueries({ queryKey: keys.dashboard })
      toast.success('Session complete. Good work.')
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  if (isLoading) return <Skeleton className="h-96 w-full" />

  if (!plan) {
    return (
      <>
        <PageHeading eyebrow="Training" title="My workout program" />
        <Card>
          <CardBody>
            <EmptyState
              icon={Dumbbell}
              title="No program assigned yet"
              description="Complete your intake — height, weight, measurements and starting photos — and Coach Auto will build your first block."
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

  return (
    <>
      <PageHeading
        eyebrow={`${plan.level.replace('level_', 'Level ')} program — week ${plan.week_number}`}
        title="My workout program"
      />

      {/* Day switcher */}
      <div className="mb-6 flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
        {days.map((d) => {
          const isActive = d.id === dayId
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setActiveDayId(d.id)}
              aria-current={isActive ? 'true' : undefined}
              className={cn(
                'min-w-[150px] shrink-0 rounded-lg border px-4 py-3 text-left transition',
                isActive
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-ink-700 bg-ink-800 hover:border-ink-600',
              )}
            >
              <span
                className={cn(
                  'block font-display text-sm font-bold tracking-wide uppercase',
                  isActive ? 'text-brand-500' : 'text-chalk-50',
                )}
              >
                {d.label}
              </span>
              <span className="block text-xs text-chalk-500">{d.focus}</span>
            </button>
          )
        })}
      </div>

      {day && (
        <Card>
          <CardHeader
            title={`${day.label}: ${day.focus}`}
            action={
              session?.status === 'completed' ? (
                <span className="flex items-center gap-1.5 rounded-md bg-signal-green/15 px-3 py-1.5 text-xs font-semibold text-signal-green">
                  <Check className="size-3.5" /> Completed
                </span>
              ) : session ? (
                <Button size="sm" onClick={() => finish.mutate()} loading={finish.isPending}>
                  Finish session
                </Button>
              ) : (
                <Button size="sm" onClick={() => start.mutate()} loading={start.isPending}>
                  Start session
                </Button>
              )
            }
          />
          <p className="px-5 pb-3 text-xs text-chalk-500">
            {day.exercises.length} exercises · about {day.estimated_minutes} minutes
          </p>
          <ul>
            {day.exercises.map((item, index) => (
              <ExerciseRow
                key={item.id}
                item={item}
                index={index}
                session={session}
                units={units}
                onLogSet={(payload) => logSet.mutate(payload)}
              />
            ))}
          </ul>
        </Card>
      )}
    </>
  )
}
