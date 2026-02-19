/**
 * 100 Darts at Target — throw 100 darts at a chosen segment.
 * Track hits on the target segment and total score.
 */

import type { ThrowResult } from '../../game-models'
import type { HundredDartsState, TrainingConfig, TrainingStats, TrainingThrowResult } from '../training-models'
import type { TrainingModeStrategy } from '../training-strategy'
import { throwPoints } from '../../game-models'

export const hundredDartsStrategy: TrainingModeStrategy<HundredDartsState> = {
  createInitialState(config: TrainingConfig): HundredDartsState {
    return {
      mode: 'hundred-darts',
      config,
      throws: [],
      isComplete: false,
      startedAt: new Date().toISOString(),
      completedAt: null,
      targetSegment: config.targetSegment ?? 20,
      totalDarts: 100,
      dartsThrown: 0,
      hits: 0,
      totalScore: 0,
    }
  },

  processThrow(state: HundredDartsState, dart: ThrowResult): TrainingThrowResult {
    const events: TrainingThrowResult['events'] = []
    state.dartsThrown++
    state.totalScore += throwPoints(dart)

    if (dart.segment === state.targetSegment) {
      state.hits++
      events.push('target_hit')
    }
    else {
      events.push('target_missed')
    }

    if (state.dartsThrown >= state.totalDarts) {
      state.isComplete = true
      state.completedAt = new Date().toISOString()
      events.push('session_complete')
    }

    return { events, state }
  },

  undoLastThrow(state: HundredDartsState): HundredDartsState {
    // Re-derive from remaining throws
    state.dartsThrown = state.throws.length
    state.hits = 0
    state.totalScore = 0
    for (const t of state.throws) {
      if (t.segment === state.targetSegment)
        state.hits++
      state.totalScore += t.points
    }
    return state
  },

  isComplete(state: HundredDartsState): boolean {
    return state.dartsThrown >= state.totalDarts
  },

  computeStats(state: HundredDartsState): TrainingStats {
    return {
      mode: 'hundred-darts',
      totalDarts: state.dartsThrown,
      hits: state.hits,
      hitRate: state.dartsThrown > 0 ? Math.round((state.hits / state.dartsThrown) * 100) : 0,
      totalScore: state.totalScore,
      targetSegment: state.targetSegment,
    }
  },
}
