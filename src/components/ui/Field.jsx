import { forwardRef, useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

const baseInput =
  'w-full rounded-md bg-ink-850 border px-4 py-3 text-sm text-white placeholder:text-chalk-500 ' +
  'transition-colors focus:border-brand-500 focus:outline-none disabled:opacity-60'

function Label({ htmlFor, children, required }) {
  if (!children) return null
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block font-display text-xs font-semibold uppercase tracking-widest text-chalk-400"
    >
      {children}
      {required && <span className="ml-1 text-brand-500">*</span>}
    </label>
  )
}

function Message({ id, error, hint }) {
  if (error) {
    return (
      <p id={id} role="alert" className="mt-1.5 text-xs text-brand-400">
        {error}
      </p>
    )
  }
  if (hint) {
    return (
      <p id={id} className="mt-1.5 text-xs text-chalk-500">
        {hint}
      </p>
    )
  }
  return null
}

export const Input = forwardRef(function Input(
  { label, error, hint, required, className, type = 'text', ...props },
  ref,
) {
  const id = useId()
  const messageId = `${id}-message`
  const [reveal, setReveal] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className={className}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={isPassword && reveal ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          className={cn(baseInput, error ? 'border-brand-500' : 'border-ink-600', isPassword && 'pr-12')}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-chalk-500 hover:text-white"
            aria-label={reveal ? 'Hide password' : 'Show password'}
          >
            {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      <Message id={messageId} error={error} hint={hint} />
    </div>
  )
})

export const Select = forwardRef(function Select(
  { label, error, hint, required, className, children, ...props },
  ref,
) {
  const id = useId()
  const messageId = `${id}-message`
  return (
    <div className={className}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <select
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
        className={cn(baseInput, error ? 'border-brand-500' : 'border-ink-600')}
        {...props}
      >
        {children}
      </select>
      <Message id={messageId} error={error} hint={hint} />
    </div>
  )
})

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, required, className, rows = 4, ...props },
  ref,
) {
  const id = useId()
  const messageId = `${id}-message`
  return (
    <div className={className}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
        className={cn(baseInput, 'resize-y', error ? 'border-brand-500' : 'border-ink-600')}
        {...props}
      />
      <Message id={messageId} error={error} hint={hint} />
    </div>
  )
})

/** Segmented choice — used for sex, goal and unit pickers. */
export function ToggleGroup({ label, value, onChange, options, className }) {
  return (
    <div className={className}>
      <Label required={false}>{label}</Label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const active = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              className={cn(
                'rounded-md border px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                  : 'border-ink-600 bg-ink-850 text-chalk-400 hover:border-ink-500 hover:text-white',
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
