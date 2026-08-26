import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'

import { api } from '@/lib/api'
import { keys } from '@/lib/queryClient'
import { useSeo } from '@/lib/seo'
import { breadcrumbSchema, gallerySchema } from '@/lib/structuredData'
import { cn } from '@/lib/utils'
import { Section } from '@/components/ui/Section'
import { Spinner } from '@/components/ui/Spinner'

const TITLE = 'Hall of the Coach'
const DESCRIPTION =
  'Transformations, coaching sessions, competition days and certifications from Coach Auto ' +
  'at Autonomy Health and Fitness. The work behind the programmes.'

/**
 * One photo.
 *
 * `width` and `height` are set on the element even though CSS controls the
 * rendered size. That pair is what lets the browser reserve the right box
 * before the bytes arrive — without it every image that loads shoves the grid
 * around, and Cumulative Layout Shift is a ranking signal on precisely the page
 * this client wants found.
 */
function GalleryTile({ image, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(image)}
      className="group relative block w-full overflow-hidden rounded-lg border border-ink-700 bg-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      aria-label={`View ${image.title}`}
    >
      <img
        src={image.image_url}
        alt={image.alt_text}
        width={image.width ?? undefined}
        height={image.height ?? undefined}
        // Native lazy loading below the fold, async decode so a large JPEG
        // never blocks the main thread while the rest of the page paints.
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 to-transparent p-3 text-left opacity-0 transition-opacity group-hover:opacity-100">
        <span className="block truncate font-display text-sm text-white">{image.title}</span>
      </span>
    </button>
  )
}

/** Full-size view. Closes on Escape, on backdrop click, or on the button. */
function Lightbox({ image, onClose }) {
  if (!image) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={image.title}
      onClick={onClose}
      onKeyDown={(event) => event.key === 'Escape' && onClose()}
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-4"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 rounded-full border border-white/20 p-2 text-white transition hover:bg-white/10"
      >
        <X className="size-5" />
      </button>

      <figure
        onClick={(event) => event.stopPropagation()}
        className="max-h-full max-w-4xl overflow-auto"
      >
        <img
          src={image.image_url}
          alt={image.alt_text}
          className="mx-auto max-h-[75dvh] w-auto rounded-lg object-contain"
        />
        <figcaption className="mt-4 text-center">
          <p className="font-display text-lg text-white">{image.title}</p>
          {image.caption && (
            <p className="mx-auto mt-2 max-w-2xl text-sm text-chalk-400">{image.caption}</p>
          )}
          {image.credit && (
            <p className="mt-2 text-xs text-chalk-500">Photo: {image.credit}</p>
          )}
        </figcaption>
      </figure>
    </div>
  )
}

export default function GalleryPage() {
  const [active, setActive] = useState('all')
  const [lightbox, setLightbox] = useState(null)

  const { data: sections, isPending } = useQuery({
    queryKey: keys.gallerySections,
    queryFn: api.gallery.sections,
  })

  const allImages = useMemo(
    () => (sections ?? []).flatMap((section) => section.images),
    [sections],
  )

  const visible = useMemo(() => {
    if (active === 'all') return allImages
    return (sections ?? []).find((section) => section.category === active)?.images ?? []
  }, [active, allImages, sections])

  // Built from every image rather than the filtered view: the structured data
  // describes the gallery as a whole, and a crawler that arrives while a filter
  // happens to be applied should still be told about all of it.
  const jsonLd = useMemo(() => {
    if (!allImages.length) return breadcrumbSchema([{ name: TITLE, path: '/gallery' }])
    return gallerySchema(allImages, { path: '/gallery', name: TITLE })
  }, [allImages])

  useSeo({
    title: TITLE,
    description: DESCRIPTION,
    path: '/gallery',
    image: allImages[0]?.image_url,
    jsonLd,
    keywords: [
      'fitness transformations',
      'online strength coaching',
      'personal trainer gallery',
      'Coach Auto',
    ],
  })

  return (
    <Section
      eyebrow="Gallery"
      title={TITLE}
      description="Transformations, sessions and the days that made them. Every photo here is someone's work."
    >
      {isPending ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : !allImages.length ? (
        <p className="py-16 text-center text-chalk-400">
          The gallery is being put together. Check back shortly.
        </p>
      ) : (
        <>
          <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            <button
              type="button"
              onClick={() => setActive('all')}
              aria-pressed={active === 'all'}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition',
                active === 'all'
                  ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                  : 'border-ink-600 text-chalk-400 hover:text-white',
              )}
            >
              All ({allImages.length})
            </button>
            {sections.map((section) => (
              <button
                key={section.category}
                type="button"
                onClick={() => setActive(section.category)}
                aria-pressed={active === section.category}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-sm font-medium transition',
                  active === section.category
                    ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                    : 'border-ink-600 text-chalk-400 hover:text-white',
                )}
              >
                {section.label} ({section.images.length})
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((image) => (
              <div key={image.id} className="aspect-square">
                <GalleryTile image={image} onOpen={setLightbox} />
              </div>
            ))}
          </div>
        </>
      )}

      <Lightbox image={lightbox} onClose={() => setLightbox(null)} />
    </Section>
  )
}