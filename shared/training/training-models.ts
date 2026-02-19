/** Domain models for the darts training mode feature. */

import type { Multiplier } from '../game-models'

// ── Training Mode Types ──────────────────────────────────────

export type TrainingMode
  = | 'scoring-practice'
    | 'around-the-clock'
    | 'bobs-27'
    | 'hundred-darts'
    | 'cricket'
    | 'checkout-practice'
    | 'shanghai'

export type AroundTheClockVariant = 'singles' | 'doubles' | 'trebles'

export interface TrainingConfig {
  mode: TrainingMode
  /** Mode-specific options */
  rounds?: number
  targetScore?: number
  variant?: AroundTheClockVariant
  targetSegment?: number // for hundred-darts
}

export interface TrainingThrowRecord {
  segment: number
  multiplier: Multiplier
  points: number
}

// ── Per-Mode State Interfaces ────────────────────────────────

export interface TrainingStateBase {
  mode: TrainingMode
  config: TrainingConfig
  throws: TrainingThrowRecord[]
  isComplete: boolean
  startedAt: string
  completedAt: string | null
}

export interface ScoringPracticeState extends TrainingStateBase {
  mode: 'scoring-practice'
  currentRound: number
  totalRounds: number
  roundScores: number[]
  currentRoundThrows: number
  threshold: number
}

export interface AroundTheClockState extends TrainingStateBase {
  mode: 'around-the-clock'
  targets: number[] // [1..20, 25]
  currentTargetIndex: number
  variant: AroundTheClockVariant
  totalDarts: number
}

export interface Bobs27State extends TrainingStateBase {
  mode: 'bobs-27'
  score: number
  currentRound: number // 1-21 (D1-D20, DBull)
  totalRounds: 21
  roundResults: ('hit' | 'miss' | null)[]
  currentRoundHits: number
  currentRoundThrows: number
  isFailed: boolean
}

export interface HundredDartsState extends TrainingStateBase {
  mode: 'hundred-darts'
  targetSegment: number
  totalDarts: number
  dartsThrown: number
  hits: number
  totalScore: number
}

export interface CricketState extends TrainingStateBase {
  mode: 'cricket'
  /** Marks per target: { 15: 0, 16: 0, ..., 20: 0, 25: 0 } */
  marks: Record<number, number>
  targets: number[] // [15, 16, 17, 18, 19, 20, 25]
  totalDarts: number
}

export interface CheckoutPracticeState extends TrainingStateBase {
  mode: 'checkout-practice'
  currentTarget: number
  attempts: number
  successes: number
  totalAttempts: number
  currentAttemptThrows: number
  targets: number[] // history of targets
}

export interface ShanghaiState extends TrainingStateBase {
  mode: 'shanghai'
  currentRound: number // 1-20
  totalRounds: 20
  roundScores: number[]
  currentRoundThrows: number
  totalScore: number
  shanghaiCount: number
  /** Track per-round if S, D, T were hit for shanghai detection */
  currentRoundHits: { single: boolean, double: boolean, treble: boolean }
}

// ── Discriminated Union ──────────────────────────────────────

export type TrainingModeState
  = | ScoringPracticeState
    | AroundTheClockState
    | Bobs27State
    | HundredDartsState
    | CricketState
    | CheckoutPracticeState
    | ShanghaiState

// ── Events ───────────────────────────────────────────────────

export type TrainingEvent
  = | 'target_hit'
    | 'target_missed'
    | 'round_complete'
    | 'session_complete'
    | 'shanghai'
    | 'failed'

export interface TrainingThrowResult {
  events: TrainingEvent[]
  state: TrainingModeState
}

// ── Stats Summary (returned by computeStats) ────────────────

export interface TrainingStats {
  mode: TrainingMode
  totalDarts: number
  /** Mode-specific stats as key-value pairs for display */
  [key: string]: unknown
}

// ── Mode Metadata (for UI) ──────────────────────────────────

export interface TrainingModeInfo {
  mode: TrainingMode
  name: string
  description: string
  icon: string
  color: string
}

export const TRAINING_MODES: TrainingModeInfo[] = [
  {
    mode: 'scoring-practice',
    name: 'Scoring Practice',
    description: 'Throw rounds of 3 darts and track your average',
    icon: 'target',
    color: '#22c55e',
  },
  {
    mode: 'around-the-clock',
    name: 'Around the Clock',
    description: 'Hit every number from 1 to 20 plus bull',
    icon: 'clock',
    color: '#3b82f6',
  },
  {
    mode: 'bobs-27',
    name: 'Bob\'s 27',
    description: 'Start at 27, hit doubles to add, miss to subtract',
    icon: 'zap',
    color: '#f59e0b',
  },
  {
    mode: 'hundred-darts',
    name: '100 Darts at Target',
    description: 'Throw 100 darts at a chosen segment',
    icon: 'crosshair',
    color: '#8b5cf6',
  },
  {
    mode: 'cricket',
    name: 'Cricket Practice',
    description: 'Close all cricket numbers: 15-20 and bull',
    icon: 'grid',
    color: '#ec4899',
  },
  {
    mode: 'checkout-practice',
    name: 'Checkout Practice',
    description: 'Practice finishing with random checkout targets',
    icon: 'check-circle',
    color: '#ef4444',
  },
  {
    mode: 'shanghai',
    name: 'Shanghai',
    description: 'Score on each number 1-20, bonus for S+D+T combo',
    icon: 'star',
    color: '#14b8a6',
  },
]
