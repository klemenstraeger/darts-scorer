import { describe, it, expect } from 'vitest'
import {
  generateKnockoutBracket,
  generateRoundRobinSchedule,
  generateGroupSchedule,
} from '../../server/utils/tournament-scheduler'

// ── Knockout bracket structure ──

describe('8-player knockout structure', () => {
  const players = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8']

  it('generates QF, SF, and Final rounds', () => {
    const matches = generateKnockoutBracket(players)
    const r1 = matches.filter(m => m.round === 1) // QF
    const r2 = matches.filter(m => m.round === 2) // SF
    const r3 = matches.filter(m => m.round === 3) // Final

    expect(r1).toHaveLength(4) // 4 quarter-finals
    expect(r2).toHaveLength(2) // 2 semi-finals
    expect(r3).toHaveLength(1) // 1 final
  })

  it('total of 7 matches', () => {
    const matches = generateKnockoutBracket(players)
    expect(matches).toHaveLength(7)
  })

  it('all first-round matches have both players', () => {
    const matches = generateKnockoutBracket(players)
    const r1 = matches.filter(m => m.round === 1)
    for (const m of r1) {
      expect(m.player1Name).not.toBeNull()
      expect(m.player2Name).not.toBeNull()
    }
  })
})

// ── 5-player knockout with byes ──

describe('5-player knockout with byes', () => {
  const players = ['A', 'B', 'C', 'D', 'E']

  it('advances bye winners to round 2', () => {
    const matches = generateKnockoutBracket(players)
    const r2 = matches.filter(m => m.round === 2)

    // Some R2 matches should have pre-filled players (bye winners)
    const preFilledCount = r2.filter(
      m => m.player1Name !== null || m.player2Name !== null,
    ).length
    expect(preFilledCount).toBeGreaterThan(0)
  })

  it('top seeds get byes', () => {
    const matches = generateKnockoutBracket(players)
    const r1Players = matches
      .filter(m => m.round === 1)
      .flatMap(m => [m.player1Name, m.player2Name])
      .filter(Boolean)

    const r2Players = matches
      .filter(m => m.round === 2)
      .flatMap(m => [m.player1Name, m.player2Name])
      .filter(Boolean)

    // Top seeds (A, B, C) should get byes → appear in R2 not R1
    // Bottom seeds (D, E) should play in R1
    // At minimum, seed 1 (A) should have a bye
    const topSeedInR2 = r2Players.includes('A')
    const topSeedNotInR1 = !r1Players.includes('A')
    expect(topSeedInR2 || topSeedNotInR1).toBe(true)
  })
})

// ── 6-player round robin ──

describe('6-player round robin', () => {
  const players = ['A', 'B', 'C', 'D', 'E', 'F']

  it('produces 15 matches (C(6,2))', () => {
    const matches = generateRoundRobinSchedule(players)
    expect(matches).toHaveLength(15)
  })

  it('each player plays 5 matches', () => {
    const matches = generateRoundRobinSchedule(players)
    for (const p of players) {
      const count = matches.filter(
        m => m.player1Name === p || m.player2Name === p,
      ).length
      expect(count, `${p} should play 5 matches`).toBe(5)
    }
  })

  it('no duplicate matchups', () => {
    const matches = generateRoundRobinSchedule(players)
    const pairs = new Set<string>()
    for (const m of matches) {
      const pair = [m.player1Name!, m.player2Name!].sort().join('-')
      expect(pairs.has(pair), `Duplicate: ${pair}`).toBe(false)
      pairs.add(pair)
    }
  })

  it('uses 5 rounds (N-1)', () => {
    const matches = generateRoundRobinSchedule(players)
    const rounds = [...new Set(matches.map(m => m.round))]
    expect(rounds).toHaveLength(5)
  })
})

// ── 8-player 2-group stage ──

describe('8-player 2-group stage', () => {
  const players = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8']

  it('creates balanced groups (4 per group)', () => {
    const { assignments } = generateGroupSchedule(players, 2)
    const g0 = assignments.filter(a => a.groupIndex === 0)
    const g1 = assignments.filter(a => a.groupIndex === 1)
    expect(g0).toHaveLength(4)
    expect(g1).toHaveLength(4)
  })

  it('produces 12 matches total (6 per group)', () => {
    const { matches } = generateGroupSchedule(players, 2)
    expect(matches).toHaveLength(12)
  })

  it('uses snake draft seeding', () => {
    const { assignments } = generateGroupSchedule(players, 2)
    // S1→G0, S2→G1, S3→G1, S4→G0, S5→G0, S6→G1, S7→G1, S8→G0
    expect(assignments[0]!.groupIndex).toBe(0) // S1
    expect(assignments[1]!.groupIndex).toBe(1) // S2
    expect(assignments[2]!.groupIndex).toBe(1) // S3
    expect(assignments[3]!.groupIndex).toBe(0) // S4
    expect(assignments[4]!.groupIndex).toBe(0) // S5
    expect(assignments[5]!.groupIndex).toBe(1) // S6
    expect(assignments[6]!.groupIndex).toBe(1) // S7
    expect(assignments[7]!.groupIndex).toBe(0) // S8
  })

  it('matches only pair players within same group', () => {
    const { assignments, matches } = generateGroupSchedule(players, 2)
    for (const m of matches) {
      const g1 = assignments.find(a => a.playerName === m.player1Name)!.groupIndex
      const g2 = assignments.find(a => a.playerName === m.player2Name)!.groupIndex
      expect(g1).toBe(g2)
      expect(m.groupIndex).toBe(g1)
    }
  })
})

// ── 9-player 3-group stage ──

describe('9-player 3-group stage', () => {
  const players = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']

  it('creates 3 groups of 3 players each', () => {
    const { assignments } = generateGroupSchedule(players, 3)
    for (let g = 0; g < 3; g++) {
      const count = assignments.filter(a => a.groupIndex === g).length
      expect(count).toBe(3)
    }
  })

  it('produces 9 matches (3 per group, C(3,2)=3)', () => {
    const { matches } = generateGroupSchedule(players, 3)
    expect(matches).toHaveLength(9)
  })

  it('each group has 3 matches', () => {
    const { matches } = generateGroupSchedule(players, 3)
    for (let g = 0; g < 3; g++) {
      const groupMatches = matches.filter(m => m.groupIndex === g)
      expect(groupMatches).toHaveLength(3)
    }
  })
})
