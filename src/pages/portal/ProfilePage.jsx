import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useEffect } from 'react'

import { api, errorMessage } from '@/lib/api'
import { keys } from '@/lib/queryClient'
import { useAuth } from '@/store/auth'
import { cmToIn, inToCm, kgToLb, lbToKg, initials } from '@/lib/utils'
import { Card, CardHeader, CardBody, Skeleton } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Field'
import { PageHeading } from '@/components/portal/PortalLayout'
import { toast } from '@/components/ui/Toast'

function IntakeForm({ profile, units }) {
  const qc = useQueryClient()
  const setUser = useAuth((s) => s.setUser)

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm()

  // Load the saved profile into the form once it arrives.
  useEffect(() => {
    if (!profile) return
    reset({
      date_of_birth: profile.date_of_birth ?? '',
      sex: profile.sex ?? 'female',
      unit_system: profile.unit_system ?? 'imperial',
      height: profile.height_cm
        ? units === 'imperial'
          ? cmToIn(profile.height_cm)
          : profile.height_cm
        : '',
      current_weight: profile.current_weight_kg
        ? units === 'imperial'
          ? kgToLb(profile.current_weight_kg)
          : profile.current_weight_kg
        : '',
      goal_weight: profile.goal_weight_kg
        ? units === 'imperial'
          ? kgToLb(profile.goal_weight_kg)
          : profile.goal_weight_kg
        : '',
      goal: profile.goal ?? 'cut',
      activity_level: profile.activity_level ?? 'light',
      sleep_target_hours: profile.sleep_target_hours ?? 8,
      weekly_cardio_target_min: profile.weekly_cardio_target_min ?? 150,
      medical_notes: profile.medical_notes ?? '',
    })
  }, [profile, units, reset])

  const save = useMutation({
    mutationFn: api.users.updateProfile,
    onSuccess: async () => {
      const user = await api.auth.me()
      setUser(user)
      qc.invalidateQueries({ queryKey: keys.profile })
      qc.invalidateQueries({ queryKey: keys.dashboard })
      toast.success('Profile updated.')
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const num = (value, convert) =>
    value === '' || value == null ? null : convert ? convert(Number(value)) : Number(value)

  return (
    <form
      onSubmit={handleSubmit((values) =>
        save.mutate({
          date_of_birth: values.date_of_birth || null,
          sex: values.sex,
          unit_system: values.unit_system,
          height_cm: num(values.height, units === 'imperial' ? inToCm : undefined),
          current_weight_kg: num(values.current_weight, units === 'imperial' ? lbToKg : undefined),
          goal_weight_kg: num(values.goal_weight, units === 'imperial' ? lbToKg : undefined),
          goal: values.goal,
          activity_level: values.activity_level,
          sleep_target_hours: num(values.sleep_target_hours),
          weekly_cardio_target_min: num(values.weekly_cardio_target_min),
          medical_notes: values.medical_notes || null,
        }),
      )}
      className="space-y-5"
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Date of birth" type="date" {...register('date_of_birth')} />
        <Select label="Sex" hint="Used by the calorie formula only." {...register('sex')}>
          <option value="female">Female</option>
          <option value="male">Male</option>
        </Select>
      </div>

      <Select label="Units" {...register('unit_system')}>
        <option value="imperial">Pounds and inches</option>
        <option value="metric">Kilograms and centimetres</option>
      </Select>

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label={`Height (${units === 'imperial' ? 'in' : 'cm'})`}
          type="number"
          step="0.1"
          inputMode="decimal"
          error={errors.height?.message}
          {...register('height')}
        />
        <Input
          label={`Current weight (${units === 'imperial' ? 'lbs' : 'kg'})`}
          type="number"
          step="0.1"
          inputMode="decimal"
          {...register('current_weight')}
        />
        <Input
          label={`Goal weight (${units === 'imperial' ? 'lbs' : 'kg'})`}
          type="number"
          step="0.1"
          inputMode="decimal"
          {...register('goal_weight')}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Goal" {...register('goal')}>
          <option value="cut">Cut — lose fat</option>
          <option value="maintain">Maintain</option>
          <option value="build">Build — add muscle</option>
        </Select>
        <Select label="Activity level" {...register('activity_level')}>
          <option value="sedentary">Sedentary — desk job, no training</option>
          <option value="light">Light — Level 1, 3 training days</option>
          <option value="moderate">Moderate — Level 2, 4 training days</option>
          <option value="active">Active — Level 3, 5–6 training days</option>
          <option value="very_active">Very active — training twice a day</option>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Sleep target (hours)"
          type="number"
          step="0.5"
          min={4}
          max={12}
          {...register('sleep_target_hours')}
        />
        <Input
          label="Weekly cardio target (minutes)"
          type="number"
          min={0}
          hint="150 minutes a week is the general health guideline."
          {...register('weekly_cardio_target_min')}
        />
      </div>

      <Textarea
        label="Injuries or medical notes"
        rows={3}
        placeholder="Anything your coach should program around — old injuries, conditions, medication."
        {...register('medical_notes')}
      />

      <Button type="submit" loading={save.isPending} disabled={!isDirty && !save.isPending}>
        Save changes
      </Button>
    </form>
  )
}

function PasswordForm() {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm()

  const change = useMutation({
    mutationFn: api.auth.changePassword,
    onSuccess: () => {
      toast.success('Password changed.')
      reset()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  return (
    <form
      onSubmit={handleSubmit((values) =>
        change.mutate({
          current_password: values.current_password,
          new_password: values.new_password,
        }),
      )}
      className="space-y-4"
      noValidate
    >
      <Input
        label="Current password"
        type="password"
        autoComplete="current-password"
        error={errors.current_password?.message}
        {...register('current_password', { required: 'Enter your current password.' })}
      />
      <Input
        label="New password"
        type="password"
        autoComplete="new-password"
        hint="At least 10 characters, with an uppercase letter, a lowercase letter and a number."
        error={errors.new_password?.message}
        {...register('new_password', {
          required: 'Choose a new password.',
          minLength: { value: 10, message: 'Use at least 10 characters.' },
          validate: (value) =>
            (/[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value)) ||
            'Add an uppercase letter, a lowercase letter and a number.',
        })}
      />
      <Input
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        error={errors.confirm?.message}
        {...register('confirm', {
          required: 'Type the new password again.',
          validate: (value) => value === watch('new_password') || 'Those passwords do not match.',
        })}
      />
      <Button type="submit" variant="subtle" loading={change.isPending}>
        Change password
      </Button>
    </form>
  )
}

export default function ProfilePage() {
  const user = useAuth((s) => s.user)
  const { data: profile, isLoading } = useQuery({
    queryKey: keys.profile,
    queryFn: api.users.profile,
  })

  const units = profile?.unit_system ?? 'imperial'

  if (isLoading) return <Skeleton className="h-96 w-full" />

  return (
    <>
      <PageHeading eyebrow="Your account" title="Profile" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Intake & preferences" />
            <CardBody>
              <p className="mb-5 text-xs leading-relaxed text-chalk-500">
                Your coach uses this to write your program and set your macros. Keep your weight
                and measurements current and your targets stay accurate.
              </p>
              <IntakeForm profile={profile} units={units} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Password" />
            <CardBody>
              <PasswordForm />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardBody className="text-center">
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-brand-500 text-xl font-bold text-white">
                {initials(user?.display_name || user?.full_name || '')}
              </span>
              <p className="mt-3 text-lg font-semibold text-chalk-50">
                {user?.display_name || user?.full_name}
              </p>
              <p className="text-sm text-chalk-500">{user?.email}</p>
              <div className="mt-3 flex justify-center gap-2">
                <span className="rounded-full border border-brand-500/40 bg-brand-500/10 px-2.5 py-0.5 text-xs font-semibold text-brand-500">
                  {profile?.level?.replace('level_', 'Level ')}
                </span>
                <span className="rounded-full border border-signal-green/40 bg-signal-green/10 px-2.5 py-0.5 text-xs font-semibold text-signal-green">
                  Active
                </span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Coaching details" />
            <CardBody>
              <dl className="space-y-3 text-sm">
                {[
                  ['Phase', profile?.phase ?? '—'],
                  ['Program week', `${profile?.program_week ?? 1} of ${profile?.program_total_weeks ?? 12}`],
                  ['Training days', `${profile?.weekly_workout_target ?? 3} per week`],
                  ['Calorie target', profile?.calorie_target ? `${profile.calorie_target} kcal` : 'Not set'],
                  ['Protein target', profile?.protein_target_g ? `${profile.protein_target_g} g` : 'Not set'],
                  ['Coach', 'Coach Auto'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-3">
                    <dt className="text-chalk-500">{label}</dt>
                    <dd className="text-right font-medium text-chalk-50">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}
