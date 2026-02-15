import { eq, and } from 'drizzle-orm'
import { tournamentStandings, tournaments } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const { id: userId } = await requireAuth(event)
  const tournamentId = Number(getRouterParam(event, 'id'))
  const query = getQuery(event)
  const groupFilter = query.group !== undefined ? Number(query.group) : undefined

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

  let standings = await db
    .select()
    .from(tournamentStandings)
    .where(eq(tournamentStandings.tournamentId, tournamentId))

  if (groupFilter !== undefined && !isNaN(groupFilter)) {
    standings = standings.filter(s => s.groupIndex === groupFilter)
  }

  standings.sort((a, b) => b.points - a.points || b.legDifference - a.legDifference)

  return standings
})
