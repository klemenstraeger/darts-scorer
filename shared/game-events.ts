/** Game event constants and detection logic for client-side event routing. */

import type { GameState } from './game-models'

export const GameEvent = {
  BUST: 'bust',
  LEG_WON: 'leg_won',
  GAME_OVER: 'game_over',
  DART_SCORED: 'dart_scored',
} as const

export type GameEventType = (typeof GameEvent)[keyof typeof GameEvent]

/**
 * Detect what event occurred after a throw by comparing pre-throw and post-throw state.
 * Call this right after engine.throw() or engine.manualScore().
 */
export function detectThrowEvent(
  prevTurnCount: number,
  prevLegs: number[],
  prevSets: number[],
  state: GameState,
): GameEventType {
  if (state.is_finished) {
    return GameEvent.GAME_OVER
  }

  // Detect leg win: legs_won or sets_won changed
  const legsChanged = state.players.some((p, i) => p.legs_won !== prevLegs[i])
    || state.sets_won.some((s, i) => s !== prevSets[i])

  if (legsChanged) {
    return GameEvent.LEG_WON
  }

  // Detect bust: a new turn was added and it was busted
  const newTurnCompleted = state.turn_history.length > prevTurnCount
  const busted = newTurnCompleted && state.turn_history[state.turn_history.length - 1]!.busted

  if (busted) {
    return GameEvent.BUST
  }

  return GameEvent.DART_SCORED
}
