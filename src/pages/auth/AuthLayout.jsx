import { Link } from 'react-router'
import { motion } from 'motion/react'
import { Logo } from '@/components/layout/Logo'
import { useSeo } from '@/lib/seo'

/**
 * Split-screen auth shell, locked to the viewport.
 *
 * The requirement is a page that fits the display with no scrollbar. Three
 * things make that hold:
 *
 *  1. `h-dvh` not `min-h-dvh` — dvh also tracks mobile browser chrome as it
 *     collapses, which `vh` does not.
 *  2. `overflow-hidden` on the shell, so the *document* can never scroll.
 *  3. The form column is its own scroll container with a hidden scrollbar. On a
 *     normal screen nothing scrolls at all; on a 600px-tall laptop the longest
 *     form (register, four fields) stays reachable rather than being clipped.
 *     Clipping content to avoid a scrollbar would trade a cosmetic complaint
 *     for an unusable page.
 */
export function AuthLayout({ title, subtitle, children, seoTitle, path }) {
  useSeo({
    title: seoTitle ?? title,
    description: 'Sign in to your Coach Auto client portal.',
    path,
    noIndex: true, // account screens must never appear in search results
  })

  return (
    <div className="flex h-dvh overflow-hidden bg-ink-900">
      {/* --- Photo panel: desktop only ---------------------------------------
          Below lg the photo is dropped entirely rather than shrunk to a banner.
          A banner plus a four-field form is exactly what forced the page to
          scroll on a phone. */}
      <div className="relative hidden w-1/2 shrink-0 overflow-hidden lg:block">
        <img
          src="/images/auth-panel.png"
          alt="Coach Auto training in her gym"
          className="size-full object-cover object-[center_18%]"
          width="1000"
          height="1667"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-linear-to-r from-ink-950/60 via-ink-950/25 to-ink-900" />
        <div className="absolute inset-0 bg-linear-to-t from-ink-950/85 via-transparent to-ink-950/40" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="absolute inset-x-10 bottom-10"
        >
          <h2 className="text-4xl leading-[0.95] xl:text-5xl">
            <span className="block text-white">Your program.</span>
            <span className="block text-white">Your progress.</span>
            <span className="block text-brand-500 text-glow-brand">Your results.</span>
          </h2>
          <p className="mt-4 max-w-md text-sm text-chalk-400">
            Your training, meal plan, measurements, sleep and cardio — all in one place.
          </p>
        </motion.div>
      </div>

      {/* --- Form column ---------------------------------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* The logo lives in the bar on every breakpoint, so it is present on
            mobile where the photo panel (and its logo) is hidden. */}
        <header className="flex shrink-0 items-center justify-between px-5 py-5 sm:px-8">
          <Logo size="sm" />
          <Link
            to="/"
            className="text-xs text-chalk-500 transition-colors hover:text-chalk-200"
          >
            ← Back to site
          </Link>
        </header>

        <div className="scrollbar-none flex flex-1 items-center justify-center overflow-y-auto px-5 pb-6 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm py-4"
          >
            <h1 className="text-3xl sm:text-4xl">{title}</h1>
            {subtitle && <p className="mt-2 text-sm leading-relaxed text-chalk-400">{subtitle}</p>}
            <div className="mt-7">{children}</div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}