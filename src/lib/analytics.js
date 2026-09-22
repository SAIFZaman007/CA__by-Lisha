/**
 * Google Analytics 4 — installed the way this site's security and speed
 * budgets require.
**/

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || ''

// Off during prerendering, in development, and without a valid GA4 id.
export const analyticsEnabled =
  !import.meta.env.SSR && import.meta.env.PROD && /^G-[A-Z0-9]{4,}$/.test(MEASUREMENT_ID)

// European Economic Area + UK + Switzerland: consent required before cookies.
const CONSENT_REGIONS = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS', 'IE',
  'IT', 'LV', 'LI', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  'GB', 'CH',
]

const KEPT_QUERY_PARAMS = /^(utm_[a-z_]+|gclid|gbraid|wbraid)$/i

let initialised = false
let lastPagePath = null

function gtag() {
  // gtag.js reads the `arguments` object itself — a rest array would not work.
  window.dataLayer.push(arguments)
}

/** The current URL with sensitive query parameters removed. */
function safeLocation() {
  const url = new URL(window.location.href)
  for (const key of [...url.searchParams.keys()]) {
    if (!KEPT_QUERY_PARAMS.test(key)) url.searchParams.delete(key)
  }
  url.hash = ''
  return url.toString()
}

function loadLibrary() {
  if (document.querySelector('script[data-gtag]')) return
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`
  script.setAttribute('data-gtag', '')
  document.head.appendChild(script)
}

const INTERACTION_EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart', 'wheel']
const FALLBACK_DELAY_MS = 12_000

/** Fetch gtag.js on first interaction, or after FALLBACK_DELAY_MS. */
function scheduleLibraryLoad() {
  let timer = null
  const listenerOptions = { once: true, passive: true, capture: true }
  const trigger = () => {
    clearTimeout(timer)
    INTERACTION_EVENTS.forEach((type) => window.removeEventListener(type, trigger, listenerOptions))
    loadLibrary()
  }
  INTERACTION_EVENTS.forEach((type) => window.addEventListener(type, trigger, listenerOptions))
  timer = setTimeout(trigger, FALLBACK_DELAY_MS)
}

/** Set up the gtag queue now; fetch gtag.js on first interaction. */
export function initAnalytics() {
  if (!analyticsEnabled || initialised) return
  initialised = true

  window.dataLayer = window.dataLayer || []
  window.gtag = gtag

  const denyAds = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }
  gtag('consent', 'default', { ...denyAds, analytics_storage: 'denied', region: CONSENT_REGIONS })
  gtag('consent', 'default', { ...denyAds, analytics_storage: 'granted' })
  gtag('set', 'ads_data_redaction', true)
  gtag('set', 'url_passthrough', false)

  gtag('js', new Date())
  gtag('config', MEASUREMENT_ID, {
    send_page_view: false, // sent by trackPageView, with the right title
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    page_location: safeLocation(),
  })

  scheduleLibraryLoad()
}

/** One page view per distinct path. Called by useSeo once the title is set. */
export function trackPageView(title) {
  if (!analyticsEnabled || !initialised) return
  const path = window.location.pathname
  if (path === lastPagePath) return
  lastPagePath = path
  gtag('event', 'page_view', {
    page_title: title,
    page_location: safeLocation(),
    page_path: path,
  })
}

/**
 * A named event (GA4 recommended names where one exists: generate_lead,
 * sign_up, begin_checkout, purchase). Never pass personal data here.
 */
export function trackEvent(name, params = {}) {
  if (!analyticsEnabled || !initialised) return
  gtag('event', name, params)
}