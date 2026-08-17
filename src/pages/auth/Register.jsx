import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'

import { AuthLayout } from './AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { useAuth } from '@/store/auth'
import { errorMessage } from '@/lib/api'

export default function Register() {
  const registerUser = useAuth((s) => s.register)
  const navigate = useNavigate()
  const [formError, setFormError] = useState(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { full_name: '', email: '', password: '', confirm: '' } })

  async function onSubmit(values) {
    setFormError(null)
    try {
      await registerUser({
        full_name: values.full_name.trim(),
        email: values.email.trim(),
        password: values.password,
        accepts_terms: true,
      })
      navigate('/portal', { replace: true })
    } catch (error) {
      setFormError(errorMessage(error, 'We could not create that account.'))
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Set up your portal, then complete your intake so your coach can build your program."
      seoTitle="Create account"
      path="/register"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Input
          label="Full name"
          autoComplete="name"
          placeholder="Sandra Thompson"
          error={errors.full_name?.message}
          {...register('full_name', {
            required: 'Enter your name.',
            minLength: { value: 2, message: 'Enter your name.' },
          })}
        />

        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@email.com"
          error={errors.email?.message}
          {...register('email', { required: 'Enter your email address.' })}
        />

        <Input
          label="Password"
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
          Create account
        </Button>

        <p className="text-center text-xs leading-relaxed text-chalk-500">
          By creating an account you agree to our{' '}
          <Link to="/terms" className="text-chalk-400 hover:underline">
            terms
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-chalk-400 hover:underline">
            privacy policy
          </Link>
          .
        </p>

        <p className="text-center text-sm text-chalk-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-500 hover:underline">
            Sign in →
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
