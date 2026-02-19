import { and, eq } from 'drizzle-orm'
import { teams } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const { id: userId } = await requireAuth(event)
  const id = Number(getRouterParam(event, 'id'))

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: 'Invalid team ID' })
  }

  const [team] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.id, id), eq(teams.userId, userId)))

  if (!team) {
    throw createError({ statusCode: 404, message: 'Team not found' })
  }

  await db.delete(teams).where(eq(teams.id, id))

  return { status: 'ok' }
})
