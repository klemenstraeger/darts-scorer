export default defineEventHandler(async (event) => {
  const { id: userId } = await requireAuth(event)
  const query = getQuery(event)

  const status = query.status as string | undefined
  const limit = Number(query.limit) || 50
  const offset = Number(query.offset) || 0

  return tournamentManager.getList(userId, status, limit, offset)
})
