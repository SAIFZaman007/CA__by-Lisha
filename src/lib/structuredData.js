import { SITE } from '@/data/site'

const BASE = SITE.url

/** Stable node ids, so separate blocks on separate pages describe one entity. */
export const ORG_ID = `${BASE}/#organization`
export const SITE_ID = `${BASE}/#website`
export const COACH_ID = `${BASE}/#coach`

const absolute = (path) => (/^https?:\/\//.test(path) ? path : `${BASE}${path}`)

export const personSchema = () =>
  SITE.coach?.name
    ? {
        '@context': 'https://schema.org',
        '@type': 'Person',
        '@id': COACH_ID,
        name: SITE.coach.name,
        ...(SITE.coach.alternateName ? { alternateName: SITE.coach.alternateName } : {}),
        jobTitle: SITE.coach.jobTitle,
        description: SITE.coach.description,
        url: `${BASE}/about`,
        image: absolute(SITE.coach.image ?? '/images/hero-portrait.png'),
        worksFor: { '@id': ORG_ID },
        ...(SITE.coach.credential
          ? {
              hasCredential: {
                '@type': 'EducationalOccupationalCredential',
                name: SITE.coach.credential,
                credentialCategory: 'certification',
              },
            }
          : {}),
        knowsAbout: [
          'Strength training',
          'Bodybuilding',
          'Online personal training',
          'Nutrition coaching',
          'Meal planning',
        ],
        ...(SITE.sameAs?.length ? { sameAs: SITE.sameAs } : {}),
      }
    : null

/**
 * The business. `OnlineBusiness` rather than a LocalBusiness subtype: the
 * coaching is delivered online with no public premises, and a LocalBusiness
 * with no address is a contradiction Search Console flags.
 */
export const organizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': ['Organization', 'OnlineBusiness'],
  '@id': ORG_ID,
  name: SITE.brand,
  alternateName: SITE.alternateNames,
  legalName: SITE.business,
  description: SITE.description,
  slogan: SITE.slogan,
  url: `${BASE}/`,
  logo: {
    '@type': 'ImageObject',
    url: `${BASE}/images/logo-lockup-light.png`,
  },
  image: `${BASE}/images/og-cover.jpg`,
  email: SITE.email,
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: SITE.email,
    url: `${BASE}/contact`,
    availableLanguage: ['en'],
  },
  ...(SITE.coach?.name ? { founder: { '@id': COACH_ID } } : {}),
  // Official profiles (YouTube, Facebook, LinkedIn…) come from VITE_SAME_AS.
  ...(SITE.sameAs?.length ? { sameAs: SITE.sameAs } : {}),
  areaServed: {
    '@type': 'Place',
    name: 'Worldwide',
  },
  knowsAbout: [
    'Strength training',
    'Online personal training',
    'Bodybuilding coaching',
    'Nutrition coaching',
    'Progressive overload',
    'Body recomposition',
  ],
})

/**
 * The site. `name` + `alternateName` are exactly what Google reads to choose
 * the "site name" shown above every result — so "Autonomy Fitness" is offered
 * to it explicitly instead of left for it to infer.
 */
export const websiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': SITE_ID,
  url: `${BASE}/`,
  name: SITE.brand,
  alternateName: ['Autonomy Fitness', 'Autonomy Health and Fitness', 'Coach Auto Fitness'],
  description: SITE.description,
  publisher: { '@id': ORG_ID },
  inLanguage: 'en',
})

const withoutContext = (node) => {
  if (!node) return null
  const { '@context': _ignored, ...rest } = node
  return rest
}

/**
 * Organization + WebSite + Person as one linked graph. `buildSeo` puts it on
 * every indexable page, so each page restates who publishes it with the same
 * stable `@id`s — one entity, however a crawler arrives.
 */
export const siteGraph = () => ({
  '@context': 'https://schema.org',
  '@graph': [organizationSchema(), websiteSchema(), personSchema()]
    .map(withoutContext)
    .filter(Boolean),
})

/** The About page as the coach's profile page (Google's ProfilePage type). */
export const profilePageSchema = () =>
  SITE.coach?.name
    ? {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        '@id': `${BASE}/about#profile`,
        url: `${BASE}/about`,
        name: `About ${SITE.coach.name} — ${SITE.brand}`,
        isPartOf: { '@id': SITE_ID },
        mainEntity: { '@id': COACH_ID },
        about: { '@id': ORG_ID },
      }
    : null

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

export const gallerySchema = (images, { path = '/gallery', name = 'Gallery' } = {}) => ({
  '@context': 'https://schema.org',
  '@type': 'ImageGallery',
  '@id': `${BASE}${path}#gallery`,
  name,
  url: `${BASE}${path}`,
  publisher: { '@id': ORG_ID },
  associatedMedia: images.slice(0, 100).map((image) => ({
    '@type': 'ImageObject',
    // Absolute already when the photo is on the CDN; API paths are relative.
    contentUrl: /^https?:\/\//.test(image.image_url) ? image.image_url : `${BASE}${image.image_url}`,
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