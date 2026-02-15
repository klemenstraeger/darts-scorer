import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { id: userId } = await requireAuth(event)
  const filters = parseStatsFilters(event)
  const { playerName } = filters
  const f = buildFilterClauses(filters)

  const [
    gamesWonResult, totalGamesResult, turnAggResult,
    totalDartsResult, bustsResult, bestLegResult,
    count180Result, count140PlusResult, count100PlusResult,
    highestTurnResult, scoringAvgResult, first9AvgResult,
    missCountResult, totalThrowCountResult, bestGameDartsResult,
    avgDartsPerLegResult,
  ] = await Promise.all([
    // Games won
    db.execute<{ value: number }>(sql`
      SELECT COUNT(*)::int as value FROM games g
      WHERE g.winner_name = ${playerName} AND g.user_id = ${userId} ${f}
    `),

    // Total games played
    db.execute<{ value: number }>(sql`
      SELECT COUNT(DISTINCT g.id)::int as value
      FROM game_players gp JOIN games g ON gp.game_id = g.id
      WHERE gp.player_name = ${playerName} AND g.user_id = ${userId} ${f}
    `),

    // Turn stats: total turns, total points
    db.execute<{ count: number; total_points: string | null }>(sql`
      SELECT COUNT(*)::int as count, SUM(t.total_points)::text as total_points
      FROM turns t JOIN games g ON t.game_id = g.id
      WHERE t.player_name = ${playerName} AND g.user_id = ${userId} ${f}
    `),

    // Total darts thrown
    db.execute<{ value: number }>(sql`
      SELECT COUNT(*)::int as value
      FROM throws th JOIN turns t ON th.turn_id = t.id JOIN games g ON t.game_id = g.id
      WHERE t.player_name = ${playerName} AND g.user_id = ${userId} ${f}
    `),

    // Bust count
    db.execute<{ value: number }>(sql`
      SELECT COUNT(*)::int as value
      FROM turns t JOIN games g ON t.game_id = g.id
      WHERE t.player_name = ${playerName} AND t.busted = true AND g.user_id = ${userId} ${f}
    `),

    // Best leg: fewest turns in a game they won
    db.execute<{ best: number | null }>(sql`
      SELECT MIN(turn_count)::int as best FROM (
        SELECT COUNT(*) as turn_count
        FROM turns t JOIN games g ON t.game_id = g.id
        WHERE t.player_name = ${playerName}
          AND g.winner_name = ${playerName}
          AND g.user_id = ${userId} ${f}
        GROUP BY g.id
      ) sub
    `),

    // 180s count
    db.execute<{ value: number }>(sql`
      SELECT COUNT(*)::int as value
      FROM turns t JOIN games g ON t.game_id = g.id
      WHERE t.player_name = ${playerName} AND g.user_id = ${userId}
        AND t.total_points = 180 AND t.busted = false ${f}
    `),

    // 140+ count
    db.execute<{ value: number }>(sql`
      SELECT COUNT(*)::int as value
      FROM turns t JOIN games g ON t.game_id = g.id
      WHERE t.player_name = ${playerName} AND g.user_id = ${userId}
        AND t.total_points >= 140 AND t.busted = false ${f}
    `),

    // 100+ count
    db.execute<{ value: number }>(sql`
      SELECT COUNT(*)::int as value
      FROM turns t JOIN games g ON t.game_id = g.id
      WHERE t.player_name = ${playerName} AND g.user_id = ${userId}
        AND t.total_points >= 100 AND t.busted = false ${f}
    `),

    // Highest turn (non-busted)
    db.execute<{ value: number | null }>(sql`
      SELECT MAX(t.total_points)::int as value
      FROM turns t JOIN games g ON t.game_id = g.id
      WHERE t.player_name = ${playerName} AND g.user_id = ${userId}
        AND t.busted = false ${f}
    `),

    // Scoring average (non-busted turns only)
    db.execute<{ avg: number | null }>(sql`
      SELECT ROUND(AVG(t.total_points)::numeric, 2)::float as avg
      FROM turns t JOIN games g ON t.game_id = g.id
      WHERE t.player_name = ${playerName} AND g.user_id = ${userId}
        AND t.busted = false ${f}
    `),

    // First 9 average (first 3 turns per game)
    db.execute<{ avg: number | null }>(sql`
      SELECT ROUND(AVG(total_points)::numeric, 2)::float as avg
      FROM (
        SELECT t.total_points,
          ROW_NUMBER() OVER (PARTITION BY t.game_id ORDER BY t.turn_number) as rn
        FROM turns t JOIN games g ON t.game_id = g.id
        WHERE t.player_name = ${playerName} AND g.user_id = ${userId}
          AND t.busted = false ${f}
      ) sub
      WHERE rn <= 3
    `),

    // Miss count (segment = 0)
    db.execute<{ value: number }>(sql`
      SELECT COUNT(*)::int as value
      FROM throws th JOIN turns t ON th.turn_id = t.id JOIN games g ON t.game_id = g.id
      WHERE t.player_name = ${playerName} AND g.user_id = ${userId}
        AND th.segment = 0 ${f}
    `),

    // Total throw count
    db.execute<{ value: number }>(sql`
      SELECT COUNT(*)::int as value
      FROM throws th JOIN turns t ON th.turn_id = t.id JOIN games g ON t.game_id = g.id
      WHERE t.player_name = ${playerName} AND g.user_id = ${userId} ${f}
    `),

    // Best game: fewest darts in a won game
    db.execute<{ value: number | null }>(sql`
      SELECT MIN(dart_count)::int as value FROM (
        SELECT COUNT(th.id) as dart_count
        FROM throws th JOIN turns t ON th.turn_id = t.id JOIN games g ON t.game_id = g.id
        WHERE t.player_name = ${playerName}
          AND g.winner_name = ${playerName}
          AND g.user_id = ${userId} ${f}
        GROUP BY g.id
      ) sub
    `),

    // Average darts per leg (won games)
    db.execute<{ avg: number | null }>(sql`
      SELECT ROUND(AVG(dart_count)::numeric, 1)::float as avg FROM (
        SELECT COUNT(th.id) as dart_count
        FROM throws th JOIN turns t ON th.turn_id = t.id JOIN games g ON t.game_id = g.id
        WHERE t.player_name = ${playerName}
          AND g.winner_name = ${playerName}
          AND g.user_id = ${userId} ${f}
        GROUP BY g.id
      ) sub
    `),
  ])

  const gamesWon = gamesWonResult[0]?.value ?? 0
  const totalGames = totalGamesResult[0]?.value ?? 0
  const totalTurns = turnAggResult[0]?.count ?? 0
  const totalPoints = Number(turnAggResult[0]?.total_points ?? 0)
  const totalDarts = totalDartsResult[0]?.value ?? 0
  const busts = bustsResult[0]?.value ?? 0
  const bestLegTurns = bestLegResult[0]?.best ?? null

  const avg = totalTurns > 0 ? totalPoints / totalTurns : 0
  const winRate = totalGames > 0 ? (gamesWon / totalGames) * 100 : 0

  const totalThrowCount = totalThrowCountResult[0]?.value ?? 0
  const missCount = missCountResult[0]?.value ?? 0
  const missRate = totalThrowCount > 0 ? (missCount / totalThrowCount) * 100 : 0
  const pointsPerDart = totalDarts > 0 ? totalPoints / totalDarts : 0

  return {
    player_name: playerName,
    total_games: totalGames,
    games_won: gamesWon,
    three_dart_average: Math.round(avg * 100) / 100,
    total_points: totalPoints,
    total_darts: totalDarts,
    total_turns: totalTurns,
    busts,
    best_leg_turns: bestLegTurns,
    win_rate: Math.round(winRate * 10) / 10,
    count_180: count180Result[0]?.value ?? 0,
    count_140_plus: count140PlusResult[0]?.value ?? 0,
    count_100_plus: count100PlusResult[0]?.value ?? 0,
    highest_turn: highestTurnResult[0]?.value ?? null,
    scoring_average: scoringAvgResult[0]?.avg ?? 0,
    first_9_average: first9AvgResult[0]?.avg ?? null,
    miss_rate: Math.round(missRate * 10) / 10,
    best_game_darts: bestGameDartsResult[0]?.value ?? null,
    points_per_dart: Math.round(pointsPerDart * 100) / 100,
    avg_darts_per_leg: avgDartsPerLegResult[0]?.avg ?? null,
  }
})
