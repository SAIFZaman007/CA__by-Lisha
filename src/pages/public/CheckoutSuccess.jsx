import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
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
 * paying — so this page asks the backend to verify the session against
 * Stripe before showing anything as "paid". It also doesn't assume the
 * visitor is still signed in: the trip through Stripe's domain and back can
 * outlive the in-memory access token, so a cold session shows a login
 * prompt instead of an error.
 */
export default function CheckoutSuccess() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')
  const authStatus = useAuth((s) => s.status)

  const [state, setState] = useState('loading') // loading | paid | pending | error
  const [entitlement, setEntitlement] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!sessionId) {
      setState('error')
      setMessage('No checkout session was given.')
      return
    }
    if (authStatus === 'loading') return // wait for the silent session refresh

    let cancelled = false

    async function run() {
      try {
        const result = await api.billing.checkoutStatus(sessionId)
        if (cancelled) return

        if (!result.paid) {
          setState('pending')
          return
        }

        setState('paid')
        try {
          const data = await api.billing.entitlement()
          if (!cancelled) setEntitlement(data)
        } catch {
          /* not signed in here — the login CTA covers it */
        }
      } catch (err) {
        if (!cancelled) {
          setState('error')
          setMessage(errorMessage(err, "We couldn't confirm this payment."))
        }
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [sessionId, authStatus])

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

          {authStatus === 'authenticated' ? (
            <Button to="/portal" size="lg" fullWidth>
              Go to your dashboard
            </Button>
          ) : (
            <Button to="/login" size="lg" fullWidth>
              Log in to your dashboard
            </Button>
          )}
        </>
      )}

      {state === 'pending' && (
        <>
          <Spinner className="size-10" />
          <h1 className="font-display text-2xl font-semibold text-white">
            Still confirming…
          </h1>
          <p className="text-center text-chalk-400">
            Stripe is finishing up your payment. This can take a few seconds — refresh in a
            moment, or check your dashboard.
          </p>
          <Button to="/login" variant="outline" size="lg" fullWidth>
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
          <Button to="/programs" variant="outline" size="lg" fullWidth>
            Back to programmes
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
