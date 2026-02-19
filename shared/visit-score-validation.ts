/**
 * Validation logic for per-visit (3-dart total) score input.
 */

import type { CheckoutMode } from './game-models'
import { CHECKOUTS } from './checkouts'

/** Scores that are impossible with 3 darts (within 0-180 range). */
const IMPOSSIBLE_SCORES = new Set([163, 166, 169, 172, 173, 175, 176, 178, 179])

/** Quick-score buttons for common visit totals. */
export const QUICK_SCORES = [180, 140, 100, 85, 60, 45, 41, 26, 0] as const

/** Check whether a score is achievable with 3 darts. */
export function isAchievableScore(score: number): boolean {
  if (!Number.isInteger(score))
    return false
  if (score < 0 || score > 180)
    return false
  return !IMPOSSIBLE_SCORES.has(score)
}

export type VisitScoreResult = 'valid' | 'bust' | 'checkout' | 'invalid_checkout' | 'invalid_score'

/**
 * Validate a per-visit score against the current game state.
 * @param score - The 3-dart total entered by the player
 * @param currentScore - The player's remaining score before this visit
 * @param checkoutMode - The game's checkout mode (single_out or double_out)
 */
export function validateVisitScore(
  score: number,
  currentScore: number,
  checkoutMode: CheckoutMode,
): VisitScoreResult {
  if (!isAchievableScore(score))
    return 'invalid_score'

  const remaining = currentScore - score

  if (remaining < 0)
    return 'bust'

  if (remaining === 0) {
    if (checkoutMode === 'single_out')
      return 'checkout'
    // double_out: verify the score has a valid checkout path
    if (CHECKOUTS[currentScore])
      return 'checkout'
    return 'invalid_checkout'
  }

  // double_out: remaining of 1 is impossible (can't finish with D0.5)
  if (remaining === 1 && checkoutMode === 'double_out')
    return 'bust'

  return 'valid'
}
