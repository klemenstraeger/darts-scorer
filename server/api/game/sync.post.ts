import { eq } from 'drizzle-orm'
import { activeGames } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const { id: userId } = await requireAuth(event)
  const body = await readBody<{ state: unknown; tournamentMatchId?: number | null }>(event)

  if (!body.state) {
    // Clear active game
    await db.delete(activeGames).where(eq(activeGames.userId, userId))
    return { synced: true }
  }

  await db
    .insert(activeGames)
    .values({
      userId,
      state: body.state,
      tournamentMatchId: body.tournamentMatchId ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: activeGames.userId,
      set: {
        state: body.state,
        tournamentMatchId: body.tournamentMatchId ?? null,
        updatedAt: new Date(),
      },
    })

  return { synced: true }
})
