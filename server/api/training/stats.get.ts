import { eq, and, sql } from 'drizzle-orm'
import { trainingSessions } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const { id: userId } = await requireAuth(event)
  const query = getQuery(event)
  const modeFilter = query.mode ? String(query.mode) : null

  const conditions = [eq(trainingSessions.userId, userId)]
  if (modeFilter) {
    conditions.push(eq(trainingSessions.mode, modeFilter))
  }

  const rows = await db
    .select({
      mode: trainingSessions.mode,
      totalSessions: sql<number>`count(*)`,
      avgDarts: sql<number>`avg(${trainingSessions.totalDarts})`,
      lastPlayed: sql<string>`max(${trainingSessions.createdAt})`,
    })
    .from(trainingSessions)
    .where(and(...conditions))
    .groupBy(trainingSessions.mode)

  const stats: Record<string, {
    totalSessions: number
    avgDarts: number
    lastPlayed: string | null
  }> = {}

  for (const row of rows) {
    stats[row.mode] = {
      totalSessions: Number(row.totalSessions),
      avgDarts: Math.round(Number(row.avgDarts)),
      lastPlayed: row.lastPlayed,
    }
  }

  return { stats }
})
