import type { Bobs27State } from '../../../shared/training/training-models'
import { describe, expect, it } from 'vitest'
import { bobs27Strategy } from '../../../shared/training/modes/bobs-27'
import { D1, D2, D3, D5, D25, MISS, S1 } from '../../helpers/darts'
import { createTrainingSession, trainingMisses, trainingThrow } from '../../helpers/training'

// ── Direct Strategy Tests ──

describe('bobs27Strategy.createInitialState', () => {
  it('starts with score 27, round 1, 21 rounds, all null results', () => {
    const state = bobs27Strategy.createInitialState({ mode: 'bobs-27' })
    expect(state.mode).toBe('bobs-27')
    expect(state.score).toBe(27)
    expect(state.currentRound).toBe(1)
    expect(state.totalRounds).toBe(21)
    expect(state.roundResults).toHaveLength(21)
    expect(state.roundResults.every(r => r === null)).toBe(true)
    expect(state.currentRoundHits).toBe(0)
    expect(state.currentRoundThrows).toBe(0)
    expect(state.isFailed).toBe(false)
    expect(state.isComplete).toBe(false)
  })
})

// ── Hitting Doubles ──

describe('bobs-27 hitting doubles', () => {
  it('d1 in round 1 adds 2 and emits target_hit', () => {
    const { engine } = createTrainingSession('bobs-27')

    const result = engine.throw(D1)
    expect(result.events).toContain('target_hit')
    // Score: 27 + D1 value (1*2=2) = 29
    expect((engine.state as Bobs27State).score).toBe(29)
    expect((engine.state as Bobs27State).currentRoundHits).toBe(1)
  })

  it('multiple D1 hits in round 1 stack', () => {
    const { engine } = createTrainingSession('bobs-27')

    engine.throw(D1) // +2 = 29
    engine.throw(D1) // +2 = 31
    const result = engine.throw(D1) // +2 = 33, round complete

    expect(result.events).toContain('round_complete')
    expect((engine.state as Bobs27State).score).toBe(33)
    expect((engine.state as Bobs27State).roundResults[0]).toBe('hit')
  })

  it('d5 in round 1 is a miss (wrong double)', () => {
    const { engine } = createTrainingSession('bobs-27')

    const result = engine.throw(D5)
    expect(result.events).toContain('target_missed')
    expect((engine.state as Bobs27State).currentRoundHits).toBe(0)
  })

  it('s1 in round 1 is a miss (not a double)', () => {
    const { engine } = createTrainingSession('bobs-27')

    const result = engine.throw(S1)
    expect(result.events).toContain('target_missed')
  })
})

// ── Missing All 3 Darts ──

describe('bobs-27 missing round', () => {
  it('3 misses subtract the double value and result is miss', () => {
    const { engine } = createTrainingSession('bobs-27')

    // Round 1: miss all 3 => subtract D1 value (2)
    trainingMisses(engine, 3)
    const s = engine.state as Bobs27State
    expect(s.score).toBe(25) // 27 - 2
    expect(s.roundResults[0]).toBe('miss')
    expect(s.currentRound).toBe(2)
  })

  it('3 wrong doubles also count as misses', () => {
    const { engine } = createTrainingSession('bobs-27')

    // Round 1 target is D1, throwing D5 three times
    trainingThrow(engine, [D5, D5, D5])
    const s = engine.state as Bobs27State
    expect(s.score).toBe(25) // 27 - 2
    expect(s.roundResults[0]).toBe('miss')
  })
})

// ── Round Progression ──

describe('bobs-27 round progression', () => {
  it('advances after 3 darts per round', () => {
    const { engine } = createTrainingSession('bobs-27')

    // Round 1: 3 misses
    trainingMisses(engine, 3)
    expect((engine.state as Bobs27State).currentRound).toBe(2)
    expect((engine.state as Bobs27State).currentRoundThrows).toBe(0)

    // Round 2: 3 misses
    trainingMisses(engine, 3)
    expect((engine.state as Bobs27State).currentRound).toBe(3)
  })

  it('targets go D1 -> D2 -> ... -> D20 -> DBull', () => {
    const { engine } = createTrainingSession('bobs-27')

    // Round 1: hit D1
    trainingThrow(engine, [D1, MISS, MISS])
    expect((engine.state as Bobs27State).currentRound).toBe(2)

    // Round 2: hit D2
    trainingThrow(engine, [D2, MISS, MISS])
    expect((engine.state as Bobs27State).currentRound).toBe(3)

    // Round 3: hit D3
    trainingThrow(engine, [D3, MISS, MISS])
    expect((engine.state as Bobs27State).currentRound).toBe(4)
  })

  it('round 21 targets DBull (D25)', () => {
    const { engine } = createTrainingSession('bobs-27')

    // Skip to round 21 by missing all rounds 1-20 (60 darts)
    // We need to avoid going below 0.
    // Hit D1 through D20 to stay above 0, then test round 21.
    for (let r = 1; r <= 20; r++) {
      const double = { segment: r, multiplier: 2 as const }
      engine.throw(double)
      trainingMisses(engine, 2)
    }
    expect((engine.state as Bobs27State).currentRound).toBe(21)

    // Round 21: D25 (double bull) should be a hit
    const result = engine.throw(D25)
    expect(result.events).toContain('target_hit')
  })
})

// ── Failure ──

describe('bobs-27 failure', () => {
  it('score < 0 triggers isFailed and session_complete', () => {
    const { engine } = createTrainingSession('bobs-27')

    // Round 1: miss all -> 27 - 2 = 25
    trainingMisses(engine, 3)
    // Round 2: miss all -> 25 - 4 = 21
    trainingMisses(engine, 3)
    // Round 3: miss all -> 21 - 6 = 15
    trainingMisses(engine, 3)
    // Round 4: miss all -> 15 - 8 = 7
    trainingMisses(engine, 3)
    // Round 5: miss all -> 7 - 10 = -3 => FAILED
    const results = trainingMisses(engine, 3)
    const lastResult = results[results.length - 1]!

    expect(lastResult.events).toContain('failed')
    expect(lastResult.events).toContain('session_complete')
    const s = engine.state as Bobs27State
    expect(s.isFailed).toBe(true)
    expect(s.isComplete).toBe(true)
    expect(s.score).toBeLessThan(0)
  })

  it('does not process throws after failure', () => {
    const { engine } = createTrainingSession('bobs-27')

    // Fail quickly
    for (let i = 0; i < 5; i++) {
      trainingMisses(engine, 3)
      if (engine.state!.isComplete)
        break
    }
    expect(engine.state!.isComplete).toBe(true)

    const result = engine.throw(D1)
    expect(result.events).toEqual([])
  })
})

// ── Successful Completion ──

describe('bobs-27 completion', () => {
  it('all 21 rounds without failure triggers session_complete with isFailed=false', () => {
    const { engine } = createTrainingSession('bobs-27')

    // Hit one double per round for all 21 rounds
    for (let r = 1; r <= 20; r++) {
      const double = { segment: r, multiplier: 2 as const }
      engine.throw(double)
      trainingMisses(engine, 2)
    }
    // Round 21: D25
    engine.throw(D25)
    const results = trainingMisses(engine, 2)
    const lastResult = results[results.length - 1]!

    expect(lastResult.events).toContain('round_complete')
    expect(lastResult.events).toContain('session_complete')
    const s = engine.state as Bobs27State
    expect(s.isComplete).toBe(true)
    expect(s.isFailed).toBe(false)
  })
})

// ── Undo ──

describe('bobs-27 undo', () => {
  it('replays correctly after undo mid-round', () => {
    const { engine } = createTrainingSession('bobs-27')

    engine.throw(D1) // hit, score = 29
    engine.throw(MISS) // miss
    expect((engine.state as Bobs27State).currentRoundThrows).toBe(2)

    engine.undo()
    const s = engine.state as Bobs27State
    expect(s.currentRoundThrows).toBe(1)
    expect(s.currentRoundHits).toBe(1)
    expect(s.score).toBe(29)
  })

  it('undo restores state after completed round', () => {
    const { engine } = createTrainingSession('bobs-27')

    // Complete round 1 with a hit
    trainingThrow(engine, [D1, MISS, MISS])
    expect((engine.state as Bobs27State).currentRound).toBe(2)
    expect((engine.state as Bobs27State).roundResults[0]).toBe('hit')

    // Undo the last throw of round 1
    engine.undo()
    const s = engine.state as Bobs27State
    expect(s.currentRound).toBe(1)
    expect(s.currentRoundThrows).toBe(2)
    expect(s.roundResults[0]).toBeNull()
  })

  it('undo un-fails a failed session', () => {
    const { engine } = createTrainingSession('bobs-27')

    // Miss rounds until failure
    // Round 1: 27-2=25, Round 2: 25-4=21, Round 3: 21-6=15, Round 4: 15-8=7, Round 5: 7-10=-3
    for (let i = 0; i < 5; i++) {
      trainingMisses(engine, 3)
      if (engine.state!.isComplete)
        break
    }
    expect((engine.state as Bobs27State).isFailed).toBe(true)

    engine.undo()
    const s = engine.state as Bobs27State
    expect(s.isFailed).toBe(false)
    expect(s.isComplete).toBe(false)
  })
})

// ── Stats ──

describe('bobs-27 stats', () => {
  it('computes finalScore, doublesHit, doublesHitRate', () => {
    const { engine } = createTrainingSession('bobs-27')

    // Round 1: hit D1 once -> score 29, result 'hit'
    trainingThrow(engine, [D1, MISS, MISS])
    // Round 2: miss all -> score 29-4=25, result 'miss'
    trainingMisses(engine, 3)

    const stats = engine.getStats()!
    expect(stats.mode).toBe('bobs-27')
    expect(stats.totalDarts).toBe(6)
    expect(stats.finalScore).toBe(25)
    expect(stats.isFailed).toBe(false)
    expect(stats.roundsCompleted).toBe(2)
    expect(stats.doublesHit).toBe(1)
    // doublesHitRate = (1/2)*100 = 50
    expect(stats.doublesHitRate).toBe(50)
  })

  it('stats reflect failure', () => {
    const { engine } = createTrainingSession('bobs-27')

    // Fail: miss all for 5 rounds
    for (let i = 0; i < 5; i++) {
      trainingMisses(engine, 3)
      if (engine.state!.isComplete)
        break
    }

    const stats = engine.getStats()!
    expect(stats.isFailed).toBe(true)
    expect(stats.doublesHit).toBe(0)
  })
})
