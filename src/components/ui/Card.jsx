import { cn } from '@/lib/utils'

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('rounded-xl border border-ink-600 bg-ink-800', className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ title, action, className }) {
  return (
    <div className={cn('flex items-center justify-between border-b border-ink-600 px-5 py-4', className)}>
      <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-chalk-200">
        {title}
      </h3>
      {action}
    </div>
  )
}

export function CardBody({ className, children }) {
  return <div className={cn('p-5', className)}>{children}</div>
}

/** A single headline number — the dashboard's core unit. */
export function StatCard({ label, value, delta, deltaTone = 'neutral', icon: Icon, className }) {
  const toneClass = {
    good: 'text-signal-green',
    bad: 'text-brand-400',
    neutral: 'text-chalk-400',
  }[deltaTone]

  return (
    <div className={cn('rounded-xl border border-ink-600 bg-ink-800 p-5', className)}>
      <div className="flex items-start justify-between">
        <p className="font-display text-[11px] font-semibold uppercase tracking-widest text-chalk-500">
          {label}
        </p>
        {Icon && <Icon className="size-4 text-chalk-500" aria-hidden="true" />}
      </div>
      <p className="mt-3 font-display text-3xl font-bold text-white">{value}</p>
      {delta && <p className={cn('mt-1 text-xs font-medium', toneClass)}>{delta}</p>}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      {Icon && <Icon className="mb-4 size-8 text-chalk-500" aria-hidden="true" />}
      <h3 className="font-display text-lg text-white">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-chalk-400">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function Skeleton({ className }) {
  return <div className={cn('skeleton rounded-md', className)} aria-hidden="true" />
}

export function ProgressBar({ value, target, tone = 'brand', label, className }) {
  const percent = target ? Math.min(Math.round((value / target) * 100), 100) : 0
  const bar = {
    brand: 'bg-brand-500',
    green: 'bg-signal-green',
    blue: 'bg-signal-blue',
    amber: 'bg-signal-amber',
  }[tone]

  return (
    <div className={className}>
      {label && (
        <div className="mb-1.5 flex items-baseline justify-between text-xs">
          <span className="font-medium text-chalk-200">{label}</span>
          <span className="text-chalk-500">
            {value} / {target}
          </span>
        </div>
      )}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-ink-600"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className={cn('h-full rounded-full transition-all duration-500', bar)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

/** Circular gauge used for the weekly rings on the dashboard. */
export function Ring({ percent, label, sublabel, tone = 'brand', size = 84 }) {
  const stroke = 6
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference
  const colour = {
    brand: 'var(--color-brand-500)',
    green: 'var(--color-signal-green)',
    blue: 'var(--color-signal-blue)',
    amber: 'var(--color-signal-amber)',
  }[tone]

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-ink-600)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colour}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 700ms ease' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-display text-base font-bold text-white">
          {percent}%
        </span>
      </div>
      <div className="text-center">
        <p className="text-xs font-medium text-chalk-200">{label}</p>
        {sublabel && <p className="text-[11px] text-chalk-500">{sublabel}</p>}
      </div>
    </div>
  )
}
