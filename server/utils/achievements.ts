/**
 * Achievement catalog and detection logic.
 * Called after a finished game is saved to check for newly unlocked achievements.
 */

import { eq, and, count as drizzleCount } from 'drizzle-orm'
import { achievements, games, gamePlayers } from '../db/schema'
import type { GameState } from '../../shared/game-models'
import { throwPoints } from '../../shared/game-models'

export interface AchievementDef {
  id: string
  name: string
  description: string
  icon: string
}

export const ACHIEVEMENT_CATALOG: AchievementDef[] = [
  // Per-game scoring achievements
  { id: 'first_180', name: 'Maximum!', description: 'Score your first 180', icon: '🎯' },
  { id: 'first_ton_plus', name: 'Ton Up', description: 'Score your first 100+ turn', icon: '💯' },
  { id: 'nine_darter', name: 'Perfect Game', description: 'Win a leg in 9 darts', icon: '⭐' },
  { id: 'sub_15_leg', name: 'Speed Demon', description: 'Win a leg in under 15 darts', icon: '⚡' },
  { id: 'avg_80_plus', name: 'Consistent Player', description: 'Finish a game with 80+ three-dart average', icon: '📈' },
  { id: 'avg_100_plus', name: 'Century Average', description: 'Finish a game with 100+ three-dart average', icon: '🔥' },

  // Checkout achievements
  { id: 'checkout_170', name: 'Big Fish', description: 'Hit a 170 checkout (T20 T20 Bull)', icon: '🐟' },
  { id: 'checkout_100plus', name: 'Ton Checkout', description: 'Hit a checkout of 100 or more', icon: '🎪' },

  // Cumulative game achievements
  { id: 'games_10', name: 'Getting Started', description: 'Play 10 games', icon: '🏁' },
  { id: 'games_50', name: 'Regular', description: 'Play 50 games', icon: '🎮' },
  { id: 'games_100', name: 'Dedicated', description: 'Play 100 games', icon: '🏆' },
  { id: 'games_500', name: 'Veteran', description: 'Play 500 games', icon: '👑' },

  // Cumulative win achievements
  { id: 'wins_10', name: 'Winner', description: 'Win 10 games', icon: '🥇' },
  { id: 'wins_50', name: 'Champion', description: 'Win 50 games', icon: '🏅' },
  { id: 'wins_100', name: 'Legend', description: 'Win 100 games', icon: '🌟' },

  // Special achievements
  { id: 'first_win', name: 'First Blood', description: 'Win your first game', icon: '🎉' },
  { id: 'five_180s_game', name: '180 Machine', description: 'Hit 5 or more 180s in a single game', icon: '🤖' },
  { id: 'no_bust_game', name: 'Clean Sheet', description: 'Win a game without busting', icon: '🧹' },
]

export interface UnlockedAchievement {
  type: string
  name: string
  description: string
  icon: string
  playerName: string
}

/**
 * Check for newly unlocked achievements after a game is saved.
 * Returns the list of achievements that were just unlocked.
 */
export async function checkAchievements(
  userId: string,
  gameId: number,
  state: GameState,
): Promise<UnlockedAchievement[]> {
  const newlyUnlocked: UnlockedAchievement[] = []

  for (const player of state.players) {
    // Skip bot players
    if (player.isBot) continue

    const playerName = player.name

    // Gather per-game data for this player
    const playerTurns = state.turn_history.filter(
      (t) => state.players[t.player_index]?.name === playerName,
    )

    const turnTotals = playerTurns.map((turn) => {
      if (turn.busted) return 0
      return turn.throws.reduce((sum, t) => sum + throwPoints(t), 0)
    })

    const threeDartTurns = playerTurns.filter((t) => t.throws.length === 3)
    const threeDartAvg = threeDartTurns.length > 0
      ? threeDartTurns.reduce((sum, t) => {
        if (t.busted) return sum
        return sum + t.throws.reduce((s, th) => s + throwPoints(th), 0)
      }, 0) / threeDartTurns.length
      : 0

    const isWinner = state.winner_index !== null && state.players[state.winner_index]?.name === playerName
    const count180 = turnTotals.filter((v) => v === 180).length
    const hasBust = playerTurns.some((t) => t.busted)

    // Determine checkout score (last turn of a won leg for this player)
    const checkoutScores: number[] = []
    for (const turn of playerTurns) {
      if (!turn.busted && turn.throws.length > 0) {
        const turnPts = turn.throws.reduce((s, t) => s + throwPoints(t), 0)
        // A checkout happens when score_before equals the turn total (player reached 0)
        if (turn.score_before !== null && turn.score_before === turnPts) {
          checkoutScores.push(turnPts)
        }
      }
    }

    // Find minimum darts per leg for this player
    // We need to find legs won by this player.
    // A leg is won when the player's score reaches 0.
    // We can detect this by looking for checkout turns.
    let minDartsInLeg: number | null = null
    let dartsInCurrentLeg = 0
    for (const turn of playerTurns) {
      dartsInCurrentLeg += turn.throws.length
      if (!turn.busted && turn.score_before !== null) {
        const turnPts = turn.throws.reduce((s, t) => s + throwPoints(t), 0)
        if (turn.score_before === turnPts) {
          // Leg completed
          if (minDartsInLeg === null || dartsInCurrentLeg < minDartsInLeg) {
            minDartsInLeg = dartsInCurrentLeg
          }
          dartsInCurrentLeg = 0
        }
      }
    }

    // Per-game achievements
    const perGameChecks: { type: string; condition: boolean; metadata?: Record<string, unknown> }[] = [
      { type: 'first_180', condition: count180 > 0 },
      { type: 'first_ton_plus', condition: turnTotals.some((v) => v >= 100) },
      { type: 'nine_darter', condition: minDartsInLeg === 9 },
      { type: 'sub_15_leg', condition: minDartsInLeg !== null && minDartsInLeg < 15 },
      { type: 'avg_80_plus', condition: threeDartAvg >= 80, metadata: { average: Math.round(threeDartAvg * 10) / 10 } },
      { type: 'avg_100_plus', condition: threeDartAvg >= 100, metadata: { average: Math.round(threeDartAvg * 10) / 10 } },
      { type: 'checkout_170', condition: checkoutScores.includes(170) },
      { type: 'first_win', condition: isWinner },
      { type: 'five_180s_game', condition: count180 >= 5, metadata: { count: count180 } },
      { type: 'no_bust_game', condition: isWinner && !hasBust },
    ]

    // Check for 100+ checkout separately to avoid computing max on empty array
    const checkout100Plus = checkoutScores.filter((s) => s >= 100)
    if (checkout100Plus.length > 0) {
      perGameChecks.push({
        type: 'checkout_100plus',
        condition: true,
        metadata: { highestCheckout: Math.max(...checkout100Plus) },
      })
    }

    for (const check of perGameChecks) {
      if (check.condition) {
        const unlocked = await tryUnlockAchievement(userId, playerName, check.type, gameId, check.metadata)
        if (unlocked) newlyUnlocked.push(unlocked)
      }
    }

    // Cumulative achievements: query the database for totals
    const [gamesPlayedResult] = await db
      .select({ count: drizzleCount() })
      .from(gamePlayers)
      .innerJoin(games, eq(gamePlayers.gameId, games.id))
      .where(and(eq(games.userId, userId), eq(gamePlayers.playerName, playerName)))

    const gamesPlayed = gamesPlayedResult?.count ?? 0

    const [gamesWonResult] = await db
      .select({ count: drizzleCount() })
      .from(games)
      .where(and(eq(games.userId, userId), eq(games.winnerName, playerName)))

    const gamesWon = gamesWonResult?.count ?? 0

    const cumulativeChecks: { type: string; condition: boolean; metadata?: Record<string, unknown> }[] = [
      { type: 'games_10', condition: gamesPlayed >= 10, metadata: { gamesPlayed } },
      { type: 'games_50', condition: gamesPlayed >= 50, metadata: { gamesPlayed } },
      { type: 'games_100', condition: gamesPlayed >= 100, metadata: { gamesPlayed } },
      { type: 'games_500', condition: gamesPlayed >= 500, metadata: { gamesPlayed } },
      { type: 'wins_10', condition: gamesWon >= 10, metadata: { gamesWon } },
      { type: 'wins_50', condition: gamesWon >= 50, metadata: { gamesWon } },
      { type: 'wins_100', condition: gamesWon >= 100, metadata: { gamesWon } },
    ]

    for (const check of cumulativeChecks) {
      if (check.condition) {
        const unlocked = await tryUnlockAchievement(userId, playerName, check.type, gameId, check.metadata)
        if (unlocked) newlyUnlocked.push(unlocked)
      }
    }
  }

  return newlyUnlocked
}

/**
 * Try to insert an achievement. Returns the achievement def if newly unlocked,
 * or null if already existed (conflict = already unlocked).
 */
async function tryUnlockAchievement(
  userId: string,
  playerName: string,
  type: string,
  gameId: number,
  metadata?: Record<string, unknown>,
): Promise<UnlockedAchievement | null> {
  const def = ACHIEVEMENT_CATALOG.find((a) => a.id === type)
  if (!def) return null

  const result = await db
    .insert(achievements)
    .values({
      userId,
      playerName,
      type,
      gameId,
      metadata: metadata ?? null,
    })
    .onConflictDoNothing()
    .returning({ id: achievements.id })

  if (result.length > 0) {
    return {
      type: def.id,
      name: def.name,
      description: def.description,
      icon: def.icon,
      playerName,
    }
  }

  return null
}
