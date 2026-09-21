import { Link } from 'react-router'
import { imageUrl } from '@/lib/images'
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
 * Light-tone logos are served from the optimised AVIF/WebP renditions (a few
 * KB each, versus 50–70 KB PNGs rendered at 36 px tall). Dark-tone variants
 * are rare (white surfaces only) and keep their PNGs.
 */
function LogoImage({ name, fallback, width, height, x1, x2, className, loading = 'eager' }) {
  if (!name) {
    return (
      <img
        src={fallback}
        alt={ALT}
        width={width}
        height={height}
        className={className}
        loading={loading}
        decoding="async"
      />
    )
  }
  return (
    <picture>
      <source
        type="image/avif"
        srcSet={`${imageUrl(name, x1, 'avif')} 1x, ${imageUrl(name, x2, 'avif')} 2x`}
      />
      <img
        src={imageUrl(name, x1, 'webp')}
        srcSet={`${imageUrl(name, x1, 'webp')} 1x, ${imageUrl(name, x2, 'webp')} 2x`}
        alt={ALT}
        width={width}
        height={height}
        className={className}
        loading={loading}
        decoding="async"
      />
    </picture>
  )
}

/**
 * @param size     'sm' | 'md' | 'lg' — rendered height
 * @param tone     'light' | 'dark'   — use 'dark' only on white surfaces
 * @param markOnly render just the square figure mark
 * @param to       router target, or null for a plain image
 */
export function Logo({ size = 'md', tone = 'light', markOnly = false, to = '/', className }) {
  const height = { sm: 'h-7', md: 'h-9', lg: 'h-12' }[size]

  const light = tone === 'light'
  const image = markOnly ? (
    <LogoImage
      name={light ? 'logo-mark-light' : null}
      fallback={MARK[tone]}
      width="512"
      height="512"
      x1={96}
      x2={192}
      className={cn('w-auto object-contain', height)}
    />
  ) : (
    <LogoImage
      name={light ? 'logo-lockup-light' : null}
      fallback={LOCKUP[tone]}
      width="931"
      height="160"
      x1={240}
      x2={480}
      className={cn('w-auto object-contain', height)}
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
    <LogoImage
      name={tone === 'dark' ? null : 'logo-coach-auto-light'}
      fallback="/images/logo-coach-auto.png"
      width="900"
      height="515"
      x1={420}
      x2={420}
      className={cn('h-auto w-full max-w-52.5 object-contain', className)}
      loading="lazy"
    />
  )
}