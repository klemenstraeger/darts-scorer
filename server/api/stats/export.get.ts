import { sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { id: userId } = await requireAuth(event)
  const query = getQuery(event)

  const format = String(query.format || 'csv')
  if (!['csv', 'json'].includes(format)) {
    throw createError({ statusCode: 400, message: 'format must be csv or json' })
  }

  const playerName = query.player ? String(query.player) : null
  const from = query.from ? String(query.from) : null
  const to = query.to ? String(query.to) : null
  const mode = query.mode ? String(query.mode) : null

  if (from && isNaN(Date.parse(from))) {
    throw createError({ statusCode: 400, message: 'Invalid from date' })
  }
  if (to && isNaN(Date.parse(to))) {
    throw createError({ statusCode: 400, message: 'Invalid to date' })
  }
  if (mode && !['301', '501'].includes(mode)) {
    throw createError({ statusCode: 400, message: 'Invalid mode. Must be 301 or 501' })
  }

  // Build filter clauses
  const parts: SQL[] = []
  if (playerName) parts.push(sql`AND gp.player_name = ${playerName}`)
  if (from) parts.push(sql`AND g.created_at >= ${from}::timestamptz`)
  if (to) parts.push(sql`AND g.created_at <= ${to}::timestamptz`)
  if (mode) parts.push(sql`AND g.mode = ${mode}`)
  const filters = parts.length > 0 ? sql.join(parts, sql` `) : sql``

  const rows = await db.execute<{
    date: string
    mode: string
    player_name: string
    result: string
    final_score: number
  }>(sql`
    SELECT
      TO_CHAR(g.created_at, 'YYYY-MM-DD HH24:MI') as date,
      g.mode,
      gp.player_name,
      CASE WHEN g.winner_name = gp.player_name THEN 'Win' ELSE 'Loss' END as result,
      gp.final_score
    FROM game_players gp
    JOIN games g ON gp.game_id = g.id
    WHERE g.user_id = ${userId} ${filters}
    ORDER BY g.created_at DESC
  `)

  const timestamp = new Date().toISOString().slice(0, 10)

  if (format === 'json') {
    setResponseHeader(event, 'Content-Type', 'application/json')
    setResponseHeader(event, 'Content-Disposition', `attachment; filename="darts-stats-${timestamp}.json"`)
    return rows
  }

  // CSV format
  const header = 'Date,Mode,Player,Result,Final Score'
  const csvRows = rows.map((r) => {
    const escapedName = r.player_name.includes(',') ? `"${r.player_name}"` : r.player_name
    return `${r.date},${r.mode},${escapedName},${r.result},${r.final_score}`
  })
  const csv = [header, ...csvRows].join('\n')

  setResponseHeader(event, 'Content-Type', 'text/csv')
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="darts-stats-${timestamp}.csv"`)
  return csv
})
