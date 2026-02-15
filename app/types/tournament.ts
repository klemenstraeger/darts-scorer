/** Tournament domain types matching server schema. */

export type TournamentFormat = 'knockout' | 'league' | 'group_only' | 'group_knockout'
export type TournamentStatus = 'created' | 'in_progress' | 'completed'
export type MatchStatus = 'pending' | 'in_progress' | 'completed'
export type MatchPhase = 'group' | 'knockout' | 'main'

export interface TournamentSummary {
  id: number
  name: string
  format: TournamentFormat
  status: TournamentStatus
  gameMode: string
  checkout: string
  legsToWin: number
  setsToWin: number
  playerCount: number
  winnerName: string | null
  createdAt: string
  updatedAt: string
}

export interface TournamentDetail extends TournamentSummary {
  groupCount: number | null
  advancePerGroup: number | null
  participants: TournamentParticipant[]
  matches: TournamentMatch[]
  standings: TournamentStanding[]
}

export interface TournamentParticipant {
  id: number
  playerName: string
  seed: number
  groupIndex: number | null
}

export interface TournamentMatch {
  id: number
  tournamentId: number
  round: number
  position: number
  phase: MatchPhase
  groupIndex: number | null
  player1Name: string | null
  player2Name: string | null
  winnerName: string | null
  loserName: string | null
  status: MatchStatus
  gameId: number | null
  player1LegsWon: number
  player2LegsWon: number
  scheduledAt: string | null
  createdAt: string
}

export interface TournamentStanding {
  id: number
  playerName: string
  groupIndex: number | null
  played: number
  won: number
  lost: number
  points: number
  legsWon: number
  legsLost: number
  legDifference: number
}

export const FORMAT_LABELS: Record<TournamentFormat, string> = {
  knockout: 'Knockout',
  league: 'League',
  group_only: 'Groups',
  group_knockout: 'Groups + Knockout',
}

export const FORMAT_COLORS: Record<TournamentFormat, string> = {
  knockout: 'red',
  league: 'blue',
  group_only: 'green',
  group_knockout: 'purple',
}
