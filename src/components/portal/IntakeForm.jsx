/**
 * The training intake — eight questions, one programme.
**/

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Dumbbell, Home, Loader2, Sparkles } from 'lucide-react'

import { api, errorMessage } from '@/lib/api'
import { keys } from '@/lib/queryClient'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea, ToggleGroup } from '@/components/ui/Field'
import { toast } from '@/components/ui/Toast'
import { cn, kgToLb, lbToKg } from '@/lib/utils'
import { useAuth } from '@/store/auth'

const GOALS = [
  { value: 'cut', label: 'Lose fat' },
  { value: 'maintain', label: 'Stay lean' },
  { value: 'build', label: 'Build muscle' },
]

const PLACES = [
  { value: 'gym', label: 'At a gym' },
  { value: 'home', label: 'At home' },
  { value: 'hybrid', label: 'Both' },
]

const EXPERIENCE = [
  { value: 'beginner', label: 'New to lifting' },
  { value: 'intermediate', label: '1–3 years' },
  { value: 'advanced', label: '3+ years' },
]

const CM_PER_INCH = 2.54

const toCm = (feet, inches) =>
  Math.round((Number(feet || 0) * 12 + Number(inches || 0)) * CM_PER_INCH * 10) / 10

function fromCm(cm) {
  if (!cm) return { feet: '', inches: '' }
  const total = Math.round(cm / CM_PER_INCH)
  return { feet: String(Math.floor(total / 12)), inches: String(total % 12) }
}

/** A checkbox that looks like a chip: the whole thing is the hit target. */
function EquipmentChip({ option, checked, onToggle }) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2.5 text-sm transition-colors',
        checked
          ? 'border-brand-500 bg-brand-500/10 text-brand-400'
          : 'border-ink-600 bg-ink-850 text-chalk-400 hover:border-ink-500 hover:text-white',
      )}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={() => onToggle(option.value)}
      />
      <span
        aria-hidden="true"
        className={cn(
          'grid size-4 shrink-0 place-items-center rounded border',
          checked ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink-500',
        )}
      >
        {checked && <Check className="size-3" strokeWidth={3} />}
      </span>
      {option.label}
    </label>
  )
}

/** The saved answers, in the shape the fields below edit. */
function seedForm(saved, imperial) {
  const height = fromCm(saved.height_cm)
  return {
    feet: height.feet,
    inches: height.inches,
    heightCm: saved.height_cm ? String(saved.height_cm) : '',
    weight: saved.current_weight_kg
      ? String(imperial ? kgToLb(saved.current_weight_kg) : saved.current_weight_kg)
      : '',
    goalWeight: saved.goal_weight_kg
      ? String(imperial ? kgToLb(saved.goal_weight_kg) : saved.goal_weight_kg)
      : '',
    dateOfBirth: saved.date_of_birth ?? '',
    sex: saved.sex ?? '',
    goal: saved.goal ?? 'build',
    location: saved.training_location ?? 'gym',
    experience: saved.training_experience ?? 'beginner',
    equipment: saved.available_equipment ?? [],
    days: String(saved.days_per_week ?? 3),
    minutes: String(saved.session_minutes ?? 45),
    notes: saved.medical_notes ?? '',
  }
}

/**
 * Fetches the answers, then hands them to the fields.
 *
 * The split is deliberate: the form's state is seeded from the saved answers
 * exactly once, when the fields mount with them already in hand. Seeding
 * inside an effect instead would render an empty form first and overwrite
 * whatever the client had started typing when the request came back.
 */
export function IntakeForm({ onDone, compact = false }) {
  const { data, isPending } = useQuery({
    queryKey: keys.workoutIntake,
    queryFn: api.workouts.intake,
  })

  if (isPending || !data) {
    return (
      <Card>
        <CardBody className="flex items-center gap-3 text-sm text-chalk-400">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Loading your intake…
        </CardBody>
      </Card>
    )
  }

  return <IntakeFields data={data} onDone={onDone} compact={compact} />
}

function IntakeFields({ data, onDone, compact }) {
  const qc = useQueryClient()
  const user = useAuth((s) => s.user)
  const setUser = useAuth((s) => s.setUser)
  const units = user?.profile?.unit_system ?? 'imperial'
  const imperial = units === 'imperial'

  const [form, setForm] = useState(() => seedForm(data.intake, imperial))
  const set = (patch) => setForm((current) => ({ ...current, ...patch }))

  const options = data.equipment_options ?? []
  const atHome = form.location !== 'gym'

  const save = useMutation({
    mutationFn: (body) => api.workouts.saveIntake(body),
    onSuccess: (result) => {
      // Everything sized from the profile is now stale: the plan itself, the
      // dashboard's weekly targets, and the macros the meal plan was built on.
      qc.invalidateQueries({ queryKey: ['workouts'] })
      qc.invalidateQueries({ queryKey: keys.dashboard })
      qc.invalidateQueries({ queryKey: keys.profile })
      if (user) {
        setUser({
          ...user,
          profile: { ...(user.profile ?? {}), ...intakeToProfile(result.intake) },
        })
      }

      if (result.plan) {
        toast.success('Your training plan is ready.')
      } else {
        // Saved, but nothing to train from yet — say why rather than dropping
        // the client onto an empty Workout tab with no explanation.
        toast.error(result.message ?? 'Saved. Your coach will build your plan.')
      }
      onDone?.(result)
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const heightCm = useMemo(
    () => (imperial ? toCm(form.feet, form.inches) : Number(form.heightCm || 0)),
    [form, imperial],
  )

  const submit = (event) => {
    event.preventDefault()
    const weight = Number(form.weight)
    if (!heightCm || heightCm < 90) {
      toast.error('Add your height so the plan can be sized to you.')
      return
    }
    if (!weight) {
      toast.error('Add your current weight.')
      return
    }

    save.mutate({
      height_cm: heightCm,
      current_weight_kg: imperial ? lbToKg(weight) : weight,
      goal_weight_kg: form.goalWeight
        ? imperial
          ? lbToKg(Number(form.goalWeight))
          : Number(form.goalWeight)
        : null,
      date_of_birth: form.dateOfBirth || null,
      sex: form.sex || null,
      unit_system: units,
      goal: form.goal,
      training_location: form.location,
      training_experience: form.experience,
      available_equipment: form.equipment,
      days_per_week: Number(form.days),
      session_minutes: Number(form.minutes),
      medical_notes: form.notes?.trim() || null,
    })
  }

  return (
    <Card>
      <CardHeader
        title={compact ? 'Update my intake' : 'Complete my intake'}
        action={
          <span className="hidden items-center gap-1.5 text-xs text-chalk-500 sm:flex">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Builds your plan instantly
          </span>
        }
      />
      <CardBody>
        <form onSubmit={submit} className="space-y-8">
          <section className="space-y-4">
            <p className="text-sm text-chalk-400">
              Your programme is built from these answers — and rebuilt whenever you change
              them. It takes about a minute.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {imperial ? (
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Height (ft)"
                    type="number"
                    inputMode="numeric"
                    min="3"
                    max="8"
                    required
                    value={form.feet}
                    onChange={(e) => set({ feet: e.target.value })}
                  />
                  <Input
                    label="Height (in)"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="11"
                    value={form.inches}
                    onChange={(e) => set({ inches: e.target.value })}
                  />
                </div>
              ) : (
                <Input
                  label="Height (cm)"
                  type="number"
                  inputMode="decimal"
                  min="90"
                  max="250"
                  required
                  value={form.heightCm}
                  onChange={(e) => set({ heightCm: e.target.value })}
                />
              )}

              <Input
                label={`Current weight (${imperial ? 'lbs' : 'kg'})`}
                type="number"
                inputMode="decimal"
                step="0.1"
                required
                value={form.weight}
                onChange={(e) => set({ weight: e.target.value })}
              />

              <Input
                label={`Goal weight (${imperial ? 'lbs' : 'kg'})`}
                type="number"
                inputMode="decimal"
                step="0.1"
                hint="Optional"
                value={form.goalWeight}
                onChange={(e) => set({ goalWeight: e.target.value })}
              />

              <Input
                label="Date of birth"
                type="date"
                hint="Optional — sharpens your calorie targets"
                value={form.dateOfBirth}
                onChange={(e) => set({ dateOfBirth: e.target.value })}
              />
            </div>

            <ToggleGroup
              label="What are you training for?"
              value={form.goal}
              onChange={(goal) => set({ goal })}
              options={GOALS}
            />
          </section>

          <section className="space-y-4 border-t border-ink-700 pt-6">
            <ToggleGroup
              label="Where will you train?"
              value={form.location}
              onChange={(location) => set({ location })}
              options={PLACES}
            />

            <div>
              <p className="mb-2 font-display text-xs font-semibold tracking-widest text-chalk-400 uppercase">
                What can you train with?
              </p>
              <p className="mb-3 text-xs text-chalk-500">
                {form.equipment.length === 0 ? (
                  <>
                    Nothing ticked — we&apos;ll assume{' '}
                    {atHome ? 'bodyweight and bands' : 'a fully equipped gym'}. Tick what you
                    actually have and nothing else will be prescribed.
                  </>
                ) : (
                  <>
                    {form.equipment.length} selected. Only these will appear in your plan — tick
                    everything you can reach.
                  </>
                )}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {options.map((option) => (
                  <EquipmentChip
                    key={option.value}
                    option={option}
                    checked={form.equipment.includes(option.value)}
                    onToggle={(value) =>
                      set({
                        equipment: form.equipment.includes(value)
                          ? form.equipment.filter((item) => item !== value)
                          : [...form.equipment, value],
                      })
                    }
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => set({ equipment: [] })}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-chalk-500 underline-offset-2 transition hover:text-chalk-200 hover:underline"
              >
                {atHome ? <Home className="size-3.5" /> : <Dumbbell className="size-3.5" />}
                Clear — I&apos;ll take whatever is normally there
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Days a week you can train"
                value={form.days}
                onChange={(e) => set({ days: e.target.value })}
              >
                {[2, 3, 4, 5, 6].map((count) => (
                  <option key={count} value={count}>
                    {count} days
                  </option>
                ))}
              </Select>

              <Select
                label="Time per session"
                value={form.minutes}
                onChange={(e) => set({ minutes: e.target.value })}
              >
                {[20, 30, 45, 60, 75, 90].map((count) => (
                  <option key={count} value={count}>
                    {count} minutes
                  </option>
                ))}
              </Select>
            </div>

            <ToggleGroup
              label="How long have you been training?"
              value={form.experience}
              onChange={(experience) => set({ experience })}
              options={EXPERIENCE}
            />

            <Textarea
              label="Injuries or anything to work around"
              rows={3}
              hint="Optional. Your coach reads this — a sore knee or a bad shoulder changes what gets prescribed."
              value={form.notes}
              onChange={(e) => set({ notes: e.target.value })}
            />
          </section>

          <div className="flex flex-wrap items-center gap-3 border-t border-ink-700 pt-6">
            <Button type="submit" loading={save.isPending}>
              {data.has_plan ? 'Save & rebuild my plan' : 'Build my plan'}
            </Button>
            {onDone && (
              <Button type="button" variant="ghost" onClick={() => onDone(null)}>
                Cancel
              </Button>
            )}
            <p className="text-xs text-chalk-500">
              Your coach can adjust or replace the plan at any time.
            </p>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}

/** The saved answers, in the shape the auth store keeps a profile in. */
function intakeToProfile(intake) {
  return {
    height_cm: intake.height_cm,
    current_weight_kg: intake.current_weight_kg,
    goal_weight_kg: intake.goal_weight_kg,
    goal: intake.goal,
    unit_system: intake.unit_system,
    weekly_workout_target: intake.days_per_week,
    onboarding_completed: true,
  }
}