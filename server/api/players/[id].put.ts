import { and, eq } from 'drizzle-orm'
import { players } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const { id: userId } = await requireAuth(event)
  const id = Number(getRouterParam(event, 'id'))

  if (!id || Number.isNaN(id)) {
    throw createError({ statusCode: 400, message: 'Invalid player ID' })
  }

  const body = await readBody<{ name?: string, avatarStyle?: string | null, avatarSeed?: string | null }>(event)

  const updates: Partial<typeof players.$inferInsert> = {}
  if (body.name?.trim())
    updates.name = body.name.trim()
  if (body.avatarStyle !== undefined)
    updates.avatarStyle = body.avatarStyle
  if (body.avatarSeed !== undefined)
    updates.avatarSeed = body.avatarSeed

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'No fields to update' })
  }

  const result = await db
    .update(players)
    .set(updates)
    .where(and(eq(players.id, id), eq(players.userId, userId)))
    .returning({ id: players.id })

  if (result.length === 0) {
    throw createError({ statusCode: 404, message: 'Player not found' })
  }

  return { status: 'ok' }
})
