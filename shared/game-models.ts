/** Domain models for the darts scoring application. */

export type GameMode = '501' | '301'

export type CheckoutMode = 'single_out' | 'double_out'

export type Multiplier = 1 | 2 | 3

export type BotDifficulty = 'easy' | 'medium' | 'hard' | 'pro'

export type InputMode = 'per_dart' | 'per_visit'

export interface PlayerDescriptor {
  name: string
  isBot?: boolean
  botDifficulty?: BotDifficulty
}

export interface ThrowResult {
  segment: number    // 0=miss, 1-20=segment, 25=bull
  multiplier: Multiplier
}

export interface Turn {
  player_index: number
  throws: ThrowResult[]
  busted: boolean
  score_before: number | null
  visitScore?: number  // Set when turn was entered as per-visit total (0-180)
}

export interface Player {
  name: string
  score: number
  legs_won: number
  sets_won: number
  turns: Turn[]
  isBot?: boolean
  botDifficulty?: BotDifficulty
}

export interface GameState {
  mode: GameMode
  checkout: CheckoutMode
  legs_to_win: number
  sets_to_win: number
  players: Player[]
  current_player_index: number
  current_turn: Turn
  is_finished: boolean
  winner_index: number | null
  turn_history: Turn[]
  score_before_turn: number | null
  current_set_legs: number[]
  sets_won: number[]
  leg_starting_player: number
}

// ── Helper functions ──

export function throwPoints(t: ThrowResult): number {
  if (t.segment === 25) return 25 * t.multiplier
  return t.segment * t.multiplier
}

export function throwLabel(t: ThrowResult): string {
  if (t.segment === 0) return 'MISS'
  if (t.segment === 25) return t.multiplier === 2 ? 'DB' : 'SB'
  const prefix = { 1: 'S', 2: 'D', 3: 'T' } as const
  return `${prefix[t.multiplier]}${t.segment}`
}

export function turnTotalPoints(turn: Turn): number {
  if (turn.busted) return 0
  if (turn.visitScore !== undefined) return turn.visitScore
  return turn.throws.reduce((sum, t) => sum + throwPoints(t), 0)
}

export function turnIsComplete(turn: Turn): boolean {
  return turn.visitScore !== undefined || turn.throws.length >= 3 || turn.busted
}

export function isVisitScoreTurn(turn: Turn): boolean {
  return turn.visitScore !== undefined
}

export function createDefaultGameState(): GameState {
  return {
    mode: '501',
    checkout: 'double_out',
    legs_to_win: 1,
    sets_to_win: 1,
    players: [],
    current_player_index: 0,
    current_turn: { player_index: 0, throws: [], busted: false, score_before: null },
    is_finished: false,
    winner_index: null,
    turn_history: [],
    score_before_turn: null,
    current_set_legs: [],
    sets_won: [],
    leg_starting_player: 0,
  }
}

export function threeDartAverage(player: Player): number {
  const completed = player.turns.filter(t => t.visitScore !== undefined || t.throws.length >= 3 || t.busted)
  if (completed.length === 0) return 0
  const total = completed.reduce((sum, t) => sum + turnTotalPoints(t), 0)
  return total / completed.length
}

export function highestTurnScore(player: Player): number {
  if (player.turns.length === 0) return 0
  return Math.max(...player.turns.map(t => turnTotalPoints(t)))
}

export function totalDartsThrown(player: Player): number {
  return player.turns.reduce((sum, t) => sum + t.throws.length, 0)
}

export function getCheckoutDart(player: Player): ThrowResult | null {
  if (player.score !== 0 || player.turns.length === 0) return null
  const lastTurn = player.turns[player.turns.length - 1]!
  if (lastTurn.busted || lastTurn.throws.length === 0) return null
  return lastTurn.throws[lastTurn.throws.length - 1]!
}

export function count180s(player: Player): number {
  return player.turns.filter(t => !t.busted && turnTotalPoints(t) === 180).length
}

export function countTonPlus(player: Player): number {
  return player.turns.filter(t => !t.busted && turnTotalPoints(t) >= 100).length
}
