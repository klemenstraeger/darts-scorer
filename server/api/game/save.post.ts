import type { GameState } from '../../../shared/game-models'

export default defineEventHandler(async (event) => {
  const { id: userId } = await requireAuth(event)
  const body = await readBody<{ state: GameState, tournamentMatchId?: number }>(event)

  if (!body.state?.is_finished) {
    throw createError({ statusCode: 400, message: 'Game is not finished' })
  }

  const result = await saveFinishedGame(userId, body.state)

  if (!result) {
    throw createError({ statusCode: 500, message: 'Failed to save game' })
  }

  // Handle tournament match completion
  if (body.tournamentMatchId) {
    await tournamentManager.completeMatch(userId, body.tournamentMatchId, body.state, result.gameId)
  }

  return { gameId: result.gameId, newAchievements: result.newAchievements }
})
