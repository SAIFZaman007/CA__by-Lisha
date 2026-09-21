import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { LazyMotion } from 'motion/react'
import { config as zodConfig } from 'zod'

import App from './App.jsx'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { queryClient } from '@/lib/queryClient'
import './index.css'

zodConfig({ jitless: true })

const loadMotionFeatures = () => import('./lib/motionFeatures.js').then((mod) => mod.default)

const rootFallback = (
  <div
    role="alert"
    style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      padding: '2rem',
      textAlign: 'center',
      background: '#0b0b0d',
      color: '#d6d6dc',
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    }}
  >
    <h1 style={{ fontSize: '1.75rem', color: '#ffffff', margin: 0 }}>Coach Auto could not start</h1>
    <p style={{ maxWidth: '32rem', lineHeight: 1.6, margin: 0, color: '#9a9aa4' }}>
      Reloading usually clears this. If it keeps happening, email{' '}
      <a href="mailto:coachauto2026@gmail.com" style={{ color: '#e5202c' }}>
        coachauto2026@gmail.com
      </a>
      .
    </p>
    <a
      href="/"
      style={{
        background: '#e5202c',
        color: '#fff',
        padding: '0.85rem 1.75rem',
        borderRadius: '0.375rem',
        textDecoration: 'none',
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        fontSize: '0.8rem',
      }}
    >
      Reload
    </a>
  </div>
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary fallback={rootFallback}>
      <QueryClientProvider client={queryClient}>
        <LazyMotion features={loadMotionFeatures} strict>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </LazyMotion>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)