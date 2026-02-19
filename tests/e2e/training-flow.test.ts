import type { AroundTheClockState, Bobs27State, CheckoutPracticeState, ScoringPracticeState } from '../../shared/training/training-models'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TrainingEngine } from '../../shared/training/training-engine'
import {
  D1,
  D20,
  D25,
  S1,
  S5,
  S20,
  S25,
  T1,
  T20,
} from '../helpers/darts'
import { createTrainingSession, trainingMisses, trainingThrow } from '../helpers/training'

afterEach(() => {
  vi.restoreAllMocks()
})

// ── Scoring Practice ──

describe('scoring Practice: 3-round session', () => {
  it('completes 3 rounds and produces correct stats', () => {
    const { engine } = createTrainingSession('scoring-practice', { rounds: 3 })

    // Round 1: T20 + T20 + T20 = 180
    trainingThrow(engine, [T20, T20, T20])
    // Round 2: S20 + S20 + S20 = 60
    trainingThrow(engine, [S20, S20, S20])
    // Round 3: S1 + S1 + S1 = 3
    const results = trainingThrow(engine, [S1, S1, S1])

    expect(engine.state!.isComplete).toBe(true)
    expect(results[2]!.events).toContain('session_complete')

    const stats = engine.getStats()!
    expect(stats.mode).toBe('scoring-practice')
    expect(stats.totalDarts).toBe(9)
    expect(stats.completedRounds).toBe(3)
    expect(stats.totalScore).toBe(243) // 180 + 60 + 3
    expect(stats.bestRound).toBe(180)
    expect(stats.average).toBe(81) // 243/3
  })
})

// ── Around the Clock ──

describe('around the Clock: complete singles run', () => {
  it('completes all 21 targets', () => {
    const { engine } = createTrainingSession('around-the-clock', { variant: 'singles' })
    const _state = engine.state as AroundTheClockState

    // Hit targets 1 through 20
    for (let i = 1; i <= 20; i++) {
      const result = engine.throw({ segment: i, multiplier: 1 })
      if (i < 20) {
        expect(result.events).toContain('target_hit')
      }
    }

    // Hit bull (25)
    const finalResult = engine.throw(S25)
    expect(finalResult.events).toContain('target_hit')
    expect(finalResult.events).toContain('session_complete')
    expect(engine.state!.isComplete).toBe(true)

    const stats = engine.getStats()!
    expect(stats.targetsHit).toBe(21)
    expect(stats.completionRate).toBe(100)
    expect(stats.dartsPerTarget).toBe(1)
  })
})

// ── Bob's 27 ──

describe('bobs 27: failure scenario', () => {
  it('fails when score drops below 0', () => {
    const { engine } = createTrainingSession('bobs-27')

    // Round 1 (target D1, value=2): miss all 3 → score = 27 - 2 = 25
    trainingMisses(engine, 3)
    expect((engine.state as Bobs27State).score).toBe(25)

    // Round 2 (target D2, value=4): miss all 3 → score = 25 - 4 = 21
    trainingMisses(engine, 3)
    expect((engine.state as Bobs27State).score).toBe(21)

    // Round 3 (target D3, value=6): miss → 21 - 6 = 15
    trainingMisses(engine, 3)
    // Round 4 (target D4, value=8): miss → 15 - 8 = 7
    trainingMisses(engine, 3)
    // Round 5 (target D5, value=10): miss → 7 - 10 = -3 < 0
    const results = trainingMisses(engine, 3)

    const state = engine.state as Bobs27State
    expect(state.isFailed).toBe(true)
    expect(state.isComplete).toBe(true)
    expect(state.score).toBeLessThan(0)
    expect(results[2]!.events).toContain('failed')
    expect(results[2]!.events).toContain('session_complete')
  })
})

describe('bobs 27: completion scenario', () => {
  it('completes all 21 rounds with hits', () => {
    const { engine } = createTrainingSession('bobs-27')

    // Hit every double once per round
    for (let round = 1; round <= 20; round++) {
      // Hit the target double, then 2 misses
      engine.throw({ segment: round, multiplier: 2 })
      trainingMisses(engine, 2)
    }
    // Round 21 = DBull (segment 25)
    engine.throw(D25)
    const _results = trainingMisses(engine, 2)

    const state = engine.state as Bobs27State
    expect(state.isComplete).toBe(true)
    expect(state.isFailed).toBe(false)
    // Score = 27 + sum of all doubleValues: D1(2)+D2(4)+...+D20(40)+DBull(50)
    // Sum of D1..D20 = 2*(1+2+...+20) = 2*210 = 420; DBull = 50; total adds = 470
    // Final = 27 + 470 = 497
    expect(state.score).toBe(497)

    const stats = engine.getStats()!
    expect(stats.doublesHit).toBe(21)
    expect(stats.isFailed).toBe(false)
  })
})

// ── Cricket ──

describe('cricket: close all targets', () => {
  it('completes by closing all 7 targets with trebles', () => {
    const { engine } = createTrainingSession('cricket')

    // Close each target with a treble (3 marks at once)
    const targets = [15, 16, 17, 18, 19, 20]
    for (const seg of targets) {
      engine.throw({ segment: seg, multiplier: 3 })
    }

    // Close bull: need 3 marks. S25 + D25 = 1 + 2 = 3
    engine.throw(S25)
    const result = engine.throw(D25)

    expect(result.events).toContain('session_complete')
    expect(engine.state!.isComplete).toBe(true)

    const stats = engine.getStats()!
    expect(stats.targetsClosed).toBe(7)
  })
})

// ── 100 Darts ──

describe('100 Darts: full session', () => {
  it('completes after exactly 100 darts', () => {
    const { engine } = createTrainingSession('hundred-darts', { targetSegment: 20 })

    // Throw 99 darts at the target
    for (let i = 0; i < 99; i++) {
      engine.throw(S20)
    }
    expect(engine.state!.isComplete).toBe(false)

    // 100th dart completes it
    const result = engine.throw(S20)
    expect(result.events).toContain('session_complete')
    expect(engine.state!.isComplete).toBe(true)

    const stats = engine.getStats()!
    expect(stats.totalDarts).toBe(100)
    expect(stats.hits).toBe(100)
    expect(stats.hitRate).toBe(100)
    expect(stats.totalScore).toBe(2000) // 100 * 20
  })
})

// ── Shanghai ──

describe('shanghai: 20 rounds with shanghai bonus', () => {
  it('detects shanghai in round 1 and completes all rounds', () => {
    const { engine } = createTrainingSession('shanghai')

    // Round 1: S1 + D1 + T1 = 1 + 2 + 3 = 6 → shanghai!
    const r1Results = trainingThrow(engine, [S1, D1, T1])
    expect(r1Results[2]!.events).toContain('shanghai')
    expect(r1Results[2]!.events).toContain('round_complete')

    // Rounds 2-20: throw misses (0 score per round)
    for (let round = 2; round <= 20; round++) {
      trainingMisses(engine, 3)
    }

    expect(engine.state!.isComplete).toBe(true)

    const stats = engine.getStats()!
    expect(stats.shanghaiCount).toBe(1)
    expect(stats.totalScore).toBe(6)
    expect(stats.completedRounds).toBe(20)
  })
})

// ── Checkout Practice ──

describe('checkout Practice: mix of successes and busts', () => {
  it('tracks successes and failures correctly', () => {
    // Mock random to always return 0 → target = 40
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const { engine } = createTrainingSession('checkout-practice', { rounds: 3 })
    const state = engine.state as CheckoutPracticeState
    expect(state.currentTarget).toBe(40)

    // Attempt 1: checkout 40 → D20 (success)
    const success = engine.throw(D20)
    expect(success.events).toContain('target_hit')

    // Attempt 2: bust (throw T20=60, which is > 40)
    const bust = engine.throw(T20)
    expect(bust.events).toContain('target_missed')

    // Attempt 3: checkout D20 again (success)
    const success2 = engine.throw(D20)
    expect(success2.events).toContain('target_hit')
    expect(success2.events).toContain('session_complete')

    const stats = engine.getStats()!
    expect(stats.attempts).toBe(3)
    expect(stats.successes).toBe(2)
    expect(stats.successRate).toBe(67) // Math.round(2/3 * 100)
  })
})

// ── Undo-Redo Consistency ──

describe('undo-redo consistency', () => {
  it('maintains correct state through undo and re-throw', () => {
    const { engine } = createTrainingSession('scoring-practice', { rounds: 5 })

    // Throw 4 darts: T20, T20, T20 (round complete), S1
    trainingThrow(engine, [T20, T20, T20, S1])
    const state = engine.state as ScoringPracticeState
    expect(state.currentRound).toBe(2)
    expect(state.currentRoundThrows).toBe(1)
    expect(state.roundScores).toHaveLength(1)
    expect(state.roundScores[0]).toBe(180)
    expect(state.throws).toHaveLength(4)

    // Undo 2 throws
    engine.undo()
    engine.undo()

    const afterUndo = engine.state as ScoringPracticeState
    expect(afterUndo.throws).toHaveLength(2)
    expect(afterUndo.currentRound).toBe(1)
    expect(afterUndo.currentRoundThrows).toBe(2)
    expect(afterUndo.roundScores).toHaveLength(0)

    // Re-throw 2 darts to complete round 1 and start round 2
    trainingThrow(engine, [S20, S5])

    const afterRethrow = engine.state as ScoringPracticeState
    expect(afterRethrow.throws).toHaveLength(4)
    expect(afterRethrow.currentRound).toBe(2)
    expect(afterRethrow.currentRoundThrows).toBe(1)
    // Round 1 score: T20(60) + T20(60) + S20(20) = 140
    expect(afterRethrow.roundScores).toHaveLength(1)
    expect(afterRethrow.roundScores[0]).toBe(140)
  })
})

// ── Session Hydration ──

describe('session hydration across engine restart', () => {
  it('continues session from serialized state', () => {
    const { engine: engine1 } = createTrainingSession('scoring-practice', { rounds: 3 })

    // Throw 3 darts in first engine (round 1)
    trainingThrow(engine1, [T20, T20, T20])
    expect((engine1.state as ScoringPracticeState).currentRound).toBe(2)

    // Serialize and rehydrate
    const serialized = JSON.parse(JSON.stringify(engine1.state!))
    const engine2 = new TrainingEngine(serialized)

    expect(engine2.state!.mode).toBe('scoring-practice')
    expect((engine2.state as ScoringPracticeState).currentRound).toBe(2)
    expect(engine2.state!.throws).toHaveLength(3)

    // Continue throwing in rehydrated engine
    trainingThrow(engine2, [S20, S20, S20])
    expect((engine2.state as ScoringPracticeState).currentRound).toBe(3)

    trainingThrow(engine2, [S1, S1, S1])
    expect(engine2.state!.isComplete).toBe(true)

    const stats = engine2.getStats()!
    expect(stats.completedRounds).toBe(3)
    expect(stats.totalScore).toBe(243) // 180 + 60 + 3
  })
})
