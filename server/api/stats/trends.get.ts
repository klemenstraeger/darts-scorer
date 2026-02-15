import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { id: userId } = await requireAuth(event)
  const filters = parseStatsFilters(event)
  const { playerName } = filters
  const f = buildFilterClauses(filters)

  const [gameAveragesResult, headToHeadResult, checkoutDartsResult] = await Promise.all([
    // Per-game 3-dart averages (chronological, last 50 games)
    db.execute<{
      game_id: number
      created_at: string
      average: number
      won: boolean
      opponent: string | null
    }>(sql`
      SELECT
        g.id as game_id,
        g.created_at::text as created_at,
        ROUND(AVG(t.total_points)::numeric, 2)::float as average,
        (g.winner_name = ${playerName}) as won,
        (
          SELECT gp2.player_name FROM game_players gp2
          WHERE gp2.game_id = g.id AND gp2.player_name != ${playerName}
          LIMIT 1
        ) as opponent
      FROM turns t
      JOIN games g ON t.game_id = g.id
      WHERE t.player_name = ${playerName}
        AND g.user_id = ${userId} ${f}
      GROUP BY g.id
      ORDER BY g.created_at ASC
      LIMIT 50
    `),

    // Head-to-head records
    db.execute<{
      opponent: string
      games_played: number
      wins: number
      losses: number
    }>(sql`
      SELECT
        gp2.player_name as opponent,
        COUNT(DISTINCT g.id)::int as games_played,
        SUM(CASE WHEN g.winner_name = ${playerName} THEN 1 ELSE 0 END)::int as wins,
        SUM(CASE WHEN g.winner_name IS NOT NULL AND g.winner_name != ${playerName} THEN 1 ELSE 0 END)::int as losses
      FROM games g
        JOIN game_players gp1 ON gp1.game_id = g.id AND gp1.player_name = ${playerName}
        JOIN game_players gp2 ON gp2.game_id = g.id AND gp2.player_name != ${playerName}
      WHERE g.user_id = ${userId} ${f}
      GROUP BY gp2.player_name
      ORDER BY games_played DESC
    `),

    // Checkout darts (last throw of final turn in each won game)
    db.execute<{
      segment: number
      multiplier: number
      label: string
      count: number
    }>(sql`
      SELECT
        th.segment,
        th.multiplier,
        CASE
          WHEN th.segment = 25 AND th.multiplier = 2 THEN 'DB'
          WHEN th.segment = 25 AND th.multiplier = 1 THEN 'SB'
          WHEN th.multiplier = 2 THEN 'D' || th.segment
          WHEN th.multiplier = 3 THEN 'T' || th.segment
          ELSE 'S' || th.segment
        END as label,
        COUNT(*)::int as count
      FROM throws th
        JOIN turns t ON th.turn_id = t.id
        JOIN games g ON t.game_id = g.id
      WHERE g.winner_name = ${playerName}
        AND t.player_name = ${playerName}
        AND g.user_id = ${userId}
        AND t.turn_number = (
          SELECT MAX(t2.turn_number) FROM turns t2
          WHERE t2.game_id = g.id AND t2.player_name = ${playerName}
        )
        AND th.throw_number = (
          SELECT MAX(th2.throw_number) FROM throws th2
          WHERE th2.turn_id = t.id
        )
        ${f}
      GROUP BY th.segment, th.multiplier
      ORDER BY count DESC
    `),
  ])

  return {
    game_averages: gameAveragesResult,
    head_to_head: headToHeadResult,
    checkout_darts: checkoutDartsResult,
  }
})
