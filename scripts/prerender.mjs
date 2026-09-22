import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')

const SITE_URL = (process.env.VITE_SITE_URL || (await readEnvFile('VITE_SITE_URL')) || 'https://autonomyfitness.press').replace(/\/+$/, '')
const API_URL = (
  process.env.PRERENDER_API_URL ||
  (await readEnvFile('PRERENDER_API_URL')) ||
  `${SITE_URL}/api/v1`
).replace(/\/+$/, '')
const PRERENDER = (process.env.PRERENDER || 'on').toLowerCase() !== 'off'

const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/programs', priority: '0.9', changefreq: 'weekly' },
  { path: '/about', priority: '0.8', changefreq: 'monthly' },
  { path: '/gallery', priority: '0.7', changefreq: 'weekly' },
  { path: '/tools', priority: '0.7', changefreq: 'monthly' },
  { path: '/contact', priority: '0.7', changefreq: 'monthly' },
  { path: '/privacy', priority: '0.2', changefreq: 'yearly' },
  { path: '/terms', priority: '0.2', changefreq: 'yearly' },
]

async function readEnvFile(key) {
  // Vite reads .env.production for `vite build`; mirror that for this script.
  for (const file of ['.env.production.local', '.env.production', '.env.local', '.env']) {
    try {
      const text = await readFile(path.join(root, file), 'utf8')
      const match = text.match(new RegExp(`^\\s*${key}\\s*=\\s*([^#\\r\\n]*)`, 'm'))
      if (match && match[1].trim()) return match[1].trim().replace(/^["']|["']$/g, '')
    } catch {
      /* file absent */
    }
  }
  return ''
}

async function fetchJson(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } finally {
    clearTimeout(timer)
  }
}

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

// JSON inside <script>: neutralise "</script>" and HTML comment openers.
const safeJson = (value) =>
  JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')

/** Replace the default SEO tags in the shell with this page's. */
function applyHead(template, seo) {
  if (!seo) return template
  let html = template
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\s+name="(description|robots|keywords|twitter:[^"]+)"[\s\S]*?\/>\s*/gi, '')
    .replace(/<meta\s+property="og:(?!image:width|image:height)[^"]+"[\s\S]*?\/>\s*/gi, '')
    .replace(/<link\s+rel="canonical"[\s\S]*?\/>\s*/i, '')

  const tags = [
    `<title>${escapeHtml(seo.title)}</title>`,
    `<meta name="description" content="${escapeHtml(seo.description)}" />`,
    `<link rel="canonical" href="${escapeHtml(seo.canonical)}" />`,
    `<meta name="robots" content="${escapeHtml(seo.robots)}" />`,
    ...(seo.keywords ? [`<meta name="keywords" content="${escapeHtml(seo.keywords)}" />`] : []),
    ...Object.entries(seo.og).map(([k, v]) => `<meta property="${k}" content="${escapeHtml(v)}" />`),
    ...Object.entries(seo.twitter).map(([k, v]) => `<meta name="${k}" content="${escapeHtml(v)}" />`),
    ...seo.jsonLd.map((data) => `<script type="application/ld+json" data-seo-ssr>${safeJson(data)}</script>`),
  ]
  html = html.replace(/(<meta\s+name="viewport"[^>]*>)/i, `$1\n    ${tags.join('\n    ')}`)
  return html
}

function applyBody(template, appHtml, state) {
  const stateTag = `<script type="application/json" id="__RQ_STATE__">${safeJson(state)}</script>`
  return template
    .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>\n    ${stateTag}`)
}

/**
 * Font preloads. The body and heading fonts swapping in after first paint
 * reflowed the text (the About page's CLS was 0.28). Preloading the Latin
 * subsets makes them arrive with the CSS, so the first paint already uses
 * them. Other subsets load on demand as before.
 */
async function fontPreloads() {
  const files = await readdir(path.join(dist, 'assets'))
  // Latin body (Inter) and heading (Barlow Condensed 700) faces only. Tested:
  // without the Inter preload, the About page's text reflows on swap (CLS
  // 0.22 on Linux/Android, where the metric-matched fallback fonts may be
  // missing); with it, CLS is 0 on every page.
  const wanted = [/^inter-latin-wght-normal-.*\.woff2$/, /^barlow-condensed-latin-700-normal-.*\.woff2$/]
  return files
    .filter((file) => wanted.some((pattern) => pattern.test(file)))
    .map((file) => `<link rel="preload" href="/assets/${file}" as="font" type="font/woff2" crossorigin />`)
    .join('\n    ')
}

/**
 * Search-engine ownership tags (optional). Verifying through DNS in Search
 * Console / Bing Webmaster Tools is better — it covers every subdomain and
 * survives redesigns — but if you choose the "HTML tag" method, put the
 * content value in GOOGLE_SITE_VERIFICATION / BING_SITE_VERIFICATION and it
 * is written into every page's <head> at build time.
 */
/**
 * Accept the token however it was pasted: the bare value, the DNS form
 * ("google-site-verification=abc…"), or the whole <meta … content="abc…"> tag.
 */
function normaliseToken(raw, name) {
  let value = String(raw ?? '').trim()
  const fromTag = value.match(/content\s*=\s*["']([^"']+)["']/i)
  if (fromTag) value = fromTag[1]
  value = value.replace(new RegExp(`^${name.replace('.', '\\.')}\\s*[=:]\\s*`, 'i'), '')
  return value.replace(/^["']|["']$/g, '').trim()
}

async function verificationTags() {
  const entries = [
    ['google-site-verification', 'GOOGLE_SITE_VERIFICATION'],
    ['msvalidate.01', 'BING_SITE_VERIFICATION'],
    ['yandex-verification', 'YANDEX_SITE_VERIFICATION'],
  ]
  const tags = []
  for (const [name, key] of entries) {
    const value = normaliseToken(process.env[key] || (await readEnvFile(key)), name)
    if (value) {
      tags.push(`<meta name="${name}" content="${escapeHtml(value)}" />`)
      console.log(`[prerender] ${name} meta tag added to every page`)
    }
  }
  return tags.join('\n    ')
}

function withVerification(html, tags) {
  if (!tags || html.includes('google-site-verification') || html.includes('msvalidate.01')) return html
  return html.replace(/(<meta\s+name="viewport"[^>]*>)/i, `$1\n    ${tags}`)
}

function withPreloads(html, preloads) {
  return preloads ? html.replace('</head>', `    ${preloads}\n  </head>`) : html
}

/**
 * Inline the stylesheet into prerendered pages: the page paints without
 * waiting for a second, render-blocking request (~0.75 s on a mobile
 * connection). The SPA shell keeps the cacheable external file.
 */
async function inlineStylesheet(html) {
  const match = html.match(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/)
  if (!match) return html
  const css = await readFile(path.join(dist, match[1].slice(1)), 'utf8')
  return html.replace(match[0], () => `<style>${css.replace(/<\/style/gi, '<\\/style')}</style>`)
}

function outputFile(routePath) {
  return routePath === '/' ? path.join(dist, 'index.html') : path.join(dist, routePath.slice(1), 'index.html')
}

/** Readable text of a rendered page, for llms-full.txt. */
function pageText(html) {
  return html
    .replace(/<(script|style|svg|noscript)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(h[1-6]|p|li|div|section|tr|br)>/gi, '\n')
    .replace(/<h([1-3])[^>]*>/gi, (_, level) => `\n${'#'.repeat(Number(level) + 1)} `)
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function sitemapXml(routes) {
  const today = new Date().toISOString().slice(0, 10)
  const urls = routes
    .map(
      (route) => `  <url>
    <loc>${SITE_URL}${route.path === '/' ? '/' : route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`,
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}

function robotsTxt() {
  // Plain ASCII only: some crawlers (and browsers without a charset header)
  // read robots.txt as Latin-1.
  return `# Coach Auto - Autonomy Health and Fitness
# ${SITE_URL}
#
# Search engines and AI assistants are welcome on every public page.
# Account screens and the client portal hold personal data and are excluded.
# /api/ is deliberately NOT disallowed: crawlers that render JavaScript need it
# to build the programme and gallery pages. API responses send
# "X-Robots-Tag: noindex", so they never appear in results themselves.

User-agent: *
Allow: /
Disallow: /portal
Disallow: /login
Disallow: /register
Disallow: /forgot-password
Disallow: /reset-password
Disallow: /checkout/

Sitemap: ${SITE_URL}/sitemap.xml
`
}

function llmsTxt(programs) {
  const programLines = programs.length
    ? programs
        .map((p) => {
          const price = p.price_cents ? ` — $${(p.price_cents / 100).toFixed(0)}/month` : ''
          const summary = p.tagline || p.description || ''
          return `- [${p.name}](${SITE_URL}/programs/${p.slug})${price}${summary ? `: ${summary}` : ''}`
        })
        .join('\n')
    : `- [All coaching programmes](${SITE_URL}/programs): Level 1 (beginner, 3 days a week), Level 2 (intermediate, 4 days), Level 3 (advanced, 5–6 days)`

  return `# Coach Auto — Autonomy Health and Fitness

> Coach Auto (Autonomy Health and Fitness, also known as Autonomy Fitness) is an online strength, bodybuilding and nutrition coaching service run by certified coach Lisha Chesson. Clients get a personalised training programme, a meal plan with macro targets, an exercise video library, weekly check-ins and direct messaging with the coach, all in one client portal. Coaching is delivered online, worldwide, for beginners through advanced lifters.

Key facts:

- Website: ${SITE_URL}
- Coach: Lisha Chesson, certified strength and bodybuilding coach
- Format: 100% online coaching; programmes are written by hand, not generated
- Levels: Level 1 beginner (3 training days a week), Level 2 intermediate (4 days), Level 3 advanced (5–6 days)
- Included: personalised programme, meal plan and macros, exercise videos, weekly progress reviews, sleep and cardio tracking, coach messaging
- Contact: coachauto2026@gmail.com, or the enquiry form at ${SITE_URL}/contact

## Coaching programmes

${programLines}

## Main pages

- [Home](${SITE_URL}/): What Coach Auto offers and how online coaching works
- [About](${SITE_URL}/about): The coach, the coaching philosophy and the assessment process
- [Programmes](${SITE_URL}/programs): Compare Level 1, 2 and 3 coaching and prices
- [Free fitness calculators](${SITE_URL}/tools): Calorie, macro and BMI calculators
- [Gallery](${SITE_URL}/gallery): Training, results and coaching photos
- [Contact](${SITE_URL}/contact): Book a free consultation call

## Optional

- [Full text of every public page](${SITE_URL}/llms-full.txt)
- [Privacy policy](${SITE_URL}/privacy)
- [Terms of service](${SITE_URL}/terms)
`
}

async function main() {
  const preloads = await fontPreloads()
  // Re-running this script on an already-prerendered dist/ starts from the
  // saved shell rather than from a prerendered home page.
  let shell = await readFile(path.join(dist, 'index.html'), 'utf8')
  if (shell.includes('id="__RQ_STATE__"')) shell = await readFile(path.join(dist, 'app.html'), 'utf8')
  const withFonts = shell.includes('as="font"') ? shell : withPreloads(shell, preloads)
  const template = withVerification(withFonts, await verificationTags())
  // The shell, for routes that are not prerendered (portal, auth, 404).
  await writeFile(path.join(dist, 'app.html'), template)
  const pageTemplate = await inlineStylesheet(template)

  let programs = []
  try {
    const data = await fetchJson(`${API_URL}/programs`)
    programs = Array.isArray(data) ? data : (data?.items ?? [])
  } catch (error) {
    console.warn(`[prerender] Programmes not loaded from ${API_URL} (${error.message}). Programme detail pages are skipped.`)
  }

  const routes = [
    ...STATIC_ROUTES,
    ...programs
      .filter((p) => p.slug)
      .map((p) => ({ path: `/programs/${p.slug}`, priority: '0.8', changefreq: 'monthly' })),
  ]

  const fullText = []
  if (PRERENDER) {
    const entry = pathToFileURL(path.join(root, 'dist-ssr', 'entry-server.js')).href
    const { render } = await import(entry)

    for (const route of routes) {
      try {
        const { html, seo, state, failedQueries } = await render(route.path, { apiBaseUrl: API_URL })
        if (failedQueries.length) {
          console.warn(`[prerender] ${route.path}: rendered without ${failedQueries.join(', ')}`)
        }
        const page = applyBody(applyHead(pageTemplate, seo), html, state)
        const file = outputFile(route.path)
        await mkdir(path.dirname(file), { recursive: true })
        await writeFile(file, page)
        fullText.push(`# ${seo?.title ?? route.path}\n\nURL: ${SITE_URL}${route.path}\n\n${pageText(html)}`)
        console.log(`[prerender] ${route.path} → ${path.relative(root, file)} (${(page.length / 1024).toFixed(0)} KB)`)
      } catch (error) {
        // A page that cannot be prerendered still works as a client-rendered page.
        console.warn(`[prerender] ${route.path}: skipped (${error.message})`)
      }
    }
  } else {
    console.log('[prerender] PRERENDER=off — pages left client-rendered.')
  }

  await writeFile(path.join(dist, 'robots.txt'), robotsTxt())
  await writeFile(path.join(dist, 'sitemap.xml'), sitemapXml(routes))
  const llms = llmsTxt(programs)
  await writeFile(path.join(dist, 'llms.txt'), llms)
  await writeFile(
    path.join(dist, 'llms-full.txt'),
    `${llms}\n\n---\n\n${fullText.join('\n\n---\n\n')}\n`,
  )
  console.log(`[prerender] robots.txt, sitemap.xml (${routes.length} URLs), llms.txt written for ${SITE_URL}`)
}

await main()