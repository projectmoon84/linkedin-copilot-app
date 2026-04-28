const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const

export function validateEnv() {
  const missing = required.filter((key) => !import.meta.env[key])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}
