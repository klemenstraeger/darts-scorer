import { describe, it, expect, vi, afterEach } from 'vitest'
import { parseCheckoutDart, BOT_PROFILES, generateBotThrow } from '../../shared/bot-engine'
import type { ThrowResult } from '../../shared/game-models'

afterEach(() => {
  vi.restoreAllMocks()
})

// Valid segments on a dartboard
const VALID_SEGMENTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25]

function isValidThrow(t: ThrowResult): boolean {
  if (!VALID_SEGMENTS.includes(t.segment)) return false
  if (![1, 2, 3].includes(t.multiplier)) return false
  if (t.segment === 0 && t.multiplier !== 1) return false
  return true
}

// ── parseCheckoutDart ──

describe('parseCheckoutDart', () => {
  it('parses triple (T20)', () => {
    expect(parseCheckoutDart('T20')).toEqual({ segment: 20, multiplier: 3 })
  })

  it('parses double (D16)', () => {
    expect(parseCheckoutDart('D16')).toEqual({ segment: 16, multiplier: 2 })
  })

  it('parses explicit single (S5)', () => {
    expect(parseCheckoutDart('S5')).toEqual({ segment: 5, multiplier: 1 })
  })

  it('parses plain number as single ("19")', () => {
    expect(parseCheckoutDart('19')).toEqual({ segment: 19, multiplier: 1 })
  })

  it('parses double bull (D25)', () => {
    expect(parseCheckoutDart('D25')).toEqual({ segment: 25, multiplier: 2 })
  })

  it('handles lowercase input (t20)', () => {
    expect(parseCheckoutDart('t20')).toEqual({ segment: 20, multiplier: 3 })
  })
})

// ── BOT_PROFILES ──

describe('BOT_PROFILES', () => {
  const difficulties = ['easy', 'medium', 'hard', 'pro'] as const

  it('defines all 4 difficulty levels', () => {
    for (const diff of difficulties) {
      expect(BOT_PROFILES[diff]).toBeDefined()
    }
  })

  it('segmentAccuracy increases with difficulty', () => {
    for (let i = 1; i < difficulties.length; i++) {
      const prev = BOT_PROFILES[difficulties[i - 1]!]
      const curr = BOT_PROFILES[difficulties[i]!]
      expect(curr.segmentAccuracy).toBeGreaterThan(prev.segmentAccuracy)
    }
  })

  it('ringAccuracy increases with difficulty', () => {
    for (let i = 1; i < difficulties.length; i++) {
      const prev = BOT_PROFILES[difficulties[i - 1]!]
      const curr = BOT_PROFILES[difficulties[i]!]
      expect(curr.ringAccuracy).toBeGreaterThan(prev.ringAccuracy)
    }
  })

  it('missRate decreases with difficulty', () => {
    for (let i = 1; i < difficulties.length; i++) {
      const prev = BOT_PROFILES[difficulties[i - 1]!]
      const curr = BOT_PROFILES[difficulties[i]!]
      expect(curr.missRate).toBeLessThan(prev.missRate)
    }
  })
})

// ── generateBotThrow ──

describe('generateBotThrow', () => {
  it('returns a valid ThrowResult', () => {
    const result = generateBotThrow(501, 3, 'medium', 'double_out')
    expect(result).toHaveProperty('segment')
    expect(result).toHaveProperty('multiplier')
    expect(isValidThrow(result)).toBe(true)
  })

  it('checkout mode: always hits when random returns 0', () => {
    // random() = 0 → passes all accuracy checks (0 < accuracy is true for all)
    vi.spyOn(Math, 'random').mockReturnValue(0)
    // 40 = D20 checkout, pro difficulty
    const result = generateBotThrow(40, 3, 'pro', 'double_out')
    // With random=0, bot will attempt checkout and hit perfectly: D20
    expect(result).toEqual({ segment: 20, multiplier: 2 })
  })

  it('scoring mode: aims for treble on high-value target', () => {
    // With random=0, all accuracy checks pass, picks first scoring target
    vi.spyOn(Math, 'random').mockReturnValue(0)
    // 501 is too high for checkout, so scoring mode kicks in
    const result = generateBotThrow(501, 3, 'pro', 'double_out')
    // Pro scoring targets are [20, 19], random=0 picks index 0 → T20
    expect(result).toEqual({ segment: 20, multiplier: 3 })
  })

  it('easy difficulty produces valid throws across 50 iterations', () => {
    vi.restoreAllMocks() // use real randomness
    for (let i = 0; i < 50; i++) {
      const result = generateBotThrow(501, 3, 'easy', 'double_out')
      expect(isValidThrow(result)).toBe(true)
    }
  })

  it('pro difficulty produces valid throws across 50 iterations', () => {
    vi.restoreAllMocks() // use real randomness
    for (let i = 0; i < 50; i++) {
      const result = generateBotThrow(501, 3, 'pro', 'double_out')
      expect(isValidThrow(result)).toBe(true)
    }
  })

  it('single_out aims for exact score when remaining <= 20', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    // 15 remaining in single_out → aim for single 15
    const result = generateBotThrow(15, 3, 'pro', 'single_out')
    expect(result).toEqual({ segment: 15, multiplier: 1 })
  })

  it('single_out aims for double when remaining is even and <= 40', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    // 30 remaining, even, <= 40 → aim for D15
    const result = generateBotThrow(30, 3, 'pro', 'single_out')
    expect(result).toEqual({ segment: 15, multiplier: 2 })
  })

  it('double_out with low remaining score sets up for a double', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    // 45 remaining in double_out, no checkout with random=0 (checkoutIQ passes)
    // 45 has checkout path ['5', 'D20'], dartsLeft=3, pro checkoutIQ=0.95
    // random=0 < 0.95 → attempts checkout: parseCheckoutDart('5') = {segment:5, multiplier:1}
    const result = generateBotThrow(45, 3, 'pro', 'double_out')
    expect(result).toEqual({ segment: 5, multiplier: 1 })
  })

  it('all difficulties produce valid segments', () => {
    const difficulties = ['easy', 'medium', 'hard', 'pro'] as const
    for (const diff of difficulties) {
      vi.restoreAllMocks()
      for (let i = 0; i < 20; i++) {
        const result = generateBotThrow(301, 3, diff, 'double_out')
        expect(isValidThrow(result)).toBe(true)
      }
    }
  })
})
