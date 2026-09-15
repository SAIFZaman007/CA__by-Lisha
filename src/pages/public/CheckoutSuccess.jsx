import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, XCircle } from 'lucide-react'

import { api, errorMessage } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FullPageSpinner, Spinner } from '@/components/ui/Spinner'

/**
 * Where Stripe sends the browser back after a completed Checkout session.
 *
 * The redirect itself proves nothing — anyone can open this URL without
 * paying — so this page asks the backend to verify the session against Stripe
 * before showing anything as "paid". The backend additionally checks that the
 * signed-in user is the one the session was opened for.
 *
 * Three things this page is responsible for, in order:
 *
 *   1. **Wait for the session to come back.** The round trip through Stripe's
 *      domain destroys the in-memory access token, so on return the app is
 *      briefly `loading` while the refresh cookie mints a new one. Calling the
 *      API during that window gets a 401 and shows a payment failure to
 *      someone who has just paid. Nothing happens until `authStatus` settles.
 *
 *   2. **Confirm and provision.** The confirm endpoint reconciles the session
 *      into the local database when it is paid, so the plan is live whether or
 *      not the webhook has landed yet. See `_reconcile_checkout` on the API
 *      for why both paths exist.
 *
 *   3. **Poll briefly, then invalidate.** If the confirm call comes back paid
 *      but not yet provisioned — Stripe still finalising, or a webhook and this
 *      request racing — it retries a few times rather than declaring success on
 *      a dashboard that will say "no plan yet". Once provisioned, the cached
 *      entitlement and billing queries are cleared, so the portal renders the
 *      new plan instead of the stale pre-purchase copy the user is about to
 *      navigate into.
 */

const MAX_ATTEMPTS = 5
const RETRY_MS = 1500

export default function CheckoutSuccess() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')
  const authStatus = useAuth((s) => s.status)
  const queryClient = useQueryClient()

  const [state, setState] = useState('loading') 
  const [entitlement, setEntitlement] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!sessionId) {
      setState('error')
      setMessage('No checkout session was given.')
      return undefined
    }

    // Wait for the silent refresh to finish before deciding anything.
    if (authStatus === 'loading') return undefined

    if (authStatus === 'anonymous') {
      setState('signin')
      return undefined
    }

    let cancelled = false
    let timer = null

    async function run(attempt = 1) {
      try {
        const result = await api.billing.checkoutStatus(sessionId)
        if (cancelled) return

        if (!result.paid) {
          setState('pending')
          if (attempt < MAX_ATTEMPTS) {
            timer = setTimeout(() => run(attempt + 1), RETRY_MS)
          }
          return
        }

        // Paid, but provisioning may still be catching up.
        if (!result.synced && attempt < MAX_ATTEMPTS) {
          setState('pending')
          timer = setTimeout(() => run(attempt + 1), RETRY_MS)
          return
        }

        setState('paid')

        queryClient.invalidateQueries({ queryKey: ['billing'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })

        try {
          const data = await api.billing.entitlement()
          if (!cancelled) setEntitlement(data)
        } catch {
          /* the CTA below still works without the summary card */
        }
      } catch (err) {
        if (cancelled) return
        setState('error')
        setMessage(errorMessage(err, "We couldn't confirm this payment."))
      }
    }

    run()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [sessionId, authStatus, queryClient])

  if (state === 'loading') return <FullPageSpinner label="Confirming your payment" />

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-6 px-6 py-16">
      {state === 'paid' && (
        <>
          <CheckCircle2 className="size-14 text-emerald-400" />
          <h1 className="font-display text-2xl font-semibold text-white">Payment successful</h1>
          <p className="text-center text-chalk-400">
            You're in. Your programme is unlocked and ready.
          </p>

          {entitlement?.program && (
            <Card className="w-full p-5">
              <dl className="space-y-3 text-sm">
                <Row label="Programme" value={entitlement.program.name} />
                <Row label="Level" value={entitlement.level} />
                {entitlement.subscription && (
                  <>
                    <Row
                      label="Amount"
                      value={formatMoney(
                        entitlement.subscription.price_cents,
                        entitlement.subscription.currency,
                      )}
                    />
                    <Row label="Billing" value={entitlement.subscription.billing_period} />
                    {entitlement.subscription.current_period_end && (
                      <Row
                        label="Renews"
                        value={new Date(
                          entitlement.subscription.current_period_end,
                        ).toLocaleDateString()}
                      />
                    )}
                  </>
                )}
              </dl>
            </Card>
          )}

          <Button to="/portal" size="lg" fullWidth>
            Go to your dashboard
          </Button>
        </>
      )}

      {state === 'pending' && (
        <>
          <Spinner className="size-10" />
          <h1 className="font-display text-2xl font-semibold text-white">Setting up your plan…</h1>
          <p className="text-center text-chalk-400">
            Your payment went through. We are just finishing the handover from Stripe — this
            usually takes a few seconds.
          </p>
          <Button to="/portal" variant="outline" size="lg" fullWidth>
            Go to your dashboard
          </Button>
        </>
      )}

      {state === 'signin' && (
        <>
          <CheckCircle2 className="size-14 text-emerald-400" />
          <h1 className="font-display text-2xl font-semibold text-white">Payment received</h1>
          <p className="text-center text-chalk-400">
            Sign in and your plan will be waiting. Nothing else is needed from you.
          </p>
          <Button to="/login" size="lg" fullWidth>
            Log in to your dashboard
          </Button>
        </>
      )}

      {state === 'error' && (
        <>
          <XCircle className="size-14 text-brand-400" />
          <h1 className="font-display text-2xl font-semibold text-white">
            Couldn't confirm this payment
          </h1>
          <p className="text-center text-chalk-400">{message}</p>
          <p className="text-center text-xs text-chalk-500">
            If your card was charged, nothing is lost — open your billing page, or email
            coachauto2026@gmail.com and it will be sorted.
          </p>
          <Button to="/portal/billing" variant="outline" size="lg" fullWidth>
            Open billing
          </Button>
        </>
      )}
    </div>
  )
}

function Row({ label, value }) {
  if (!value) return null
  return (
    <div className="flex justify-between border-b border-ink-700 pb-2 last:border-0 last:pb-0">
      <dt className="text-chalk-500">{label}</dt>
      <dd className="font-medium text-chalk-100">{value}</dd>
    </div>
  )
}

function formatMoney(cents, currency) {
  if (cents == null) return null
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: (currency || 'usd').toUpperCase(),
  }).format(cents / 100)
}