import { eq } from 'drizzle-orm'
import { broadcastSessions, tournaments } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const { id: userId } = await requireAuth(event)
  const tournamentId = Number(getRouterParam(event, 'tournamentId'))

  if (!tournamentId || Number.isNaN(tournamentId)) {
    throw createError({ statusCode: 400, message: 'Invalid tournament ID' })
  }

  // Verify user owns this tournament
  const [tournament] = await db
    .select({ userId: tournaments.userId })
    .from(tournaments)
    .where(eq(tournaments.id, tournamentId))

  if (!tournament || tournament.userId !== userId) {
    throw createError({ statusCode: 403, message: 'Not tournament owner' })
  }

  await db
    .delete(broadcastSessions)
    .where(eq(broadcastSessions.tournamentId, tournamentId))

  return { ok: true }
})
