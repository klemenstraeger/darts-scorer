import { describe, it, expect } from 'vitest'
import { getCheckout, CHECKOUTS } from '../../shared/checkouts'

// ── getCheckout ──

describe('getCheckout', () => {
  it('returns null for score < 2', () => {
    expect(getCheckout(1, 3)).toBeNull()
    expect(getCheckout(0, 3)).toBeNull()
    expect(getCheckout(-1, 3)).toBeNull()
  })

  it('returns null for dartsRemaining <= 0', () => {
    expect(getCheckout(40, 0)).toBeNull()
    expect(getCheckout(40, -1)).toBeNull()
  })

  it('returns null when no checkout path exists', () => {
    expect(getCheckout(159, 3)).toBeNull()
    expect(getCheckout(171, 3)).toBeNull()
  })

  it('returns null when path is longer than darts remaining', () => {
    // 170 requires 3 darts: T20, T20, D25
    expect(getCheckout(170, 2)).toBeNull()
    // 100 requires 2 darts: T20, D20
    expect(getCheckout(100, 1)).toBeNull()
  })

  it('returns 1-dart checkout paths', () => {
    expect(getCheckout(40, 3)).toEqual(['D20'])
    expect(getCheckout(2, 3)).toEqual(['D1'])
    expect(getCheckout(50, 3)).toEqual(['D25'])
  })

  it('returns 2-dart checkout paths', () => {
    expect(getCheckout(100, 3)).toEqual(['T20', 'D20'])
    expect(getCheckout(3, 3)).toEqual(['1', 'D1'])
  })

  it('returns 3-dart checkout paths', () => {
    expect(getCheckout(170, 3)).toEqual(['T20', 'T20', 'D25'])
    expect(getCheckout(160, 3)).toEqual(['T20', 'T20', 'D20'])
  })

  it('returns path when dartsRemaining exceeds path length', () => {
    // 40 is a 1-dart checkout, should work with 2 or 3 darts remaining
    expect(getCheckout(40, 2)).toEqual(['D20'])
    expect(getCheckout(40, 3)).toEqual(['D20'])
    // 100 is a 2-dart checkout, should work with 3 darts remaining
    expect(getCheckout(100, 3)).toEqual(['T20', 'D20'])
  })
})

// ── CHECKOUTS table validation ──

describe('CHECKOUTS', () => {
  it('contains all 1-dart finishes (even 2-40 + 50)', () => {
    for (let score = 2; score <= 40; score += 2) {
      expect(CHECKOUTS[score]).toBeDefined()
      expect(CHECKOUTS[score]).toHaveLength(1)
    }
    expect(CHECKOUTS[50]).toBeDefined()
    expect(CHECKOUTS[50]).toHaveLength(1)
  })

  it('all paths end with a double', () => {
    for (const [, path] of Object.entries(CHECKOUTS)) {
      const lastDart = path[path.length - 1]!
      expect(lastDart.startsWith('D')).toBe(true)
    }
  })

  it('170 is the highest checkout', () => {
    const scores = Object.keys(CHECKOUTS).map(Number)
    expect(Math.max(...scores)).toBe(170)
  })

  it('spot-check known checkouts', () => {
    expect(CHECKOUTS[170]).toEqual(['T20', 'T20', 'D25'])
    expect(CHECKOUTS[160]).toEqual(['T20', 'T20', 'D20'])
    expect(CHECKOUTS[100]).toEqual(['T20', 'D20'])
    expect(CHECKOUTS[40]).toEqual(['D20'])
    expect(CHECKOUTS[50]).toEqual(['D25'])
    expect(CHECKOUTS[2]).toEqual(['D1'])
    expect(CHECKOUTS[110]).toEqual(['T20', 'D25'])
    expect(CHECKOUTS[92]).toEqual(['T20', 'D16'])
  })

  it('has no checkout for score 1', () => {
    expect(CHECKOUTS[1]).toBeUndefined()
  })

  it('has no checkout for impossible scores (159, 163, 166, 169)', () => {
    expect(CHECKOUTS[159]).toBeUndefined()
    expect(CHECKOUTS[163]).toBeUndefined()
    expect(CHECKOUTS[166]).toBeUndefined()
    expect(CHECKOUTS[169]).toBeUndefined()
  })
})
