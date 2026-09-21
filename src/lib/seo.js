import { useEffect } from 'react'

import { SITE } from '@/data/site'

const BASE_URL = SITE.url
const DEFAULT_IMAGE = `${BASE_URL}/images/og-cover.jpg`

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

    // Search engines truncate around 155–160 characters; cut on a word
    // boundary instead of letting them cut mid-word.
    const summary =
      description && description.length > 160
        ? `${description.slice(0, 157).replace(/\s+\S*$/, '')}…`
        : description

    meta('description', summary)
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
    property('og:description', summary ?? '')
    property('og:url', canonical)
    property('og:image', socialImage)
    property('og:image:alt', title ? `${title} — ${SITE.brand}` : SITE.brand)

    meta('twitter:card', 'summary_large_image')
    meta('twitter:title', fullTitle)
    meta('twitter:description', summary ?? '')
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