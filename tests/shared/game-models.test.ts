import { describe, it, expect } from 'vitest'
import {
  throwPoints,
  throwLabel,
  turnTotalPoints,
  turnIsComplete,
  threeDartAverage,
  createDefaultGameState,
} from '../../shared/game-models'
import type { ThrowResult, Turn, Player } from '../../shared/game-models'

// ── throwPoints ──

describe('throwPoints', () => {
  it('single segment', () => {
    expect(throwPoints({ segment: 20, multiplier: 1 })).toBe(20)
  })

  it('double segment', () => {
    expect(throwPoints({ segment: 20, multiplier: 2 })).toBe(40)
  })

  it('triple segment', () => {
    expect(throwPoints({ segment: 20, multiplier: 3 })).toBe(60)
  })

  it('miss returns 0', () => {
    expect(throwPoints({ segment: 0, multiplier: 1 })).toBe(0)
  })

  it('single bull returns 25', () => {
    expect(throwPoints({ segment: 25, multiplier: 1 })).toBe(25)
  })

  it('double bull returns 50', () => {
    expect(throwPoints({ segment: 25, multiplier: 2 })).toBe(50)
  })

  it('triple bull returns 75', () => {
    expect(throwPoints({ segment: 25, multiplier: 3 })).toBe(75)
  })
})

// ── throwLabel ──

describe('throwLabel', () => {
  it('single prefix', () => {
    expect(throwLabel({ segment: 5, multiplier: 1 })).toBe('S5')
  })

  it('double prefix', () => {
    expect(throwLabel({ segment: 18, multiplier: 2 })).toBe('D18')
  })

  it('triple prefix', () => {
    expect(throwLabel({ segment: 20, multiplier: 3 })).toBe('T20')
  })

  it('miss label', () => {
    expect(throwLabel({ segment: 0, multiplier: 1 })).toBe('MISS')
  })

  it('single bull', () => {
    expect(throwLabel({ segment: 25, multiplier: 1 })).toBe('SB')
  })

  it('double bull', () => {
    expect(throwLabel({ segment: 25, multiplier: 2 })).toBe('DB')
  })
})

// ── turnTotalPoints ──

describe('turnTotalPoints', () => {
  it('sums non-busted throws', () => {
    const turn: Turn = {
      player_index: 0,
      throws: [
        { segment: 20, multiplier: 3 },
        { segment: 20, multiplier: 3 },
        { segment: 20, multiplier: 3 },
      ],
      busted: false,
      score_before: 501,
    }
    expect(turnTotalPoints(turn)).toBe(180)
  })

  it('busted turn returns 0', () => {
    const turn: Turn = {
      player_index: 0,
      throws: [{ segment: 20, multiplier: 3 }],
      busted: true,
      score_before: 100,
    }
    expect(turnTotalPoints(turn)).toBe(0)
  })

  it('empty turn returns 0', () => {
    const turn: Turn = {
      player_index: 0,
      throws: [],
      busted: false,
      score_before: 501,
    }
    expect(turnTotalPoints(turn)).toBe(0)
  })
})

// ── turnIsComplete ──

describe('turnIsComplete', () => {
  it('3 darts = complete', () => {
    const turn: Turn = {
      player_index: 0,
      throws: [
        { segment: 1, multiplier: 1 },
        { segment: 1, multiplier: 1 },
        { segment: 1, multiplier: 1 },
      ],
      busted: false,
      score_before: 501,
    }
    expect(turnIsComplete(turn)).toBe(true)
  })

  it('busted = complete', () => {
    const turn: Turn = {
      player_index: 0,
      throws: [{ segment: 20, multiplier: 3 }],
      busted: true,
      score_before: 50,
    }
    expect(turnIsComplete(turn)).toBe(true)
  })

  it('fewer than 3 darts not busted = incomplete', () => {
    const turn: Turn = {
      player_index: 0,
      throws: [{ segment: 20, multiplier: 1 }],
      busted: false,
      score_before: 501,
    }
    expect(turnIsComplete(turn)).toBe(false)
  })
})

// ── threeDartAverage ──

describe('threeDartAverage', () => {
  it('averages completed turns', () => {
    const player: Player = {
      name: 'Test',
      score: 141,
      legs_won: 0,
      sets_won: 0,
      turns: [
        { player_index: 0, throws: [
          { segment: 20, multiplier: 3 },
          { segment: 20, multiplier: 3 },
          { segment: 20, multiplier: 3 },
        ], busted: false, score_before: 501 },
        { player_index: 0, throws: [
          { segment: 20, multiplier: 3 },
          { segment: 20, multiplier: 3 },
          { segment: 20, multiplier: 3 },
        ], busted: false, score_before: 321 },
      ],
    }
    expect(threeDartAverage(player)).toBe(180)
  })

  it('busted turns count as 0', () => {
    const player: Player = {
      name: 'Test',
      score: 501,
      legs_won: 0,
      sets_won: 0,
      turns: [
        { player_index: 0, throws: [
          { segment: 20, multiplier: 3 },
          { segment: 20, multiplier: 3 },
          { segment: 20, multiplier: 3 },
        ], busted: false, score_before: 501 },
        { player_index: 0, throws: [
          { segment: 20, multiplier: 3 },
        ], busted: true, score_before: 321 },
      ],
    }
    // (180 + 0) / 2 = 90
    expect(threeDartAverage(player)).toBe(90)
  })

  it('no turns = 0', () => {
    const player: Player = {
      name: 'Test',
      score: 501,
      legs_won: 0,
      sets_won: 0,
      turns: [],
    }
    expect(threeDartAverage(player)).toBe(0)
  })

  it('ignores incomplete turns', () => {
    const player: Player = {
      name: 'Test',
      score: 321,
      legs_won: 0,
      sets_won: 0,
      turns: [
        { player_index: 0, throws: [
          { segment: 20, multiplier: 3 },
          { segment: 20, multiplier: 3 },
          { segment: 20, multiplier: 3 },
        ], busted: false, score_before: 501 },
        { player_index: 0, throws: [
          { segment: 20, multiplier: 1 },
        ], busted: false, score_before: 321 },
      ],
    }
    // Only the first turn (180) is completed (3 darts), second is incomplete (1 dart)
    expect(threeDartAverage(player)).toBe(180)
  })
})

// ── createDefaultGameState ──

describe('createDefaultGameState', () => {
  it('returns sensible defaults', () => {
    const state = createDefaultGameState()
    expect(state.mode).toBe('501')
    expect(state.checkout).toBe('double_out')
    expect(state.legs_to_win).toBe(1)
    expect(state.sets_to_win).toBe(1)
    expect(state.players).toEqual([])
    expect(state.current_player_index).toBe(0)
    expect(state.is_finished).toBe(false)
    expect(state.winner_index).toBeNull()
    expect(state.turn_history).toEqual([])
    expect(state.score_before_turn).toBeNull()
    expect(state.current_set_legs).toEqual([])
    expect(state.sets_won).toEqual([])
    expect(state.leg_starting_player).toBe(0)
  })
})
