import { players } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const { id: userId } = await requireAuth(event)
  const body = await readBody<{ name: string; avatarStyle?: string; avatarSeed?: string }>(event)
  const name = body.name?.trim()

  if (!name) {
    throw createError({ statusCode: 400, message: 'Name cannot be empty' })
  }

  const values: typeof players.$inferInsert = { name, userId }
  if (body.avatarStyle) values.avatarStyle = body.avatarStyle
  if (body.avatarSeed) values.avatarSeed = body.avatarSeed

  await db
    .insert(players)
    .values(values)
    .onConflictDoNothing()

  return { status: 'ok', name }
})
