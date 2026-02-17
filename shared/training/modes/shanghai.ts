/**
 * Shanghai — score on each number 1-20 over 20 rounds.
 *
 * Rules:
 * - 20 rounds, targeting numbers 1 through 20 in order
 * - 3 darts per round, scoring only on the target number
 * - Single = face value, Double = 2x, Treble = 3x
 * - Throws on non-target numbers score 0
 * - Shanghai bonus: hit a single, double, AND treble in one round
 * - Final score is total across all rounds
 */

import type { ThrowResult } from '../../game-models'
import type { TrainingConfig, ShanghaiState, TrainingThrowResult, TrainingStats } from '../training-models'
import type { TrainingModeStrategy } from '../training-strategy'

export const shanghaiStrategy: TrainingModeStrategy<ShanghaiState> = {
  createInitialState(config: TrainingConfig): ShanghaiState {
    return {
      mode: 'shanghai',
      config,
      throws: [],
      isComplete: false,
      startedAt: new Date().toISOString(),
      completedAt: null,
      currentRound: 1,
      totalRounds: 20,
      roundScores: [],
      currentRoundThrows: 0,
      totalScore: 0,
      shanghaiCount: 0,
      currentRoundHits: { single: false, double: false, treble: false },
    }
  },

  processThrow(state: ShanghaiState, dart: ThrowResult): TrainingThrowResult {
    const events: TrainingThrowResult['events'] = []
    state.currentRoundThrows++

    // Only score if hitting the target number
    if (dart.segment === state.currentRound) {
      const points = dart.segment * dart.multiplier
      state.totalScore += points
      events.push('target_hit')

      // Track hit types for shanghai detection
      if (dart.multiplier === 1) state.currentRoundHits.single = true
      if (dart.multiplier === 2) state.currentRoundHits.double = true
      if (dart.multiplier === 3) state.currentRoundHits.treble = true
    } else {
      events.push('target_missed')
    }

    // Round complete after 3 darts
    if (state.currentRoundThrows >= 3) {
      // Calculate round score from last 3 throws
      const roundStart = state.throws.length - 3
      let roundScore = 0
      for (let i = Math.max(0, roundStart); i < state.throws.length; i++) {
        const t = state.throws[i]!
        if (t.segment === state.currentRound) {
          roundScore += t.segment * t.multiplier
        }
      }
      state.roundScores.push(roundScore)
      events.push('round_complete')

      // Check for Shanghai
      const { single, double, treble } = state.currentRoundHits
      if (single && double && treble) {
        state.shanghaiCount++
        events.push('shanghai')
      }

      if (state.currentRound >= 20) {
        state.isComplete = true
        state.completedAt = new Date().toISOString()
        events.push('session_complete')
      } else {
        state.currentRound++
        state.currentRoundThrows = 0
        state.currentRoundHits = { single: false, double: false, treble: false }
      }
    }

    return { events, state }
  },

  undoLastThrow(state: ShanghaiState): ShanghaiState {
    return replayState(state)
  },

  isComplete(state: ShanghaiState): boolean {
    return state.currentRound >= 20 && state.currentRoundThrows >= 3
  },

  computeStats(state: ShanghaiState): TrainingStats {
    const completedRounds = state.roundScores.length
    const bestRound = completedRounds > 0 ? Math.max(...state.roundScores) : 0
    const avg = completedRounds > 0 ? state.totalScore / completedRounds : 0

    return {
      mode: 'shanghai',
      totalDarts: state.throws.length,
      totalScore: state.totalScore,
      completedRounds,
      bestRound,
      averagePerRound: Math.round(avg * 10) / 10,
      shanghaiCount: state.shanghaiCount,
    }
  },
}

/** Replay throws to reconstruct state (used for undo). */
function replayState(state: ShanghaiState): ShanghaiState {
  let round = 1
  let roundThrows = 0
  let totalScore = 0
  let shanghaiCount = 0
  const roundScores: number[] = []
  let hits = { single: false, double: false, treble: false }

  for (const t of state.throws) {
    roundThrows++

    if (t.segment === round) {
      totalScore += t.segment * t.multiplier
      if (t.multiplier === 1) hits.single = true
      if (t.multiplier === 2) hits.double = true
      if (t.multiplier === 3) hits.treble = true
    }

    if (roundThrows >= 3) {
      // Calculate round score
      const startIdx = state.throws.indexOf(t) - 2
      let roundScore = 0
      for (let i = Math.max(0, startIdx); i <= state.throws.indexOf(t); i++) {
        const rt = state.throws[i]!
        if (rt.segment === round) {
          roundScore += rt.segment * rt.multiplier
        }
      }
      roundScores.push(roundScore)

      if (hits.single && hits.double && hits.treble) {
        shanghaiCount++
      }

      if (round < 20) {
        round++
        roundThrows = 0
        hits = { single: false, double: false, treble: false }
      }
    }
  }

  state.currentRound = round
  state.currentRoundThrows = roundThrows
  state.totalScore = totalScore
  state.roundScores = roundScores
  state.shanghaiCount = shanghaiCount
  state.currentRoundHits = hits

  return state
}
