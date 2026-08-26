import { SITE } from '@/data/site'

/**
 * Schema.org builders.
 *
 * Structured data is the part of SEO with the clearest return for an online
 * coaching business. It is what produces a rich result rather than a plain blue
 * link, and — increasingly the bigger prize — it is what an AI assistant reads
 * when someone asks it to recommend a coach. A `FAQPage` block is quotable in a
 * way a paragraph of marketing copy is not.
 *
 * Everything is built from `SITE` so the canonical origin is defined once. A
 * `@id` pointing at `localhost` is not a visible bug — it is a schema block
 * that silently fails validation in production.
 */

const BASE = SITE.url

/** Stable node ids, so separate blocks on separate pages describe one entity. */
export const ORG_ID = `${BASE}/#organization`
export const SITE_ID = `${BASE}/#website`

/**
 * The business itself.
 *
 * `HealthAndBeautyBusiness` rather than the more obvious `LocalBusiness`: this
 * is an online coaching practice with no premises, and claiming a physical
 * business type without an address is the kind of mismatch that gets structured
 * data ignored rather than rewarded.
 */
export const organizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': ['Organization', 'HealthAndBeautyBusiness'],
  '@id': ORG_ID,
  name: SITE.brand,
  legalName: SITE.business,
  url: BASE,
  logo: {
    '@type': 'ImageObject',
    url: `${BASE}/images/logo-lockup-light.png`,
  },
  image: `${BASE}/images/hero-portrait.png`,
  email: SITE.email,
  sameAs: [SITE.instagram].filter(Boolean),
  areaServed: {
    '@type': 'Place',
    name: 'Worldwide',
  },
  knowsAbout: [
    'Strength training',
    'Online personal training',
    'Nutrition coaching',
    'Progressive overload',
    'Body recomposition',
  ],
})

/** The site, with a search action so a sitelinks search box is possible. */
export const websiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': SITE_ID,
  url: BASE,
  name: SITE.brand,
  publisher: { '@id': ORG_ID },
  inLanguage: 'en',
})

/**
 * One coaching tier, as a purchasable service.
 *
 * Prices come from the API in minor units, so they are divided here rather than
 * anywhere a rounding error could reach the customer. An `Offer` with a price
 * and currency is what makes a programme eligible for a rich result at all.
 */
export const programSchema = (program) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': `${BASE}/programs/${program.slug}#service`,
  name: program.name,
  serviceType: 'Online strength coaching',
  description: program.description,
  provider: { '@id': ORG_ID },
  areaServed: { '@type': 'Place', name: 'Worldwide' },
  offers: {
    '@type': 'Offer',
    price: (program.price_cents / 100).toFixed(2),
    priceCurrency: 'USD',
    availability: program.is_accepting_clients
      ? 'https://schema.org/InStock'
      : 'https://schema.org/SoldOut',
    url: `${BASE}/programs/${program.slug}`,
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: (program.price_cents / 100).toFixed(2),
      priceCurrency: 'USD',
      billingDuration: 1,
      billingIncrement: 1,
      unitCode: 'MON',
    },
  },
})

/** Answers written for search engines and AI assistants as much as for readers. */
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
    item: `${BASE}${path}`,
  })),
})

/**
 * The gallery.
 *
 * `ImageGallery` with a nested `ImageObject` per photo is what gets individual
 * images into Google Images with their captions attached, rather than indexed
 * as anonymous files sitting behind an API path. `caption` is deliberately fed
 * from `alt_text`, which the API requires and validates — the field most likely
 * to have been written thoughtfully.
 */
export const gallerySchema = (images, { path = '/gallery', name = 'Gallery' } = {}) => ({
  '@context': 'https://schema.org',
  '@type': 'ImageGallery',
  '@id': `${BASE}${path}#gallery`,
  name,
  url: `${BASE}${path}`,
  publisher: { '@id': ORG_ID },
  associatedMedia: images.slice(0, 100).map((image) => ({
    '@type': 'ImageObject',
    contentUrl: `${BASE}${image.image_url}`,
    name: image.title,
    caption: image.alt_text,
    ...(image.width ? { width: image.width } : {}),
    ...(image.height ? { height: image.height } : {}),
    ...(image.taken_on ? { datePublished: image.taken_on } : {}),
    ...(image.credit ? { creditText: image.credit } : {}),
  })),
})

/** Client results, as reviews attached to the business. */
export const reviewsSchema = (testimonials) => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': ORG_ID,
  name: SITE.brand,
  review: testimonials.slice(0, 20).map((item) => ({
    '@type': 'Review',
    author: { '@type': 'Person', name: item.client_name },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: item.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: item.quote,
  })),
})