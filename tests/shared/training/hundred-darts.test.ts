import { describe, it, expect } from 'vitest'
import { hundredDartsStrategy } from '../../../shared/training/modes/hundred-darts'
import type { HundredDartsState } from '../../../shared/training/training-models'
import { createTrainingSession, trainingThrow, trainingMisses } from '../../helpers/training'
import { S20, S19, S1, S5, T20, D20, MISS } from '../../helpers/darts'

// ── Direct Strategy Tests ──

describe('hundredDartsStrategy.createInitialState', () => {
  it('defaults to target 20 and 100 darts', () => {
    const state = hundredDartsStrategy.createInitialState({ mode: 'hundred-darts' })
    expect(state.mode).toBe('hundred-darts')
    expect(state.targetSegment).toBe(20)
    expect(state.totalDarts).toBe(100)
    expect(state.dartsThrown).toBe(0)
    expect(state.hits).toBe(0)
    expect(state.totalScore).toBe(0)
    expect(state.isComplete).toBe(false)
  })

  it('accepts custom targetSegment', () => {
    const state = hundredDartsStrategy.createInitialState({
      mode: 'hundred-darts',
      targetSegment: 19,
    })
    expect(state.targetSegment).toBe(19)
  })
})

// ── Hit Counting ──

describe('hundred-darts hit counting', () => {
  it('counts a hit when segment matches target', () => {
    const { engine } = createTrainingSession('hundred-darts')
    // target is 20, S20 matches segment
    const result = engine.throw(S20)
    expect(result.events).toContain('target_hit')
    const s = engine.state as HundredDartsState
    expect(s.hits).toBe(1)
    expect(s.dartsThrown).toBe(1)
    expect(s.totalScore).toBe(20)
  })

  it('counts T20 and D20 as hits on target 20 (segment match)', () => {
    const { engine } = createTrainingSession('hundred-darts')

    const result1 = engine.throw(T20)
    expect(result1.events).toContain('target_hit')
    expect((engine.state as HundredDartsState).hits).toBe(1)
    expect((engine.state as HundredDartsState).totalScore).toBe(60)

    const result2 = engine.throw(D20)
    expect(result2.events).toContain('target_hit')
    expect((engine.state as HundredDartsState).hits).toBe(2)
    expect((engine.state as HundredDartsState).totalScore).toBe(100) // 60+40
  })

  it('counts a miss when segment does not match', () => {
    const { engine } = createTrainingSession('hundred-darts')
    const result = engine.throw(S19)
    expect(result.events).toContain('target_missed')
    const s = engine.state as HundredDartsState
    expect(s.hits).toBe(0)
    expect(s.dartsThrown).toBe(1)
    expect(s.totalScore).toBe(19)
  })

  it('MISS scores 0 and is a miss', () => {
    const { engine } = createTrainingSession('hundred-darts')
    const result = engine.throw(MISS)
    expect(result.events).toContain('target_missed')
    expect((engine.state as HundredDartsState).totalScore).toBe(0)
  })

  it('custom target segment counts correctly', () => {
    const { engine } = createTrainingSession('hundred-darts', { targetSegment: 5 })
    // S5 hits target 5
    const result = engine.throw(S5)
    expect(result.events).toContain('target_hit')
    expect((engine.state as HundredDartsState).hits).toBe(1)

    // S20 misses target 5
    const result2 = engine.throw(S20)
    expect(result2.events).toContain('target_missed')
    expect((engine.state as HundredDartsState).hits).toBe(1)
  })
})

// ── Completion ──

describe('hundred-darts completion', () => {
  it('session_complete after 100 darts', () => {
    const { engine } = createTrainingSession('hundred-darts')

    // Throw 99 misses
    trainingMisses(engine, 99)
    expect(engine.state!.isComplete).toBe(false)
    expect((engine.state as HundredDartsState).dartsThrown).toBe(99)

    // 100th dart
    const result = engine.throw(S20)
    expect(result.events).toContain('session_complete')
    expect(engine.state!.isComplete).toBe(true)
    expect(engine.state!.completedAt).not.toBeNull()
    expect((engine.state as HundredDartsState).dartsThrown).toBe(100)
  })

  it('does not process throws after completion', () => {
    const { engine } = createTrainingSession('hundred-darts')
    trainingMisses(engine, 100)
    expect(engine.state!.isComplete).toBe(true)

    const result = engine.throw(S20)
    expect(result.events).toEqual([])
    expect((engine.state as HundredDartsState).dartsThrown).toBe(100)
  })
})

// ── Undo ──

describe('hundred-darts undo', () => {
  it('re-derives hits and totalScore after undo', () => {
    const { engine } = createTrainingSession('hundred-darts')

    engine.throw(S20) // hit, +20
    engine.throw(S19) // miss, +19
    engine.throw(T20) // hit, +60

    expect((engine.state as HundredDartsState).hits).toBe(2)
    expect((engine.state as HundredDartsState).totalScore).toBe(99)
    expect((engine.state as HundredDartsState).dartsThrown).toBe(3)

    // Undo the T20
    engine.undo()
    const s = engine.state as HundredDartsState
    expect(s.hits).toBe(1)
    expect(s.totalScore).toBe(39) // 20+19
    expect(s.dartsThrown).toBe(2)
  })

  it('undo un-completes a completed session', () => {
    const { engine } = createTrainingSession('hundred-darts')
    trainingMisses(engine, 100)
    expect(engine.state!.isComplete).toBe(true)

    engine.undo()
    expect(engine.state!.isComplete).toBe(false)
    expect((engine.state as HundredDartsState).dartsThrown).toBe(99)
  })

  it('undo with no throws does nothing', () => {
    const { engine } = createTrainingSession('hundred-darts')
    const state = engine.undo()
    expect(state.throws).toHaveLength(0)
    expect((state as HundredDartsState).dartsThrown).toBe(0)
  })
})

// ── Stats ──

describe('hundred-darts stats', () => {
  it('computes hits, hitRate, totalScore', () => {
    const { engine } = createTrainingSession('hundred-darts')

    // 3 hits (S20, T20, D20) + 2 misses (S1, MISS)
    trainingThrow(engine, [S20, T20, D20, S1, MISS])

    const stats = engine.getStats()!
    expect(stats.mode).toBe('hundred-darts')
    expect(stats.totalDarts).toBe(5)
    expect(stats.hits).toBe(3)
    // hitRate = (3/5)*100 = 60
    expect(stats.hitRate).toBe(60)
    // totalScore = 20 + 60 + 40 + 1 + 0 = 121
    expect(stats.totalScore).toBe(121)
    expect(stats.targetSegment).toBe(20)
  })

  it('stats with no throws', () => {
    const { engine } = createTrainingSession('hundred-darts')
    const stats = engine.getStats()!
    expect(stats.hits).toBe(0)
    expect(stats.hitRate).toBe(0)
    expect(stats.totalScore).toBe(0)
  })
})
