/**
 * Persist a finished game to the database for stats tracking.
 * Extracted from GameManager.saveGameAndReturnId().
 */

import { games, gamePlayers, turns, dartsThrows, players } from '../db/schema'
import type { GameState } from '../../shared/game-models'
import type { UnlockedAchievement } from './achievements'

export interface SaveGameResult {
  gameId: number
  newAchievements: UnlockedAchievement[]
}

export async function saveFinishedGame(userId: string, state: GameState): Promise<SaveGameResult | null> {
  if (!state.is_finished || state.winner_index === null) return null

  try {
    const winnerName = state.players[state.winner_index]!.name

    // Ensure players exist for this user
    for (const player of state.players) {
      await db
        .insert(players)
        .values({ name: player.name, userId })
        .onConflictDoNothing()
    }

    // Create game with userId
    const [game] = await db
      .insert(games)
      .values({
        mode: state.mode,
        winnerName,
        totalTurns: state.turn_history.length,
        userId,
      })
      .returning({ id: games.id })

    const gameId = game!.id

    // Create game players
    await db.insert(gamePlayers).values(
      state.players.map((player, i) => ({
        gameId,
        playerName: player.name,
        position: i,
        finalScore: player.score,
      }))
    )

    // Create turns and throws
    for (let turnNum = 0; turnNum < state.turn_history.length; turnNum++) {
      const turn = state.turn_history[turnNum]!
      const playerName = state.players[turn.player_index]!.name
      const totalPts = turn.busted
        ? 0
        : turn.throws.reduce((sum, t) => sum + (t.segment === 25 ? 25 * t.multiplier : t.segment * t.multiplier), 0)

      const [dbTurn] = await db
        .insert(turns)
        .values({
          gameId,
          turnNumber: turnNum,
          playerName,
          totalPoints: totalPts,
          busted: turn.busted,
        })
        .returning({ id: turns.id })

      if (turn.throws.length > 0) {
        await db.insert(dartsThrows).values(
          turn.throws.map((t, throwNum) => ({
            turnId: dbTurn!.id,
            throwNumber: throwNum,
            segment: t.segment,
            multiplier: t.multiplier,
            points: t.segment === 25 ? 25 * t.multiplier : t.segment * t.multiplier,
          }))
        )
      }
    }

    console.log(`Game ${gameId} saved (${winnerName} won) for user ${userId}`)

    // Check for newly unlocked achievements
    let newAchievements: UnlockedAchievement[] = []
    try {
      newAchievements = await checkAchievements(userId, gameId, state)
      if (newAchievements.length > 0) {
        console.log(`Unlocked ${newAchievements.length} achievement(s) for user ${userId}:`, newAchievements.map(a => a.name).join(', '))
      }
    } catch (achErr) {
      console.warn('Failed to check achievements:', achErr)
    }

    return { gameId, newAchievements }
  } catch (err) {
    console.warn('Failed to save game to database', err)
    return null
  }
}
