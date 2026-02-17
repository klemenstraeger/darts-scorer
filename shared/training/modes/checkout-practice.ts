/**
 * Checkout Practice — practice finishing with random targets.
 *
 * Rules:
 * - Random target scores between 40 and 170
 * - 3 darts per attempt (standard double-out rules)
 * - Score deducts from target, must finish on a double
 * - Success = hit exact 0 with double. Failure = bust or 3 darts used.
 * - After success or failure, next random target.
 * - Default 10 attempts.
 */

import type { ThrowResult } from '../../game-models'
import { throwPoints } from '../../game-models'
import type { TrainingConfig, CheckoutPracticeState, TrainingThrowResult, TrainingStats } from '../training-models'
import type { TrainingModeStrategy } from '../training-strategy'

/** Generate a random checkout target between 40 and 170. */
function randomTarget(): number {
  return 40 + Math.floor(Math.random() * 131) // 40-170
}

export const checkoutPracticeStrategy: TrainingModeStrategy<CheckoutPracticeState> = {
  createInitialState(config: TrainingConfig): CheckoutPracticeState {
    const totalAttempts = config.rounds ?? 10
    const firstTarget = randomTarget()
    return {
      mode: 'checkout-practice',
      config,
      throws: [],
      isComplete: false,
      startedAt: new Date().toISOString(),
      completedAt: null,
      currentTarget: firstTarget,
      attempts: 0,
      successes: 0,
      totalAttempts,
      currentAttemptThrows: 0,
      targets: [firstTarget],
    }
  },

  processThrow(state: CheckoutPracticeState, dart: ThrowResult): TrainingThrowResult {
    const events: TrainingThrowResult['events'] = []
    state.currentAttemptThrows++
    const points = throwPoints(dart)
    const remaining = state.currentTarget - points

    if (remaining === 0 && dart.multiplier === 2) {
      // Checkout!
      state.successes++
      events.push('target_hit')
      state.attempts++
      advanceToNextTarget(state, events)
    } else if (remaining < 0 || remaining === 1 || (remaining === 0 && dart.multiplier !== 2)) {
      // Bust — skip to next target
      events.push('target_missed')
      events.push('round_complete')
      state.attempts++
      advanceToNextTarget(state, events)
    } else if (state.currentAttemptThrows >= 3) {
      // Used all 3 darts without finishing
      events.push('target_missed')
      events.push('round_complete')
      state.attempts++
      advanceToNextTarget(state, events)
    } else {
      // Still throwing — deduct score (track it for display)
      state.currentTarget = remaining
    }

    return { events, state }
  },

  undoLastThrow(state: CheckoutPracticeState): CheckoutPracticeState {
    // Re-derive state from remaining throws
    return replayState(state)
  },

  isComplete(state: CheckoutPracticeState): boolean {
    return state.attempts >= state.totalAttempts
  },

  computeStats(state: CheckoutPracticeState): TrainingStats {
    return {
      mode: 'checkout-practice',
      totalDarts: state.throws.length,
      attempts: state.attempts,
      successes: state.successes,
      successRate: state.attempts > 0 ? Math.round((state.successes / state.attempts) * 100) : 0,
      totalAttempts: state.totalAttempts,
    }
  },
}

function advanceToNextTarget(state: CheckoutPracticeState, events: TrainingThrowResult['events']): void {
  if (state.attempts >= state.totalAttempts) {
    state.isComplete = true
    state.completedAt = new Date().toISOString()
    events.push('session_complete')
  } else {
    const next = randomTarget()
    state.currentTarget = next
    state.targets.push(next)
    state.currentAttemptThrows = 0
  }
}

/** Replay all throws to reconstruct state (used for undo). */
function replayState(state: CheckoutPracticeState): CheckoutPracticeState {
  const totalAttempts = state.config.rounds ?? 10

  // We need the original target sequence to replay correctly
  // Rebuild using stored targets array
  let targetIdx = 0
  let currentTarget = state.targets[0] ?? randomTarget()
  let attemptThrows = 0
  let attempts = 0
  let successes = 0

  for (const t of state.throws) {
    attemptThrows++
    const points = t.points
    const remaining = currentTarget - points

    if (remaining === 0 && t.multiplier === 2) {
      // Checkout
      successes++
      attempts++
      targetIdx++
      if (attempts < totalAttempts && targetIdx < state.targets.length) {
        currentTarget = state.targets[targetIdx]!
        attemptThrows = 0
      }
    } else if (remaining < 0 || remaining === 1 || (remaining === 0 && t.multiplier !== 2)) {
      // Bust
      attempts++
      targetIdx++
      if (attempts < totalAttempts && targetIdx < state.targets.length) {
        currentTarget = state.targets[targetIdx]!
        attemptThrows = 0
      }
    } else if (attemptThrows >= 3) {
      // 3 darts used
      attempts++
      targetIdx++
      if (attempts < totalAttempts && targetIdx < state.targets.length) {
        currentTarget = state.targets[targetIdx]!
        attemptThrows = 0
      }
    } else {
      currentTarget = remaining
    }
  }

  state.currentTarget = currentTarget
  state.currentAttemptThrows = attemptThrows
  state.attempts = attempts
  state.successes = successes
  // Trim targets array to match replay
  state.targets = state.targets.slice(0, targetIdx + 1)

  return state
}
