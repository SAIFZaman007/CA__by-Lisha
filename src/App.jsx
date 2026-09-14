import { Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'

import { useAuth } from '@/store/auth'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { PortalLayout } from '@/components/portal/PortalLayout'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { ToastHost } from '@/components/ui/Toast'
import { clearChunkReloadFlag, lazyWithRetry } from '@/lib/lazyWithRetry'
import Home from '@/pages/public/Home'

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

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

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
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </RouteBoundary>
    </>
  )
}