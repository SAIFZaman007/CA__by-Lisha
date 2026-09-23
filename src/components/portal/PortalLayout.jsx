import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { AnimatePresence, m as motion } from 'motion/react'
import { useQuery } from '@tanstack/react-query'
import { Activity, Apple, Calculator, CreditCard, Dumbbell, LayoutDashboard, LineChart, Lock, Menu, MessageSquare, Moon, PlayCircle, User, X } from 'lucide-react'

import { useAuth } from '@/store/auth'
import { api } from '@/lib/api'
import { cn, initials } from '@/lib/utils'
import { Logo } from '@/components/layout/Logo'
import { useSeo } from '@/lib/seo'
import { FEATURES, useEntitlement } from '@/lib/entitlement'
import { PaywallListener } from '@/components/portal/FeatureGate'

// `feature` names the entitlement a link needs; without it the link is free.
// Locked links stay visible and clickable on purpose: hiding them hides the
// product, and the page they lead to explains the plan in one sentence.
const NAV = [
  { to: '/portal', label: 'Dashboard', icon: LayoutDashboard, end: true, feature: FEATURES.dashboard },
  { to: '/portal/workout', label: 'Workout', icon: Dumbbell, feature: FEATURES.workouts },
  { to: '/portal/meal-plan', label: 'Meal Plan', icon: Apple, feature: FEATURES.mealPlan },
  { to: '/portal/progress', label: 'Progress', icon: LineChart, feature: FEATURES.progress },
  // Added after the Figma sign-off: clients log sleep and cardio daily, so it
  // earns a top-level slot rather than being buried inside Progress.
  { to: '/portal/sleep-cardio', label: 'Sleep & Cardio', icon: Moon, feature: FEATURES.sleepCardio },
  // Clients asked for form guidance they can check before they lift, not after.
  { to: '/portal/tutorials', label: 'Video Tutorials', icon: PlayCircle, feature: FEATURES.tutorials },
  { to: '/portal/calculators', label: 'Calculators', icon: Calculator },
  { to: '/portal/messages', label: 'Messages', icon: MessageSquare, badge: 'unread', feature: FEATURES.messaging },
  // Sits directly above Profile because the two are the same kind of task:
  // managing the account rather than training. A subscription product that
  // hides this is a subscription product people cancel by email.
  { to: '/portal/billing', label: 'Billing', icon: CreditCard },
  { to: '/portal/profile', label: 'Profile', icon: User },
]

function NavItems({ onNavigate, unread, isLocked }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Client portal">
      {NAV.map(({ to, label, icon: Icon, end, badge, feature }) => {
        const locked = isLocked(feature)
        return (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-brand-500/12 text-brand-500'
                  : 'text-chalk-400 hover:bg-ink-700/60 hover:text-chalk-50',
                locked && !isActive && 'text-chalk-500',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="size-4.5 shrink-0" aria-hidden="true" />
                <span className="flex-1">{label}</span>
                {locked && (
                  <Lock
                    className="size-3.5 shrink-0 text-chalk-600"
                    aria-label="Included with a coaching plan"
                  />
                )}
                {!locked && badge === 'unread' && unread > 0 && (
                  <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[11px] font-bold text-white">
                    {unread}
                  </span>
                )}
                {isActive && <span className="size-1.5 rounded-full bg-brand-500" />}
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}

function AccountCard() {
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const { isSubscribed, program } = useEntitlement()
  const name = user?.display_name || user?.full_name || 'Client'
  // The plan someone is actually paying for, not the cached level on their
  // profile: a subscription that ended must stop describing them as a client
  // of it. Falling back to 'Level 1' told every unsubscribed client they were
  // on a plan they had never bought.
  const level = isSubscribed
    ? (program?.name ?? user?.profile?.level?.replace('level_', 'Level ') ?? 'Coaching')
    : 'No plan yet'

  return (
    <div className="mt-auto space-y-3 border-t border-ink-700 pt-4">
      <div className="flex items-center gap-3 rounded-lg bg-ink-800 px-3 py-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-500 text-sm font-bold text-white">
          {initials(name)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-chalk-50">{name}</span>
          <span className="block truncate text-xs text-chalk-500">
            {isSubscribed ? `${level} client` : level}
          </span>
        </span>
      </div>
      <button
        type="button"
        onClick={logout}
        className="w-full rounded-lg border border-ink-600 px-3 py-2 text-sm text-chalk-400 transition hover:border-ink-500 hover:text-chalk-50"
      >
        Sign out
      </button>
    </div>
  )
}

export function PortalLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  // Private, per-client screens: keep every portal route out of search results.
  useSeo({ title: 'Client portal', path: '/portal', noIndex: true })

  const { has, isResolving } = useEntitlement()
  const canMessage = has(FEATURES.messaging)

  // Locked links are the ones the entitlement answer has ruled out. While the
  // answer is still loading nothing is marked locked, so a paying client never
  // sees padlocks flicker across their own navigation on every page load.
  const isLocked = (feature) => Boolean(feature) && !isResolving && !has(feature)

  const { data: unreadData } = useQuery({
    queryKey: ['messages', 'unread'],
    queryFn: api.messages.unreadCount,
    refetchInterval: 60_000,
    // Polling a paid route from a free account would answer 402 once a minute.
    enabled: canMessage,
  })
  const unread = canMessage ? (unreadData?.unread ?? 0) : 0

  return (
    <div className="min-h-dvh bg-ink-900">
      {/* Raises the upgrade panel if a plan ends while the portal is open. */}
      <PaywallListener />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-ink-700 bg-ink-850 p-4 lg:flex">
        <div className="mb-6 px-1">
          <Logo />
          <p className="mt-1 text-xs tracking-wide text-chalk-500">Client Portal</p>
        </div>
        <NavItems unread={unread} isLocked={isLocked} />
        <AccountCard />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-700 bg-ink-850/95 px-4 py-3 backdrop-blur lg:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          className="rounded-lg border border-ink-600 p-2 text-chalk-400 transition hover:text-chalk-50"
        >
          <Menu className="size-5" />
        </button>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/70 lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 right-0 z-50 flex w-72 flex-col border-l border-ink-700 bg-ink-850 p-4 lg:hidden"
            >
              <div className="mb-6 flex items-center justify-between">
                <p className="text-xs tracking-widest text-chalk-500 uppercase">Menu</p>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="rounded-lg p-1.5 text-chalk-400 transition hover:text-chalk-50"
                >
                  <X className="size-5" />
                </button>
              </div>
              <NavItems unread={unread} isLocked={isLocked} onNavigate={() => setMenuOpen(false)} />
              <AccountCard />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-64">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  )
}

export function PageHeading({ eyebrow, title, action }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-1.5 text-chalk-500">{eyebrow}</p>}
        <h1 className="text-3xl sm:text-4xl">{title}</h1>
      </div>
      {action}
    </header>
  )
}

export { Activity }