import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import * as motionLib from 'motion/react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Logo } from './Logo'
import { useAuth } from '@/store/auth'
import { cn } from '@/lib/utils'

const { motion, AnimatePresence } = motionLib

const LINKS = [
  { to: '/programs', label: 'Programmes' },
  { to: '/about', label: 'About' },
  { to: '/tools', label: 'Calculators' },
  { to: '/contact', label: 'Contact' },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const status = useAuth((s) => s.status)

  // The landing page opens on a full-bleed hero, so the bar can sit directly on
  // the artwork. Inner pages start with content at the top, where a see-through
  // bar would collide with it — so those get the glass treatment immediately.
  const overHero = pathname === '/'

  // Close the mobile menu on navigation. Derived during render rather than in an
  // effect, which avoids a second render pass.
  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    if (open) setOpen(false)
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Stop the page scrolling behind the open mobile menu.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const glass = scrolled || !overHero

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        glass
          ? // Translucent rather than solid: the hero stays visible through the
            // bar while blur and a slight tint keep the labels readable.
            'border-b border-white/5 bg-ink-950/55 shadow-lg shadow-black/20 backdrop-blur-xl backdrop-saturate-150'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <div
        className={cn(
          'mx-auto flex max-w-7xl items-center justify-between px-5 transition-all duration-300 sm:px-8',
          glass ? 'h-16' : 'h-20',
        )}
      >
        {/* Full lockup from the small breakpoint up; the mark alone on phones,
            where a 5.8:1 image would crowd out the menu button. */}
        <Logo size="md" className="hidden sm:inline-flex" />
        <Logo size="md" markOnly className="sm:hidden" />

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Main">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className="nav-link">
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          {status === 'authenticated' ? (
            <Button to="/portal" size="sm">
              My portal
            </Button>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Sign in
              </Link>
              <Button to="/contact" size="sm">
                Start coaching
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-md p-2 text-white transition-colors hover:text-brand-500 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-nav"
            aria-label="Mobile"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-white/5 bg-ink-950/95 backdrop-blur-xl lg:hidden"
          >
            <div className="space-y-1 px-4 py-5">
              {LINKS.map((link) => (
                <NavLink key={link.to} to={link.to} className="nav-link-mobile">
                  {link.label}
                </NavLink>
              ))}
              <div className="mt-4 space-y-3 border-t border-ink-600 pt-5">
                {status === 'authenticated' ? (
                  <Button to="/portal" fullWidth>
                    My portal
                  </Button>
                ) : (
                  <>
                    <Button to="/login" variant="subtle" fullWidth>
                      Sign in
                    </Button>
                    <Button to="/contact" fullWidth>
                      Start coaching
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}