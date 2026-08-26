import { useEffect } from 'react'

import { SITE } from '@/data/site'

const BASE_URL = SITE.url
const DEFAULT_IMAGE = `${BASE_URL}/images/hero-portrait.png`

/**
 * Per-page SEO.
 *
 * React 19 hoists `<title>` and `<meta>` out of components, which handles the
 * simple cases. This does it imperatively anyway, for three reasons that
 * hoisting does not cover:
 *
 * - Canonical URLs and JSON-LD have to agree with each other across every
 *   route. Keeping them in one function is what stops `/programs/level-2`
 *   quietly canonicalising to `/` after a copy-paste.
 * - Tags have to be *replaced*, not appended. Navigating between five pages in
 *   a single-page app must not leave five `og:title` tags in the head — a
 *   crawler reads the first one it finds, which would be whichever page the
 *   visitor happened to land on first.
 * - Everything is cleaned up on unmount, so a route that sets `noIndex` cannot
 *   leave that behind on the next page.
 *
 * A note on what this cannot do. This is a client-rendered app: Google executes
 * JavaScript and will see these tags, but most social crawlers and several
 * smaller search engines do not. `index.html` therefore carries a complete set
 * of defaults so an unrendered fetch still gets a correct title, description
 * and image — this hook refines them per route rather than creating them from
 * nothing. Prerendering the public routes at build time is the next real step
 * up from here.
 */

const MANAGED = 'data-seo'

function upsert(selector, tag, attrs) {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement(tag)
    el.setAttribute(MANAGED, 'true')
    document.head.appendChild(el)
  }
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === null || value === undefined) el.removeAttribute(key)
    else el.setAttribute(key, String(value))
  })
  return el
}

function meta(name, content) {
  upsert(`meta[name="${name}"]`, 'meta', { name, content: content ?? '' })
}

function property(prop, content) {
  upsert(`meta[property="${prop}"]`, 'meta', { property: prop, content: content ?? '' })
}

function absolute(path) {
  if (!path) return DEFAULT_IMAGE
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export function useSeo({
  title,
  description,
  path = '/',
  image,
  type = 'website',
  jsonLd,
  noIndex = false,
  keywords,
}) {
  // JSON-LD is stringified here rather than in the dependency array so an
  // object literal built inline in a component does not retrigger the effect
  // on every render. Passing `jsonLd={faqSchema(FAQS)}` is the natural way to
  // call this, and it creates a new object each time.
  const serialisedJsonLd = jsonLd ? JSON.stringify(jsonLd) : null

  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE.brand}` : `${SITE.brand} | ${SITE.business}`
    const canonical = `${BASE_URL}${path === '/' ? '/' : path}`
    const socialImage = absolute(image)

    document.title = fullTitle

    meta('description', description)
    if (keywords?.length) meta('keywords', keywords.join(', '))

    upsert('link[rel="canonical"]', 'link', { rel: 'canonical', href: canonical })

    meta(
      'robots',
      noIndex
        ? 'noindex, nofollow'
        : // `max-image-preview:large` is what lets a result carry a full-width
          // photo instead of a thumbnail, which matters most on the gallery
          // and programme pages.
          'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    )

    property('og:type', type)
    property('og:site_name', SITE.brand)
    property('og:locale', 'en_US')
    property('og:title', fullTitle)
    property('og:description', description ?? '')
    property('og:url', canonical)
    property('og:image', socialImage)
    property('og:image:alt', title ? `${title} — ${SITE.brand}` : SITE.brand)

    meta('twitter:card', 'summary_large_image')
    meta('twitter:title', fullTitle)
    meta('twitter:description', description ?? '')
    meta('twitter:image', socialImage)

    let script
    if (serialisedJsonLd) {
      script = document.createElement('script')
      script.type = 'application/ld+json'
      script.setAttribute(MANAGED, 'true')
      script.textContent = serialisedJsonLd
      document.head.appendChild(script)
    }

    return () => script?.remove()
  }, [title, description, path, image, type, serialisedJsonLd, noIndex, keywords])
}