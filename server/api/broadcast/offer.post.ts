import { eq } from 'drizzle-orm'
import { broadcastSessions, tournaments } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const { id: userId } = await requireAuth(event)
  const body = await readBody<{ tournamentId: number, offer: unknown }>(event)

  if (!body.tournamentId || !body.offer) {
    throw createError({ statusCode: 400, message: 'tournamentId and offer required' })
  }

  // Verify user owns this tournament
  const [tournament] = await db
    .select({ userId: tournaments.userId })
    .from(tournaments)
    .where(eq(tournaments.id, body.tournamentId))

  if (!tournament || tournament.userId !== userId) {
    throw createError({ statusCode: 403, message: 'Not tournament owner' })
  }

  await db
    .insert(broadcastSessions)
    .values({
      tournamentId: body.tournamentId,
      userId,
      offer: body.offer,
      answer: null,
      status: 'waiting',
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: broadcastSessions.tournamentId,
      set: {
        userId,
        offer: body.offer,
        answer: null,
        status: 'waiting',
        updatedAt: new Date(),
      },
    })

  return { ok: true }
})
