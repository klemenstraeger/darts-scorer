/**
 * Bot throw generation engine.
 * Pure logic — no Vue dependencies. Used by useBotPlay composable.
 */

import type { BotDifficulty, CheckoutMode, Multiplier, ThrowResult } from './game-models'
import { CHECKOUTS } from './checkouts'

// Dartboard segment order (clockwise from top)
const SEGMENT_ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5] as const

export interface BotConfig {
  /** Probability of hitting the intended segment (0–1) */
  segmentAccuracy: number
  /** Probability of hitting the intended multiplier ring (0–1) */
  ringAccuracy: number
  /** Probability of attempting checkout when available (0–1) */
  checkoutIQ: number
  /** Probability of total miss (segment 0) on any throw (0–1) */
  missRate: number
  /** Preferred scoring targets in order of preference */
  scoringTargets: number[]
}

export const BOT_PROFILES: Record<BotDifficulty, BotConfig> = {
  easy: {
    segmentAccuracy: 0.40,
    ringAccuracy: 0.35,
    checkoutIQ: 0.40,
    missRate: 0.15,
    scoringTargets: [20, 19, 18],
  },
  medium: {
    segmentAccuracy: 0.55,
    ringAccuracy: 0.50,
    checkoutIQ: 0.65,
    missRate: 0.08,
    scoringTargets: [20, 19, 18],
  },
  hard: {
    segmentAccuracy: 0.72,
    ringAccuracy: 0.65,
    checkoutIQ: 0.85,
    missRate: 0.03,
    scoringTargets: [20, 19, 18, 17],
  },
  pro: {
    segmentAccuracy: 0.88,
    ringAccuracy: 0.80,
    checkoutIQ: 0.95,
    missRate: 0.01,
    scoringTargets: [20, 19],
  },
}

/** Parse a checkout dart label like "T20", "D16", "19" into a ThrowResult */
export function parseCheckoutDart(label: string): ThrowResult {
  const upper = label.toUpperCase()
  if (upper.startsWith('T')) {
    return { segment: Number.parseInt(upper.slice(1), 10), multiplier: 3 }
  }
  if (upper.startsWith('D')) {
    const seg = Number.parseInt(upper.slice(1), 10)
    return { segment: seg, multiplier: 2 }
  }
  if (upper.startsWith('S')) {
    return { segment: Number.parseInt(upper.slice(1), 10), multiplier: 1 }
  }
  // Plain number = single
  return { segment: Number.parseInt(upper, 10), multiplier: 1 }
}

/** Get adjacent segments on the dartboard (the two physical neighbors) */
function getAdjacentSegments(segment: number): [number, number] {
  if (segment === 25)
    return [20, 20] // bull → fallback to 20
  const idx = SEGMENT_ORDER.indexOf(segment as typeof SEGMENT_ORDER[number])
  if (idx === -1)
    return [20, 20]
  const left = SEGMENT_ORDER[(idx - 1 + 20) % 20]!
  const right = SEGMENT_ORDER[(idx + 1) % 20]!
  return [left, right]
}

/** Generate a miss result — either total miss or adjacent segment hit */
function generateMissedSegment(intended: number, config: BotConfig): number {
  // Total miss check
  if (Math.random() < config.missRate)
    return 0

  // Hit adjacent segment
  const [left, right] = getAdjacentSegments(intended)
  return Math.random() < 0.5 ? left : right
}

/** Generate the multiplier the bot actually hits when aiming for a specific ring */
function generateActualMultiplier(intended: Multiplier, config: BotConfig): Multiplier {
  if (Math.random() < config.ringAccuracy)
    return intended

  // Missed the ring — land on an adjacent ring
  if (intended === 3) {
    // Aiming for treble, miss to single (inner or outer)
    return 1
  }
  if (intended === 2) {
    // Aiming for double, miss to single or off the board
    return Math.random() < 0.7 ? 1 : 1 // always single on miss
  }
  // Aiming for single, occasionally hit double or treble
  return Math.random() < 0.3 ? 2 : 1
}

/**
 * Generate a single bot throw.
 *
 * @param remainingScore - Bot's remaining score
 * @param dartsLeft - Darts remaining in this turn (1–3)
 * @param difficulty - Bot difficulty level
 * @param checkoutMode - Game checkout mode (double_out / single_out)
 */
export function generateBotThrow(
  remainingScore: number,
  dartsLeft: number,
  difficulty: BotDifficulty,
  checkoutMode: CheckoutMode,
): ThrowResult {
  const config = BOT_PROFILES[difficulty]

  // ── Checkout mode: try to follow checkout table ──
  if (checkoutMode === 'double_out' && remainingScore <= 170 && remainingScore >= 2) {
    const path = CHECKOUTS[remainingScore]
    if (path && path.length <= dartsLeft && Math.random() < config.checkoutIQ) {
      return attemptCheckoutDart(path[0]!, config)
    }
  }

  if (checkoutMode === 'single_out' && remainingScore <= 60) {
    // Simple single out: just aim to score exactly what's needed
    if (remainingScore <= 20) {
      return attemptThrow(remainingScore, 1, config)
    }
    if (remainingScore <= 40 && remainingScore % 2 === 0) {
      return attemptThrow(remainingScore / 2, 2, config)
    }
  }

  // ── Scoring mode: aim for high-value trebles ──
  return generateScoringThrow(remainingScore, config, checkoutMode)
}

/** Attempt to hit a specific checkout dart (from the checkout table) */
function attemptCheckoutDart(dartLabel: string, config: BotConfig): ThrowResult {
  const intended = parseCheckoutDart(dartLabel)
  return attemptThrow(intended.segment, intended.multiplier, config)
}

/** Attempt to hit a specific segment + multiplier with accuracy-based misses */
function attemptThrow(segment: number, multiplier: Multiplier, config: BotConfig): ThrowResult {
  // Bull handling
  if (segment === 25) {
    if (Math.random() < config.segmentAccuracy) {
      // Hit the bull area
      const actualMult = generateActualMultiplier(multiplier, config)
      return { segment: 25, multiplier: actualMult }
    }
    // Miss bull entirely — land on a random segment single
    const randomSeg = SEGMENT_ORDER[Math.floor(Math.random() * 20)]!
    return { segment: randomSeg, multiplier: 1 }
  }

  // Segment accuracy check
  let actualSegment: number
  if (Math.random() < config.segmentAccuracy) {
    actualSegment = segment
  }
  else {
    actualSegment = generateMissedSegment(segment, config)
  }

  if (actualSegment === 0) {
    return { segment: 0, multiplier: 1 }
  }

  // Multiplier accuracy check
  const actualMultiplier = generateActualMultiplier(multiplier, config)

  return { segment: actualSegment, multiplier: actualMultiplier }
}

/** Generate a scoring throw (not aiming for checkout) */
function generateScoringThrow(
  remainingScore: number,
  config: BotConfig,
  checkoutMode: CheckoutMode,
): ThrowResult {
  // Don't bust: if remaining is low, be more careful
  if (checkoutMode === 'double_out' && remainingScore <= 60) {
    // Set up for a double — aim for single to leave an even number
    const targetSingle = Math.min(remainingScore - 2, 20) // leave at least 2
    if (targetSingle > 0) {
      return attemptThrow(targetSingle, 1, config)
    }
  }

  // Standard scoring: aim for treble on preferred targets
  const target = config.scoringTargets[Math.floor(Math.random() * config.scoringTargets.length)]!
  return attemptThrow(target, 3, config)
}
