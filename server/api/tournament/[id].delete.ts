export default defineEventHandler(async (event) => {
  const { id: userId } = await requireAuth(event)
  const tournamentId = Number(getRouterParam(event, 'id'))

  if (!tournamentId || isNaN(tournamentId)) {
    throw createError({ statusCode: 400, message: 'Invalid tournament ID' })
  }

  return tournamentManager.deleteTournament(userId, tournamentId)
})
