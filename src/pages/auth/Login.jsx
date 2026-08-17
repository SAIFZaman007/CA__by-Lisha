import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'

import { AuthLayout } from './AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { useAuth } from '@/store/auth'
import { errorMessage } from '@/lib/api'

export default function Login() {
  const login = useAuth((s) => s.login)
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '', password: '' } })

  async function onSubmit(values) {
    setFormError(null)
    try {
      await login({ email: values.email.trim(), password: values.password })
      navigate(location.state?.from ?? '/portal', { replace: true })
    } catch (error) {
      setFormError(errorMessage(error, 'That email and password do not match.'))
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to your dashboard."
      path="/login"
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

        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          hint={
            <Link to="/forgot-password" className="text-brand-500 hover:underline">
              Forgot password?
            </Link>
          }
          {...register('password', { required: 'Enter your password.' })}
        />

        {formError && (
          <p role="alert" className="rounded-lg bg-brand-500/10 px-3 py-2 text-sm text-brand-400">
            {formError}
          </p>
        )}

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Sign in
        </Button>

        <p className="text-center text-sm text-chalk-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-brand-500 hover:underline">
            Create one →
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}