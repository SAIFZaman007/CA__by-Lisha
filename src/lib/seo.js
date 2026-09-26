import { useEffect } from 'react'

import { SITE } from '@/data/site'
import { trackPageView } from '@/lib/analytics'
import { siteGraph } from '@/lib/structuredData'

const BASE_URL = SITE.url
const DEFAULT_IMAGE = `${BASE_URL}/images/og-cover.jpg`

const MANAGED = 'data-seo'
// JSON-LD written into the prerendered HTML. The client removes these once it
// has written its own, so a hydrated page never carries two copies.
export const SSR_JSONLD_ATTR = 'data-seo-ssr'

const ROBOTS_INDEX = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
const ROBOTS_NOINDEX = 'noindex, nofollow'

/**
 * The head tags for one page, as plain data.
 *
 * One function feeds both paths: the browser (useSeo's effect) and the build
 * (scripts/prerender.mjs, via `collectedSeo`). Prerendered HTML and the
 * hydrated page can therefore never disagree about a title or canonical URL.
 */
export function buildSeo({
  title,
  description,
  path = '/',
  image,
  type = 'website',
  jsonLd,
  noIndex = false,
  keywords,
}) {
  const fullTitle = title ? `${title} | ${SITE.brand}` : SITE.defaultTitle
  const canonical = `${BASE_URL}${path === '/' ? '/' : path}`
  const socialImage = !image
    ? DEFAULT_IMAGE
    : /^https?:\/\//.test(image)
      ? image
      : `${BASE_URL}${image.startsWith('/') ? image : `/${image}`}`

  // Search engines truncate around 155–160 characters; cut on a word boundary.
  const summary =
    description && description.length > 160
      ? `${description.slice(0, 157).replace(/\s+\S*$/, '')}…`
      : description

  return {
    title: fullTitle,
    description: summary ?? '',
    canonical,
    robots: noIndex ? ROBOTS_NOINDEX : ROBOTS_INDEX,
    keywords: keywords?.length ? keywords.join(', ') : null,
    og: {
      'og:type': type,
      'og:site_name': SITE.brand,
      'og:locale': 'en_US',
      'og:title': fullTitle,
      'og:description': summary ?? '',
      'og:url': canonical,
      'og:image': socialImage,
      'og:image:alt': title ? `${title} — ${SITE.brand}` : SITE.brand,
    },
    twitter: {
      'twitter:card': 'summary_large_image',
      'twitter:title': fullTitle,
      'twitter:description': summary ?? '',
      'twitter:image': socialImage,
    },
    // Every indexable page carries the site-wide entity graph (Organization,
    // WebSite, Person) first, then its own blocks. It used to be hard-coded
    // in index.html — a second copy that had already drifted from the one
    // here. Now there is one source, and noindex pages carry none of it.
    jsonLd: [
      ...(noIndex ? [] : [siteGraph()]),
      ...(jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []),
    ],
  }
}

/** Filled during a server render; read by scripts/prerender.mjs. */
export const collectedSeo = { current: null }

function recordForPrerender(options) {
  collectedSeo.current = buildSeo(options)
}

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
}

export function useSeo(options) {
  // Stringified so an inline object literal (`jsonLd: faqSchema(FAQS)`) does
  // not retrigger the effect on every render.
  const serialised = JSON.stringify(options)

  // On the server there are no effects: record the tags for the prerenderer.
  if (import.meta.env.SSR) recordForPrerender(options)

  useEffect(() => {
    const seo = buildSeo(JSON.parse(serialised))

    document.title = seo.title
    upsert('meta[name="description"]', 'meta', { name: 'description', content: seo.description })
    if (seo.keywords) upsert('meta[name="keywords"]', 'meta', { name: 'keywords', content: seo.keywords })
    upsert('link[rel="canonical"]', 'link', { rel: 'canonical', href: seo.canonical })
    upsert('meta[name="robots"]', 'meta', { name: 'robots', content: seo.robots })
    for (const [prop, content] of Object.entries(seo.og)) {
      upsert(`meta[property="${prop}"]`, 'meta', { property: prop, content })
    }
    for (const [name, content] of Object.entries(seo.twitter)) {
      upsert(`meta[name="${name}"]`, 'meta', { name, content })
    }

    // The prerendered copies have done their job; this page now owns JSON-LD.
    document.head.querySelectorAll(`script[${SSR_JSONLD_ATTR}]`).forEach((el) => el.remove())

    const scripts = seo.jsonLd.map((data) => {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.setAttribute(MANAGED, 'true')
      script.textContent = JSON.stringify(data)
      document.head.appendChild(script)
      return script
    })
    // The title is final now, so this page view reports the right one.
    trackPageView(seo.title)

    return () => scripts.forEach((script) => script.remove())
  }, [serialised])
}