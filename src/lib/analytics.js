/**
 * Google Analytics 4 and Google Ads conversion tracking — installed the way
 * this site's security and speed budgets require.
 *
 * One gtag.js library serves both products. GA4 reports on the site; the Ads
 * tag tells Google Ads which clicks ended in a sign-up or a sale, which is what
 * Smart Bidding ("Maximize conversions") optimises for. Ads tracking switches
 * on only when VITE_GOOGLE_ADS_ID is set, so a build without it behaves exactly
 * as before.
**/

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || ''
const ADS_ID = import.meta.env.VITE_GOOGLE_ADS_ID || ''

const GA_VALID = /^G-[A-Z0-9]{4,}$/.test(MEASUREMENT_ID)
const ADS_VALID = /^AW-\d{6,}$/.test(ADS_ID)

/**
 * Whether Google Ads conversion measurement is configured in this build. Also
 * read by the privacy policy, so what the page says follows what the site does.
 */
export const adsTrackingConfigured = ADS_VALID

/**
 * GA4 event name → the Google Ads conversion label that mirrors it. The label
 * is the part after the slash in the conversion's `send_to` value
 * (AW-123456789/<label>) shown under Goals → Conversions → the action → Tag
 * setup → Event snippet. A blank label simply means "not mirrored to Ads".
 */
const ADS_CONVERSIONS = {
  purchase: import.meta.env.VITE_GOOGLE_ADS_PURCHASE_LABEL || '',
  sign_up: import.meta.env.VITE_GOOGLE_ADS_SIGNUP_LABEL || '',
}

/**
 * Events that end a visit. gtag.js normally waits for the first interaction to
 * be fetched; for these it is fetched at once, so a visitor who pays and closes
 * the tab is still counted.
 */
const FLUSH_EVENTS = new Set(['purchase', 'sign_up', 'generate_lead'])

// Off during prerendering, in development, and without a valid GA4 or Ads id.
export const analyticsEnabled =
  !import.meta.env.SSR && import.meta.env.PROD && (GA_VALID || ADS_VALID)

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
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_VALID ? MEASUREMENT_ID : ADS_ID)}`
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

  // Outside the EEA / UK / Switzerland, Google Ads may keep its click cookie
  // (`_gcl_aw`) and use conversion data — without that cookie a click on an ad
  // cannot be matched to a purchase made several pages (and a Stripe round trip)
  // later. Ad *personalisation* stays off everywhere: this is measurement only.
  // Inside the consent regions everything advertising-related stays denied, and
  // there is no banner to grant it, so those visitors get no advertising cookie.
  // With no Ads id configured the original all-denied behaviour is unchanged.
  const adsStorage = ADS_VALID ? 'granted' : 'denied'
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    region: CONSENT_REGIONS,
  })
  gtag('consent', 'default', {
    ad_storage: adsStorage,
    ad_user_data: adsStorage,
    ad_personalization: 'denied',
    analytics_storage: 'granted',
  })
  gtag('set', 'ads_data_redaction', true)
  gtag('set', 'url_passthrough', false)

  gtag('js', new Date())
  if (GA_VALID) {
    gtag('config', MEASUREMENT_ID, {
      send_page_view: false, // sent by trackPageView, with the right title
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: safeLocation(),
    })
  }
  if (ADS_VALID) {
    // Registers the Ads account with the tag (this is what flips the
    // conversion from "Unverified") and starts the click-id linker.
    gtag('config', ADS_ID, {
      allow_ad_personalization_signals: false,
      page_location: safeLocation(),
    })
  }

  scheduleLibraryLoad()
}

/** One page view per distinct path. Called by useSeo once the title is set. */
export function trackPageView(title) {
  if (!analyticsEnabled || !initialised || !GA_VALID) return
  const path = window.location.pathname
  if (path === lastPagePath) return
  lastPagePath = path
  gtag('event', 'page_view', {
    page_title: title,
    page_location: safeLocation(),
    page_path: path,
  })
}

/** Mirror a GA4 event to its Google Ads conversion, when one is configured. */
function trackAdsConversion(name, params) {
  const label = ADS_CONVERSIONS[name]
  if (!ADS_VALID || !label) return

  const value = Number(params.value)
  gtag('event', 'conversion', {
    send_to: `${ADS_ID}/${label}`,
    // Only a real amount is sent; otherwise the action's default value applies.
    ...(Number.isFinite(value) && value > 0
      ? { value, currency: params.currency || 'USD' }
      : {}),
    // Google Ads counts one conversion per transaction_id, so a reload or a
    // second tab cannot double-count a sale.
    ...(params.transaction_id ? { transaction_id: params.transaction_id } : {}),
  })
}

/**
 * A named event (GA4 recommended names where one exists: generate_lead,
 * sign_up, begin_checkout, purchase). Never pass personal data here.
 */
export function trackEvent(name, params = {}) {
  if (!analyticsEnabled || !initialised) return
  if (GA_VALID) gtag('event', name, params)
  trackAdsConversion(name, params)
  if (FLUSH_EVENTS.has(name)) loadLibrary()
}
