import { eq } from 'drizzle-orm'
import { broadcastSessions } from '../../db/schema'

/** Phone polls this to check if an answer has been posted */
export default defineEventHandler(async (event) => {
  const tournamentId = Number(getRouterParam(event, 'tournamentId'))
  if (!tournamentId || Number.isNaN(tournamentId)) {
    throw createError({ statusCode: 400, message: 'Invalid tournament ID' })
  }

  const [session] = await db
    .select()
    .from(broadcastSessions)
    .where(eq(broadcastSessions.tournamentId, tournamentId))

  setResponseHeader(event, 'Cache-Control', 'no-cache, no-store')

  if (!session) {
    return { session: null }
  }

  return {
    session: {
      status: session.status,
      answer: session.answer,
    },
  }
})
