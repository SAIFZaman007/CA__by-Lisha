import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  CreditCard,
  Download,
  ExternalLink,
  Receipt,
  RotateCcw,
} from 'lucide-react'

import { api, errorMessage } from '@/lib/api'
import { keys } from '@/lib/queryClient'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, EmptyState, Skeleton } from '@/components/ui/Card'
import { toast } from '@/components/ui/Toast'

/**
 * Billing — everything a subscriber can do after the sale.
 *
 * The page is organised by urgency rather than by feature, which is why the
 * order looks the way it does:
 *
 *   1. A problem, if there is one. A declined card with a retry deadline goes
 *      above everything, because it is the only thing on this page with a
 *      clock attached.
 *   2. What you are on, what it costs, when it renews, and the card paying
 *      for it. The four facts people open this page to check.
 *   3. Changing plan. Upgrades and downgrades read differently on purpose —
 *      see `PlanCard`.
 *   4. Receipts.
 *   5. Cancelling, last and understated. Findable, not signposted.
 *
 * Every irreversible or chargeable action is confirmed first, and every
 * confirmation states the consequence in money and dates rather than in
 * adjectives.
 */

function money(cents, currency = 'usd') {
  if (cents == null) return '—'
  const symbol = { usd: '$', gbp: '£', eur: '€' }[currency?.toLowerCase()] ?? ''
  return `${symbol}${(cents / 100).toFixed(2)}`
}

function shortDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const STATUS_TONE = {
  active: 'text-signal-green',
  trialing: 'text-signal-green',
  past_due: 'text-signal-amber',
  unpaid: 'text-brand-400',
  canceled: 'text-chalk-500',
  incomplete: 'text-signal-amber',
}

/** Reasons offered at cancellation. Optional — "prefer not to say" is a real answer. */
const CANCEL_REASONS = [
  { value: 'too_expensive', label: 'Too expensive' },
  { value: 'not_using', label: 'Not using it enough' },
  { value: 'reached_goal', label: 'I reached my goal' },
  { value: 'injury_or_health', label: 'Injury or health' },
  { value: 'switching', label: 'Going elsewhere' },
  { value: 'other', label: 'Something else' },
]

/* --------------------------------------------------------------------------- */

function Row({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-ink-700 py-3 last:border-0">
      <dt className="text-sm text-chalk-500">{label}</dt>
      <dd className="text-right text-sm text-chalk-100">{children}</dd>
    </div>
  )
}

/**
 * One plan in the change-plan grid.
 *
 * The verb comes from the server (`change_type`), not from comparing prices in
 * the browser. If the client decided the direction, a promotional month where
 * a higher tier costs less would silently turn an upgrade into a downgrade —
 * and downgrades are prorated differently, so that is a money bug, not a
 * cosmetic one.
 */
function PlanCard({ plan, onChoose, busy }) {
  const isUpgrade = plan.change_type === 'upgrade'
  const isDowngrade = plan.change_type === 'downgrade'

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border p-5 transition',
        plan.is_current ? 'border-brand-500 bg-brand-500/5' : 'border-ink-600 bg-ink-800',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.18em] text-brand-500">
            {plan.days_per_week} days / week
          </p>
          <h3 className="mt-1.5 text-lg font-semibold text-chalk-50">{plan.name}</h3>
        </div>
        {plan.is_current && (
          <span className="shrink-0 rounded-full bg-brand-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-400">
            Current
          </span>
        )}
      </div>

      <p className="mt-3">
        <span className="font-display text-2xl font-bold text-white">
          {money(plan.price_cents, 'usd')}
        </span>
        <span className="ml-1 text-xs text-chalk-500">/ {plan.billing_period}</span>
      </p>

      <ul className="mt-4 grow space-y-1.5">
        {(plan.features ?? []).slice(0, 4).map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-xs text-chalk-300">
            <Check className="mt-0.5 size-3.5 shrink-0 text-brand-500" aria-hidden="true" />
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-5">
        {plan.is_current ? (
          <Button variant="subtle" size="sm" fullWidth disabled>
            Your plan
          </Button>
        ) : !plan.is_available ? (
          <Button variant="ghost" size="sm" fullWidth disabled>
            Not taking clients
          </Button>
        ) : (
          <Button
            size="sm"
            fullWidth
            variant={isUpgrade ? 'primary' : 'outline'}
            loading={busy}
            onClick={() => onChoose(plan)}
          >
            {isUpgrade ? (
              <>
                <ArrowUpRight className="size-4" aria-hidden="true" />
                Upgrade
              </>
            ) : isDowngrade ? (
              <>
                <ArrowDownRight className="size-4" aria-hidden="true" />
                Downgrade
              </>
            ) : (
              'Choose this plan'
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------------- */

export default function BillingPage() {
  const queryClient = useQueryClient()
  const [pendingPlan, setPendingPlan] = useState(null) // { plan, preview }
  const [cancelling, setCancelling] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelComment, setCancelComment] = useState('')

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: keys.billingSummary,
    queryFn: api.billing.summary,
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['billing'] })
  }

  // Preview first, apply second. Two round trips, deliberately: the first one
  // is what lets the confirmation dialog say "$23.40 today" instead of
  // "you may be charged".
  const preview = useMutation({
    mutationFn: (plan) => api.billing.previewChange(plan.id),
    onSuccess: (result, plan) => setPendingPlan({ plan, preview: result }),
    onError: (failure) => toast.error(errorMessage(failure)),
  })

  const applyChange = useMutation({
    mutationFn: (plan) => api.billing.changePlan(plan.id),
    onSuccess: (result) => {
      invalidate()
      setPendingPlan(null)
      toast.success(result.message ?? 'Your plan has been updated.')
    },
    onError: (failure) => toast.error(errorMessage(failure)),
  })

  const cancelScheduled = useMutation({
    mutationFn: api.billing.cancelScheduledChange,
    onSuccess: () => {
      invalidate()
      toast.success('Your plan stays as it is.')
    },
    onError: (failure) => toast.error(errorMessage(failure)),
  })

  const cancelPlan = useMutation({
    mutationFn: () =>
      api.billing.cancel({
        reason: cancelReason || null,
        comment: cancelComment.trim() || null,
      }),
    onSuccess: (result) => {
      invalidate()
      setCancelling(false)
      setCancelReason('')
      setCancelComment('')
      toast.success(result.message ?? 'Your plan will end at the end of this period.')
    },
    onError: (failure) => toast.error(errorMessage(failure)),
  })

  const resume = useMutation({
    mutationFn: api.billing.resume,
    onSuccess: () => {
      invalidate()
      toast.success('Your plan will keep renewing.')
    },
    onError: (failure) => toast.error(errorMessage(failure)),
  })

  // Both hand back a one-use Stripe URL. Full navigation rather than a popup:
  // a blocked popup on the screen someone reached because their payment failed
  // is the worst possible place to lose them.
  const openStripe = useMutation({
    mutationFn: (which) =>
      which === 'card' ? api.billing.updatePaymentMethod() : api.billing.portal(),
    onSuccess: (result) => {
      window.location.href = result.url
    },
    onError: (failure) => toast.error(errorMessage(failure)),
  })

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (isError) {
    return (
      <Card>
        <EmptyState
          icon={AlertTriangle}
          title="Billing did not load"
          description={errorMessage(error)}
          action={<Button onClick={() => refetch()}>Try again</Button>}
        />
      </Card>
    )
  }

  const subscription = data.subscription
  const scheduled = subscription?.scheduled_change

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow text-brand-500">Account</p>
        <h1 className="mt-2 text-3xl sm:text-4xl">Billing</h1>
        <p className="mt-2 max-w-2xl text-sm text-chalk-400">
          Your plan, your card and every receipt. Change or cancel any time — nothing here needs
          an email to the coach.
        </p>
      </header>

      {/* 1 — The only thing on this page with a deadline. */}
      {subscription?.is_past_due && (
        <div
          role="alert"
          className="rounded-xl border border-signal-amber/40 bg-signal-amber/10 p-5"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-signal-amber" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-chalk-50">Your last payment did not go through</h2>
              <p className="mt-1 text-sm text-chalk-300">
                {subscription.last_payment_error ?? 'The card on file was declined.'}
                {subscription.payment_retry_at && (
                  <> We will try again on {shortDate(subscription.payment_retry_at)}.</>
                )}{' '}
                Your coaching is still active in the meantime — nothing has been switched off.
              </p>
              <Button
                size="sm"
                className="mt-4"
                loading={openStripe.isPending}
                onClick={() => openStripe.mutate('card')}
              >
                <CreditCard className="size-4" aria-hidden="true" />
                Update your card
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* A pending downgrade, stated plainly and reversible in one click. */}
      {scheduled && (
        <div className="rounded-xl border border-ink-600 bg-ink-850 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-chalk-300">
              You are moving to <strong className="text-chalk-50">{scheduled.name}</strong> on{' '}
              {shortDate(scheduled.effective_at)}. Nothing changes before then.
            </p>
            <Button
              variant="ghost"
              size="sm"
              loading={cancelScheduled.isPending}
              onClick={() => cancelScheduled.mutate()}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Keep my current plan
            </Button>
          </div>
        </div>
      )}

      {/* A cancellation that has not happened yet is still reversible. */}
      {subscription?.cancel_at_period_end && (
        <div className="rounded-xl border border-brand-500/40 bg-brand-500/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-chalk-300">
              Your plan ends on {shortDate(subscription.current_period_end)}. You keep full access
              until then.
            </p>
            <Button size="sm" loading={resume.isPending} onClick={() => resume.mutate()}>
              Keep my plan
            </Button>
          </div>
        </div>
      )}

      {/* 2 — The four facts people came here to check. */}
      <Card>
        <CardBody>
          {subscription ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-chalk-500">Current plan</p>
                  <h2 className="mt-1 text-2xl text-chalk-50">
                    {subscription.program?.name ?? 'Coaching'}
                  </h2>
                </div>
                <span
                  className={cn(
                    'text-xs font-semibold uppercase tracking-wide',
                    STATUS_TONE[subscription.status] ?? 'text-chalk-400',
                  )}
                >
                  {subscription.status.replace('_', ' ')}
                </span>
              </div>

              <dl className="mt-5">
                <Row label="Price">
                  {money(subscription.price_cents, subscription.currency)} / {subscription.billing_period}
                </Row>
                <Row label={subscription.cancel_at_period_end ? 'Ends' : 'Renews'}>
                  {shortDate(subscription.current_period_end) ?? '—'}
                </Row>
                <Row label="Member since">{shortDate(subscription.started_at) ?? '—'}</Row>
                <Row label="Card">
                  {subscription.payment_method ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="capitalize">{subscription.payment_method.brand}</span>
                      <span className="tabular-nums">···· {subscription.payment_method.last4}</span>
                      {subscription.payment_method.exp && (
                        <span className="text-chalk-500">exp {subscription.payment_method.exp}</span>
                      )}
                    </span>
                  ) : (
                    '—'
                  )}
                </Row>
              </dl>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  variant="subtle"
                  size="sm"
                  loading={openStripe.isPending}
                  onClick={() => openStripe.mutate('card')}
                >
                  <CreditCard className="size-4" aria-hidden="true" />
                  Update payment method
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openStripe.mutate('portal')}>
                  <ExternalLink className="size-4" aria-hidden="true" />
                  Manage at Stripe
                </Button>
              </div>
            </>
          ) : (
            <EmptyState
              icon={Receipt}
              title="You are not on a plan"
              description="Pick a coaching level to get your first block of training written."
              action={<Button to="/programs">See the levels</Button>}
            />
          )}
        </CardBody>
      </Card>

      {/* 3 — Changing plan. */}
      {data.plans?.length > 0 && (
        <section>
          <h2 className="text-xl text-chalk-50">
            {subscription ? 'Change your plan' : 'Choose a plan'}
          </h2>
          <p className="mt-1 text-sm text-chalk-400">
            Upgrades start immediately and you only pay the difference for the rest of this period.
            Downgrades wait until your current period ends, so you never lose something you have
            already paid for.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                busy={preview.isPending && preview.variables?.id === plan.id}
                onChoose={(chosen) => {
                  if (!subscription) {
                    // No subscription yet: this is a first purchase, which goes
                    // through Stripe Checkout rather than a plan change.
                    api.billing
                      .checkout(chosen.id)
                      .then((session) => {
                        window.location.href = session.url
                      })
                      .catch((failure) => toast.error(errorMessage(failure)))
                    return
                  }
                  preview.mutate(chosen)
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* 4 — Receipts. */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg text-chalk-50">Billing history</h2>
          </div>

          {data.recent_payments?.length ? (
            <ul className="mt-4 divide-y divide-ink-700">
              {data.recent_payments.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm text-chalk-100">
                      {money(payment.amount_cents, payment.currency)}
                      {payment.invoice_number && (
                        <span className="ml-2 text-xs text-chalk-500">
                          #{payment.invoice_number}
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-chalk-500">
                      {shortDate(payment.paid_at ?? payment.created_at)}
                      {payment.status === 'failed' && payment.failure_reason && (
                        <span className="text-brand-400"> · {payment.failure_reason}</span>
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={cn(
                        'text-xs font-medium capitalize',
                        payment.status === 'succeeded' ? 'text-signal-green' : 'text-brand-400',
                      )}
                    >
                      {payment.status}
                    </span>
                    {payment.invoice_pdf_url && (
                      <a
                        href={payment.invoice_pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-chalk-400 transition-colors hover:text-brand-500"
                        aria-label="Download invoice"
                      >
                        <Download className="size-4" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-chalk-500">No payments yet.</p>
          )}
        </CardBody>
      </Card>

      {/* 5 — Cancelling. Present, findable, not advertised. */}
      {subscription && !subscription.cancel_at_period_end && (
        <div className="pt-2">
          {!cancelling ? (
            <button
              type="button"
              onClick={() => setCancelling(true)}
              className="text-xs text-chalk-500 underline underline-offset-4 transition-colors hover:text-chalk-300"
            >
              Cancel my subscription
            </button>
          ) : (
            <Card>
              <CardBody>
                <h2 className="text-lg text-chalk-50">Cancel your subscription?</h2>
                <p className="mt-2 text-sm text-chalk-400">
                  You keep full access until{' '}
                  <strong className="text-chalk-200">
                    {shortDate(subscription.current_period_end)}
                  </strong>
                  , and you can undo this at any point before then. Your logged training, weights
                  and photos stay on your account either way.
                </p>

                <fieldset className="mt-5">
                  <legend className="text-xs uppercase tracking-[0.18em] text-chalk-500">
                    What is prompting this? (optional)
                  </legend>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {CANCEL_REASONS.map((reason) => (
                      <button
                        key={reason.value}
                        type="button"
                        onClick={() =>
                          setCancelReason((current) =>
                            current === reason.value ? '' : reason.value,
                          )
                        }
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs transition',
                          cancelReason === reason.value
                            ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                            : 'border-ink-600 text-chalk-400 hover:text-white',
                        )}
                      >
                        {reason.label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label className="mt-4 block">
                  <span className="sr-only">Anything else</span>
                  <textarea
                    rows={3}
                    value={cancelComment}
                    maxLength={1000}
                    onChange={(event) => setCancelComment(event.target.value)}
                    placeholder="Anything the coach should know? This is read by a person."
                    className="w-full rounded-md border border-ink-600 bg-ink-900 p-3 text-sm text-white placeholder:text-chalk-500 focus:border-brand-500 focus:outline-none"
                  />
                </label>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button variant="subtle" size="sm" onClick={() => setCancelling(false)}>
                    Keep my plan
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={cancelPlan.isPending}
                    onClick={() => cancelPlan.mutate()}
                  >
                    Cancel at period end
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* Confirmation for a plan change — always shows the number first. */}
      {pendingPlan && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5"
          onClick={() => !applyChange.isPending && setPendingPlan(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-ink-600 bg-ink-850 p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-xl text-chalk-50">
              {pendingPlan.preview.change_type === 'upgrade' ? 'Upgrade to' : 'Move to'}{' '}
              {pendingPlan.plan.name}
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-chalk-300">
              {pendingPlan.preview.message}
            </p>

            <dl className="mt-5 rounded-lg border border-ink-700 bg-ink-900 p-4">
              <Row label="Due today">
                {pendingPlan.preview.change_type === 'upgrade'
                  ? money(
                      pendingPlan.preview.amount_due_cents,
                      pendingPlan.preview.currency ?? 'usd',
                    )
                  : money(0)}
              </Row>
              <Row label="Then">
                {money(pendingPlan.plan.price_cents)} / {pendingPlan.plan.billing_period}
              </Row>
              {pendingPlan.preview.effective_at && (
                <Row label="Starts">{shortDate(pendingPlan.preview.effective_at)}</Row>
              )}
            </dl>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={applyChange.isPending}
                onClick={() => setPendingPlan(null)}
              >
                Not now
              </Button>
              <Button
                size="sm"
                loading={applyChange.isPending}
                onClick={() => applyChange.mutate(pendingPlan.plan)}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}