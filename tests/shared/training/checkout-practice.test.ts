import type { CheckoutPracticeState } from '../../../shared/training/training-models'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { D10, D20, S1, S20, T20 } from '../../helpers/darts'
import { createTrainingSession, trainingThrow } from '../../helpers/training'

afterEach(() => {
  vi.restoreAllMocks()
})

function checkoutState(engine: { state: unknown }): CheckoutPracticeState {
  return engine.state as CheckoutPracticeState
}

/** Mock Math.random to return 0 so randomTarget() gives 40. */
function mockRandomTarget(value = 0) {
  vi.spyOn(Math, 'random').mockReturnValue(value)
}

// ── Initial State ──

describe('initial state', () => {
  it('starts with target in range and defaults to 10 attempts', () => {
    mockRandomTarget(0) // target = 40
    const { state } = createTrainingSession('checkout-practice')
    const s = state as CheckoutPracticeState
    expect(s.currentTarget).toBe(40)
    expect(s.totalAttempts).toBe(10)
    expect(s.attempts).toBe(0)
    expect(s.successes).toBe(0)
    expect(s.currentAttemptThrows).toBe(0)
    expect(s.isComplete).toBe(false)
    expect(s.targets).toEqual([40])
  })

  it('respects custom rounds config', () => {
    mockRandomTarget(0)
    const { state } = createTrainingSession('checkout-practice', { rounds: 5 })
    const s = state as CheckoutPracticeState
    expect(s.totalAttempts).toBe(5)
  })
})

// ── Successful Checkout ──

describe('successful checkout', () => {
  it('checkout on double increments successes and emits target_hit', () => {
    mockRandomTarget(0) // target = 40
    const { engine } = createTrainingSession('checkout-practice')
    // 40 = D20
    const [result] = trainingThrow(engine, [D20])
    expect(result.events).toContain('target_hit')
    expect(checkoutState(engine).successes).toBe(1)
    expect(checkoutState(engine).attempts).toBe(1)
  })

  it('advances to next target after successful checkout', () => {
    mockRandomTarget(0) // target = 40 for init
    const { engine } = createTrainingSession('checkout-practice')

    // After init, allow next random to produce different target
    vi.spyOn(Math, 'random').mockReturnValue(0) // next target also 40
    trainingThrow(engine, [D20]) // checkout first attempt

    expect(checkoutState(engine).attempts).toBe(1)
    expect(checkoutState(engine).currentAttemptThrows).toBe(0)
    expect(checkoutState(engine).targets).toHaveLength(2)
  })
})

// ── Bust Scenarios ──

describe('bust', () => {
  it('remaining < 0 emits target_missed and round_complete', () => {
    mockRandomTarget(0) // target = 40
    const { engine } = createTrainingSession('checkout-practice')
    // T20 = 60, remaining = 40-60 = -20 → bust
    const [result] = trainingThrow(engine, [T20])
    expect(result.events).toContain('target_missed')
    expect(result.events).toContain('round_complete')
    expect(checkoutState(engine).attempts).toBe(1)
    expect(checkoutState(engine).successes).toBe(0)
  })

  it('remaining = 1 is bust (cannot finish on double)', () => {
    // target = 41: Math.random returns (41-40)/131 = 1/131
    vi.spyOn(Math, 'random').mockReturnValue(1 / 131) // target = 41
    const { engine } = createTrainingSession('checkout-practice')
    expect(checkoutState(engine).currentTarget).toBe(41)
    // S20 = 20, remaining = 21. Then S20 = 20, remaining = 1 → bust
    trainingThrow(engine, [S20])
    expect(checkoutState(engine).currentTarget).toBe(21)
    const [result] = trainingThrow(engine, [S20])
    expect(result.events).toContain('target_missed')
    expect(result.events).toContain('round_complete')
  })

  it('remaining = 0 without double is bust', () => {
    mockRandomTarget(0) // target = 40
    const { engine } = createTrainingSession('checkout-practice')
    // S20 + S20 = 40 on singles, remaining=0 but multiplier=1 → bust
    trainingThrow(engine, [S20])
    expect(checkoutState(engine).currentTarget).toBe(20)
    const [result] = trainingThrow(engine, [S20])
    expect(result.events).toContain('target_missed')
  })
})

// ── 3 Darts Used ──

describe('3 darts used without finish', () => {
  it('emits target_missed and round_complete after 3 darts', () => {
    mockRandomTarget(0) // target = 40
    const { engine } = createTrainingSession('checkout-practice')
    // S1, S1, S1 → remaining = 37, 36, 35 (no finish)
    // Wait: 3rd dart at remaining=35 → not bust but 3 darts used
    // Actually: S1=1 pt → 39, S1=1 → 38, S1=1 → 37. 3 darts used, not finished.
    const results = trainingThrow(engine, [S1, S1, S1])
    const lastResult = results[results.length - 1]
    expect(lastResult.events).toContain('target_missed')
    expect(lastResult.events).toContain('round_complete')
    expect(checkoutState(engine).attempts).toBe(1)
  })
})

// ── Mid-attempt ──

describe('mid-attempt scoring', () => {
  it('currentTarget reduces by throw points', () => {
    mockRandomTarget(0) // target = 40
    const { engine } = createTrainingSession('checkout-practice')
    trainingThrow(engine, [S20]) // 40 - 20 = 20
    expect(checkoutState(engine).currentTarget).toBe(20)
    expect(checkoutState(engine).currentAttemptThrows).toBe(1)
  })

  it('multi-dart sequence reduces correctly then finishes', () => {
    mockRandomTarget(0) // target = 40
    const { engine } = createTrainingSession('checkout-practice')
    trainingThrow(engine, [S20]) // remaining = 20
    const [result] = trainingThrow(engine, [D10]) // remaining = 0 on double → checkout!
    expect(result.events).toContain('target_hit')
    expect(checkoutState(engine).successes).toBe(1)
  })
})

// ── Completion ──

describe('completion', () => {
  it('after all attempts emits session_complete', () => {
    mockRandomTarget(0) // all targets = 40
    const { engine } = createTrainingSession('checkout-practice', { rounds: 2 })

    // Attempt 1: bust
    trainingThrow(engine, [T20])
    expect(checkoutState(engine).attempts).toBe(1)

    // Attempt 2: bust
    const [result] = trainingThrow(engine, [T20])
    expect(result.events).toContain('session_complete')
    expect(checkoutState(engine).isComplete).toBe(true)
    expect(checkoutState(engine).attempts).toBe(2)
  })

  it('throws after completion are no-ops', () => {
    mockRandomTarget(0)
    const { engine } = createTrainingSession('checkout-practice', { rounds: 1 })
    trainingThrow(engine, [T20]) // bust → 1 attempt → complete
    const result = engine.throw(S20)
    expect(result.events).toEqual([])
  })
})

// ── Undo ──

describe('undo', () => {
  it('replay with stored targets reconstructs state correctly', () => {
    mockRandomTarget(0) // target = 40
    const { engine } = createTrainingSession('checkout-practice')
    trainingThrow(engine, [S20]) // remaining = 20
    expect(checkoutState(engine).currentTarget).toBe(20)
    expect(checkoutState(engine).currentAttemptThrows).toBe(1)

    engine.undo()
    expect(checkoutState(engine).currentTarget).toBe(40)
    expect(checkoutState(engine).currentAttemptThrows).toBe(0)
    expect(checkoutState(engine).attempts).toBe(0)
  })

  it('undo after bust restores previous attempt state', () => {
    mockRandomTarget(0) // target = 40
    const { engine } = createTrainingSession('checkout-practice', { rounds: 3 })
    // Bust with T20 (60 > 40)
    trainingThrow(engine, [T20])
    expect(checkoutState(engine).attempts).toBe(1)

    engine.undo()
    expect(checkoutState(engine).attempts).toBe(0)
    expect(checkoutState(engine).currentTarget).toBe(40)
    expect(checkoutState(engine).isComplete).toBe(false)
  })

  it('undo on empty session is safe', () => {
    mockRandomTarget(0)
    const { engine } = createTrainingSession('checkout-practice')
    const state = engine.undo()
    expect(state.throws).toHaveLength(0)
  })
})

// ── Stats ──

describe('stats', () => {
  it('computes successes, successRate, totalAttempts', () => {
    mockRandomTarget(0) // target = 40
    const { engine } = createTrainingSession('checkout-practice', { rounds: 2 })

    // Attempt 1: checkout with D20
    trainingThrow(engine, [D20])
    // Attempt 2: bust with T20
    trainingThrow(engine, [T20])

    const stats = engine.getStats()!
    expect(stats.mode).toBe('checkout-practice')
    expect(stats.successes).toBe(1)
    expect(stats.attempts).toBe(2)
    expect(stats.totalAttempts).toBe(2)
    expect(stats.successRate).toBe(50) // 1/2 * 100
    expect(stats.totalDarts).toBe(2)
  })

  it('successRate is 0 when no attempts', () => {
    mockRandomTarget(0)
    const { engine } = createTrainingSession('checkout-practice')
    const stats = engine.getStats()!
    expect(stats.successRate).toBe(0)
  })
})
