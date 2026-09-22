import { IMAGES, fallbackUrl, srcSet } from '@/lib/images'
import { cn } from '@/lib/utils'

/**
 * A responsive, modern-format photograph.
 *
 * Emits AVIF and WebP `srcset`s from the renditions `scripts/optimize-images.mjs`
 * generates, so a phone downloads a ~35 KB file where it used to download a
 * 2.6 MB PNG. `sizes` tells the browser how wide the slot is *before* layout,
 * which is what lets it choose the right file on the first request.
 *
 * `priority` is for the one above-the-fold image per page (the LCP element):
 * eager, high fetch priority. Everything else is lazy and async-decoded, and
 * always carries intrinsic width/height so nothing shifts when it arrives.
 */
export function Picture({
  name,
  alt = '',
  sizes = '100vw',
  priority = false,
  className,
  imgClassName,
  ...rest
}) {
  const entry = IMAGES[name]
  if (!entry) {
    if (import.meta.env.DEV) console.warn(`Picture: unknown image "${name}"`)
    return null
  }

  return (
    <picture className={className}>
      <source type="image/avif" srcSet={srcSet(name, 'avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(name, 'webp')} sizes={sizes} />
      <img
        src={fallbackUrl(name)}
        alt={alt}
        width={entry.width}
        height={entry.height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        // Always async. `sync` on the hero portrait held back the whole first
        // paint (text included) until the AVIF was decoded: ~1 s on a phone.
        decoding="async"
        className={imgClassName}
        {...rest}
      />
    </picture>
  )
}

/** For `<link rel=preload imagesrcset>` and similar. */
export function pictureSrcSet(name, format = 'webp') {
  return srcSet(name, format)
}

export function PictureFill({ className, imgClassName, ...props }) {
  // Convenience: a picture that fills its (positioned) parent.
  return (
    <Picture
      {...props}
      className={cn('block size-full', className)}
      imgClassName={cn('size-full object-cover', imgClassName)}
    />
  )
}