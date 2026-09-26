import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Mail } from 'lucide-react'
import { LogoStacked } from './Logo'
import { SITE } from '@/data/site'
import { api } from '@/lib/api'
import { keys } from '@/lib/queryClient'

const LEVEL_SHORT = { level_1: 'Level 1', level_2: 'Level 2', level_3: 'Level 3' }

/**
 * Programme links come from the live catalogue, not hard-coded slugs.
 *
 * The old list pointed at fixed URLs. A slug is regenerated when the coach
 * renames a plan, so a hard-coded link silently became a "programme not
 * found" page — linked from the footer of every page on the site, which is
 * the worst place for a crawler to find a soft 404. Same query key as the
 * home and programmes pages, so this costs no extra request there, and the
 * prerender bakes the real links into the HTML.
 */
function useProgrammeLinks() {
  const { data } = useQuery({ queryKey: keys.programs, queryFn: api.site.programs })
  const programmes = Array.isArray(data) ? data : (data?.items ?? [])
  return [
    { to: '/programs', label: 'All programmes' },
    ...programmes
      .filter((programme) => programme.slug)
      .slice(0, 5)
      .map((programme) => {
        // "Level 1 — Strength Foundation" → "Level 1 — Foundation"-style
        // short labels when the name follows that pattern; the full name
        // otherwise.
        const name = programme.name ?? ''
        const suffix = name.includes('—') ? name.split('—').pop().trim() : ''
        const level = LEVEL_SHORT[programme.level]
        return {
          to: `/programs/${programme.slug}`,
          label: level && suffix ? `${level} — ${suffix}` : name,
        }
      }),
  ]
}

const COLUMNS = [
  {
    title: 'Tools',
    links: [
      { to: '/tools', label: 'Calorie calculator' },
      { to: '/tools#bmi', label: 'BMI calculator' },
      { to: '/tools#cardio', label: 'Cardio burn estimator' },
    ],
  },
  {
    title: 'Company',
    links: [
      { to: '/about', label: 'About Coach Auto' },
      { to: '/contact', label: 'Contact' },
      { to: '/privacy', label: 'Privacy' },
      { to: '/terms', label: 'Terms' },
    ],
  },
]

export function Footer() {
  const programmeLinks = useProgrammeLinks()
  const columns = [{ title: 'Coaching', links: programmeLinks }, ...COLUMNS]

  return (
    <footer className="border-t border-ink-600 bg-ink-950">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_2fr]">
          <div>
            <LogoStacked />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-chalk-400">
              Online strength and bodybuilding coaching. Programmes written by hand, reviewed
              every week, built to make you stronger than you were.
            </p>
            {/* One plain sentence naming every alias of the business and its
                coach, on every page. Consistent name-and-relationship text
                across a site is part of how search engines decide these are
                one entity. */}
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-chalk-500">
              {SITE.brand} is the online coaching brand of {SITE.business} (Autonomy Fitness)
              {SITE.coach?.name ? (
                <>
                  , founded and coached by{' '}
                  <Link to="/about" className="text-chalk-400 underline-offset-2 hover:underline">
                    {SITE.coach.name}
                  </Link>
                </>
              ) : null}
              .
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href={`mailto:${SITE.email}`}
                className="rounded-md border border-ink-600 p-2.5 text-chalk-400 transition-colors hover:border-brand-500 hover:text-brand-500"
                aria-label="Email Coach Auto"
              >
                <Mail className="size-4" />
              </a>
              <a
                href={`mailto:${SITE.email}`}
                className="text-xs text-chalk-500 transition-colors hover:text-brand-500"
              >
                {SITE.email}
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((column) => (
              <div key={column.title}>
                <h2 className="mb-4 font-display text-xs font-semibold uppercase tracking-[0.2em] text-white">
                  {column.title}
                </h2>
                <ul className="space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.to + link.label}>
                      <Link
                        to={link.to}
                        className="text-sm text-chalk-400 transition-colors hover:text-brand-500"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-ink-600 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-chalk-500">
            © {new Date().getFullYear()} {SITE.business}. All rights reserved.
          </p>
          <p className="max-w-xl text-xs text-chalk-500">
            Coaching is not medical advice. Speak to your doctor before starting a new training
            or nutrition programme.
          </p>
        </div>
      </div>
    </footer>
  )
}