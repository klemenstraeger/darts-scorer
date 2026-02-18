import { describe, it, expect } from 'vitest'
import type { ShanghaiState } from '../../../shared/training/training-models'
import { createTrainingSession, trainingThrow, trainingMisses } from '../../helpers/training'
import { S1, D1, T1, S2, D2, T2, S5, S20, D20, T20, MISS } from '../../helpers/darts'

function shanghaiState(engine: { state: unknown }): ShanghaiState {
  return engine.state as ShanghaiState
}

// ── Initial State ──

describe('initial state', () => {
  it('starts at round 1, score 0, shanghaiCount 0', () => {
    const { state } = createTrainingSession('shanghai')
    const s = state as ShanghaiState
    expect(s.currentRound).toBe(1)
    expect(s.totalRounds).toBe(20)
    expect(s.totalScore).toBe(0)
    expect(s.shanghaiCount).toBe(0)
    expect(s.currentRoundThrows).toBe(0)
    expect(s.roundScores).toEqual([])
    expect(s.isComplete).toBe(false)
  })
})

// ── Scoring ──

describe('scoring', () => {
  it('single on target scores face value and emits target_hit', () => {
    const { engine } = createTrainingSession('shanghai')
    const [result] = trainingThrow(engine, [S1])
    expect(result.events).toContain('target_hit')
    expect(shanghaiState(engine).totalScore).toBe(1) // S1 = 1*1
  })

  it('double on target scores 2x', () => {
    const { engine } = createTrainingSession('shanghai')
    trainingThrow(engine, [D1])
    expect(shanghaiState(engine).totalScore).toBe(2) // D1 = 1*2
  })

  it('triple on target scores 3x', () => {
    const { engine } = createTrainingSession('shanghai')
    trainingThrow(engine, [T1])
    expect(shanghaiState(engine).totalScore).toBe(3) // T1 = 1*3
  })

  it('non-target segment scores 0 and emits target_missed', () => {
    const { engine } = createTrainingSession('shanghai')
    // Round 1 targets segment 1; S5 is off-target
    const [result] = trainingThrow(engine, [S5])
    expect(result.events).toContain('target_missed')
    expect(shanghaiState(engine).totalScore).toBe(0)
  })

  it('miss scores 0 and emits target_missed', () => {
    const { engine } = createTrainingSession('shanghai')
    const [result] = trainingThrow(engine, [MISS])
    expect(result.events).toContain('target_missed')
    expect(shanghaiState(engine).totalScore).toBe(0)
  })
})

// ── Round Progression ──

describe('round progression', () => {
  it('3 darts emit round_complete and advance to next round', () => {
    const { engine } = createTrainingSession('shanghai')
    const results = trainingThrow(engine, [S1, S1, S1])
    const lastResult = results[results.length - 1]
    expect(lastResult.events).toContain('round_complete')
    expect(shanghaiState(engine).currentRound).toBe(2)
    expect(shanghaiState(engine).currentRoundThrows).toBe(0)
    expect(shanghaiState(engine).roundScores).toEqual([3]) // 1+1+1
  })

  it('round score only counts target segment', () => {
    const { engine } = createTrainingSession('shanghai')
    // Round 1: hit, miss, hit → score = 1+0+1 = 2
    trainingThrow(engine, [S1, S5, S1])
    expect(shanghaiState(engine).roundScores).toEqual([2])
  })

  it('currentRoundHits resets on new round', () => {
    const { engine } = createTrainingSession('shanghai')
    trainingThrow(engine, [S1, D1, T1]) // round 1 complete with shanghai
    // Now round 2 — hits should be reset
    expect(shanghaiState(engine).currentRoundHits).toEqual({
      single: false,
      double: false,
      treble: false,
    })
  })
})

// ── Shanghai Bonus ──

describe('shanghai bonus', () => {
  it('S+D+T in same round emits shanghai event', () => {
    const { engine } = createTrainingSession('shanghai')
    const results = trainingThrow(engine, [S1, D1, T1])
    const lastResult = results[results.length - 1]
    expect(lastResult.events).toContain('shanghai')
    expect(shanghaiState(engine).shanghaiCount).toBe(1)
  })

  it('no shanghai without all three types', () => {
    const { engine } = createTrainingSession('shanghai')
    // S1 + D1 + S1 → missing treble → no shanghai
    const results = trainingThrow(engine, [S1, D1, S1])
    const lastResult = results[results.length - 1]
    expect(lastResult.events).not.toContain('shanghai')
    expect(shanghaiState(engine).shanghaiCount).toBe(0)
  })

  it('no shanghai if all misses', () => {
    const { engine } = createTrainingSession('shanghai')
    const results = trainingMisses(engine, 3)
    const lastResult = results[results.length - 1]
    expect(lastResult.events).not.toContain('shanghai')
    expect(shanghaiState(engine).shanghaiCount).toBe(0)
  })

  it('shanghai in later rounds works correctly', () => {
    const { engine } = createTrainingSession('shanghai')
    // Finish round 1 with misses
    trainingMisses(engine, 3)
    // Round 2: S2+D2+T2 → shanghai
    const results = trainingThrow(engine, [S2, D2, T2])
    const lastResult = results[results.length - 1]
    expect(lastResult.events).toContain('shanghai')
    expect(shanghaiState(engine).shanghaiCount).toBe(1)
    // Score from round 2: 2+4+6 = 12
    expect(shanghaiState(engine).totalScore).toBe(12)
  })
})

// ── Completion ──

describe('completion', () => {
  it('after round 20 emits session_complete', () => {
    const { engine } = createTrainingSession('shanghai')
    // Play 19 rounds of misses (57 darts)
    trainingMisses(engine, 57)
    expect(shanghaiState(engine).currentRound).toBe(20)
    // Round 20: 3 misses
    const results = trainingMisses(engine, 3)
    const lastResult = results[results.length - 1]
    expect(lastResult.events).toContain('session_complete')
    expect(shanghaiState(engine).isComplete).toBe(true)
  })

  it('throws after completion are no-ops', () => {
    const { engine } = createTrainingSession('shanghai')
    trainingMisses(engine, 60) // 20 rounds * 3 darts
    const result = engine.throw(S1)
    expect(result.events).toEqual([])
  })
})

// ── Undo ──

describe('undo', () => {
  it('undo within a round restores throw count and score', () => {
    const { engine } = createTrainingSession('shanghai')
    trainingThrow(engine, [S1, D1]) // 2 throws, score = 1+2=3
    expect(shanghaiState(engine).totalScore).toBe(3)
    expect(shanghaiState(engine).currentRoundThrows).toBe(2)

    engine.undo() // remove D1
    expect(shanghaiState(engine).totalScore).toBe(1)
    expect(shanghaiState(engine).currentRoundThrows).toBe(1)
  })

  it('undo across rounds restores previous round', () => {
    const { engine } = createTrainingSession('shanghai')
    trainingThrow(engine, [S1, S1, S1]) // round 1 complete → round 2
    expect(shanghaiState(engine).currentRound).toBe(2)
    expect(shanghaiState(engine).roundScores).toHaveLength(1)

    engine.undo() // remove last S1 → back to round 1, 2 throws
    expect(shanghaiState(engine).currentRound).toBe(1)
    expect(shanghaiState(engine).currentRoundThrows).toBe(2)
    expect(shanghaiState(engine).roundScores).toHaveLength(0)
  })

  it('undo reconstructs shanghaiCount', () => {
    const { engine } = createTrainingSession('shanghai')
    trainingThrow(engine, [S1, D1, T1]) // shanghai in round 1
    expect(shanghaiState(engine).shanghaiCount).toBe(1)

    engine.undo() // remove T1 → no longer complete round
    expect(shanghaiState(engine).shanghaiCount).toBe(0)
  })

  it('undo restores isComplete to false', () => {
    const { engine } = createTrainingSession('shanghai')
    trainingMisses(engine, 60)
    expect(shanghaiState(engine).isComplete).toBe(true)

    engine.undo()
    expect(shanghaiState(engine).isComplete).toBe(false)
    expect(shanghaiState(engine).currentRoundThrows).toBe(2)
  })

  it('undo on empty session is safe', () => {
    const { engine } = createTrainingSession('shanghai')
    const state = engine.undo()
    expect(state.throws).toHaveLength(0)
  })
})

// ── Stats ──

describe('stats', () => {
  it('computes totalScore, bestRound, shanghaiCount, averagePerRound', () => {
    const { engine } = createTrainingSession('shanghai')
    // Round 1: S1+D1+T1 = 1+2+3 = 6 (shanghai)
    trainingThrow(engine, [S1, D1, T1])
    // Round 2: 3 misses = 0
    trainingMisses(engine, 3)

    const stats = engine.getStats()!
    expect(stats.mode).toBe('shanghai')
    expect(stats.totalScore).toBe(6)
    expect(stats.bestRound).toBe(6)
    expect(stats.shanghaiCount).toBe(1)
    expect(stats.completedRounds).toBe(2)
    // averagePerRound = round(6/2 * 10) / 10 = 3
    expect(stats.averagePerRound).toBe(3)
    expect(stats.totalDarts).toBe(6)
  })

  it('bestRound is 0 with no completed rounds', () => {
    const { engine } = createTrainingSession('shanghai')
    const stats = engine.getStats()!
    expect(stats.bestRound).toBe(0)
  })

  it('averagePerRound is 0 with no completed rounds', () => {
    const { engine } = createTrainingSession('shanghai')
    const stats = engine.getStats()!
    expect(stats.averagePerRound).toBe(0)
  })
})
