import { createClient } from '@supabase/supabase-js'

let supabaseAdmin: ReturnType<typeof createClient> | null = null

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const url = process.env.SUPABASE_URL!
    // Use secret key (server-side) or fall back to publishable key
    const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY!
    supabaseAdmin = createClient(url, key)
  }
  return supabaseAdmin
}

/**
 * Verify a Supabase JWT token and return the user ID.
 * Used for WebSocket authentication where we can't use HTTP middleware.
 */
export async function verifySupabaseToken(token: string): Promise<string | null> {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) return null
    return data.user.id
  } catch {
    return null
  }
}
