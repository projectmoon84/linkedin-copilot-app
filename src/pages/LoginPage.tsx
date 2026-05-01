import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { IconBrandGoogle, IconLoader2 } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import lincoLogo from '@/assets/linco-logo.svg'

interface LocationState {
  from?: {
    pathname?: string
  }
}

export function LoginPage() {
  const { user, loading, signIn, signUp, signInWithGoogle } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const from = (location.state as LocationState | null)?.from?.pathname || '/home'

  if (!loading && user) {
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (mode === 'sign-up' && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)

    try {
      if (mode === 'sign-up') {
        const { error: signUpError } = await signUp(email, password)

        if (signUpError) {
          setError(signUpError.message)
          return
        }

        setSuccessMessage('Account created. If email confirmation is enabled, check your inbox before signing in.')
        setMode('sign-in')
        setPassword('')
        setConfirmPassword('')
        return
      }

      const { error: signInError } = await signIn(email, password)

      if (signInError) {
        setError(signInError.message)
        return
      }

      navigate(from, { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogle = async () => {
    setError(null)
    setSuccessMessage(null)
    setSubmitting(true)

    try {
      const { error: googleError } = await signInWithGoogle()
      if (googleError) setError(googleError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="app-card w-full max-w-md p-6">
        <div className="space-y-2 text-center">
          <img src={lincoLogo} alt="LINCO" className="mx-auto size-16 rounded-2xl" />
          <div className="space-y-1">
            <h1 className="font-heading text-xl font-semibold text-foreground">Welcome to LINCO.</h1>
            <p className="text-sm text-muted-foreground">
              {mode === 'sign-in'
                ? 'Sign in to start writing, planning, and learning inside LINCO.'
                : 'Create your account to start writing, planning, and learning inside LINCO.'}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 rounded-xl bg-muted p-1">
          <button
            type="button"
            onClick={() => {
              setMode('sign-in')
              setError(null)
              setSuccessMessage(null)
            }}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              mode === 'sign-in' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('sign-up')
              setError(null)
              setSuccessMessage(null)
            }}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              mode === 'sign-up' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Create account
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-1.5 text-sm font-medium text-foreground">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus:border-ring"
              autoComplete="email"
              required
            />
          </label>

          <label className="block space-y-1.5 text-sm font-medium text-foreground">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus:border-ring"
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              required
            />
          </label>

          {mode === 'sign-up' && (
            <label className="block space-y-1.5 text-sm font-medium text-foreground">
              <span>Confirm password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus:border-ring"
                autoComplete="new-password"
                required
              />
            </label>
          )}

          {successMessage && <p className="rounded-lg bg-muted p-3 text-sm text-foreground">{successMessage}</p>}
          {error && <p className="rounded-lg bg-muted p-3 text-sm text-negative">{error}</p>}

          <Button className="w-full" disabled={submitting}>
            {submitting ? <IconLoader2 className="animate-spin" size={16} /> : null}
            {mode === 'sign-in' ? 'Continue' : 'Create account'}
          </Button>
        </form>

        <Button variant="outline" className="mt-3 w-full" onClick={handleGoogle} disabled={submitting}>
          <IconBrandGoogle size={16} />
          {mode === 'sign-in' ? 'Continue with Google' : 'Sign up with Google'}
        </Button>
      </div>
    </div>
  )
}
