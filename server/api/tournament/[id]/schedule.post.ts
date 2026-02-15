export default defineEventHandler(async (event) => {
  const { id: userId } = await requireAuth(event)
  const tournamentId = Number(getRouterParam(event, 'id'))

  if (!tournamentId || isNaN(tournamentId)) {
    throw createError({ statusCode: 400, message: 'Invalid tournament ID' })
  }

  const body = await readBody<{
    startDate: string
    intervalDays?: number
    matchesPerDay?: number
  }>(event)

  if (!body.startDate) {
    throw createError({ statusCode: 400, message: 'startDate is required' })
  }

  return tournamentManager.scheduleFixtures(
    userId,
    tournamentId,
    body.startDate,
    body.intervalDays ?? 7,
    body.matchesPerDay ?? 4,
  )
})
