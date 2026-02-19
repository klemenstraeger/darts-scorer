/**
 * Cricket Practice — close all cricket numbers solo.
 *
 * Rules:
 * - Targets: 15, 16, 17, 18, 19, 20, 25 (bull)
 * - Need 3 marks to close each target
 * - Single = 1 mark, Double = 2 marks, Treble = 3 marks
 * - Complete when all 7 targets are closed (3+ marks each)
 */

import type { ThrowResult } from '../../game-models'
import type { CricketState, TrainingConfig, TrainingStats, TrainingThrowResult } from '../training-models'
import type { TrainingModeStrategy } from '../training-strategy'

const CRICKET_TARGETS = [15, 16, 17, 18, 19, 20, 25]

export const cricketStrategy: TrainingModeStrategy<CricketState> = {
  createInitialState(config: TrainingConfig): CricketState {
    const marks: Record<number, number> = {}
    for (const t of CRICKET_TARGETS) {
      marks[t] = 0
    }
    return {
      mode: 'cricket',
      config,
      throws: [],
      isComplete: false,
      startedAt: new Date().toISOString(),
      completedAt: null,
      marks,
      targets: [...CRICKET_TARGETS],
      totalDarts: 0,
    }
  },

  processThrow(state: CricketState, dart: ThrowResult): TrainingThrowResult {
    const events: TrainingThrowResult['events'] = []
    state.totalDarts++

    if (CRICKET_TARGETS.includes(dart.segment)) {
      const current = state.marks[dart.segment] ?? 0
      if (current < 3) {
        const marksToAdd = Math.min(dart.multiplier, 3 - current)
        state.marks[dart.segment] = current + marksToAdd
        events.push('target_hit')
      }
      else {
        events.push('target_missed') // already closed
      }
    }
    else {
      events.push('target_missed')
    }

    // Check if all closed
    const allClosed = CRICKET_TARGETS.every(t => (state.marks[t] ?? 0) >= 3)
    if (allClosed) {
      state.isComplete = true
      state.completedAt = new Date().toISOString()
      events.push('session_complete')
    }

    return { events, state }
  },

  undoLastThrow(state: CricketState): CricketState {
    // Re-derive marks from remaining throws
    const marks: Record<number, number> = {}
    for (const t of CRICKET_TARGETS) {
      marks[t] = 0
    }
    state.totalDarts = state.throws.length

    for (const t of state.throws) {
      if (CRICKET_TARGETS.includes(t.segment)) {
        const current = marks[t.segment] ?? 0
        if (current < 3) {
          marks[t.segment] = Math.min(current + t.multiplier, 3)
        }
      }
    }

    state.marks = marks
    return state
  },

  isComplete(state: CricketState): boolean {
    return CRICKET_TARGETS.every(t => (state.marks[t] ?? 0) >= 3)
  },

  computeStats(state: CricketState): TrainingStats {
    const closed = CRICKET_TARGETS.filter(t => (state.marks[t] ?? 0) >= 3).length
    const totalMarks = Object.values(state.marks).reduce((s, m) => s + m, 0)

    return {
      mode: 'cricket',
      totalDarts: state.totalDarts,
      targetsClosed: closed,
      targetsTotal: CRICKET_TARGETS.length,
      totalMarks,
      dartsPerClose: closed > 0 ? Math.round((state.totalDarts / closed) * 10) / 10 : 0,
    }
  },
}
