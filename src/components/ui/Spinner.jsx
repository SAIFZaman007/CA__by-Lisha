import { cn } from '@/lib/utils'

export function Spinner({ className }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block size-5 animate-spin rounded-full border-2 border-ink-600 border-t-brand-500',
        className,
      )}
    />
  )
}

export function FullPageSpinner({ label = 'Loading' }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-ink-900">
      <Spinner className="size-8" />
      <p className="text-sm text-chalk-400">{label}…</p>
    </div>
  )
}
