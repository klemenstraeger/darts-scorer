export default defineEventHandler(async (event) => {
  const { id: userId } = await requireAuth(event)
  const tournamentId = Number(getRouterParam(event, 'id'))
  const matchId = Number(getRouterParam(event, 'matchId'))

  if (!tournamentId || isNaN(tournamentId)) {
    throw createError({ statusCode: 400, message: 'Invalid tournament ID' })
  }
  if (!matchId || isNaN(matchId)) {
    throw createError({ statusCode: 400, message: 'Invalid match ID' })
  }

  return tournamentManager.startMatch(userId, tournamentId, matchId)
})
