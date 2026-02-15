import { eq, and, desc, gte, lte, type SQL } from 'drizzle-orm'
import { games, turns, dartsThrows } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const { id: userId } = await requireAuth(event)
  const query = getQuery(event)
  const filters = parseStatsFilters(event)
  const { playerName } = filters
  const turnLimit = Math.min(Math.max(Number(query.turn_limit) || 40, 10), 200)
  const throwLimit = Math.min(Math.max(Number(query.throw_limit) || 200, 50), 1000)

  // Build Drizzle conditions
  const conditions: SQL[] = [
    eq(turns.playerName, playerName),
    eq(games.userId, userId),
  ]
  if (filters.from) conditions.push(gte(games.createdAt, new Date(filters.from)))
  if (filters.to) conditions.push(lte(games.createdAt, new Date(filters.to)))
  if (filters.mode) conditions.push(eq(games.mode, filters.mode))

  const [turnsResult, throwsResult] = await Promise.all([
    db.select({
      id: turns.id,
      gameId: turns.gameId,
      turnNumber: turns.turnNumber,
      totalPoints: turns.totalPoints,
      busted: turns.busted,
      gameCreatedAt: games.createdAt,
    })
      .from(turns)
      .innerJoin(games, eq(turns.gameId, games.id))
      .where(and(...conditions))
      .orderBy(desc(games.createdAt), desc(turns.turnNumber))
      .limit(turnLimit),

    db.select({
      segment: dartsThrows.segment,
      multiplier: dartsThrows.multiplier,
      points: dartsThrows.points,
    })
      .from(dartsThrows)
      .innerJoin(turns, eq(dartsThrows.turnId, turns.id))
      .innerJoin(games, eq(turns.gameId, games.id))
      .where(and(...conditions))
      .orderBy(desc(turns.id), desc(dartsThrows.throwNumber))
      .limit(throwLimit),
  ])

  return {
    player_name: playerName,
    turns: turnsResult.map(t => ({
      id: t.id,
      game_id: t.gameId,
      turn_number: t.turnNumber,
      total_points: t.totalPoints,
      busted: t.busted,
      game_created_at: t.gameCreatedAt,
    })),
    throws: throwsResult.map(t => ({
      segment: t.segment,
      multiplier: t.multiplier,
      points: t.points,
    })),
  }
})
