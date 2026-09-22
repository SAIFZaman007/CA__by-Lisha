import { useSyncExternalStore } from 'react'

/**
 * Server-rendering helpers.
 *
 * The public pages are prerendered to static HTML at build time
 * (`scripts/prerender.mjs`), so crawlers, AI assistants and slow phones get
 * real content before any JavaScript runs. The browser then *hydrates* that
 * HTML instead of throwing it away. Hydration only works if the first client
 * render produces exactly what the server produced, and these helpers keep
 * the two in step.
 */

export const isServer = typeof window === 'undefined'

// True while the browser is adopting prerendered HTML for the page it landed
// on. Read once at module load — before hydrateRoot runs — and switched off
// on the first client-side navigation.
let hydratingLandingPage =
  !isServer && Boolean(document.getElementById('root')?.firstElementChild)

/**
 * Should entrance animations be skipped for components mounting now?
 *
 * On the server and on the landing page's hydration pass: yes. Content that
 * is already painted must not be reset to `opacity: 0` and faded back in —
 * that hides the Largest Contentful Paint and makes crawlers see nothing.
 * After the first navigation, sections animate in as before.
 */
export function skipEntranceAnimation() {
  return isServer || hydratingLandingPage
}

/** Called on the first client-side route change. */
export function markClientNavigation() {
  hydratingLandingPage = false
}

const noopSubscribe = () => () => {}

/**
 * A value only the browser knows (timezone, "now"), rendered as `fallback`
 * on the server and during hydration, then swapped in right after. Prevents
 * hydration mismatches without an effect-driven re-render.
 */
export function useClientValue(getValue, fallback = '') {
  return useSyncExternalStore(noopSubscribe, getValue, () => fallback)
}

let cachedTimezone
export function browserTimezone() {
  cachedTimezone ??= Intl.DateTimeFormat().resolvedOptions().timeZone
  return cachedTimezone
}