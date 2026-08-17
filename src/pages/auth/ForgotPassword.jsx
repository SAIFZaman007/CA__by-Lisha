import { useState } from 'react'
import { Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { MailCheck } from 'lucide-react'

import { AuthLayout } from './AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { api, errorMessage } from '@/lib/api'

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '' } })

  async function onSubmit(values) {
    setFormError(null)
    try {
      await api.auth.forgotPassword({ email: values.email.trim() })
      setSent(true)
    } catch (error) {
      setFormError(errorMessage(error))
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Check your email" path="/forgot-password">
        <div className="space-y-4">
          <MailCheck className="size-10 text-signal-green" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-chalk-400">
            If that email has an account, a reset link is on its way. The link works for 30
            minutes. Check your spam folder if it does not arrive within a few minutes.
          </p>
          <Button to="/login" variant="subtle" className="w-full">
            Back to sign in
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link to set a new password."
      path="/forgot-password"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@email.com"
          error={errors.email?.message}
          {...register('email', { required: 'Enter your email address.' })}
        />

        {formError && (
          <p role="alert" className="rounded-lg bg-brand-500/10 px-3 py-2 text-sm text-brand-400">
            {formError}
          </p>
        )}

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Send reset link
        </Button>

        <p className="text-center text-sm text-chalk-500">
          Remembered it?{' '}
          <Link to="/login" className="font-medium text-brand-500 hover:underline">
            Sign in →
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}