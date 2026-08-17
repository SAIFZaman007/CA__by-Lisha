import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Flame, Scale, HeartPulse } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Select, ToggleGroup } from '@/components/ui/Field'
import { Card, CardBody } from '@/components/ui/Card'
import { api, errorMessage } from '@/lib/api'
import { cn, lbToKg, inToCm } from '@/lib/utils'

const TABS = [
  { id: 'calories', label: 'Calories', icon: Flame },
  { id: 'bmi', label: 'BMI', icon: Scale },
  { id: 'cardio', label: 'Cardio burn', icon: HeartPulse },
]

const ACTIVITY = [
  { value: 'sedentary', label: 'Sedentary — desk job, no training' },
  { value: 'light', label: 'Light — Level 1, 3 training days' },
  { value: 'moderate', label: 'Moderate — Level 2, 4 training days' },
  { value: 'active', label: 'Active — Level 3, 5–6 training days' },
  { value: 'very_active', label: 'Very active — training twice a day' },
]

const ACTIVITY_TYPES = [
  'walking', 'running', 'cycling', 'rowing', 'elliptical',
  'stair_climber', 'swimming', 'hiit', 'sports', 'other',
]

const label = (value) => value.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

/**
 * Calculators. Defaults to imperial because the client and her audience are in
 * the US; the API only ever speaks metric, so conversion happens here.
 */
export function Calculators({ defaultTab = 'calories', defaults = {}, onApplied, compact = false }) {
  const [tab, setTab] = useState(defaultTab)
  const [units, setUnits] = useState(defaults.units ?? 'imperial')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    age: defaults.age ?? 35,
    sex: defaults.sex ?? 'female',
    weight: defaults.weight ?? (units === 'imperial' ? 154 : 70),
    height: defaults.height ?? (units === 'imperial' ? 65 : 165),
    activity_level: defaults.activity_level ?? 'light',
    goal: defaults.goal ?? 'cut',
    duration_minutes: 30,
    activity_type: 'walking',
    intensity: 'moderate',
  })

  const set = (key) => (event) => {
    const value = event?.target ? event.target.value : event
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const toMetric = () => ({
    weight_kg: units === 'imperial' ? lbToKg(Number(form.weight)) : Number(form.weight),
    height_cm: units === 'imperial' ? inToCm(Number(form.height)) : Number(form.height),
  })

  const mutation = useMutation({
    mutationFn: async () => {
      const { weight_kg, height_cm } = toMetric()
      if (tab === 'calories') {
        const body = {
          age: Number(form.age),
          sex: form.sex,
          weight_kg,
          height_cm,
          activity_level: form.activity_level,
          goal: form.goal,
        }
        return onApplied ? api.calculators.applyCalories(body) : api.calculators.calories(body)
      }
      if (tab === 'bmi') return api.calculators.bmi({ weight_kg, height_cm })
      return api.calculators.cardioBurn({
        activity_type: form.activity_type,
        duration_minutes: Number(form.duration_minutes),
        weight_kg,
        intensity: form.intensity,
      })
    },
    onSuccess: (data) => {
      setResult(data)
      setError(null)
      if (tab === 'calories') onApplied?.(data)
    },
    onError: (err) => {
      setError(errorMessage(err))
      setResult(null)
    },
  })

  const switchTab = (id) => {
    setTab(id)
    setResult(null)
    setError(null)
  }

  return (
    <div className={cn('grid gap-5', !compact && 'lg:grid-cols-[1.1fr_1fr]')}>
      <Card>
        <div className="flex gap-1 border-b border-ink-600 p-2" role="tablist" aria-label="Calculators">
          {TABS.map(({ id, label: text, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => switchTab(id)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2.5 font-display text-xs font-semibold uppercase tracking-wider transition-colors',
                tab === id ? 'bg-brand-500 text-white' : 'text-chalk-400 hover:bg-ink-700 hover:text-white',
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {text}
            </button>
          ))}
        </div>

        <CardBody className="space-y-4">
          <ToggleGroup
            label="Units"
            value={units}
            onChange={setUnits}
            options={[
              { value: 'imperial', label: 'lbs / inches' },
              { value: 'metric', label: 'kg / cm' },
            ]}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={units === 'imperial' ? 'Weight (lbs)' : 'Weight (kg)'}
              type="number"
              step="0.1"
              inputMode="decimal"
              value={form.weight}
              onChange={set('weight')}
            />
            {tab !== 'cardio' && (
              <Input
                label={units === 'imperial' ? 'Height (inches)' : 'Height (cm)'}
                type="number"
                step="0.1"
                inputMode="decimal"
                value={form.height}
                onChange={set('height')}
              />
            )}
            {tab === 'calories' && (
              <Input label="Age" type="number" inputMode="numeric" value={form.age} onChange={set('age')} />
            )}
            {tab === 'cardio' && (
              <Input
                label="Duration (minutes)"
                type="number"
                inputMode="numeric"
                value={form.duration_minutes}
                onChange={set('duration_minutes')}
              />
            )}
          </div>

          {tab === 'calories' && (
            <>
              <ToggleGroup
                label="Sex"
                value={form.sex}
                onChange={set('sex')}
                options={[
                  { value: 'female', label: 'Female' },
                  { value: 'male', label: 'Male' },
                ]}
              />
              <Select label="Activity level" value={form.activity_level} onChange={set('activity_level')}>
                {ACTIVITY.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <ToggleGroup
                label="Goal"
                value={form.goal}
                onChange={set('goal')}
                options={[
                  { value: 'cut', label: 'Cut' },
                  { value: 'maintain', label: 'Maintain' },
                  { value: 'build', label: 'Build' },
                ]}
              />
            </>
          )}

          {tab === 'cardio' && (
            <>
              <Select label="Activity" value={form.activity_type} onChange={set('activity_type')}>
                {ACTIVITY_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {label(value)}
                  </option>
                ))}
              </Select>
              <ToggleGroup
                label="Intensity"
                value={form.intensity}
                onChange={set('intensity')}
                options={[
                  { value: 'low', label: 'Easy' },
                  { value: 'moderate', label: 'Moderate' },
                  { value: 'high', label: 'Hard' },
                ]}
              />
            </>
          )}

          <Button onClick={() => mutation.mutate()} loading={mutation.isPending} fullWidth size="lg">
            {onApplied && tab === 'calories' ? 'Calculate and save targets' : 'Calculate'}
          </Button>
        </CardBody>
      </Card>

      <ResultPanel tab={tab} result={result} error={error} />
    </div>
  )
}

function ResultPanel({ tab, result, error }) {
  if (error) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-brand-400">{error}</p>
        </CardBody>
      </Card>
    )
  }

  if (!result) {
    return (
      <Card className="flex items-center justify-center">
        <CardBody className="text-center">
          <Flame className="mx-auto mb-3 size-7 text-brand-500" aria-hidden="true" />
          <p className="max-w-xs text-sm text-chalk-400">
            Fill in your details and hit calculate. Your numbers appear here.
          </p>
        </CardBody>
      </Card>
    )
  }

  if (tab === 'calories') {
    return (
      <Card>
        <CardBody>
          <p className="font-display text-xs font-semibold uppercase tracking-widest text-chalk-500">
            Daily target
          </p>
          <p className="mt-2 font-display text-5xl font-bold text-brand-500">
            {result.target_calories}
            <span className="ml-2 text-base font-normal text-chalk-500">kcal</span>
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <Macro label="Protein" value={`${result.macros.protein_g}g`} tone="text-signal-blue" />
            <Macro label="Carbs" value={`${result.macros.carbs_g}g`} tone="text-signal-green" />
            <Macro label="Fat" value={`${result.macros.fat_g}g`} tone="text-signal-amber" />
          </div>

          <dl className="mt-6 space-y-2 border-t border-ink-600 pt-4 text-sm">
            <Row term="Resting metabolism (BMR)" value={`${result.bmr} kcal`} />
            <Row term="Daily burn (TDEE)" value={`${result.tdee} kcal`} />
            <Row term="Formula" value={result.formula} />
          </dl>

          <p className="mt-4 rounded-md border-l-2 border-brand-500 bg-ink-850 p-3 text-xs leading-relaxed text-chalk-400">
            {result.note}
          </p>
        </CardBody>
      </Card>
    )
  }

  if (tab === 'bmi') {
    const tone =
      result.category === 'Healthy weight'
        ? 'text-signal-green'
        : result.category === 'Underweight'
          ? 'text-signal-blue'
          : 'text-brand-500'
    return (
      <Card>
        <CardBody className="text-center">
          <p className="font-display text-xs font-semibold uppercase tracking-widest text-chalk-500">
            Body Mass Index
          </p>
          <p className={cn('mt-2 font-display text-6xl font-bold', tone)}>{result.bmi}</p>
          <p className={cn('mt-1 font-display text-lg uppercase tracking-wide', tone)}>
            {result.category}
          </p>
          <p className="mt-5 text-sm text-chalk-400">
            Healthy range for your height:{' '}
            <span className="text-white">
              {result.healthy_weight_range_kg[0]}–{result.healthy_weight_range_kg[1]} kg
            </span>
          </p>
          <p className="mt-5 rounded-md border-l-2 border-brand-500 bg-ink-850 p-3 text-left text-xs leading-relaxed text-chalk-400">
            {result.note}
          </p>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardBody className="text-center">
        <p className="font-display text-xs font-semibold uppercase tracking-widest text-chalk-500">
          Estimated burn
        </p>
        <p className="mt-2 font-display text-6xl font-bold text-brand-500">
          {result.calories_burned}
          <span className="ml-2 text-base font-normal text-chalk-500">kcal</span>
        </p>
        <p className="mt-3 text-sm text-chalk-400">
          Energy cost: <span className="text-white">{result.met_value} METs</span>
        </p>
        <p className="mt-5 rounded-md border-l-2 border-brand-500 bg-ink-850 p-3 text-left text-xs leading-relaxed text-chalk-400">
          {result.note}
        </p>
      </CardBody>
    </Card>
  )
}

function Macro({ label: text, value, tone }) {
  return (
    <div className="rounded-lg border border-ink-600 bg-ink-850 p-3 text-center">
      <p className={cn('font-display text-xl font-bold', tone)}>{value}</p>
      <p className="mt-0.5 text-[11px] uppercase tracking-wider text-chalk-500">{text}</p>
    </div>
  )
}

function Row({ term, value }) {
  return (
    <div className="flex justify-between">
      <dt className="text-chalk-500">{term}</dt>
      <dd className="font-medium text-white">{value}</dd>
    </div>
  )
}
