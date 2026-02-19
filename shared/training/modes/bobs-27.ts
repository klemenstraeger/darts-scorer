/**
 * Bob's 27 — Classic training game for doubles practice.
 *
 * Rules:
 * - Start with 27 points
 * - 21 rounds: D1, D2, D3, ..., D20, DBull
 * - Each round: 3 darts at the current double
 * - Hit the double: add the double's value per hit (D5 = +10 per hit)
 * - Miss all 3: subtract the double's value (D5 = -10)
 * - Score drops below 0: game over (failed)
 * - Complete all 21 rounds: final score is your result
 */

import type { ThrowResult } from '../../game-models'
import type { Bobs27State, TrainingConfig, TrainingStats, TrainingThrowResult } from '../training-models'
import type { TrainingModeStrategy } from '../training-strategy'

/** Get the target double for a given round (1-indexed). Round 21 = DBull. */
function roundTarget(round: number): number {
  return round <= 20 ? round : 25
}

/** Get the value of a double hit for the given round. */
function doubleValue(round: number): number {
  const target = roundTarget(round)
  return target * 2 // D1=2, D5=10, D20=40, DBull=50
}

function isDoubleHit(dart: ThrowResult, round: number): boolean {
  const target = roundTarget(round)
  return dart.segment === target && dart.multiplier === 2
}

export const bobs27Strategy: TrainingModeStrategy<Bobs27State> = {
  createInitialState(config: TrainingConfig): Bobs27State {
    return {
      mode: 'bobs-27',
      config,
      throws: [],
      isComplete: false,
      startedAt: new Date().toISOString(),
      completedAt: null,
      score: 27,
      currentRound: 1,
      totalRounds: 21,
      roundResults: Array.from({ length: 21 }).fill(null),
      currentRoundHits: 0,
      currentRoundThrows: 0,
      isFailed: false,
    }
  },

  processThrow(state: Bobs27State, dart: ThrowResult): TrainingThrowResult {
    const events: TrainingThrowResult['events'] = []
    state.currentRoundThrows++

    if (isDoubleHit(dart, state.currentRound)) {
      state.currentRoundHits++
      state.score += doubleValue(state.currentRound)
      events.push('target_hit')
    }
    else {
      events.push('target_missed')
    }

    // Round complete after 3 darts
    if (state.currentRoundThrows >= 3) {
      if (state.currentRoundHits > 0) {
        state.roundResults[state.currentRound - 1] = 'hit'
      }
      else {
        state.score -= doubleValue(state.currentRound)
        state.roundResults[state.currentRound - 1] = 'miss'
      }

      events.push('round_complete')

      // Check failure
      if (state.score < 0) {
        state.isFailed = true
        state.isComplete = true
        state.completedAt = new Date().toISOString()
        events.push('failed')
        events.push('session_complete')
      }
      else if (state.currentRound >= 21) {
        state.isComplete = true
        state.completedAt = new Date().toISOString()
        events.push('session_complete')
      }
      else {
        state.currentRound++
        state.currentRoundHits = 0
        state.currentRoundThrows = 0
      }
    }

    return { events, state }
  },

  undoLastThrow(state: Bobs27State): Bobs27State {
    // Re-derive state from remaining throws
    return replayState(state)
  },

  isComplete(state: Bobs27State): boolean {
    return state.isFailed || (state.currentRound >= 21 && state.currentRoundThrows >= 3)
  },

  computeStats(state: Bobs27State): TrainingStats {
    const totalDarts = state.throws.length
    const roundsCompleted = state.roundResults.filter(r => r !== null).length
    const doublesHit = state.roundResults.filter(r => r === 'hit').length

    return {
      mode: 'bobs-27',
      totalDarts,
      finalScore: state.score,
      isFailed: state.isFailed,
      roundsCompleted,
      doublesHit,
      doublesHitRate: roundsCompleted > 0 ? Math.round((doublesHit / roundsCompleted) * 100) : 0,
    }
  },
}

/** Replay all throws to reconstruct state (used for undo). */
function replayState(state: Bobs27State): Bobs27State {
  let score = 27
  let round = 1
  let roundThrows = 0
  let roundHits = 0
  const roundResults: ('hit' | 'miss' | null)[] = Array.from({ length: 21 }).fill(null)

  for (const t of state.throws) {
    const dart: ThrowResult = { segment: t.segment, multiplier: t.multiplier }
    roundThrows++

    if (isDoubleHit(dart, round)) {
      roundHits++
      score += doubleValue(round)
    }

    if (roundThrows >= 3) {
      if (roundHits > 0) {
        roundResults[round - 1] = 'hit'
      }
      else {
        score -= doubleValue(round)
        roundResults[round - 1] = 'miss'
      }

      if (score < 0 || round >= 21) {
        // End
        state.score = score
        state.currentRound = round
        state.currentRoundThrows = roundThrows
        state.currentRoundHits = roundHits
        state.roundResults = roundResults
        state.isFailed = score < 0
        return state
      }

      round++
      roundThrows = 0
      roundHits = 0
    }
  }

  state.score = score
  state.currentRound = round
  state.currentRoundThrows = roundThrows
  state.currentRoundHits = roundHits
  state.roundResults = roundResults
  state.isFailed = false
  return state
}
