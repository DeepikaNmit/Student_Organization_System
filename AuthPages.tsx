import { useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { loginSchema, registerSchema, type LoginForm, type RegisterForm } from '../lib/schemas'
import { DEMO_ACCOUNTS } from '../mocks/seed'
import { errMsg } from '../lib/format'
import { Field } from '../components/Field'
import { Banner, DemoBadge, Logo } from '../components/ui'

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Branding Panel */}
      <div className="relative flex flex-col justify-between bg-navy p-8 text-white lg:w-5/12 lg:p-10 xl:w-1/2">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=2070&auto=format&fit=crop" 
            alt="Students gathering" 
            className="h-full w-full object-cover" 
          />
          {/* Subtle gradient for readable text, removing the opaque overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-transparent lg:via-navy/40"></div>
        </div>
        <div className="relative z-10 hidden lg:block">
          <Logo light size="lg" />
        </div>
        {/* On mobile, add top margin to push text down over the image */}
        <div className="relative z-10 mt-32 lg:mt-auto lg:mb-10">
          <h2 className="text-3xl font-bold leading-tight drop-shadow-md lg:text-4xl">Everything Your Organization Needs, Together.</h2>
          <p className="mt-4 hidden max-w-md text-white/90 drop-shadow lg:block">Members, events, tickets and announcements — one place for your student organization.</p>
          <div className="mt-6 flex gap-2 drop-shadow-sm lg:mt-8" aria-hidden>
            <span className="h-2 w-16 rounded-full bg-cyan-clustro" />
            <span className="h-2 w-10 rounded-full bg-lav" />
            <span className="h-2 w-6 rounded-full bg-pinky" />
          </div>
        </div>
        <p className="relative z-10 hidden text-sm text-white/90 drop-shadow lg:block">Frontend preview · all data is demo data</p>
      </div>

      {/* Form Panel */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><Logo size="lg" /></div>
          <h1 className="text-2xl font-bold text-navy">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-navy/80">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  )
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })

  const onSubmit = handleSubmit(async (values) => {
    setError(null)
    try {
      await login(values)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from && from !== '/login' ? from : '/dashboard', { replace: true })
    } catch (e) {
      setError(errMsg(e))
    }
  })

  return (
    <AuthShell title="Welcome back" subtitle="Log in to your Clustro account.">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <input id="email" type="email" autoComplete="email" className="input" {...register('email')} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <input id="password" type="password" autoComplete="current-password" className="input" {...register('password')} />
        </Field>
        {error && <Banner tone="error">{error}</Banner>}
        <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Log in
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-navy">
        New to Clustro?{' '}
        <Link to="/register" className="font-semibold underline">
          Create an account
        </Link>
      </p>

      <div className="card mt-6">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-navy">Try a demo account</p>
          <DemoBadge />
        </div>
        <ul className="space-y-1.5">
          {DEMO_ACCOUNTS.map((a) => (
            <li key={a.email}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-navy/20 px-3 py-2 text-left text-sm text-navy hover:bg-navy-50"
                onClick={() => {
                  setValue('email', a.email, { shouldValidate: true })
                  setValue('password', a.password, { shouldValidate: true })
                }}
              >
                <span className="font-semibold">{a.label}</span>
                <span className="truncate text-xs text-navy/80">{a.email}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </AuthShell>
  )
}

export function RegisterPage() {
  const { register: signUp } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema), defaultValues: { name: '', email: '', password: '', confirm: '' } })

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    setError(null)
    setPendingMessage(null)
    try {
      await signUp({ name, email, password })
      navigate('/dashboard', { replace: true })
    } catch (e) {
      const msg = errMsg(e)
      if (msg.startsWith('ACCOUNT_PENDING:')) {
        setPendingMessage(msg.replace('ACCOUNT_PENDING:', ''))
      } else {
        setError(msg)
      }
    }
  })

  if (pendingMessage) {
    return (
      <AuthShell title="Registration submitted" subtitle="Your account is awaiting admin approval.">
        <Banner tone="success">{pendingMessage}</Banner>
        <p className="mt-4 text-center text-sm text-navy">
          You'll be able to <Link to="/login" className="font-semibold underline">log in</Link> once an admin approves your account.
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Create your account" subtitle="New accounts require admin approval before you can log in.">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Full name" htmlFor="name" error={errors.name?.message}>
          <input id="name" autoComplete="name" className="input" {...register('name')} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <input id="email" type="email" autoComplete="email" className="input" {...register('email')} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message} hint="At least 8 characters, with a letter and a number.">
          <input id="password" type="password" autoComplete="new-password" className="input" {...register('password')} />
        </Field>
        <Field label="Confirm password" htmlFor="confirm" error={errors.confirm?.message}>
          <input id="confirm" type="password" autoComplete="new-password" className="input" {...register('confirm')} />
        </Field>
        {error && <Banner tone="error">{error}</Banner>}
        <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Create account
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-navy">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  )
}
