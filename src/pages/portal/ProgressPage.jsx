import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Camera, Plus, Trash2 } from 'lucide-react'

import { api, errorMessage } from '@/lib/api'
import { keys } from '@/lib/queryClient'
import { useAuth } from '@/store/auth'
import { cmToIn, formatDelta, formatLength, formatWeight, inToCm, kgToLb, lbToKg } from '@/lib/utils'
import { Card, CardHeader, CardBody, EmptyState, Skeleton } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { PageHeading } from '@/components/portal/PortalLayout'
import { toast } from '@/components/ui/Toast'

const MEASUREMENTS = [
  ['chest_cm', 'Chest / bust'],
  ['waist_cm', 'Waist'],
  ['hips_cm', 'Hips'],
  ['left_arm_cm', 'Left arm'],
  ['right_arm_cm', 'Right arm'],
  ['left_thigh_cm', 'Left thigh'],
]

function WeightPanel({ units }) {
  const qc = useQueryClient()
  const { data: weights } = useQuery({ queryKey: keys.weight(180), queryFn: () => api.progress.weight(180) })
  const { register, handleSubmit, reset } = useForm()

  const save = useMutation({
    mutationFn: api.progress.logWeight,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progress'] })
      qc.invalidateQueries({ queryKey: keys.dashboard })
      toast.success('Weight logged.')
      reset()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const chart = (weights ?? []).map((row) => ({
    date: new Date(row.log_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: units === 'imperial' ? kgToLb(row.weight_kg) : row.weight_kg,
  }))

  return (
    <Card>
      <CardHeader title="Weight" action={<span className="text-xs text-chalk-500">Last 6 months</span>} />
      <CardBody className="space-y-5">
        {chart.length > 1 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chart} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#26262b" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#74747e', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#74747e', fontSize: 11 }} axisLine={false} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip
                contentStyle={{ background: '#141417', border: '1px solid #26262b', borderRadius: 8, fontSize: 12 }}
                formatter={(value) => [`${value} ${units === 'imperial' ? 'lbs' : 'kg'}`, 'Weight']}
              />
              <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: '#22c55e' }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="Not enough data yet" description="Log your weight weekly and the trend line will appear here." />
        )}

        <form
          onSubmit={handleSubmit((values) =>
            save.mutate({
              weight_kg: units === 'imperial' ? lbToKg(Number(values.weight)) : Number(values.weight),
            }),
          )}
          className="flex items-end gap-3"
        >
          <Input
            label={`Today's weight (${units === 'imperial' ? 'lbs' : 'kg'})`}
            type="number"
            step="0.1"
            inputMode="decimal"
            className="flex-1"
            {...register('weight', { required: true })}
          />
          <Button type="submit" loading={save.isPending}>
            Log
          </Button>
        </form>
      </CardBody>
    </Card>
  )
}

function MeasurementsPanel({ units }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const { data: rows } = useQuery({ queryKey: keys.measurements, queryFn: api.progress.measurements })
  const { register, handleSubmit, reset } = useForm()

  const save = useMutation({
    mutationFn: api.progress.logMeasurements,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progress'] })
      toast.success('Measurements saved.')
      reset()
      setOpen(false)
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const latest = rows?.[0]
  const first = rows?.[rows.length - 1]

  return (
    <Card>
      <CardHeader
        title="Body measurements"
        action={
          <Button size="sm" variant="subtle" onClick={() => setOpen((v) => !v)}>
            <Plus className="size-4" /> Log today
          </Button>
        }
      />
      <CardBody className="space-y-5">
        {open && (
          <form
            onSubmit={handleSubmit((values) => {
              const payload = {}
              MEASUREMENTS.forEach(([key]) => {
                const raw = values[key]
                if (raw !== '' && raw != null) {
                  payload[key] = units === 'imperial' ? inToCm(Number(raw)) : Number(raw)
                }
              })
              save.mutate(payload)
            })}
            className="grid gap-3 rounded-lg border border-ink-600 bg-ink-850 p-4 sm:grid-cols-2"
          >
            {MEASUREMENTS.map(([key, label]) => (
              <Input
                key={key}
                label={`${label} (${units === 'imperial' ? 'in' : 'cm'})`}
                type="number"
                step="0.1"
                inputMode="decimal"
                placeholder="Optional"
                {...register(key)}
              />
            ))}
            <div className="sm:col-span-2">
              <Button type="submit" fullWidth loading={save.isPending}>
                Save measurements
              </Button>
            </div>
          </form>
        )}

        {latest ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MEASUREMENTS.map(([key, label]) => {
              const current = latest[key]
              const start = first?.[key]
              const change = current != null && start != null ? cmToIn(current) - cmToIn(start) : null
              return (
                <div key={key} className="rounded-lg border border-ink-700 bg-ink-850 p-3">
                  <p className="font-display text-[11px] font-bold tracking-widest text-chalk-500 uppercase">
                    {label}
                  </p>
                  <p className="mt-1 text-xl font-bold text-chalk-50">{formatLength(current, units)}</p>
                  {change != null && change !== 0 && (
                    <p className={`text-xs ${change < 0 ? 'text-signal-green' : 'text-chalk-500'}`}>
                      {formatDelta(change, '"')} since start
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <EmptyState
            title="No measurements yet"
            description="Chest, waist and hips are what your coach assesses at every check-in. Take them first thing in the morning, before food."
          />
        )}
      </CardBody>
    </Card>
  )
}

function PhotosPanel() {
  const qc = useQueryClient()
  const { data: photos } = useQuery({ queryKey: keys.photos, queryFn: api.progress.photos })

  const upload = useMutation({
    mutationFn: (formData) => api.progress.uploadPhoto(formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.photos })
      toast.success('Photo added. Only you and your coach can see it.')
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const remove = useMutation({
    mutationFn: api.progress.deletePhoto,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.photos })
      toast.success('Photo deleted.')
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  function onPick(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    formData.append('pose', 'front')
    upload.mutate(formData)
    event.target.value = ''
  }

  return (
    <Card>
      <CardHeader
        title="Check-in photos"
        action={
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-ink-600 bg-ink-700 px-4 py-2 font-display text-xs font-bold tracking-wider text-chalk-200 uppercase transition hover:bg-ink-600">
            <Camera className="size-4" /> Add photo
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onPick} className="sr-only" />
          </label>
        }
      />
      <CardBody>
        <p className="mb-4 text-xs leading-relaxed text-chalk-500">
          Private to you and Coach Auto. Location data is stripped on upload, and photos are never
          public or indexed by search engines.
        </p>

        {photos?.length ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((photo) => (
              <li key={photo.id} className="group relative overflow-hidden rounded-lg border border-ink-700">
                <img
                  src={photo.url}
                  alt={`Check-in ${photo.pose} view, ${photo.log_date}`}
                  loading="lazy"
                  className="aspect-[3/4] w-full object-cover"
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5 text-[11px] text-chalk-200">
                  {new Date(photo.log_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <button
                  type="button"
                  onClick={() => remove.mutate(photo.id)}
                  aria-label="Delete photo"
                  className="absolute top-2 right-2 grid size-7 place-items-center rounded-md bg-black/70 text-chalk-200 opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100 hover:text-brand-500"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={Camera}
            title="No photos yet"
            description="Front, side and back, same spot and same lighting each time. The scale stalls; photos rarely lie."
          />
        )}
      </CardBody>
    </Card>
  )
}

export default function ProgressPage() {
  const units = useAuth((s) => s.user?.profile?.unit_system ?? 'imperial')
  const { data: summary, isLoading } = useQuery({
    queryKey: keys.progressSummary(30),
    queryFn: () => api.progress.summary(30),
  })

  if (isLoading) return <Skeleton className="h-96 w-full" />

  return (
    <>
      <PageHeading eyebrow="Your results" title="Progress" />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total change', formatDelta(units === 'imperial' ? kgToLb(summary?.total_change_kg) : summary?.total_change_kg, units === 'imperial' ? ' lbs' : ' kg'), 'Since you started'],
          ['Current weight', formatWeight(summary?.current_weight_kg, units), 'Latest weigh-in'],
          ['Goal weight', formatWeight(summary?.goal_weight_kg, units), 'Target'],
          ['Program', `Week ${summary?.program_week ?? 1} of ${summary?.program_total_weeks ?? 12}`, 'Current block'],
        ].map(([label, value, sub]) => (
          <Card key={label} className="p-4">
            <p className="font-display text-[11px] font-bold tracking-widest text-chalk-500 uppercase">{label}</p>
            <p className="mt-1.5 text-2xl font-bold text-chalk-50">{value}</p>
            <p className="mt-1 text-xs text-chalk-500">{sub}</p>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        <WeightPanel units={units} />
        <MeasurementsPanel units={units} />
        <PhotosPanel />
      </div>
    </>
  )
}
