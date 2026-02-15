import { eq, and } from 'drizzle-orm'
import { tournamentMatches, tournaments } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const { id: userId } = await requireAuth(event)
  const tournamentId = Number(getRouterParam(event, 'id'))

  if (!tournamentId || isNaN(tournamentId)) {
    throw createError({ statusCode: 400, message: 'Invalid tournament ID' })
  }

  // Verify ownership
  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(and(eq(tournaments.id, tournamentId), eq(tournaments.userId, userId)))

  if (!tournament) {
    throw createError({ statusCode: 404, message: 'Tournament not found' })
  }

  const matches = await db
    .select()
    .from(tournamentMatches)
    .where(and(
      eq(tournamentMatches.tournamentId, tournamentId),
      eq(tournamentMatches.phase, 'knockout'),
    ))

  // Organize by rounds
  const rounds: Record<number, typeof matches> = {}
  for (const match of matches) {
    if (!rounds[match.round]) rounds[match.round] = []
    rounds[match.round]!.push(match)
  }

  // Sort matches within each round by position
  for (const round of Object.values(rounds)) {
    round.sort((a, b) => a.position - b.position)
  }

  return { rounds, totalRounds: Object.keys(rounds).length }
})
