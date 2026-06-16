import { createClient } from '@supabase/supabase-js'

// Browser client — uses the public anon/publishable key only.
// Never import the service role key here.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Fail fast at module load if misconfigured (rules: validate at boundaries)
  // eslint-disable-next-line no-console
  console.warn(
    'Supabase public env vars missing: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY'
  )
}

export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: { persistSession: false },
})
