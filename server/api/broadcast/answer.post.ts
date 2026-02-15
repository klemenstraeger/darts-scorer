import { eq, and } from 'drizzle-orm'
import { broadcastSessions } from '../../db/schema'

/** Public endpoint — spectate view posts the SDP answer */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ tournamentId: number; answer: unknown }>(event)

  if (!body.tournamentId || !body.answer) {
    throw createError({ statusCode: 400, message: 'tournamentId and answer required' })
  }

  const result = await db
    .update(broadcastSessions)
    .set({
      answer: body.answer,
      status: 'connected',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(broadcastSessions.tournamentId, body.tournamentId),
        eq(broadcastSessions.status, 'waiting'),
      ),
    )

  return { ok: true }
})
