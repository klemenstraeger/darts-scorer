import type { CricketState } from '../../../shared/training/training-models'
import { describe, expect, it } from 'vitest'
import { D15, MISS, S1, S15, S16, S17, T15, T16, T17, T18, T19, T20, T25 } from '../../helpers/darts'
import { createTrainingSession, trainingThrow } from '../../helpers/training'

function cricketState(engine: { state: unknown }): CricketState {
  return engine.state as CricketState
}

// ── Initial State ──

describe('initial state', () => {
  it('has correct targets and zero marks', () => {
    const { state } = createTrainingSession('cricket')
    const s = state as CricketState
    expect(s.targets).toEqual([15, 16, 17, 18, 19, 20, 25])
    expect(s.marks).toEqual({ 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 25: 0 })
    expect(s.totalDarts).toBe(0)
    expect(s.isComplete).toBe(false)
  })
})

// ── Marking ──

describe('marking', () => {
  it('single adds 1 mark and emits target_hit', () => {
    const { engine } = createTrainingSession('cricket')
    const [result] = trainingThrow(engine, [S15])
    expect(result.events).toContain('target_hit')
    expect(cricketState(engine).marks[15]).toBe(1)
  })

  it('double adds 2 marks', () => {
    const { engine } = createTrainingSession('cricket')
    trainingThrow(engine, [D15])
    expect(cricketState(engine).marks[15]).toBe(2)
  })

  it('triple adds 3 marks and closes the target', () => {
    const { engine } = createTrainingSession('cricket')
    trainingThrow(engine, [T15])
    expect(cricketState(engine).marks[15]).toBe(3)
  })

  it('marks cap at 3 (double on 2 marks stays at 3)', () => {
    const { engine } = createTrainingSession('cricket')
    trainingThrow(engine, [D15]) // 2 marks
    trainingThrow(engine, [D15]) // would be +2 but caps at 3
    expect(cricketState(engine).marks[15]).toBe(3)
  })

  it('already-closed target emits target_missed', () => {
    const { engine } = createTrainingSession('cricket')
    trainingThrow(engine, [T15]) // close 15
    const [result] = trainingThrow(engine, [S15])
    expect(result.events).toContain('target_missed')
    expect(cricketState(engine).marks[15]).toBe(3) // unchanged
  })

  it('non-cricket segment emits target_missed', () => {
    const { engine } = createTrainingSession('cricket')
    const [result] = trainingThrow(engine, [S1])
    expect(result.events).toContain('target_missed')
  })

  it('miss emits target_missed', () => {
    const { engine } = createTrainingSession('cricket')
    const [result] = trainingThrow(engine, [MISS])
    expect(result.events).toContain('target_missed')
  })

  it('totalDarts increments with each throw', () => {
    const { engine } = createTrainingSession('cricket')
    trainingThrow(engine, [S15, S16, MISS])
    expect(cricketState(engine).totalDarts).toBe(3)
  })
})

// ── Completion ──

describe('completion', () => {
  it('all 7 targets closed emits session_complete', () => {
    const { engine } = createTrainingSession('cricket')
    // Close all 7 with triples
    const results = trainingThrow(engine, [T15, T16, T17, T18, T19, T20, T25])
    const lastResult = results[results.length - 1]
    expect(lastResult.events).toContain('session_complete')
    expect(cricketState(engine).isComplete).toBe(true)
  })

  it('not complete with 6 of 7 closed', () => {
    const { engine } = createTrainingSession('cricket')
    trainingThrow(engine, [T15, T16, T17, T18, T19, T20])
    expect(cricketState(engine).isComplete).toBe(false)
  })

  it('throws after completion are no-ops', () => {
    const { engine } = createTrainingSession('cricket')
    trainingThrow(engine, [T15, T16, T17, T18, T19, T20, T25])
    const result = engine.throw(S15)
    expect(result.events).toEqual([])
    expect(cricketState(engine).totalDarts).toBe(7)
  })
})

// ── Undo ──

describe('undo', () => {
  it('re-derives marks after undo', () => {
    const { engine } = createTrainingSession('cricket')
    trainingThrow(engine, [S15, D15]) // marks[15] = 3
    expect(cricketState(engine).marks[15]).toBe(3)
    engine.undo() // remove D15 → marks[15] should be 1
    expect(cricketState(engine).marks[15]).toBe(1)
    expect(cricketState(engine).totalDarts).toBe(1)
  })

  it('undo restores isComplete to false', () => {
    const { engine } = createTrainingSession('cricket')
    trainingThrow(engine, [T15, T16, T17, T18, T19, T20, T25])
    expect(cricketState(engine).isComplete).toBe(true)
    engine.undo() // remove T25 → bull no longer closed
    expect(cricketState(engine).isComplete).toBe(false)
    expect(cricketState(engine).marks[25]).toBe(0)
  })

  it('undo on empty session is safe', () => {
    const { engine } = createTrainingSession('cricket')
    const state = engine.undo()
    expect(state.throws).toHaveLength(0)
  })
})

// ── Stats ──

describe('stats', () => {
  it('computes targetsClosed, totalMarks, dartsPerClose', () => {
    const { engine } = createTrainingSession('cricket')
    trainingThrow(engine, [T15, T16, S17]) // 2 closed, 7 total marks (3+3+1)
    const stats = engine.getStats()!
    expect(stats.mode).toBe('cricket')
    expect(stats.targetsClosed).toBe(2)
    expect(stats.targetsTotal).toBe(7)
    expect(stats.totalMarks).toBe(7)
    expect(stats.totalDarts).toBe(3)
    // dartsPerClose = round(3/2 * 10) / 10 = 1.5
    expect(stats.dartsPerClose).toBe(1.5)
  })

  it('dartsPerClose is 0 when nothing closed', () => {
    const { engine } = createTrainingSession('cricket')
    trainingThrow(engine, [S15])
    const stats = engine.getStats()!
    expect(stats.dartsPerClose).toBe(0)
  })

  it('stats reflect full completion', () => {
    const { engine } = createTrainingSession('cricket')
    trainingThrow(engine, [T15, T16, T17, T18, T19, T20, T25])
    const stats = engine.getStats()!
    expect(stats.targetsClosed).toBe(7)
    expect(stats.totalMarks).toBe(21)
    expect(stats.dartsPerClose).toBe(1)
  })
})
