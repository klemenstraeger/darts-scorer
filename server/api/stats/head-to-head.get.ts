import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { id: userId } = await requireAuth(event)
  const query = getQuery(event)

  const player1 = query.player1 as string | undefined
  const player2 = query.player2 as string | undefined

  if (!player1 || !player2) {
    throw createError({ statusCode: 400, message: 'player1 and player2 query parameters are required' })
  }

  if (player1 === player2) {
    throw createError({ statusCode: 400, message: 'player1 and player2 must be different' })
  }

  // Find all games where both players participated
  // Join gamePlayers twice: once for player1, once for player2
  const [
    totalGamesResult,
    player1WinsResult,
    player2WinsResult,
    player1AvgResult,
    player2AvgResult,
    recentGamesResult,
  ] = await Promise.all([
    // Total H2H games
    db.execute<{ value: number }>(sql`
      SELECT COUNT(DISTINCT g.id)::int as value
      FROM games g
        JOIN game_players gp1 ON gp1.game_id = g.id AND gp1.player_name = ${player1}
        JOIN game_players gp2 ON gp2.game_id = g.id AND gp2.player_name = ${player2}
      WHERE g.user_id = ${userId}
    `),

    // Player 1 wins
    db.execute<{ value: number }>(sql`
      SELECT COUNT(DISTINCT g.id)::int as value
      FROM games g
        JOIN game_players gp1 ON gp1.game_id = g.id AND gp1.player_name = ${player1}
        JOIN game_players gp2 ON gp2.game_id = g.id AND gp2.player_name = ${player2}
      WHERE g.user_id = ${userId} AND g.winner_name = ${player1}
    `),

    // Player 2 wins
    db.execute<{ value: number }>(sql`
      SELECT COUNT(DISTINCT g.id)::int as value
      FROM games g
        JOIN game_players gp1 ON gp1.game_id = g.id AND gp1.player_name = ${player1}
        JOIN game_players gp2 ON gp2.game_id = g.id AND gp2.player_name = ${player2}
      WHERE g.user_id = ${userId} AND g.winner_name = ${player2}
    `),

    // Player 1 three-dart average in H2H games
    db.execute<{ avg: number | null }>(sql`
      SELECT ROUND(AVG(t.total_points)::numeric, 2)::float as avg
      FROM turns t
        JOIN games g ON t.game_id = g.id
        JOIN game_players gp1 ON gp1.game_id = g.id AND gp1.player_name = ${player1}
        JOIN game_players gp2 ON gp2.game_id = g.id AND gp2.player_name = ${player2}
      WHERE g.user_id = ${userId}
        AND t.player_name = ${player1}
        AND t.busted = false
    `),

    // Player 2 three-dart average in H2H games
    db.execute<{ avg: number | null }>(sql`
      SELECT ROUND(AVG(t.total_points)::numeric, 2)::float as avg
      FROM turns t
        JOIN games g ON t.game_id = g.id
        JOIN game_players gp1 ON gp1.game_id = g.id AND gp1.player_name = ${player1}
        JOIN game_players gp2 ON gp2.game_id = g.id AND gp2.player_name = ${player2}
      WHERE g.user_id = ${userId}
        AND t.player_name = ${player2}
        AND t.busted = false
    `),

    // Recent H2H games (last 5)
    db.execute<{
      game_id: number
      created_at: string
      mode: string
      winner_name: string | null
      player1_score: number
      player2_score: number
      player1_avg: number | null
      player2_avg: number | null
    }>(sql`
      SELECT
        g.id as game_id,
        g.created_at::text as created_at,
        g.mode,
        g.winner_name,
        gp1.final_score as player1_score,
        gp2.final_score as player2_score,
        (
          SELECT ROUND(AVG(t1.total_points)::numeric, 1)::float
          FROM turns t1
          WHERE t1.game_id = g.id AND t1.player_name = ${player1} AND t1.busted = false
        ) as player1_avg,
        (
          SELECT ROUND(AVG(t2.total_points)::numeric, 1)::float
          FROM turns t2
          WHERE t2.game_id = g.id AND t2.player_name = ${player2} AND t2.busted = false
        ) as player2_avg
      FROM games g
        JOIN game_players gp1 ON gp1.game_id = g.id AND gp1.player_name = ${player1}
        JOIN game_players gp2 ON gp2.game_id = g.id AND gp2.player_name = ${player2}
      WHERE g.user_id = ${userId}
      ORDER BY g.created_at DESC
      LIMIT 5
    `),
  ])

  const totalGames = totalGamesResult[0]?.value ?? 0
  const player1Wins = player1WinsResult[0]?.value ?? 0
  const player2Wins = player2WinsResult[0]?.value ?? 0
  const draws = totalGames - player1Wins - player2Wins
  const player1Avg = player1AvgResult[0]?.avg ?? 0
  const player2Avg = player2AvgResult[0]?.avg ?? 0

  return {
    player1,
    player2,
    total_games: totalGames,
    player1_wins: player1Wins,
    player2_wins: player2Wins,
    draws,
    player1_avg: player1Avg,
    player2_avg: player2Avg,
    recent_games: recentGamesResult,
  }
})
