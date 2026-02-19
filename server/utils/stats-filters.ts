import type { SQL } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { sql } from 'drizzle-orm'

export interface StatsFilters {
  playerName: string
  from: string | null
  to: string | null
  mode: string | null
}

/**
 * Parse shared filter query params for stats endpoints.
 * Validates dates and mode, returns null for unset filters.
 */
export function parseStatsFilters(event: H3Event): StatsFilters {
  const query = getQuery(event)
  const playerName = query.player as string

  if (!playerName) {
    throw createError({ statusCode: 400, message: 'player query parameter is required' })
  }

  const from = query.from ? String(query.from) : null
  const to = query.to ? String(query.to) : null
  const mode = query.mode ? String(query.mode) : null

  // Validate date format (ISO date string)
  if (from && Number.isNaN(Date.parse(from))) {
    throw createError({ statusCode: 400, message: 'Invalid from date' })
  }
  if (to && Number.isNaN(Date.parse(to))) {
    throw createError({ statusCode: 400, message: 'Invalid to date' })
  }

  // Validate mode
  if (mode && !['301', '501'].includes(mode)) {
    throw createError({ statusCode: 400, message: 'Invalid mode. Must be 301 or 501' })
  }

  return { playerName, from, to, mode }
}

/**
 * Build SQL filter clauses for raw SQL queries.
 * Assumes games table is aliased as `g`.
 */
export function buildFilterClauses(filters: StatsFilters): SQL {
  const { from, to, mode } = filters
  const parts: SQL[] = []

  if (from)
    parts.push(sql`AND g.created_at >= ${from}::timestamptz`)
  if (to)
    parts.push(sql`AND g.created_at <= ${to}::timestamptz`)
  if (mode)
    parts.push(sql`AND g.mode = ${mode}`)

  if (parts.length === 0)
    return sql``
  return sql.join(parts, sql` `)
}
