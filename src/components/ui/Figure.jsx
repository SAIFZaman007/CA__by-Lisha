import { Picture } from '@/components/ui/Picture'
import { cn } from '@/lib/utils'

/**
 * Aspect-locked image.
 *
 * Every photograph supplied for this site is portrait (between 3:5 and 3:4).
 * Dropping one into a landscape box with `object-cover` keeps the box and
 * throws away most of the subject — which is why images were appearing halved.
 *
 * This component makes the ratio an explicit, named decision instead of an
 * accident of whatever height the surrounding grid happened to have:
 *
 *   ratio="portrait"  3:4  — the house standard for section photography
 *   ratio="tall"      3:5  — narrow columns and the auth panel
 *   ratio="square"    1:1  — grid cells
 *   ratio="wide"     16:9  — only for genuinely landscape sources
 *   ratio="fill"           — take the height of the row, for column alignment
 *
 * `focus` maps to object-position, so the subject stays in frame when the
 * container is a different shape from the file.
 *
 * Pass `image="<name>"` (see `lib/images.js`) for site photography — it is
 * served as responsive AVIF/WebP. `src` still works for dynamic URLs (API or
 * CDN images that are already optimised upstream).
 */

const RATIOS = {
  portrait: 'aspect-[3/4]',
  tall: 'aspect-[3/5]',
  square: 'aspect-square',
  wide: 'aspect-video',
  golden: 'aspect-[4/5]',
  // Match the height of a neighbouring column instead of imposing one.
  // Stays portrait while the grid is stacked, then fills the row from lg up —
  // which is what makes a photo line up flush with the card beside it.
  fill: 'aspect-[3/4] lg:aspect-auto lg:h-full',
}

const FOCUS = {
  center: 'object-center',
  top: 'object-top',
  bottom: 'object-bottom',
  // Subjects standing slightly above centre — the common case for these photos.
  upper: 'object-[center_28%]',
}

export function Figure({
  image,
  sizes = '(min-width: 1024px) 40vw, 90vw',
  src,
  alt = '',
  ratio = 'portrait',
  focus = 'center',
  className,
  imgClassName,
  overlay = false,
  caption,
  priority = false,
  width,
  height,
  children,
}) {
  return (
    <figure
      className={cn(
        'relative overflow-hidden rounded-xl border border-ink-600 bg-ink-850',
        RATIOS[ratio],
        className,
      )}
    >
      {image ? (
        // Named catalogue image: AVIF/WebP at the right width for the slot.
        <Picture
          name={image}
          alt={alt}
          sizes={sizes}
          priority={priority}
          className="block size-full"
          imgClassName={cn('size-full object-cover', FOCUS[focus], imgClassName)}
        />
      ) : (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
          className={cn('size-full object-cover', FOCUS[focus], imgClassName)}
        />
      )}

      {/* Bottom scrim, so any caption or badge stays readable over the photo. */}
      {(overlay || caption || children) && (
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-ink-950/85 via-ink-950/10 to-transparent"
          aria-hidden="true"
        />
      )}

      {children}

      {caption && (
        <figcaption className="absolute inset-x-0 bottom-0 p-4 text-xs leading-snug text-chalk-200">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}