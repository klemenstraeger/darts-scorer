import type { ThrowResult, Turn } from '~/types/game'
import { throwLabel, throwPoints, turnTotal } from '~/types/game'

/**
 * Format a throw for display: "T20 (60)" or "MISS (0)"
 */
export function formatThrow(t: ThrowResult): string {
  return `${throwLabel(t)} (${throwPoints(t)})`
}

/**
 * Format a turn summary: "T20 S19 D16 = 99" or "BUST"
 */
export function formatTurn(turn: Turn): string {
  if (turn.busted) {
    const labels = turn.throws.map(t => throwLabel(t)).join(' ')
    return `${labels} - BUST`
  }
  const labels = turn.throws.map(t => throwLabel(t)).join(' ')
  return `${labels} = ${turnTotal(turn)}`
}

/**
 * Format remaining score with checkout suggestion if <= 170.
 */
export function formatScore(score: number): string {
  return score.toString()
}
