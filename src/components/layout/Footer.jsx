import { Link } from 'react-router'
import { Mail } from 'lucide-react'
import { InstagramIcon } from '@/components/ui/icons'
import { LogoStacked } from './Logo'
import { SITE } from '@/data/site'

const COLUMNS = [
  {
    title: 'Coaching',
    links: [
      { to: '/programs', label: 'All programmes' },
      { to: '/programs/level-1-strength-foundation', label: 'Level 1 — Foundation' },
      { to: '/programs/level-2-strength-builder', label: 'Level 2 — Builder' },
      { to: '/programs/level-3-competition-prep', label: 'Level 3 — Advanced' },
    ],
  },
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
            <div className="mt-6 flex items-center gap-3">
              <a
                href={SITE.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-ink-600 p-2.5 text-chalk-400 transition-colors hover:border-brand-500 hover:text-brand-500"
                aria-label={`Coach Auto on Instagram (${SITE.instagramHandle})`}
              >
                <InstagramIcon className="size-4" />
              </a>
              <a
                href={`mailto:${SITE.email}`}
                className="rounded-md border border-ink-600 p-2.5 text-chalk-400 transition-colors hover:border-brand-500 hover:text-brand-500"
                aria-label="Email Coach Auto"
              >
                <Mail className="size-4" />
              </a>
              <span className="text-xs text-chalk-500">
                The Instagram account is private — request to follow.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <h3 className="mb-4 font-display text-xs font-semibold uppercase tracking-[0.2em] text-white">
                  {column.title}
                </h3>
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