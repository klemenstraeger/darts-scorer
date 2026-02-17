/**
 * Around the Clock — hit every number from 1 to 20, then bull.
 * Variants: singles (any hit), doubles (D only), trebles (T only).
 * Each dart either advances to the next target or doesn't.
 */

import type { ThrowResult } from '../../game-models'
import type { TrainingConfig, AroundTheClockState, TrainingThrowResult, TrainingStats, AroundTheClockVariant } from '../training-models'
import type { TrainingModeStrategy } from '../training-strategy'

const TARGETS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25]

function isHit(dart: ThrowResult, target: number, variant: AroundTheClockVariant): boolean {
  if (dart.segment !== target) return false
  switch (variant) {
    case 'singles': return true // any hit on the segment counts
    case 'doubles': return dart.multiplier === 2
    case 'trebles': return target !== 25 && dart.multiplier === 3 // bull can't be trebled
  }
}

export const aroundTheClockStrategy: TrainingModeStrategy<AroundTheClockState> = {
  createInitialState(config: TrainingConfig): AroundTheClockState {
    const variant = config.variant ?? 'singles'
    return {
      mode: 'around-the-clock',
      config,
      throws: [],
      isComplete: false,
      startedAt: new Date().toISOString(),
      completedAt: null,
      targets: [...TARGETS],
      currentTargetIndex: 0,
      variant,
      totalDarts: 0,
    }
  },

  processThrow(state: AroundTheClockState, dart: ThrowResult): TrainingThrowResult {
    state.totalDarts++
    const events: TrainingThrowResult['events'] = []
    const currentTarget = state.targets[state.currentTargetIndex]!

    if (isHit(dart, currentTarget, state.variant)) {
      events.push('target_hit')
      state.currentTargetIndex++

      if (state.currentTargetIndex >= state.targets.length) {
        state.isComplete = true
        state.completedAt = new Date().toISOString()
        events.push('session_complete')
      }
    } else {
      events.push('target_missed')
    }

    return { events, state }
  },

  undoLastThrow(state: AroundTheClockState): AroundTheClockState {
    if (state.totalDarts <= 0) return state
    state.totalDarts--

    // Check if the last throw was a hit by looking at the throw record
    const lastThrow = state.throws[state.throws.length]
    // After undo, the throw was already popped from state.throws by the engine.
    // We need to check if the target index should go back.
    // The engine pops from throws before calling undoLastThrow, so we look at
    // what was popped. We can infer: if currentTargetIndex > 0, check if
    // the removed throw would have been a hit on the previous target.
    if (state.currentTargetIndex > 0) {
      const prevTarget = state.targets[state.currentTargetIndex - 1]!
      // The removed throw is gone from state.throws, but we can check
      // the throw count vs expected position to decide.
      // Simpler approach: re-derive currentTargetIndex from remaining throws.
      state.currentTargetIndex = deriveTargetIndex(state)
    }

    return state
  },

  isComplete(state: AroundTheClockState): boolean {
    return state.currentTargetIndex >= state.targets.length
  },

  computeStats(state: AroundTheClockState): TrainingStats {
    const completed = state.currentTargetIndex
    const total = state.targets.length
    return {
      mode: 'around-the-clock',
      totalDarts: state.totalDarts,
      targetsHit: completed,
      targetsTotal: total,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      dartsPerTarget: completed > 0 ? Math.round((state.totalDarts / completed) * 10) / 10 : 0,
      variant: state.variant,
    }
  },
}

/** Re-derive target index by replaying throws against targets. */
function deriveTargetIndex(state: AroundTheClockState): number {
  let idx = 0
  for (const t of state.throws) {
    if (idx >= state.targets.length) break
    const target = state.targets[idx]!
    const dart: ThrowResult = { segment: t.segment, multiplier: t.multiplier }
    if (isHit(dart, target, state.variant)) {
      idx++
    }
  }
  return idx
}
