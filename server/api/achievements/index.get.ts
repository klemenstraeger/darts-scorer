import { eq } from 'drizzle-orm'
import { achievements } from '../../db/schema'
import { ACHIEVEMENT_CATALOG } from '../../utils/achievements'

export default defineEventHandler(async (event) => {
  const { id: userId } = await requireAuth(event)

  // Fetch all unlocked achievements for this user
  const unlocked = await db
    .select({
      type: achievements.type,
      playerName: achievements.playerName,
      unlockedAt: achievements.unlockedAt,
      metadata: achievements.metadata,
    })
    .from(achievements)
    .where(eq(achievements.userId, userId))

  // Build a lookup: type -> array of unlock records
  const unlockedMap = new Map<string, { playerName: string, unlockedAt: Date, metadata: unknown }[]>()
  for (const u of unlocked) {
    const arr = unlockedMap.get(u.type) ?? []
    arr.push({ playerName: u.playerName, unlockedAt: u.unlockedAt, metadata: u.metadata })
    unlockedMap.set(u.type, arr)
  }

  // Return catalog with unlock status
  return ACHIEVEMENT_CATALOG.map(def => ({
    ...def,
    unlocked: unlockedMap.has(def.id),
    unlockedBy: unlockedMap.get(def.id) ?? [],
  }))
})
