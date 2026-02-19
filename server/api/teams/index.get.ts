import { asc, eq } from 'drizzle-orm'
import { teamMembers, teams } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const { id: userId } = await requireAuth(event)

  const teamRows = await db
    .select()
    .from(teams)
    .where(eq(teams.userId, userId))
    .orderBy(asc(teams.name))

  const result = await Promise.all(
    teamRows.map(async (team) => {
      const members = await db
        .select({
          id: teamMembers.id,
          playerName: teamMembers.playerName,
          position: teamMembers.position,
        })
        .from(teamMembers)
        .where(eq(teamMembers.teamId, team.id))
        .orderBy(asc(teamMembers.position))

      return { ...team, members }
    }),
  )

  return result
})
