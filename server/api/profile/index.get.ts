import { eq } from 'drizzle-orm'
import { profiles } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const { id } = await requireAuth(event)

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, id))

  if (!profile) {
    return { profile: null }
  }

  return {
    profile: {
      id: profile.id,
      displayName: profile.displayName,
      createdAt: profile.createdAt,
    },
  }
})
