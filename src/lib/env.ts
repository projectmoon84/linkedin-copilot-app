const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const

export function validateEnv() {
  const missing = required.filter((key) => !import.meta.env[key])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  if (import.meta.env.VITE_OPENAI_API_KEY) {
    console.warn('VITE_OPENAI_API_KEY is set but should not be used. Store provider secrets server-side only.')
  }
}
