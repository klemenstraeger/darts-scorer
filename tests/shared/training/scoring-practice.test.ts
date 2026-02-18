import { describe, it, expect } from 'vitest'
import { scoringPracticeStrategy } from '../../../shared/training/modes/scoring-practice'
import type { ScoringPracticeState } from '../../../shared/training/training-models'
import { createTrainingSession, trainingThrow, trainingMisses } from '../../helpers/training'
import { T20, S20, S1, T19, S5, D20, MISS } from '../../helpers/darts'

// ── Direct Strategy Tests ──

describe('scoringPracticeStrategy.createInitialState', () => {
  it('defaults to 10 rounds with threshold 60', () => {
    const state = scoringPracticeStrategy.createInitialState({ mode: 'scoring-practice' })
    expect(state.mode).toBe('scoring-practice')
    expect(state.totalRounds).toBe(10)
    expect(state.threshold).toBe(60)
    expect(state.currentRound).toBe(1)
    expect(state.currentRoundThrows).toBe(0)
    expect(state.roundScores).toEqual([])
    expect(state.throws).toEqual([])
    expect(state.isComplete).toBe(false)
    expect(state.completedAt).toBeNull()
  })

  it('accepts custom rounds and targetScore', () => {
    const state = scoringPracticeStrategy.createInitialState({
      mode: 'scoring-practice',
      rounds: 5,
      targetScore: 100,
    })
    expect(state.totalRounds).toBe(5)
    expect(state.threshold).toBe(100)
  })
})

// ── Engine Integration Tests ──

describe('scoring-practice via TrainingEngine', () => {
  it('increments currentRoundThrows on each dart', () => {
    const { engine, state } = createTrainingSession('scoring-practice')
    expect(state.currentRoundThrows).toBe(0)

    engine.throw(T20)
    expect((engine.state as ScoringPracticeState).currentRoundThrows).toBe(1)

    engine.throw(S20)
    expect((engine.state as ScoringPracticeState).currentRoundThrows).toBe(2)
  })

  it('emits round_complete after 3 darts and calculates round score', () => {
    const { engine } = createTrainingSession('scoring-practice')

    // Throw T20 (60) + S20 (20) + S1 (1) = 81
    engine.throw(T20)
    engine.throw(S20)
    const result = engine.throw(S1)

    expect(result.events).toContain('round_complete')
    const s = engine.state as ScoringPracticeState
    expect(s.roundScores).toEqual([81])
    expect(s.currentRound).toBe(2)
    expect(s.currentRoundThrows).toBe(0)
  })

  it('completes session after all rounds', () => {
    const { engine } = createTrainingSession('scoring-practice', { rounds: 2 })

    // Round 1: 3 misses = 0
    trainingMisses(engine, 3)
    expect((engine.state as ScoringPracticeState).currentRound).toBe(2)

    // Round 2: 3 misses = 0
    const results = trainingMisses(engine, 3)
    const lastResult = results[results.length - 1]!

    expect(lastResult.events).toContain('round_complete')
    expect(lastResult.events).toContain('session_complete')
    expect(engine.state!.isComplete).toBe(true)
    expect(engine.state!.completedAt).not.toBeNull()
  })

  it('does not process throws after completion', () => {
    const { engine } = createTrainingSession('scoring-practice', { rounds: 1 })

    // Complete the single round
    trainingThrow(engine, [T20, T20, T20])
    expect(engine.state!.isComplete).toBe(true)

    // Additional throw should be ignored
    const result = engine.throw(S1)
    expect(result.events).toEqual([])
    expect((engine.state as ScoringPracticeState).throws).toHaveLength(3)
  })

  it('undo decrements mid-round throw count', () => {
    const { engine } = createTrainingSession('scoring-practice')

    engine.throw(T20)
    engine.throw(S20)
    expect((engine.state as ScoringPracticeState).currentRoundThrows).toBe(2)

    engine.undo()
    const s = engine.state as ScoringPracticeState
    expect(s.currentRoundThrows).toBe(1)
    expect(s.throws).toHaveLength(1)
  })

  it('undo goes back to previous round after round completion', () => {
    const { engine } = createTrainingSession('scoring-practice', { rounds: 3 })

    // Complete round 1
    trainingThrow(engine, [T20, S20, S1])
    expect((engine.state as ScoringPracticeState).currentRound).toBe(2)
    expect((engine.state as ScoringPracticeState).roundScores).toHaveLength(1)

    // Undo last dart of round 1
    engine.undo()
    const s = engine.state as ScoringPracticeState
    expect(s.currentRound).toBe(1)
    expect(s.currentRoundThrows).toBe(2)
    expect(s.roundScores).toHaveLength(0)
  })

  it('undo un-completes a completed session', () => {
    const { engine } = createTrainingSession('scoring-practice', { rounds: 1 })

    trainingThrow(engine, [T20, T20, T20])
    expect(engine.state!.isComplete).toBe(true)

    engine.undo()
    expect(engine.state!.isComplete).toBe(false)
    expect(engine.state!.completedAt).toBeNull()
  })

  it('computes stats correctly', () => {
    const { engine } = createTrainingSession('scoring-practice', {
      rounds: 3,
      targetScore: 60,
    })

    // Round 1: T20 + T20 + T20 = 180
    trainingThrow(engine, [T20, T20, T20])
    // Round 2: S1 + S1 + S1 = 3
    trainingThrow(engine, [S1, S1, S1])
    // Round 3: T19 + S20 + S5 = 57+20+5 = 82
    trainingThrow(engine, [T19, S20, S5])

    const stats = engine.getStats()!
    expect(stats.mode).toBe('scoring-practice')
    expect(stats.totalDarts).toBe(9)
    expect(stats.completedRounds).toBe(3)
    // average = (180+3+82)/3 = 88.333... => rounded to 88.3
    expect(stats.average).toBe(88.3)
    expect(stats.bestRound).toBe(180)
    expect(stats.totalScore).toBe(265)
    // Rounds >= 60: 180 and 82 => 2
    expect(stats.aboveThreshold).toBe(2)
    expect(stats.threshold).toBe(60)
  })

  it('stats with no rounds completed', () => {
    const { engine } = createTrainingSession('scoring-practice')
    const stats = engine.getStats()!
    expect(stats.average).toBe(0)
    expect(stats.bestRound).toBe(0)
    expect(stats.completedRounds).toBe(0)
  })
})
