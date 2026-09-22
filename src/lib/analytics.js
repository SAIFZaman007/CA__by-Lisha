const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || ''

export const analyticsEnabled =
  !import.meta.env.SSR && import.meta.env.PROD && /^G-[A-Z0-9]{4,}$/.test(MEASUREMENT_ID)

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

/** Set up the gtag queue now; fetch gtag.js once the page is idle. */
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

  const start = () =>
    'requestIdleCallback' in window
      ? window.requestIdleCallback(loadLibrary, { timeout: 4000 })
      : setTimeout(loadLibrary, 1500)
  if (document.readyState === 'complete') start()
  else window.addEventListener('load', start, { once: true })
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

export function trackEvent(name, params = {}) {
  if (!analyticsEnabled || !initialised) return
  gtag('event', name, params)
}