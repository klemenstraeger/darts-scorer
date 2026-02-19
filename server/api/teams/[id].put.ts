import { and, eq } from 'drizzle-orm'
import { teams, teamMembers } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const { id: userId } = await requireAuth(event)
  const id = Number(getRouterParam(event, 'id'))

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: 'Invalid team ID' })
  }

  const body = await readBody<{
    name?: string
    members?: { playerName: string; position: number }[]
  }>(event)

  // Verify ownership
  const [team] = await db
    .select()
    .from(teams)
    .where(and(eq(teams.id, id), eq(teams.userId, userId)))

  if (!team) {
    throw createError({ statusCode: 404, message: 'Team not found' })
  }

  // Update name if provided
  if (body.name?.trim()) {
    await db.update(teams)
      .set({ name: body.name.trim() })
      .where(eq(teams.id, id))
  }

  // Replace members if provided
  if (body.members && body.members.length >= 2) {
    await db.delete(teamMembers).where(eq(teamMembers.teamId, id))
    await db.insert(teamMembers).values(
      body.members.map(m => ({
        teamId: id,
        playerName: m.playerName.trim(),
        position: m.position,
      })),
    )
  }

  return { status: 'ok' }
})
