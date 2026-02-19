import type { TrainingMode } from '../../shared/training/training-models'
import { describe, expect, it } from 'vitest'
import { TrainingEngine } from '../../shared/training/training-engine'
import { S20, T20 } from '../helpers/darts'
import { createTrainingSession } from '../helpers/training'

// ── Construction ──

describe('construction', () => {
  it('starts with null state when constructed empty', () => {
    const engine = new TrainingEngine()
    expect(engine.state).toBeNull()
  })

  it('hydrates from existing state', () => {
    const { engine, state } = createTrainingSession('scoring-practice')
    const engine2 = new TrainingEngine(state)
    expect(engine2.state).not.toBeNull()
    expect(engine2.state!.mode).toBe('scoring-practice')
    expect(engine2.state!.isComplete).toBe(false)
    expect(engine2.state!.throws).toEqual(engine.state!.throws)
  })

  it('hydrated engine can continue throwing', () => {
    const { state } = createTrainingSession('scoring-practice')
    const engine2 = new TrainingEngine(state)
    const result = engine2.throw(S20)
    expect(result.state.throws).toHaveLength(1)
    expect(result.state.throws[0]!.segment).toBe(20)
  })
})

// ── newSession ──

describe('newSession', () => {
  const allModes: TrainingMode[] = [
    'scoring-practice',
    'around-the-clock',
    'bobs-27',
    'hundred-darts',
    'cricket',
    'checkout-practice',
    'shanghai',
  ]

  it.each(allModes)('creates session for mode: %s', (mode) => {
    const engine = new TrainingEngine()
    const state = engine.newSession({ mode })
    expect(state.mode).toBe(mode)
    expect(state.isComplete).toBe(false)
    expect(state.throws).toEqual([])
  })
})

// ── throw ──

describe('throw', () => {
  it('throws error when no active session', () => {
    const engine = new TrainingEngine()
    expect(() => engine.throw(S20)).toThrow('No active training session')
  })

  it('returns early when session is complete', () => {
    const { engine } = createTrainingSession('scoring-practice')
    engine.state!.isComplete = true
    const result = engine.throw(S20)
    expect(result.events).toEqual([])
    expect(result.state.isComplete).toBe(true)
  })

  it('records throw in state.throws', () => {
    const { engine } = createTrainingSession('scoring-practice')
    expect(engine.state!.throws).toHaveLength(0)
    engine.throw(T20)
    expect(engine.state!.throws).toHaveLength(1)
    expect(engine.state!.throws[0]!.segment).toBe(20)
    expect(engine.state!.throws[0]!.multiplier).toBe(3)
    expect(engine.state!.throws[0]!.points).toBe(60)
  })
})

// ── undo ──

describe('undo', () => {
  it('throws error when no active session', () => {
    const engine = new TrainingEngine()
    expect(() => engine.undo()).toThrow('No active training session')
  })

  it('returns state unchanged on empty throws', () => {
    const { engine, state } = createTrainingSession('scoring-practice')
    const result = engine.undo()
    expect(result.throws).toHaveLength(0)
    expect(result.mode).toBe(state.mode)
  })

  it('removes last throw', () => {
    const { engine } = createTrainingSession('scoring-practice')
    engine.throw(S20)
    engine.throw(T20)
    expect(engine.state!.throws).toHaveLength(2)
    engine.undo()
    expect(engine.state!.throws).toHaveLength(1)
    expect(engine.state!.throws[0]!.segment).toBe(20)
    expect(engine.state!.throws[0]!.multiplier).toBe(1)
  })

  it('un-completes a completed session', () => {
    const { engine } = createTrainingSession('scoring-practice')
    engine.throw(S20)
    // Manually mark as complete
    engine.state!.isComplete = true
    engine.state!.completedAt = new Date().toISOString()

    const result = engine.undo()
    expect(result.isComplete).toBe(false)
    expect(result.completedAt).toBeNull()
  })
})

// ── manualScore / getStats / stopSession ──

describe('manualScore / getStats / stopSession', () => {
  it('manualScore(20, 1) delegates to throw correctly', () => {
    const { engine } = createTrainingSession('scoring-practice')
    const result = engine.manualScore(20, 1)
    expect(result.state.throws).toHaveLength(1)
    expect(result.state.throws[0]!.segment).toBe(20)
    expect(result.state.throws[0]!.multiplier).toBe(1)
    expect(result.state.throws[0]!.points).toBe(20)
  })

  it('getStats returns null with no session', () => {
    const engine = new TrainingEngine()
    expect(engine.getStats()).toBeNull()
  })

  it('getStats returns stats object during active session', () => {
    const { engine } = createTrainingSession('scoring-practice')
    engine.throw(S20)
    const stats = engine.getStats()
    expect(stats).not.toBeNull()
    expect(stats!.mode).toBe('scoring-practice')
    expect(typeof stats!.totalDarts).toBe('number')
  })

  it('stopSession resets state to null', () => {
    const { engine } = createTrainingSession('scoring-practice')
    engine.throw(S20)
    engine.stopSession()
    expect(engine.state).toBeNull()
  })
})
