import { SITE } from '@/data/site'

const BASE = SITE.url

/** Stable node ids, so separate blocks on separate pages describe one entity. */
export const ORG_ID = `${BASE}/#organization`
export const SITE_ID = `${BASE}/#website`
export const COACH_ID = `${BASE}/#coach`

/** The coach, as a Person — what lets a search for her name find this site. */
export const personSchema = () =>
  SITE.coach?.name
    ? {
        '@context': 'https://schema.org',
        '@type': 'Person',
        '@id': COACH_ID,
        name: SITE.coach.name,
        jobTitle: SITE.coach.jobTitle,
        url: `${BASE}/about`,
        image: `${BASE}/images/hero-portrait.png`,
        worksFor: { '@id': ORG_ID },
        knowsAbout: ['Strength training', 'Bodybuilding', 'Nutrition coaching'],
        ...(SITE.sameAs?.length ? { sameAs: SITE.sameAs } : {}),
      }
    : null

export const organizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': ['Organization', 'HealthAndBeautyBusiness'],
  '@id': ORG_ID,
  name: SITE.brand,
  alternateName: SITE.alternateNames,
  legalName: SITE.business,
  description: SITE.description,
  url: BASE,
  logo: {
    '@type': 'ImageObject',
    url: `${BASE}/images/logo-lockup-light.png`,
  },
  image: `${BASE}/images/og-cover.jpg`,
  email: SITE.email,
  ...(SITE.coach?.name ? { founder: { '@id': COACH_ID } } : {}),
  // Official profiles (Google Business Profile, etc.) go in SITE.sameAs.
  ...(SITE.sameAs?.length ? { sameAs: SITE.sameAs } : {}),
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