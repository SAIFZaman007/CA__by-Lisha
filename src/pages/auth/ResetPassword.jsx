import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useForm } from 'react-hook-form'

import { AuthLayout } from './AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { api, errorMessage } from '@/lib/api'
import { toast } from '@/components/ui/Toast'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const navigate = useNavigate()
  const [formError, setFormError] = useState(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { password: '', confirm: '' } })

  async function onSubmit(values) {
    setFormError(null)
    try {
      await api.auth.resetPassword({ token, password: values.password })
      toast.success('Password updated. Sign in with your new password.')
      navigate('/login', { replace: true })
    } catch (error) {
      setFormError(errorMessage(error, 'That reset link has expired. Request a new one.'))
    }
  }

  if (!token) {
    return (
      <AuthLayout title="Link not valid" path="/reset-password">
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-chalk-400">
            This reset link is missing its token. Request a fresh one and use the most recent
            email.
          </p>
          <Button to="/forgot-password" className="w-full">
            Request a new link
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose something you have not used here before."
      path="/reset-password"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="At least 10 characters, with an uppercase letter, a lowercase letter and a number."
          error={errors.password?.message}
          {...register('password', {
            required: 'Choose a password.',
            minLength: { value: 10, message: 'Use at least 10 characters.' },
            validate: (value) =>
              (/[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value)) ||
              'Add an uppercase letter, a lowercase letter and a number.',
          })}
        />

        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirm?.message}
          {...register('confirm', {
            required: 'Type your password again.',
            validate: (value) => value === watch('password') || 'Those passwords do not match.',
          })}
        />

        {formError && (
          <p role="alert" className="rounded-lg bg-brand-500/10 px-3 py-2 text-sm text-brand-400">
            {formError}
          </p>
        )}

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Update password
        </Button>
      </form>
    </AuthLayout>
  )
}
