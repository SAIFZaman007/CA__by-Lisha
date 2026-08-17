import { Link } from 'react-router'
import { motion } from 'motion/react'
import { Logo } from '@/components/layout/Logo'
import { useSeo } from '@/lib/seo'

/**
 * Split screen: the coach's own gym photo on the left, the form on the right.
 * On mobile the photo becomes a short banner so the form stays above the fold.
 */
export function AuthLayout({ title, subtitle, children, seoTitle, path }) {
  useSeo({
    title: seoTitle ?? title,
    description: 'Sign in to your Coach Auto client portal.',
    path,
    noIndex: true, // account screens must never appear in search results
  })

  return (
    <div className="min-h-dvh bg-ink-900 lg:grid lg:grid-cols-2">
      <div className="relative h-44 overflow-hidden sm:h-56 lg:h-auto">
        <img
          src="/images/hero-coach-auto.jpg"
          alt="Coach Auto training in the gym"
          className="size-full object-cover object-[center_25%]"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/50 to-ink-900/20 lg:bg-gradient-to-r lg:from-ink-900/70 lg:via-ink-900/20 lg:to-ink-900" />

        <div className="absolute top-5 left-5 lg:top-8 lg:left-8">
          <Logo />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="absolute right-5 bottom-6 left-5 hidden lg:right-10 lg:bottom-10 lg:left-8 lg:block"
        >
          <h2 className="text-4xl leading-[0.95] xl:text-5xl">
            Your program.
            <br />
            Your progress.
            <br />
            <span className="text-brand-500">Your results.</span>
          </h2>
          <p className="mt-4 max-w-md text-sm text-chalk-400">
            Your training, meal plan, measurements, sleep and cardio — all in one place.
          </p>
        </motion.div>
      </div>

      <div className="flex items-center justify-center px-5 py-10 sm:px-8 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm"
        >
          <h1 className="text-3xl sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-chalk-400">{subtitle}</p>}
          <div className="mt-8">{children}</div>

          <p className="mt-10 text-center text-xs text-chalk-500">
            <Link to="/" className="transition hover:text-chalk-400">
              ← Back to coachauto.com
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
