import { useEffect } from 'react'

const SITE = 'Coach Auto'
const BASE_URL = 'https://autonomyfitness.press'

function setTag(selector, attrs) {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement(attrs.property ? 'meta' : selector.startsWith('link') ? 'link' : 'meta')
    document.head.appendChild(el)
  }
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value))
  return el
}

/**
 * Per-page SEO. React 19 hoists <title> and <meta> from components, but we set
 * them imperatively here so canonical URLs and JSON-LD stay in one place and
 * cannot drift between routes.
 */
export function useSeo({ title, description, path = '/', jsonLd, noIndex = false }) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE}` : SITE
    document.title = fullTitle

    setTag('meta[name="description"]', { name: 'description', content: description ?? '' })
    setTag('link[rel="canonical"]', { rel: 'canonical', href: `${BASE_URL}${path}` })
    setTag('meta[property="og:title"]', { property: 'og:title', content: fullTitle })
    setTag('meta[property="og:description"]', {
      property: 'og:description',
      content: description ?? '',
    })
    setTag('meta[property="og:url"]', { property: 'og:url', content: `${BASE_URL}${path}` })
    setTag('meta[name="robots"]', {
      name: 'robots',
      content: noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
    })

    let script
    if (jsonLd) {
      script = document.createElement('script')
      script.type = 'application/ld+json'
      script.dataset.page = 'true'
      script.textContent = JSON.stringify(jsonLd)
      document.head.appendChild(script)
    }
    return () => script?.remove()
  }, [title, description, path, jsonLd, noIndex])
}

/** FAQ schema — this is what AI assistants quote when asked about the service. */
export const faqSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map(({ question, answer }) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: { '@type': 'Answer', text: answer },
  })),
})

export const breadcrumbSchema = (crumbs) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map(({ name, path }, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name,
    item: `${BASE_URL}${path}`,
  })),
})
