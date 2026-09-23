import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Lock, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { onSubscriptionRequired } from '@/lib/api'
import { useEntitlement } from '@/lib/entitlement'
import { keys } from '@/lib/queryClient'

export const UPGRADE_MESSAGE = 'To get direct coaching, please get suitable program...'
const BILLING_PATH = '/portal/billing'

/** An empty, inert impression of a portal page: cards, rows, a chart block. */
function LockedPreview() {
  return (
    <div aria-hidden="true" className="pointer-events-none select-none space-y-6 blur-[6px]">
      <div className="space-y-2">
        <div className="h-3 w-24 rounded bg-ink-700" />
        <div className="h-9 w-64 max-w-full rounded bg-ink-700/80" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-xl border border-ink-700 bg-ink-800/80" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-72 rounded-xl border border-ink-700 bg-ink-800/80 lg:col-span-2" />
        <div className="space-y-4 rounded-xl border border-ink-700 bg-ink-800/80 p-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-ink-700/70" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function UpgradeDialog({ message = UPGRADE_MESSAGE, title = 'Coaching is a paid plan' }) {
  const primaryRef = useRef(null)

  useEffect(() => {
    primaryRef.current?.focus()
  }, [])

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink-900/70 p-4 backdrop-blur-md">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-title"
        aria-describedby="upgrade-message"
        className="w-full max-w-md rounded-2xl border border-ink-700 bg-ink-850 p-6 text-center shadow-2xl sm:p-8"
      >
        <span className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-brand-500/12 text-brand-500">
          <Lock className="size-6" aria-hidden="true" />
        </span>

        <h2 id="upgrade-title" className="text-2xl sm:text-3xl">
          {title}
        </h2>
        <p id="upgrade-message" className="mt-3 text-sm leading-relaxed text-chalk-300">
          {message}
        </p>

        <div className="mt-7 space-y-3">
          <Button ref={primaryRef} to={BILLING_PATH} fullWidth>
            <Sparkles className="size-4" aria-hidden="true" />
            See plans &amp; subscribe
          </Button>
          <Button to="/portal/calculators" variant="subtle" fullWidth>
            Use the free tools
          </Button>
        </div>

        <p className="mt-5 text-xs text-chalk-500">
          Already paid? Your access opens the moment the payment clears — refresh this page.
        </p>
      </div>
    </div>
  )
}

export function FeatureGate({ feature, children }) {
  const { has, isResolving, isError } = useEntitlement()
  const location = useLocation()

  if (isResolving) return <FullPageSpinner label="Checking your plan" />

  if (isError || has(feature)) return children

  return (
    <>
      <LockedPreview />
      <UpgradeDialog key={location.pathname} />
    </>
  )
}

export function PaywallListener() {
  const queryClient = useQueryClient()

  useEffect(() => {
    onSubscriptionRequired(() => {
      queryClient.setQueryData(keys.billingEntitlement, (current) =>
        current ? { ...current, is_subscribed: false, level: null, features: [] } : current,
      )
      queryClient.invalidateQueries({ queryKey: keys.billingEntitlement })
    })
    return () => onSubscriptionRequired(() => {})
  }, [queryClient])

  return null
}