import { eq } from 'drizzle-orm'
import { tournamentMatches } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const matchId = Number(getRouterParam(event, 'matchId'))

  if (!matchId || Number.isNaN(matchId)) {
    throw createError({ statusCode: 400, message: 'Invalid match ID' })
  }

  const [match] = await db
    .select({ tournamentId: tournamentMatches.tournamentId })
    .from(tournamentMatches)
    .where(eq(tournamentMatches.id, matchId))

  if (!match) {
    throw createError({ statusCode: 404, message: 'Match not found' })
  }

  return { tournamentId: match.tournamentId }
})
