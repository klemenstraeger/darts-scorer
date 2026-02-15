import type { H3Event } from 'h3'
import { serverSupabaseUser } from '#supabase/server'

/**
 * Require authentication for an API route.
 * Returns the authenticated user's id and email.
 * Throws 401 if not authenticated.
 *
 * @nuxtjs/supabase v2 returns JWT claims from serverSupabaseUser(),
 * where `sub` is the user ID and `email` is in the claims.
 */
export async function requireAuth(event: H3Event): Promise<{ id: string; email: string }> {
  const claims = await serverSupabaseUser(event)

  if (!claims) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  // v2 returns JWT claims — `sub` is the user ID
  const id = (claims as any).sub as string
  const email = ((claims as any).email as string) ?? ''

  if (!id) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  return { id, email }
}
