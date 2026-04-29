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
  const { user, loading, signIn, signInWithGoogle } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const from = (location.state as LocationState | null)?.from?.pathname || '/home'

  if (!loading && user) {
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
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
            <p className="text-sm text-muted-foreground">Sign in to start writing, planning, and learning inside LINCO.</p>
          </div>
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
              autoComplete="current-password"
              required
            />
          </label>

          {error && <p className="rounded-lg bg-muted p-3 text-sm text-negative">{error}</p>}

          <Button className="w-full" disabled={submitting}>
            {submitting ? <IconLoader2 className="animate-spin" size={16} /> : null}
            Continue
          </Button>
        </form>

        <Button variant="outline" className="mt-3 w-full" onClick={handleGoogle} disabled={submitting}>
          <IconBrandGoogle size={16} />
          Continue with Google
        </Button>
      </div>
    </div>
  )
}
