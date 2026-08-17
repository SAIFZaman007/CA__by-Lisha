import { useSeo } from '@/lib/seo'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/layout/Logo'

export default function NotFound() {
  useSeo({ title: 'Page not found', path: '/404', noIndex: true })

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-ink-900 px-6 text-center">
      <Logo />
      <p className="font-display text-7xl font-bold text-ink-600">404</p>
      <div>
        <h1 className="text-3xl">This page does not exist</h1>
        <p className="mt-2 max-w-sm text-sm text-chalk-400">
          The link may be old, or the address slightly off. Everything else is still where you
          left it.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button to="/">Back to home</Button>
        <Button to="/programs" variant="subtle">
          View programs
        </Button>
      </div>
    </div>
  )
}
