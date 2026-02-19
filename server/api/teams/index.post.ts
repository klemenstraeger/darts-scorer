import { teamMembers, teams } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const { id: userId } = await requireAuth(event)
  const body = await readBody<{
    name: string
    members: { playerName: string, position: number }[]
  }>(event)

  const name = body.name?.trim()
  if (!name) {
    throw createError({ statusCode: 400, message: 'Team name is required' })
  }

  if (!body.members || body.members.length < 2) {
    throw createError({ statusCode: 400, message: 'Team needs at least 2 members' })
  }

  const [team] = await db
    .insert(teams)
    .values({ userId, name })
    .onConflictDoNothing()
    .returning()

  if (!team) {
    throw createError({ statusCode: 409, message: 'A team with this name already exists' })
  }

  await db.insert(teamMembers).values(
    body.members.map(m => ({
      teamId: team.id,
      playerName: m.playerName.trim(),
      position: m.position,
    })),
  )

  return { id: team.id, name: team.name }
})
