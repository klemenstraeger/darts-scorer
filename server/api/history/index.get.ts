import { eq, and, desc, gte, lte, type SQL } from 'drizzle-orm'
import { games, gamePlayers } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const { id: userId } = await requireAuth(event)
  const query = getQuery(event)
  const playerName = query.player as string | undefined
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100)
  const offset = Math.max(Number(query.offset) || 0, 0)
  const from = query.from ? String(query.from) : null
  const to = query.to ? String(query.to) : null
  const mode = query.mode ? String(query.mode) : null

  // Use relational query builder for nested players
  const result = await db.query.games.findMany({
    with: {
      players: { orderBy: (gp, { asc }) => [asc(gp.position)] },
    },
    where: (g, { exists }) => {
      const conditions: SQL[] = [eq(g.userId, userId)]
      if (playerName) {
        conditions.push(
          exists(
            db.select({ _: gamePlayers.id })
              .from(gamePlayers)
              .where(and(eq(gamePlayers.playerName, playerName), eq(gamePlayers.gameId, g.id)))
          )
        )
      }
      if (from) conditions.push(gte(g.createdAt, new Date(from)))
      if (to) conditions.push(lte(g.createdAt, new Date(to)))
      if (mode) conditions.push(eq(g.mode, mode))
      return and(...conditions)
    },
    orderBy: [desc(games.createdAt)],
    limit,
    offset,
  })

  return result.map(g => ({
    id: g.id,
    mode: g.mode,
    winner_name: g.winnerName,
    players: g.players.map(p => ({
      player_name: p.playerName,
      position: p.position,
      final_score: p.finalScore,
    })),
    total_turns: g.totalTurns,
    created_at: g.createdAt,
  }))
})
