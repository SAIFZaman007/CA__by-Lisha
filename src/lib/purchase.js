/**
 * The "Purchase now" journey, in one place.
 *
 * A visitor with no account is sent to the sign-up page carrying the slug of
 * the plan they picked (`/register?plan=level-2-...`). Once they have an
 * account they land on the billing page of their new dashboard, where the plans
 * are listed and the purchase goes through Stripe Checkout.
 *
 * Both halves live here so the buttons that start the journey and the screens
 * that finish it can never disagree about the URL shape.
 */

const PLAN_PARAM = 'plan'

// Same alphabet the nginx route for /programs/<slug> accepts.
const SLUG = /^[a-z0-9-]{1,80}$/

/** `/register`, carrying the chosen plan when there is a valid one. */
export function signupPath(slug) {
  return typeof slug === 'string' && SLUG.test(slug)
    ? `/register?${PLAN_PARAM}=${slug}`
    : '/register'
}

/** The plan slug in a `location.search` string, or null if absent or invalid. */
export function planFromSearch(search) {
  const slug = new URLSearchParams(search).get(PLAN_PARAM)
  return slug && SLUG.test(slug) ? slug : null
}

/**
 * Where to send someone once they are signed in. A visitor who arrived via
 * "Purchase now" goes straight to the billing page to choose and pay; everyone
 * else goes to the dashboard, exactly as before.
 */
export function postAuthPath(search) {
  return planFromSearch(search) ? '/portal/billing' : '/portal'
}

/** `?plan=<slug>` to carry across to the sibling auth screen, or ''. */
export function planSearch(search) {
  const slug = planFromSearch(search)
  return slug ? `?${PLAN_PARAM}=${slug}` : ''
}
