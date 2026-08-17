import { Link } from 'react-router'
import { cn } from '@/lib/utils'

/**
 * Brand logo.
 *
 * The supplied artwork is a tall stacked lockup (mark above wordmark above
 * strapline, roughly 1.75:1) which is unreadable at navbar height. Two
 * derivatives are used instead:
 *
 *   logo-lockup-light.png   mark + wordmark side by side, ~5.8:1 — bars, footers
 *   logo-mark-light.png     the three-figure mark alone, 1:1 — tight spaces, favicon
 *
 * Both exist in `-light` (white + red) and `-dark` (black + red). This product is
 * dark end to end, so *light is the default*. Rendering the dark file on a dark
 * surface is why the logo previously looked missing — it was black on black.
 */

const LOCKUP = {
  light: '/images/logo-lockup-light.png',
  dark: '/images/logo-lockup-dark.png',
}

const MARK = {
  light: '/images/logo-mark-light.png',
  dark: '/images/logo-mark-dark.png',
}

const ALT = 'Coach Auto — Autonomy Health and Fitness'

/**
 * @param size     'sm' | 'md' | 'lg' — rendered height
 * @param tone     'light' | 'dark'   — use 'dark' only on white surfaces
 * @param markOnly render just the square figure mark
 * @param to       router target, or null for a plain image
 */
export function Logo({ size = 'md', tone = 'light', markOnly = false, to = '/', className }) {
  const height = { sm: 'h-7', md: 'h-9', lg: 'h-12' }[size]

  const image = markOnly ? (
    <img
      src={MARK[tone]}
      alt={ALT}
      width="512"
      height="512"
      className={cn('w-auto object-contain', height)}
      loading="eager"
      decoding="async"
    />
  ) : (
    <img
      src={LOCKUP[tone]}
      alt={ALT}
      width="931"
      height="160"
      className={cn('w-auto object-contain', height)}
      loading="eager"
      decoding="async"
    />
  )

  if (!to) return <span className={cn('inline-flex items-center', className)}>{image}</span>

  return (
    <Link
      to={to}
      aria-label="Coach Auto — home"
      className={cn(
        'inline-flex items-center rounded-sm transition-opacity duration-200 hover:opacity-85',
        'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500',
        className,
      )}
    >
      {image}
    </Link>
  )
}

/** Square figure mark on its own. */
export function LogoMark({ size = 'md', tone = 'light', to = '/', className }) {
  return <Logo markOnly size={size} tone={tone} to={to} className={className} />
}

/** Full stacked lockup including the strapline — footers and wide space. */
export function LogoStacked({ tone = 'light', className }) {
  return (
    <img
      src={tone === 'dark' ? '/images/logo-coach-auto.png' : '/images/logo-coach-auto-light.png'}
      alt={ALT}
      width="900"
      height="515"
      className={cn('h-auto w-full max-w-52.5 object-contain', className)}
      loading="lazy"
      decoding="async"
    />
  )
}