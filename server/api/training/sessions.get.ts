import type { SQL } from 'drizzle-orm'
import { and, desc, eq, sql } from 'drizzle-orm'
import { trainingSessions } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const { id: userId } = await requireAuth(event)
  const query = getQuery(event)
  const mode = query.mode ? String(query.mode) : null
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100)
  const offset = Math.max(Number(query.offset) || 0, 0)

  const conditions: SQL[] = [eq(trainingSessions.userId, userId)]
  if (mode) {
    conditions.push(eq(trainingSessions.mode, mode))
  }

  const where = and(...conditions)!

  const [sessions, countResult] = await Promise.all([
    db
      .select()
      .from(trainingSessions)
      .where(where)
      .orderBy(desc(trainingSessions.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(trainingSessions)
      .where(where),
  ])

  return {
    sessions,
    total: Number(countResult[0]?.count ?? 0),
  }
})
