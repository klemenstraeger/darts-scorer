import { describe, it, expect } from 'vitest'
import { isAchievableScore, validateVisitScore, QUICK_SCORES } from '../../shared/visit-score-validation'

describe('isAchievableScore', () => {
  it('accepts valid scores 0-180', () => {
    expect(isAchievableScore(0)).toBe(true)
    expect(isAchievableScore(1)).toBe(true)
    expect(isAchievableScore(60)).toBe(true)
    expect(isAchievableScore(100)).toBe(true)
    expect(isAchievableScore(180)).toBe(true)
  })

  it('rejects negative scores', () => {
    expect(isAchievableScore(-1)).toBe(false)
  })

  it('rejects scores above 180', () => {
    expect(isAchievableScore(181)).toBe(false)
    expect(isAchievableScore(200)).toBe(false)
  })

  it('rejects non-integer scores', () => {
    expect(isAchievableScore(60.5)).toBe(false)
    expect(isAchievableScore(0.1)).toBe(false)
  })

  it('rejects impossible 3-dart scores', () => {
    const impossible = [163, 166, 169, 172, 173, 175, 176, 178, 179]
    for (const score of impossible) {
      expect(isAchievableScore(score)).toBe(false)
    }
  })

  it('accepts scores near impossible values', () => {
    // Neighbors of impossible scores that ARE achievable
    expect(isAchievableScore(162)).toBe(true)
    expect(isAchievableScore(164)).toBe(true)
    expect(isAchievableScore(170)).toBe(true)
    expect(isAchievableScore(174)).toBe(true)
    expect(isAchievableScore(177)).toBe(true)
  })
})

describe('validateVisitScore', () => {
  describe('single_out mode', () => {
    it('returns valid for normal scoring throws', () => {
      expect(validateVisitScore(60, 501, 'single_out')).toBe('valid')
      expect(validateVisitScore(100, 301, 'single_out')).toBe('valid')
      expect(validateVisitScore(0, 100, 'single_out')).toBe('valid')
    })

    it('returns checkout when score equals remaining', () => {
      expect(validateVisitScore(60, 60, 'single_out')).toBe('checkout')
      expect(validateVisitScore(1, 1, 'single_out')).toBe('checkout')
    })

    it('returns bust when score exceeds remaining', () => {
      expect(validateVisitScore(100, 50, 'single_out')).toBe('bust')
      expect(validateVisitScore(180, 100, 'single_out')).toBe('bust')
    })

    it('returns invalid_score for impossible values', () => {
      expect(validateVisitScore(179, 501, 'single_out')).toBe('invalid_score')
      expect(validateVisitScore(-1, 501, 'single_out')).toBe('invalid_score')
    })
  })

  describe('double_out mode', () => {
    it('returns valid for normal scoring throws', () => {
      expect(validateVisitScore(60, 501, 'double_out')).toBe('valid')
      expect(validateVisitScore(100, 301, 'double_out')).toBe('valid')
    })

    it('returns checkout for valid checkout scores', () => {
      // 40 = D20 (valid checkout)
      expect(validateVisitScore(40, 40, 'double_out')).toBe('checkout')
      // 170 = T20 T20 D25 (max checkout)
      expect(validateVisitScore(170, 170, 'double_out')).toBe('checkout')
      // 50 = D25
      expect(validateVisitScore(50, 50, 'double_out')).toBe('checkout')
    })

    it('returns invalid_checkout when checkout is not possible with doubles', () => {
      // Score of 159: no checkout path exists in CHECKOUTS table
      expect(validateVisitScore(159, 159, 'double_out')).toBe('invalid_checkout')
      // Score of 1: can't finish on 1 with double out
      expect(validateVisitScore(1, 1, 'double_out')).toBe('invalid_checkout')
    })

    it('returns bust when remaining would be 1 (impossible to finish)', () => {
      // 60 from 61 leaves 1 — bust in double-out
      expect(validateVisitScore(60, 61, 'double_out')).toBe('bust')
      expect(validateVisitScore(100, 101, 'double_out')).toBe('bust')
    })

    it('returns bust when score exceeds remaining', () => {
      expect(validateVisitScore(100, 50, 'double_out')).toBe('bust')
    })
  })
})

describe('QUICK_SCORES', () => {
  it('contains expected common scores', () => {
    expect(QUICK_SCORES).toContain(180)
    expect(QUICK_SCORES).toContain(140)
    expect(QUICK_SCORES).toContain(100)
    expect(QUICK_SCORES).toContain(60)
    expect(QUICK_SCORES).toContain(0)
  })

  it('all quick scores are achievable', () => {
    for (const score of QUICK_SCORES) {
      expect(isAchievableScore(score)).toBe(true)
    }
  })
})
