/**
 * Scoring Practice — throw rounds of 3 darts, track your 3-dart average.
 * Configurable number of rounds (default 10) and threshold target.
 */

import type { ThrowResult } from '../../game-models'
import type { ScoringPracticeState, TrainingConfig, TrainingStats, TrainingThrowResult } from '../training-models'
import type { TrainingModeStrategy } from '../training-strategy'
import { throwPoints } from '../../game-models'

export const scoringPracticeStrategy: TrainingModeStrategy<ScoringPracticeState> = {
  createInitialState(config: TrainingConfig): ScoringPracticeState {
    const rounds = config.rounds ?? 10
    return {
      mode: 'scoring-practice',
      config,
      throws: [],
      isComplete: false,
      startedAt: new Date().toISOString(),
      completedAt: null,
      currentRound: 1,
      totalRounds: rounds,
      roundScores: [],
      currentRoundThrows: 0,
      threshold: config.targetScore ?? 60,
    }
  },

  processThrow(state: ScoringPracticeState, dart: ThrowResult): TrainingThrowResult {
    const _points = throwPoints(dart)
    state.currentRoundThrows++
    const events: TrainingThrowResult['events'] = []

    if (state.currentRoundThrows >= 3) {
      // Calculate round score from last 3 throws
      const roundStart = state.throws.length - 3
      let roundScore = 0
      for (let i = Math.max(0, roundStart); i < state.throws.length; i++) {
        roundScore += state.throws[i]!.points
      }
      state.roundScores.push(roundScore)
      events.push('round_complete')

      if (state.currentRound >= state.totalRounds) {
        state.isComplete = true
        state.completedAt = new Date().toISOString()
        events.push('session_complete')
      }
      else {
        state.currentRound++
        state.currentRoundThrows = 0
      }
    }

    return { events, state }
  },

  undoLastThrow(state: ScoringPracticeState): ScoringPracticeState {
    if (state.currentRoundThrows > 0) {
      state.currentRoundThrows--
    }
    else if (state.roundScores.length > 0) {
      // Go back to previous round
      state.roundScores.pop()
      state.currentRound = Math.max(1, state.currentRound - 1)
      state.currentRoundThrows = 2 // Was 3 (complete), now 2 after undo
    }
    return state
  },

  isComplete(state: ScoringPracticeState): boolean {
    return state.currentRound >= state.totalRounds && state.currentRoundThrows >= 3
  },

  computeStats(state: ScoringPracticeState): TrainingStats {
    const totalDarts = state.throws.length
    const completedRounds = state.roundScores.length
    const totalScore = state.roundScores.reduce((s, r) => s + r, 0)
    const average = completedRounds > 0 ? totalScore / completedRounds : 0
    const best = completedRounds > 0 ? Math.max(...state.roundScores) : 0
    const aboveThreshold = state.roundScores.filter(s => s >= state.threshold).length

    return {
      mode: 'scoring-practice',
      totalDarts,
      average: Math.round(average * 10) / 10,
      bestRound: best,
      totalScore,
      completedRounds,
      aboveThreshold,
      threshold: state.threshold,
    }
  },
}
