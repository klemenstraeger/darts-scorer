import { and, eq } from 'drizzle-orm'
import { gamePlayers, players } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const { id: userId } = await requireAuth(event)
  const id = Number(getRouterParam(event, 'id'))

  if (!id || Number.isNaN(id)) {
    throw createError({ statusCode: 400, message: 'Invalid player ID' })
  }

  // Check if this player has any game history (by name)
  const [player] = await db
    .select({ id: players.id, name: players.name })
    .from(players)
    .where(and(eq(players.id, id), eq(players.userId, userId)))

  if (!player) {
    throw createError({ statusCode: 404, message: 'Player not found' })
  }

  const gameRecords = await db
    .select({ id: gamePlayers.id })
    .from(gamePlayers)
    .where(eq(gamePlayers.playerName, player.name))
    .limit(1)

  const hadGames = gameRecords.length > 0

  await db
    .delete(players)
    .where(and(eq(players.id, id), eq(players.userId, userId)))

  return { status: 'ok', hadGames }
})
