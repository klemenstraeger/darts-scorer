import { describe, it, expect } from 'vitest'
import {
  generateKnockoutBracket,
  generateRoundRobinSchedule,
  generateGroupSchedule,
} from '../../server/utils/tournament-scheduler'

// ── Knockout Bracket ──

describe('generateKnockoutBracket', () => {
  it('throws error for < 2 players', () => {
    expect(() => generateKnockoutBracket(['Solo'])).toThrow('Need at least 2 players')
  })

  it('2 players: 1 match, 1 round', () => {
    const matches = generateKnockoutBracket(['A', 'B'])
    const r1 = matches.filter(m => m.round === 1)
    expect(r1).toHaveLength(1)
    expect(r1[0]!.player1Name).toBe('A')
    expect(r1[0]!.player2Name).toBe('B')
  })

  it('4 players: 2 first-round + 1 final', () => {
    const matches = generateKnockoutBracket(['P1', 'P2', 'P3', 'P4'])
    const r1 = matches.filter(m => m.round === 1)
    const r2 = matches.filter(m => m.round === 2)
    expect(r1).toHaveLength(2)
    expect(r2).toHaveLength(1) // final
  })

  it('8 players: proper seeding (1v8, 4v5, 2v7, 3v6)', () => {
    const players = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8']
    const matches = generateKnockoutBracket(players)
    const r1 = matches.filter(m => m.round === 1).sort((a, b) => a.position - b.position)

    // Standard bracket seeding: [1,8,4,5,2,7,3,6]
    expect(r1[0]!.player1Name).toBe('S1')
    expect(r1[0]!.player2Name).toBe('S8')
    expect(r1[1]!.player1Name).toBe('S4')
    expect(r1[1]!.player2Name).toBe('S5')
    expect(r1[2]!.player1Name).toBe('S2')
    expect(r1[2]!.player2Name).toBe('S7')
    expect(r1[3]!.player1Name).toBe('S3')
    expect(r1[3]!.player2Name).toBe('S6')
  })

  it('3 players: 1 first-round match + bye winner in round 2', () => {
    const matches = generateKnockoutBracket(['A', 'B', 'C'])
    const r1 = matches.filter(m => m.round === 1)
    const r2 = matches.filter(m => m.round === 2)

    // bracketSize=4, 1 bye (4 - 3 = 1)
    // First round: only matches where both players exist
    expect(r1.length).toBeGreaterThanOrEqual(1)

    // Round 2 should have bye winner placed
    expect(r2).toHaveLength(1)
    const byeWinners = r2.filter(m => m.player1Name !== null || m.player2Name !== null)
    expect(byeWinners.length).toBeGreaterThanOrEqual(1)
  })

  it('5 players: byes for top 3 seeds', () => {
    const matches = generateKnockoutBracket(['A', 'B', 'C', 'D', 'E'])
    // bracketSize=8, 3 byes
    const r1 = matches.filter(m => m.round === 1)
    const r2 = matches.filter(m => m.round === 2)

    // Only matches where both players present in R1
    expect(r1.length).toBeLessThan(4) // not all 4 first-round spots filled
    // Round 2 should have some bye winners
    const r2WithPlayers = r2.filter(m => m.player1Name !== null || m.player2Name !== null)
    expect(r2WithPlayers.length).toBeGreaterThan(0)
  })

  it('6 players: correct bracket structure', () => {
    const matches = generateKnockoutBracket(['A', 'B', 'C', 'D', 'E', 'F'])
    // bracketSize=8, 2 byes
    const allRounds = [...new Set(matches.map(m => m.round))]
    expect(allRounds).toContain(1)
    expect(allRounds).toContain(2)
    expect(allRounds).toContain(3) // final
  })

  it('7 players: 1 bye', () => {
    const matches = generateKnockoutBracket(['A', 'B', 'C', 'D', 'E', 'F', 'G'])
    // bracketSize=8, 1 bye
    const r1 = matches.filter(m => m.round === 1)
    expect(r1).toHaveLength(3) // 7 players in 8-bracket = 3 real matches + 1 bye
  })

  it('all matches have phase = knockout', () => {
    const matches = generateKnockoutBracket(['A', 'B', 'C', 'D'])
    expect(matches.every(m => m.phase === 'knockout')).toBe(true)
  })

  it('all matches have groupIndex = null', () => {
    const matches = generateKnockoutBracket(['A', 'B', 'C', 'D'])
    expect(matches.every(m => m.groupIndex === null)).toBe(true)
  })
})

// ── Round Robin ──

describe('generateRoundRobinSchedule', () => {
  it('throws error for < 2 players', () => {
    expect(() => generateRoundRobinSchedule(['Solo'])).toThrow('Need at least 2 players')
  })

  it('4 players: 3 rounds', () => {
    const matches = generateRoundRobinSchedule(['A', 'B', 'C', 'D'])
    const rounds = [...new Set(matches.map(m => m.round))]
    expect(rounds).toHaveLength(3) // N-1 rounds
  })

  it('4 players: 6 total matches (C(4,2))', () => {
    const matches = generateRoundRobinSchedule(['A', 'B', 'C', 'D'])
    expect(matches).toHaveLength(6)
  })

  it('every player plays every other (4 players)', () => {
    const players = ['A', 'B', 'C', 'D']
    const matches = generateRoundRobinSchedule(players)
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const found = matches.some(
          m =>
            (m.player1Name === players[i] && m.player2Name === players[j]) ||
            (m.player1Name === players[j] && m.player2Name === players[i]),
        )
        expect(found, `${players[i]} vs ${players[j]} should exist`).toBe(true)
      }
    }
  })

  it('5 players (odd): ghost player excluded from matches', () => {
    const matches = generateRoundRobinSchedule(['A', 'B', 'C', 'D', 'E'])
    // No match should contain __BYE__
    expect(matches.every(m => m.player1Name !== '__BYE__' && m.player2Name !== '__BYE__')).toBe(true)
    // C(5,2) = 10 matches
    expect(matches).toHaveLength(10)
  })

  it('every player plays every other (5 players)', () => {
    const players = ['A', 'B', 'C', 'D', 'E']
    const matches = generateRoundRobinSchedule(players)
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const found = matches.some(
          m =>
            (m.player1Name === players[i] && m.player2Name === players[j]) ||
            (m.player1Name === players[j] && m.player2Name === players[i]),
        )
        expect(found, `${players[i]} vs ${players[j]} should exist`).toBe(true)
      }
    }
  })

  it('default phase is main', () => {
    const matches = generateRoundRobinSchedule(['A', 'B'])
    expect(matches[0]!.phase).toBe('main')
    expect(matches[0]!.groupIndex).toBeNull()
  })

  it('custom phase and groupIndex', () => {
    const matches = generateRoundRobinSchedule(['A', 'B'], 'group', 2)
    expect(matches[0]!.phase).toBe('group')
    expect(matches[0]!.groupIndex).toBe(2)
  })
})

// ── Group Schedule ──

describe('generateGroupSchedule', () => {
  it('throws error for < 2 groups', () => {
    expect(() => generateGroupSchedule(['A', 'B', 'C', 'D'], 1)).toThrow('Need at least 2 groups')
  })

  it('throws error for too few players', () => {
    expect(() => generateGroupSchedule(['A', 'B', 'C'], 2)).toThrow('Need at least 2 players per group')
  })

  it('4 players / 2 groups: snake draft', () => {
    const { assignments } = generateGroupSchedule(['S1', 'S2', 'S3', 'S4'], 2)
    // Snake: S1→G0, S2→G1, S3→G1, S4→G0
    expect(assignments.find(a => a.playerName === 'S1')!.groupIndex).toBe(0)
    expect(assignments.find(a => a.playerName === 'S2')!.groupIndex).toBe(1)
    expect(assignments.find(a => a.playerName === 'S3')!.groupIndex).toBe(1)
    expect(assignments.find(a => a.playerName === 'S4')!.groupIndex).toBe(0)
  })

  it('6 players / 3 groups: snake draft', () => {
    const { assignments } = generateGroupSchedule(['A', 'B', 'C', 'D', 'E', 'F'], 3)
    // Snake: A→G0, B→G1, C→G2, D→G2, E→G1, F→G0
    expect(assignments.find(a => a.playerName === 'A')!.groupIndex).toBe(0)
    expect(assignments.find(a => a.playerName === 'B')!.groupIndex).toBe(1)
    expect(assignments.find(a => a.playerName === 'C')!.groupIndex).toBe(2)
    expect(assignments.find(a => a.playerName === 'D')!.groupIndex).toBe(2)
    expect(assignments.find(a => a.playerName === 'E')!.groupIndex).toBe(1)
    expect(assignments.find(a => a.playerName === 'F')!.groupIndex).toBe(0)
  })

  it('generates round-robin per group', () => {
    const { matches } = generateGroupSchedule(['A', 'B', 'C', 'D'], 2)
    // 2 groups of 2, 1 match each = 2 total matches
    expect(matches).toHaveLength(2)
    expect(matches.every(m => m.phase === 'group')).toBe(true)
  })

  it('correct groupIndex on matches', () => {
    const { matches } = generateGroupSchedule(['A', 'B', 'C', 'D', 'E', 'F'], 3)
    // Each group has 2 players → 1 match per group → 3 matches
    expect(matches).toHaveLength(3)

    const group0 = matches.filter(m => m.groupIndex === 0)
    const group1 = matches.filter(m => m.groupIndex === 1)
    const group2 = matches.filter(m => m.groupIndex === 2)
    expect(group0).toHaveLength(1)
    expect(group1).toHaveLength(1)
    expect(group2).toHaveLength(1)
  })

  it('larger groups produce more matches', () => {
    // 8 players, 2 groups → 4 per group → C(4,2) = 6 per group → 12 total
    const { matches } = generateGroupSchedule(
      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      2,
    )
    expect(matches).toHaveLength(12)
  })
})
