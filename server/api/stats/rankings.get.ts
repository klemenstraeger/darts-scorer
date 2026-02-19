import { desc, eq } from 'drizzle-orm'
import { eloHistory, players } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const { id: userId } = await requireAuth(event)

  // Get all players sorted by Elo (descending)
  const allPlayers = await db
    .select({
      id: players.id,
      name: players.name,
      currentElo: players.currentElo,
      avatarStyle: players.avatarStyle,
      avatarSeed: players.avatarSeed,
    })
    .from(players)
    .where(eq(players.userId, userId))
    .orderBy(desc(players.currentElo))

  // For each player, fetch last 5 Elo history entries for sparkline trend
  const rankings = await Promise.all(
    allPlayers.map(async (player, index) => {
      const history = await db
        .select({
          eloAfter: eloHistory.eloAfter,
          result: eloHistory.result,
          createdAt: eloHistory.createdAt,
        })
        .from(eloHistory)
        .where(eq(eloHistory.playerName, player.name))
        .orderBy(desc(eloHistory.createdAt))
        .limit(5)

      return {
        rank: index + 1,
        name: player.name,
        currentElo: player.currentElo,
        avatarStyle: player.avatarStyle,
        avatarSeed: player.avatarSeed,
        trend: history.reverse(), // chronological order for sparkline
      }
    }),
  )

  return rankings
})
