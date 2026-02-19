/**
 * Pure scheduling functions for tournament formats.
 * No DB access — returns match templates for the manager to persist.
 */

export interface MatchTemplate {
  round: number
  position: number
  phase: 'group' | 'knockout' | 'main'
  groupIndex: number | null
  player1Name: string | null
  player2Name: string | null
}

/**
 * Generate a single-elimination knockout bracket.
 * Handles non-power-of-2 counts with first-round byes for top seeds.
 */
export function generateKnockoutBracket(players: string[]): MatchTemplate[] {
  const n = players.length
  if (n < 2)
    throw new Error('Need at least 2 players')

  // Next power of 2
  const bracketSize = nextPowerOf2(n)
  const totalRounds = Math.log2(bracketSize)
  const _byeCount = bracketSize - n

  // Seed positions: standard bracket seeding
  const seeds = generateBracketSeeds(bracketSize)

  // Map seed positions to player names (higher seeds = later in array = get byes)
  const seedToPlayer = new Map<number, string>()
  for (let i = 0; i < n; i++) {
    seedToPlayer.set(i + 1, players[i]!)
  }

  const matches: MatchTemplate[] = []

  // First round: bracketSize/2 matches
  const firstRoundMatchCount = bracketSize / 2
  for (let pos = 0; pos < firstRoundMatchCount; pos++) {
    const seed1 = seeds[pos * 2]!
    const seed2 = seeds[pos * 2 + 1]!
    const p1 = seedToPlayer.get(seed1) ?? null
    const p2 = seedToPlayer.get(seed2) ?? null

    // If one player is null (bye), the other auto-advances
    if (p1 && !p2) {
      // Don't create a match — this player gets a bye
      // They'll be placed directly into round 2
      continue
    }
    if (!p1 && p2) {
      continue
    }
    if (!p1 && !p2) {
      continue
    }

    matches.push({
      round: 1,
      position: pos,
      phase: 'knockout',
      groupIndex: null,
      player1Name: p1,
      player2Name: p2,
    })
  }

  // Fill subsequent rounds with empty match slots
  // Also place bye winners into round 2
  for (let round = 2; round <= totalRounds; round++) {
    const matchCount = bracketSize / 2 ** round
    for (let pos = 0; pos < matchCount; pos++) {
      // Check if any bye winners should be placed here
      let p1: string | null = null
      let p2: string | null = null

      if (round === 2) {
        // Check the two first-round positions that feed into this match
        const feedPos1 = pos * 2
        const feedPos2 = pos * 2 + 1

        p1 = getByeWinner(feedPos1, seeds, seedToPlayer)
        p2 = getByeWinner(feedPos2, seeds, seedToPlayer)
      }

      matches.push({
        round,
        position: pos,
        phase: 'knockout',
        groupIndex: null,
        player1Name: p1,
        player2Name: p2,
      })
    }
  }

  return matches
}

function getByeWinner(
  firstRoundPos: number,
  seeds: number[],
  seedToPlayer: Map<number, string>,
): string | null {
  const seed1 = seeds[firstRoundPos * 2]!
  const seed2 = seeds[firstRoundPos * 2 + 1]!
  const p1 = seedToPlayer.get(seed1) ?? null
  const p2 = seedToPlayer.get(seed2) ?? null

  // Bye: one player present, other absent
  if (p1 && !p2)
    return p1
  if (!p1 && p2)
    return p2
  return null
}

/**
 * Generate round-robin schedule using the circle method.
 * Returns N-1 rounds with floor(N/2) matches each.
 */
export function generateRoundRobinSchedule(
  players: string[],
  phase: 'main' | 'group' = 'main',
  groupIndex: number | null = null,
): MatchTemplate[] {
  const n = players.length
  if (n < 2)
    throw new Error('Need at least 2 players')

  // If odd number, add a "BYE" placeholder
  const list = [...players]
  const hasGhost = n % 2 !== 0
  if (hasGhost)
    list.push('__BYE__')

  const size = list.length
  const rounds = size - 1
  const matchesPerRound = size / 2

  const matches: MatchTemplate[] = []

  // Circle method: fix first element, rotate rest
  const fixed = list[0]!
  const rotating = list.slice(1)

  for (let round = 0; round < rounds; round++) {
    const current = [fixed, ...rotating]

    for (let i = 0; i < matchesPerRound; i++) {
      const p1 = current[i]!
      const p2 = current[size - 1 - i]!

      // Skip matches involving the ghost player
      if (p1 === '__BYE__' || p2 === '__BYE__')
        continue

      matches.push({
        round: round + 1,
        position: i,
        phase,
        groupIndex,
        player1Name: p1,
        player2Name: p2,
      })
    }

    // Rotate: move last element to front of rotating array
    rotating.unshift(rotating.pop()!)
  }

  return matches
}

/**
 * Assign players to groups using snake draft by seed,
 * then generate round-robin schedule per group.
 */
export function generateGroupSchedule(
  players: string[],
  groupCount: number,
): { assignments: { playerName: string, groupIndex: number }[], matches: MatchTemplate[] } {
  if (groupCount < 2)
    throw new Error('Need at least 2 groups')
  if (players.length < groupCount * 2)
    throw new Error('Need at least 2 players per group')

  // Snake draft: 1→A, 2→B, 3→C, 4→C, 5→B, 6→A, 7→A, 8→B...
  const groups: string[][] = Array.from({ length: groupCount }, () => [])
  const assignments: { playerName: string, groupIndex: number }[] = []

  for (let i = 0; i < players.length; i++) {
    const round = Math.floor(i / groupCount)
    const pos = i % groupCount
    const groupIdx = round % 2 === 0 ? pos : groupCount - 1 - pos

    groups[groupIdx]!.push(players[i]!)
    assignments.push({ playerName: players[i]!, groupIndex: groupIdx })
  }

  // Generate round-robin within each group
  const matches: MatchTemplate[] = []
  for (let g = 0; g < groupCount; g++) {
    const groupMatches = generateRoundRobinSchedule(groups[g]!, 'group', g)
    matches.push(...groupMatches)
  }

  return { assignments, matches }
}

// ── Bracket Helpers ──

function nextPowerOf2(n: number): number {
  let p = 1
  while (p < n) p *= 2
  return p
}

/**
 * Standard tournament seeding for a bracket of size N.
 * Returns array of seeds in bracket order.
 * E.g. for 8: [1,8,4,5,2,7,3,6] so seed 1 plays 8, 4 plays 5, etc.
 */
function generateBracketSeeds(size: number): number[] {
  if (size === 1)
    return [1]

  const half = generateBracketSeeds(size / 2)
  const result: number[] = []

  for (const seed of half) {
    result.push(seed)
    result.push(size + 1 - seed)
  }

  return result
}
