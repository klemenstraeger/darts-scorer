import { asc, eq } from 'drizzle-orm'
import { players } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const { id: userId } = await requireAuth(event)

  return db
    .select({
      id: players.id,
      name: players.name,
      avatarStyle: players.avatarStyle,
      avatarSeed: players.avatarSeed,
      createdAt: players.createdAt,
    })
    .from(players)
    .where(eq(players.userId, userId))
    .orderBy(asc(players.name))
})
