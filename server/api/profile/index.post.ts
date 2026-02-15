import { profiles } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const { id } = await requireAuth(event)
  const body = await readBody<{ displayName: string }>(event)
  const displayName = body.displayName?.trim()

  if (!displayName || displayName.length < 2 || displayName.length > 20) {
    throw createError({ statusCode: 400, message: 'Display name must be 2-20 characters' })
  }

  try {
    await db.insert(profiles).values({ id, displayName })
  } catch (err: any) {
    if (err.code === '23505') {
      throw createError({ statusCode: 409, message: 'Display name already taken' })
    }
    throw err
  }

  return { status: 'ok', displayName }
})
