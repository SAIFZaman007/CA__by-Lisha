import { useSearchParams } from 'react-router'
import { XCircle } from 'lucide-react'

import { Button } from '@/components/ui/Button'

/**
 * Where Stripe sends the browser back when someone backs out of Checkout
 * before paying. Nothing was charged — this is just a soft landing page.
 */
export default function CheckoutCancelled() {
  const [params] = useSearchParams()
  const programSlug = params.get('program')

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-6 px-6 py-16">
      <XCircle className="size-14 text-brand-400" />
      <h1 className="font-display text-2xl font-semibold text-white">Payment not completed</h1>
      <p className="text-center text-chalk-400">
        No charge was made. You can pick up where you left off whenever you're ready.
      </p>

      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <Button to="/" variant="outline" size="lg" fullWidth>
          Go to home
        </Button>
        <Button to={programSlug ? `/programs/${programSlug}` : '/programs'} size="lg" fullWidth>
          View programmes
        </Button>
      </div>
    </div>
  )
}
