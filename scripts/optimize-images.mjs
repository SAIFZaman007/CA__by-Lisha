import { mkdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

import { IMAGES } from '../src/lib/images.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = path.join(root, 'public', 'images')
const outDir = path.join(srcDir, 'opt')

async function newer(source, target) {
  try {
    const [s, t] = await Promise.all([stat(source), stat(target)])
    return s.mtimeMs > t.mtimeMs
  } catch {
    return true
  }
}

async function renditions() {
  await mkdir(outDir, { recursive: true })
  let written = 0
  for (const [name, entry] of Object.entries(IMAGES)) {
    const source = path.join(srcDir, entry.source)
    for (const width of entry.widths) {
      const base = path.join(outDir, `${name}-${width}`)
      const pipeline = () => sharp(source).rotate().resize({ width, withoutEnlargement: true })
      if (await newer(source, `${base}.webp`)) {
        await pipeline().webp({ quality: 74, effort: 5 }).toFile(`${base}.webp`)
        written++
      }
      if (await newer(source, `${base}.avif`)) {
        await pipeline().avif({ quality: 52, effort: 3 }).toFile(`${base}.avif`)
        written++
      }
    }
  }
  return written
}

/** 1200×630 share card: brand-dark canvas, portrait on the right, logo left. */
async function ogCover() {
  const target = path.join(srcDir, 'og-cover.jpg')
  const portraitSrc = path.join(srcDir, 'hero-portrait.png')
  const logoSrc = path.join(srcDir, 'logo-coach-auto-light.png')
  if (!(await newer(portraitSrc, target)) && !(await newer(logoSrc, target))) return 0

  const portrait = await sharp(portraitSrc)
    .resize({ width: 470, height: 630, fit: 'cover', position: 'top' })
    .toBuffer()
  const logo = await sharp(logoSrc).resize({ width: 520 }).toBuffer()
  const logoMeta = await sharp(logo).metadata()

  await sharp({
    create: { width: 1200, height: 630, channels: 3, background: '#0b0b0d' },
  })
    .composite([
      { input: portrait, left: 730, top: 0 },
      { input: logo, left: 110, top: Math.round((630 - logoMeta.height) / 2) },
    ])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(target)
  return 1
}

/** Small PNG icons — the 512 px mark (61 KB) was being used as the favicon. */
async function icons() {
  const source = path.join(srcDir, 'logo-mark-light.png')
  let written = 0
  for (const [file, size] of [
    ['favicon-48.png', 48],
    ['apple-touch-icon.png', 180],
    ['icon-192.png', 192],
    ['icon-512.png', 512],
  ]) {
    const target = path.join(srcDir, file)
    if (await newer(source, target)) {
      await sharp(source).resize(size, size).png({ compressionLevel: 9, palette: true }).toFile(target)
      written++
    }
  }
  return written
}

const started = Date.now()
const count = (await renditions()) + (await ogCover()) + (await icons())
console.log(`optimize-images: ${count} file(s) written in ${Date.now() - started} ms`)