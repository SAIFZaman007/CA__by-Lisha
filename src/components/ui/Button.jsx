import { forwardRef } from 'react'
import { Link } from 'react-router'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const VARIANTS = {
  primary:
    'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-lg shadow-brand-500/20',
  outline: 'border border-brand-500 text-brand-500 hover:bg-brand-500 hover:text-white',
  ghost: 'text-chalk-200 hover:bg-ink-700 hover:text-white',
  subtle: 'bg-ink-700 text-chalk-200 hover:bg-ink-600 hover:text-white border border-ink-600',
  danger: 'bg-ink-700 text-brand-400 hover:bg-brand-500 hover:text-white border border-ink-600',
}

const SIZES = {
  sm: 'h-9 px-4 text-xs',
  md: 'h-11 px-6 text-sm',
  lg: 'h-14 px-8 text-base',
}

/**
 * One button for the whole product. `to` renders a router link, `href` an
 * anchor, otherwise a real <button> — so keyboard and screen-reader behaviour
 * is always correct for what the control actually does.
 */
export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    className,
    children,
    to,
    href,
    fullWidth,
    ...props
  },
  ref,
) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-md font-display font-bold uppercase tracking-wider',
    'transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none',
    'active:scale-[0.98]',
    VARIANTS[variant],
    SIZES[size],
    fullWidth && 'w-full',
    className,
  )

  const content = (
    <>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </>
  )

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...props}>
        {content}
      </Link>
    )
  }
  if (href) {
    return (
      <a ref={ref} href={href} className={classes} {...props}>
        {content}
      </a>
    )
  }
  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {content}
    </button>
  )
})
