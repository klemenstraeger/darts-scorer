import type { AroundTheClockState } from '../../../shared/training/training-models'
import { describe, expect, it } from 'vitest'
import { aroundTheClockStrategy } from '../../../shared/training/modes/around-the-clock'
import { D1, MISS, S1, S2, S5, S25, T1, T25 } from '../../helpers/darts'
import { createTrainingSession } from '../../helpers/training'

// ── Direct Strategy Tests ──

describe('aroundTheClockStrategy.createInitialState', () => {
  it('creates state with 21 targets (1-20 + 25), default singles variant', () => {
    const state = aroundTheClockStrategy.createInitialState({ mode: 'around-the-clock' })
    expect(state.mode).toBe('around-the-clock')
    expect(state.targets).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25])
    expect(state.targets).toHaveLength(21)
    expect(state.currentTargetIndex).toBe(0)
    expect(state.variant).toBe('singles')
    expect(state.totalDarts).toBe(0)
    expect(state.isComplete).toBe(false)
  })

  it('accepts doubles variant', () => {
    const state = aroundTheClockStrategy.createInitialState({
      mode: 'around-the-clock',
      variant: 'doubles',
    })
    expect(state.variant).toBe('doubles')
  })

  it('accepts trebles variant', () => {
    const state = aroundTheClockStrategy.createInitialState({
      mode: 'around-the-clock',
      variant: 'trebles',
    })
    expect(state.variant).toBe('trebles')
  })
})

// ── Singles Variant ──

describe('around-the-clock singles via TrainingEngine', () => {
  it('any hit on target segment advances', () => {
    const { engine } = createTrainingSession('around-the-clock')
    // Target is 1; S1 should hit
    const result = engine.throw(S1)
    expect(result.events).toContain('target_hit')
    expect((engine.state as AroundTheClockState).currentTargetIndex).toBe(1)
  })

  it('double on target segment also advances in singles mode', () => {
    const { engine } = createTrainingSession('around-the-clock')
    const result = engine.throw(D1) // D1 still hits segment 1
    expect(result.events).toContain('target_hit')
    expect((engine.state as AroundTheClockState).currentTargetIndex).toBe(1)
  })

  it('wrong segment does not advance', () => {
    const { engine } = createTrainingSession('around-the-clock')
    // Target is 1, throwing S5
    const result = engine.throw(S5)
    expect(result.events).toContain('target_missed')
    expect((engine.state as AroundTheClockState).currentTargetIndex).toBe(0)
  })

  it('miss does not advance', () => {
    const { engine } = createTrainingSession('around-the-clock')
    const result = engine.throw(MISS)
    expect(result.events).toContain('target_missed')
    expect((engine.state as AroundTheClockState).currentTargetIndex).toBe(0)
  })
})

// ── Doubles Variant ──

describe('around-the-clock doubles via TrainingEngine', () => {
  it('only D hit on target advances', () => {
    const { engine } = createTrainingSession('around-the-clock', { variant: 'doubles' })
    const result = engine.throw(D1)
    expect(result.events).toContain('target_hit')
    expect((engine.state as AroundTheClockState).currentTargetIndex).toBe(1)
  })

  it('single on target segment does NOT advance', () => {
    const { engine } = createTrainingSession('around-the-clock', { variant: 'doubles' })
    const result = engine.throw(S1)
    expect(result.events).toContain('target_missed')
    expect((engine.state as AroundTheClockState).currentTargetIndex).toBe(0)
  })

  it('treble on target segment does NOT advance', () => {
    const { engine } = createTrainingSession('around-the-clock', { variant: 'doubles' })
    const result = engine.throw(T1)
    expect(result.events).toContain('target_missed')
    expect((engine.state as AroundTheClockState).currentTargetIndex).toBe(0)
  })
})

// ── Trebles Variant ──

describe('around-the-clock trebles via TrainingEngine', () => {
  it('only T hit on target advances', () => {
    const { engine } = createTrainingSession('around-the-clock', { variant: 'trebles' })
    const result = engine.throw(T1)
    expect(result.events).toContain('target_hit')
    expect((engine.state as AroundTheClockState).currentTargetIndex).toBe(1)
  })

  it('single on target does NOT advance in trebles', () => {
    const { engine } = createTrainingSession('around-the-clock', { variant: 'trebles' })
    const result = engine.throw(S1)
    expect(result.events).toContain('target_missed')
    expect((engine.state as AroundTheClockState).currentTargetIndex).toBe(0)
  })

  it('double on target does NOT advance in trebles', () => {
    const { engine } = createTrainingSession('around-the-clock', { variant: 'trebles' })
    const result = engine.throw(D1)
    expect(result.events).toContain('target_missed')
    expect((engine.state as AroundTheClockState).currentTargetIndex).toBe(0)
  })

  it('t25 does NOT count when target is 25 (bull cannot be trebled)', () => {
    const { engine } = createTrainingSession('around-the-clock', { variant: 'trebles' })
    const _state = engine.state as AroundTheClockState

    // Advance to target 25 (index 20) by hitting T1-T20
    for (let seg = 1; seg <= 20; seg++) {
      engine.throw({ segment: seg, multiplier: 3 })
    }
    expect((engine.state as AroundTheClockState).currentTargetIndex).toBe(20)

    // T25 should NOT count
    const result = engine.throw(T25)
    expect(result.events).toContain('target_missed')
    expect((engine.state as AroundTheClockState).currentTargetIndex).toBe(20)
  })
})

// ── Completion ──

describe('around-the-clock completion', () => {
  it('emits session_complete after all 21 targets hit', () => {
    const { engine } = createTrainingSession('around-the-clock')

    // Hit 1 through 20
    for (let seg = 1; seg <= 20; seg++) {
      engine.throw({ segment: seg, multiplier: 1 })
    }
    expect((engine.state as AroundTheClockState).currentTargetIndex).toBe(20)
    expect(engine.state!.isComplete).toBe(false)

    // Hit 25 (bull)
    const result = engine.throw(S25)
    expect(result.events).toContain('target_hit')
    expect(result.events).toContain('session_complete')
    expect(engine.state!.isComplete).toBe(true)
    expect(engine.state!.completedAt).not.toBeNull()
  })

  it('does not process throws after completion', () => {
    const { engine } = createTrainingSession('around-the-clock')
    for (let seg = 1; seg <= 20; seg++) {
      engine.throw({ segment: seg, multiplier: 1 })
    }
    engine.throw(S25)
    expect(engine.state!.isComplete).toBe(true)

    const result = engine.throw(S1)
    expect(result.events).toEqual([])
  })
})

// ── Undo ──

describe('around-the-clock undo', () => {
  it('re-derives target index on undo after a hit', () => {
    const { engine } = createTrainingSession('around-the-clock')

    engine.throw(S1) // hit target 1 => index 1
    expect((engine.state as AroundTheClockState).currentTargetIndex).toBe(1)

    engine.undo()
    expect((engine.state as AroundTheClockState).currentTargetIndex).toBe(0)
    expect((engine.state as AroundTheClockState).totalDarts).toBe(0)
  })

  it('undo after a miss does not change target index', () => {
    const { engine } = createTrainingSession('around-the-clock')

    engine.throw(S5) // miss (target is 1)
    expect((engine.state as AroundTheClockState).currentTargetIndex).toBe(0)
    expect((engine.state as AroundTheClockState).totalDarts).toBe(1)

    engine.undo()
    expect((engine.state as AroundTheClockState).currentTargetIndex).toBe(0)
    expect((engine.state as AroundTheClockState).totalDarts).toBe(0)
  })

  it('undo un-completes a completed session', () => {
    const { engine } = createTrainingSession('around-the-clock')
    for (let seg = 1; seg <= 20; seg++) {
      engine.throw({ segment: seg, multiplier: 1 })
    }
    engine.throw(S25)
    expect(engine.state!.isComplete).toBe(true)

    engine.undo()
    expect(engine.state!.isComplete).toBe(false)
    expect((engine.state as AroundTheClockState).currentTargetIndex).toBe(20)
  })
})

// ── Stats ──

describe('around-the-clock stats', () => {
  it('computes targetsHit, dartsPerTarget, completionRate', () => {
    const { engine } = createTrainingSession('around-the-clock')

    // Hit S1, miss, hit S2 => 3 darts, 2 targets hit
    engine.throw(S1)
    engine.throw(MISS) // miss
    engine.throw(S2)

    const stats = engine.getStats()!
    expect(stats.mode).toBe('around-the-clock')
    expect(stats.totalDarts).toBe(3)
    expect(stats.targetsHit).toBe(2)
    expect(stats.targetsTotal).toBe(21)
    // completionRate = (2/21)*100 = 9.52... => 10 (rounded)
    expect(stats.completionRate).toBe(10)
    // dartsPerTarget = 3/2 = 1.5
    expect(stats.dartsPerTarget).toBe(1.5)
    expect(stats.variant).toBe('singles')
  })

  it('stats with no hits', () => {
    const { engine } = createTrainingSession('around-the-clock')
    engine.throw(MISS)

    const stats = engine.getStats()!
    expect(stats.targetsHit).toBe(0)
    expect(stats.completionRate).toBe(0)
    expect(stats.dartsPerTarget).toBe(0)
  })
})
