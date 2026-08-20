import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'

import { useAuth } from '@/store/auth'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { PortalLayout } from '@/components/portal/PortalLayout'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { ToastHost } from '@/components/ui/Toast'
import Home from '@/pages/public/Home'

// Lazy-loaded routes
const ProgramsPage = lazy(() => import('@/pages/public/ProgramsPage'))
const ProgramDetail = lazy(() => import('@/pages/public/ProgramDetail'))
const AboutPage = lazy(() => import('@/pages/public/AboutPage'))
const ContactPage = lazy(() => import('@/pages/public/ContactPage'))
const ToolsPage = lazy(() => import('@/pages/public/ToolsPage'))
const LegalPage = lazy(() => import('@/pages/public/LegalPage'))
const NotFound = lazy(() => import('@/pages/public/NotFound'))

const Login = lazy(() => import('@/pages/auth/Login'))
const Register = lazy(() => import('@/pages/auth/Register'))
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'))

const Dashboard = lazy(() => import('@/pages/portal/Dashboard'))
const WorkoutPage = lazy(() => import('@/pages/portal/WorkoutPage'))
const MealPlanPage = lazy(() => import('@/pages/portal/MealPlanPage'))
const ProgressPage = lazy(() => import('@/pages/portal/ProgressPage'))
const WellnessPage = lazy(() => import('@/pages/portal/WellnessPage'))
const TutorialsPage = lazy(() => import('@/pages/portal/TutorialsPage'))
const CalculatorsPage = lazy(() => import('@/pages/portal/CalculatorsPage'))
const MessagesPage = lazy(() => import('@/pages/portal/MessagesPage'))
const ProfilePage = lazy(() => import('@/pages/portal/ProfilePage'))

/** Sends the browser back to the top whenever the route changes. */
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
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

  return (
    <>
      <ScrollToTop />
      <ToastHost />
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
    </>
  )
}