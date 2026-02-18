/**
 * Persist a finished game to the database for stats tracking.
 * Extracted from GameManager.saveGameAndReturnId().
 */

import { eq, and } from 'drizzle-orm'
import { games, gamePlayers, turns, dartsThrows, players, eloHistory } from '../db/schema'
import type { GameState } from '../../shared/game-models'
import { computeElo } from './elo'
import type { UnlockedAchievement } from './achievements'

export interface SaveGameResult {
  gameId: number
  newAchievements: UnlockedAchievement[]
}

export async function saveFinishedGame(userId: string, state: GameState): Promise<SaveGameResult | null> {
  if (!state.is_finished || state.winner_index === null) return null

  try {
    const winnerName = state.players[state.winner_index]!.name

    // Ensure players exist for this user (skip bots)
    for (const player of state.players) {
      if (player.isBot) continue
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

    // Update Elo ratings for 2-player human games
    await updateEloRatings(userId, state, gameId)

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

/**
 * Update Elo ratings for both players after a 2-player human game.
 * Skips games with bots or games with != 2 players.
 */
async function updateEloRatings(userId: string, state: GameState, gameId: number): Promise<void> {
  // Only update Elo for exactly 2 human players
  if (state.players.length !== 2) return
  if (state.players.some(p => p.isBot)) return
  if (state.winner_index === null) return

  const winner = state.players[state.winner_index]!
  const loserIndex = state.winner_index === 0 ? 1 : 0
  const loser = state.players[loserIndex]!

  try {
    // Get current Elo ratings from the players table
    const [winnerRow] = await db
      .select({ currentElo: players.currentElo })
      .from(players)
      .where(and(eq(players.userId, userId), eq(players.name, winner.name)))

    const [loserRow] = await db
      .select({ currentElo: players.currentElo })
      .from(players)
      .where(and(eq(players.userId, userId), eq(players.name, loser.name)))

    if (!winnerRow || !loserRow) return

    const result = computeElo(winnerRow.currentElo, loserRow.currentElo)

    // Update player ratings
    await db
      .update(players)
      .set({ currentElo: result.newWinner })
      .where(and(eq(players.userId, userId), eq(players.name, winner.name)))

    await db
      .update(players)
      .set({ currentElo: result.newLoser })
      .where(and(eq(players.userId, userId), eq(players.name, loser.name)))

    // Insert Elo history records
    await db.insert(eloHistory).values([
      {
        userId,
        playerName: winner.name,
        eloBefore: winnerRow.currentElo,
        eloAfter: result.newWinner,
        gameId,
        opponentName: loser.name,
        result: 'win',
      },
      {
        userId,
        playerName: loser.name,
        eloBefore: loserRow.currentElo,
        eloAfter: result.newLoser,
        gameId,
        opponentName: winner.name,
        result: 'loss',
      },
    ])

    console.log(`Elo updated: ${winner.name} ${winnerRow.currentElo} -> ${result.newWinner}, ${loser.name} ${loserRow.currentElo} -> ${result.newLoser}`)
  } catch (err) {
    console.warn('Failed to update Elo ratings', err)
  }
}
