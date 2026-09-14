import { Component } from 'react'
import { RefreshCw, TriangleAlert } from 'lucide-react'

import { Button } from '@/components/ui/Button'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack)
    this.props.onError?.(error, info)
  }

  handleRetry = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    if (this.props.fallback) {
      return typeof this.props.fallback === 'function'
        ? this.props.fallback(error, this.handleRetry)
        : this.props.fallback
    }

    return (
      <div
        role="alert"
        className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center gap-5 px-5 py-24 text-center"
      >
        <span className="grid size-14 place-items-center rounded-full border border-ink-600 bg-ink-800">
          <TriangleAlert className="size-6 text-brand-500" aria-hidden="true" />
        </span>

        <h1 className="text-3xl sm:text-4xl">This page did not load</h1>

        <p className="text-sm leading-relaxed text-chalk-400">
          Something went wrong on our side, not yours. Reloading usually clears it. If it keeps
          happening, email{' '}
          <a
            href="mailto:coachauto2026@gmail.com"
            className="text-brand-500 underline underline-offset-4"
          >
            coachauto2026@gmail.com
          </a>{' '}
          and tell us which page you were on.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="size-4" aria-hidden="true" />
            Reload the page
          </Button>
          <Button variant="ghost" onClick={this.handleRetry}>
            Try again
          </Button>
          <Button variant="ghost" to="/">
            Back to home
          </Button>
        </div>

        {import.meta.env.DEV && (
          <pre className="mt-4 max-w-full overflow-auto rounded-md border border-ink-600 bg-ink-900 p-4 text-left text-xs text-chalk-400">
            {String(error?.stack ?? error)}
          </pre>
        )}
      </div>
    )
  }
}

export default ErrorBoundary