import { Outlet } from 'react-router'
import { Header } from './Header'
import { Footer } from './Footer'

export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-ink-900">
      <a href="#main" className="skip-link">
      </a>
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
