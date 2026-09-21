/**
 * Responsive image catalogue.
 *
 * The original photographs are 1–2.6 MB PNGs. Served as-is they were the
 * single largest cost on the PageSpeed report: the hero alone (2.6 MB) was
 * the Largest Contentful Paint element, downloaded in full even on a phone
 * that paints it 360 px wide.
 *
 * `scripts/optimize-images.mjs` (run automatically before `vite build` and
 * `vite dev`) reads this table and writes AVIF + WebP renditions at each
 * width into `public/images/opt/`. Components ask for an image by *name* and
 * the browser picks the smallest file that is sharp enough for the slot.
 *
 * Adding a photo: drop the original in `public/images/`, add a row here.
 */

/** @type {Record<string, {source: string, width: number, height: number, widths: number[]}>} */
export const IMAGES = {
  'hero-portrait': { source: 'hero-portrait.png', width: 1086, height: 1448, widths: [400, 640, 860, 1086] },
  'hero-ambient': { source: 'hero-ambient.jpg', width: 960, height: 540, widths: [480, 960] },
  'coach-auto-gym-1': { source: 'coach-auto-gym-1.png', width: 1086, height: 1448, widths: [360, 560, 800, 1086] },
  'coach-auto-gym-2': { source: 'coach-auto-gym-2.png', width: 1086, height: 1448, widths: [360, 560, 800, 1086] },
  'coach-auto-gym-3': { source: 'coach-auto-gym-3.png', width: 1086, height: 1448, widths: [360, 560, 800, 1086] },
  'auth-panel': { source: 'auth-panel.png', width: 971, height: 1619, widths: [480, 720, 971] },
  certification: { source: 'Certification.png', width: 1401, height: 1123, widths: [480, 800, 1200] },
  'logo-lockup-light': { source: 'logo-lockup-light.png', width: 931, height: 160, widths: [240, 480] },
  'logo-mark-light': { source: 'logo-mark-light.png', width: 512, height: 512, widths: [96, 192] },
  'logo-coach-auto-light': { source: 'logo-coach-auto-light.png', width: 900, height: 515, widths: [420] },
}

export const IMAGE_DIR = '/images/opt'

export function imageUrl(name, width, format = 'webp') {
  return `${IMAGE_DIR}/${name}-${width}.${format}`
}

export function srcSet(name, format) {
  const entry = IMAGES[name]
  if (!entry) return undefined
  return entry.widths.map((w) => `${imageUrl(name, w, format)} ${w}w`).join(', ')
}

export function fallbackUrl(name) {
  const entry = IMAGES[name]
  const mid = entry.widths[Math.min(1, entry.widths.length - 1)]
  return imageUrl(name, mid, 'webp')
}