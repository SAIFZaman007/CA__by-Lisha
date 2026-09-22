import { Suspense, useEffect, useRef } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'

import { useAuth } from '@/store/auth'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { PortalLayout } from '@/components/portal/PortalLayout'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { ToastHost } from '@/components/ui/Toast'
import { clearChunkReloadFlag, lazyWithRetry } from '@/lib/lazyWithRetry'
import Home from '@/pages/public/Home'
import { markClientNavigation } from '@/lib/ssr'

// Lazy-loaded routes.
const ProgramsPage = lazyWithRetry(() => import('@/pages/public/ProgramsPage'))
const ProgramDetail = lazyWithRetry(() => import('@/pages/public/ProgramDetail'))
const AboutPage = lazyWithRetry(() => import('@/pages/public/AboutPage'))
const ContactPage = lazyWithRetry(() => import('@/pages/public/ContactPage'))
const ToolsPage = lazyWithRetry(() => import('@/pages/public/ToolsPage'))
const GalleryPage = lazyWithRetry(() => import('@/pages/public/GalleryPage'))
const LegalPage = lazyWithRetry(() => import('@/pages/public/LegalPage'))
const CheckoutSuccess = lazyWithRetry(() => import('@/pages/public/CheckoutSuccess'))
const CheckoutCancelled = lazyWithRetry(() => import('@/pages/public/CheckoutCancelled'))
const NotFound = lazyWithRetry(() => import('@/pages/public/NotFound'))

const Login = lazyWithRetry(() => import('@/pages/auth/Login'))
const Register = lazyWithRetry(() => import('@/pages/auth/Register'))
const ForgotPassword = lazyWithRetry(() => import('@/pages/auth/ForgotPassword'))
const ResetPassword = lazyWithRetry(() => import('@/pages/auth/ResetPassword'))

const Dashboard = lazyWithRetry(() => import('@/pages/portal/Dashboard'))
const WorkoutPage = lazyWithRetry(() => import('@/pages/portal/WorkoutPage'))
const MealPlanPage = lazyWithRetry(() => import('@/pages/portal/MealPlanPage'))
const ProgressPage = lazyWithRetry(() => import('@/pages/portal/ProgressPage'))
const WellnessPage = lazyWithRetry(() => import('@/pages/portal/WellnessPage'))
const TutorialsPage = lazyWithRetry(() => import('@/pages/portal/TutorialsPage'))
const CalculatorsPage = lazyWithRetry(() => import('@/pages/portal/CalculatorsPage'))
const MessagesPage = lazyWithRetry(() => import('@/pages/portal/MessagesPage'))
const ProfilePage = lazyWithRetry(() => import('@/pages/portal/ProfilePage'))
const BillingPage = lazyWithRetry(() => import('@/pages/portal/BillingPage'))

// Public routes that are prerendered, in match order. main.jsx preloads the
// landing route's chunk before hydrating (see lazyWithRetry).
const PUBLIC_ROUTE_CHUNKS = [
  [/^\/programs\/?$/, ProgramsPage],
  [/^\/programs\/[^/]+\/?$/, ProgramDetail],
  [/^\/about\/?$/, AboutPage],
  [/^\/contact\/?$/, ContactPage],
  [/^\/tools\/?$/, ToolsPage],
  [/^\/gallery\/?$/, GalleryPage],
  [/^\/(privacy|terms)\/?$/, LegalPage],
]

/** Load the code for the page at `pathname` (no-op for the home page). */
export function preloadRoute(pathname) {
  if (pathname === '/' || pathname === '') return Promise.resolve()
  const match = PUBLIC_ROUTE_CHUNKS.find(([pattern]) => pattern.test(pathname))
  return (match ? match[1] : NotFound).preload()
}

/** Sends the browser back to the top whenever the route changes. **/
function ScrollToTop() {
  const { pathname } = useLocation()
  const landing = useRef(pathname)

  useEffect(() => {
    // The landing page arrived prerendered; from the first navigation on,
    // pages are client-rendered and may animate in again.
    if (pathname !== landing.current) markClientNavigation()
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

/**
 * A boundary keyed to the current path.
 *
 * Changing the key remounts the boundary, which clears a caught error. Without
 * it, one page crashing would leave the error screen pinned in place for the
 * rest of the session even after the visitor navigated somewhere healthy —
 * boundaries hold their error state until something remounts them.
**/
function RouteBoundary({ children }) {
  const { pathname } = useLocation()
  return <ErrorBoundary key={pathname}>{children}</ErrorBoundary>
}

function RequireAuth({ children }) {
  const status = useAuth((s) => s.status)
  const location = useLocation()

  if (status === 'loading') return <FullPageSpinner label="Checking your session" />
  if (status === 'anonymous') {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return children
}

function RedirectIfSignedIn({ children }) {
  const status = useAuth((s) => s.status)
  if (status === 'loading') return <FullPageSpinner />
  if (status === 'authenticated') return <Navigate to="/portal" replace />
  return children
}

export default function App() {
  const bootstrap = useAuth((s) => s.bootstrap)

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  // The app rendered. Whatever chunk problem may have triggered an automatic
  // reload earlier is over, so release the one-shot guard — a deploy next week
  // gets its own recovery rather than inheriting a spent flag.
  useEffect(() => {
    clearChunkReloadFlag()
  }, [])

  return (
    <>
      <ScrollToTop />
      <ToastHost />
      <RouteBoundary>
        <Suspense fallback={<FullPageSpinner />}>
          <Routes>
            {/* Public site */}
            <Route element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="programs" element={<ProgramsPage />} />
              <Route path="programs/:slug" element={<ProgramDetail />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="tools" element={<ToolsPage />} />
              <Route path="gallery" element={<GalleryPage />} />
              <Route path="privacy" element={<LegalPage doc="privacy" />} />
              <Route path="terms" element={<LegalPage doc="terms" />} />
            </Route>

            {/* Account */}
            <Route
              path="/login"
              element={
                <RedirectIfSignedIn>
                  <Login />
                </RedirectIfSignedIn>
              }
            />
            <Route
              path="/register"
              element={
                <RedirectIfSignedIn>
                  <Register />
                </RedirectIfSignedIn>
              }
            />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/checkout/success" element={<CheckoutSuccess />} />
            <Route path="/checkout/cancelled" element={<CheckoutCancelled />} />

            {/* Client portal */}
            <Route
              path="/portal"
              element={
                <RequireAuth>
                  <PortalLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="workout" element={<WorkoutPage />} />
              <Route path="meal-plan" element={<MealPlanPage />} />
              <Route path="progress" element={<ProgressPage />} />
              <Route path="sleep-cardio" element={<WellnessPage />} />
              <Route path="tutorials" element={<TutorialsPage />} />
              <Route path="calculators" element={<CalculatorsPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </RouteBoundary>
    </>
  )
}