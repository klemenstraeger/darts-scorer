/**
 * Tournament manager — stateless DB operations (like GameSessionStore).
 * Each method loads from DB, processes, saves back.
 */

import type { GameState } from '../../shared/game-models'
import { and, desc, eq } from 'drizzle-orm'
import {
  tournamentMatches,
  tournamentParticipants,
  tournaments,
  tournamentStandings,
} from '../db/schema'
import {
  generateGroupSchedule,
  generateKnockoutBracket,
  generateRoundRobinSchedule,
} from './tournament-scheduler'

export interface CreateTournamentConfig {
  name: string
  format: 'knockout' | 'league' | 'group_only' | 'group_knockout'
  playerNames: string[]
  gameMode?: string
  checkout?: string
  legsToWin?: number
  setsToWin?: number
  groupCount?: number
  advancePerGroup?: number
}

class TournamentManager {
  async create(userId: string, config: CreateTournamentConfig) {
    const {
      name,
      format,
      playerNames,
      gameMode = '501',
      checkout = 'double_out',
      legsToWin = 1,
      setsToWin = 1,
      groupCount,
      advancePerGroup,
    } = config

    if (playerNames.length < 2) {
      throw createError({ statusCode: 400, message: 'Need at least 2 players' })
    }

    // Insert tournament
    const [tournament] = await db
      .insert(tournaments)
      .values({
        userId,
        name,
        format,
        gameMode,
        checkout,
        legsToWin,
        setsToWin,
        groupCount: groupCount ?? null,
        advancePerGroup: advancePerGroup ?? null,
      })
      .returning()

    const tournamentId = tournament!.id

    // Insert participants
    const participantValues = playerNames.map((pn, i) => ({
      tournamentId,
      playerName: pn,
      seed: i + 1,
      groupIndex: null as number | null,
    }))

    // Generate matches based on format
    if (format === 'knockout') {
      const matchTemplates = generateKnockoutBracket(playerNames)

      await db.insert(tournamentParticipants).values(participantValues)
      if (matchTemplates.length > 0) {
        await db.insert(tournamentMatches).values(
          matchTemplates.map(m => ({ tournamentId, ...m })),
        )
      }
    }
    else if (format === 'league') {
      const matchTemplates = generateRoundRobinSchedule(playerNames)

      await db.insert(tournamentParticipants).values(participantValues)
      if (matchTemplates.length > 0) {
        await db.insert(tournamentMatches).values(
          matchTemplates.map(m => ({ tournamentId, ...m })),
        )
      }

      // Initialize standings
      await db.insert(tournamentStandings).values(
        playerNames.map(pn => ({ tournamentId, playerName: pn })),
      )
    }
    else if (format === 'group_only' || format === 'group_knockout') {
      const gc = groupCount ?? 2
      const apg = advancePerGroup ?? 2
      const { assignments, matches: matchTemplates } = generateGroupSchedule(playerNames, gc)

      // Update participant group assignments
      const participantsWithGroups = participantValues.map((p) => {
        const assignment = assignments.find(a => a.playerName === p.playerName)
        return { ...p, groupIndex: assignment?.groupIndex ?? null }
      })

      await db.insert(tournamentParticipants).values(participantsWithGroups)
      if (matchTemplates.length > 0) {
        await db.insert(tournamentMatches).values(
          matchTemplates.map(m => ({ tournamentId, ...m })),
        )
      }

      // Initialize standings per group
      await db.insert(tournamentStandings).values(
        participantsWithGroups.map(p => ({
          tournamentId,
          playerName: p.playerName,
          groupIndex: p.groupIndex,
        })),
      )

      // Update tournament with actual group config
      await db.update(tournaments)
        .set({ groupCount: gc, advancePerGroup: apg })
        .where(eq(tournaments.id, tournamentId))
    }

    return this.getTournament(userId, tournamentId)
  }

  async startMatch(userId: string, tournamentId: number, matchId: number) {
    // Verify ownership and load match
    const [tournament] = await db
      .select()
      .from(tournaments)
      .where(and(eq(tournaments.id, tournamentId), eq(tournaments.userId, userId)))

    if (!tournament) {
      throw createError({ statusCode: 404, message: 'Tournament not found' })
    }

    const [match] = await db
      .select()
      .from(tournamentMatches)
      .where(and(eq(tournamentMatches.id, matchId), eq(tournamentMatches.tournamentId, tournamentId)))

    if (!match) {
      throw createError({ statusCode: 404, message: 'Match not found' })
    }

    if (match.status !== 'pending') {
      throw createError({ statusCode: 409, message: 'Match is not pending' })
    }

    if (!match.player1Name || !match.player2Name) {
      throw createError({ statusCode: 400, message: 'Match players not yet determined' })
    }

    // Update match status
    await db.update(tournamentMatches)
      .set({ status: 'in_progress' })
      .where(eq(tournamentMatches.id, matchId))

    // Update tournament status if first match
    if (tournament.status === 'created') {
      await db.update(tournaments)
        .set({ status: 'in_progress', updatedAt: new Date() })
        .where(eq(tournaments.id, tournamentId))
    }

    // Return match config for client-side game creation
    return {
      player1Name: match.player1Name,
      player2Name: match.player2Name,
      gameMode: tournament.gameMode,
      checkout: tournament.checkout,
      legsToWin: tournament.legsToWin,
      setsToWin: tournament.setsToWin,
      matchId,
      tournamentId,
    }
  }

  async completeMatch(userId: string, matchId: number, gameState: GameState, gameId: number) {
    const [match] = await db
      .select()
      .from(tournamentMatches)
      .where(eq(tournamentMatches.id, matchId))

    if (!match)
      return

    const winnerIndex = gameState.winner_index
    if (winnerIndex === null)
      return

    const winnerName = gameState.players[winnerIndex]!.name
    const loserIndex = winnerIndex === 0 ? 1 : 0
    const loserName = gameState.players[loserIndex]!.name

    // Map gameState player indices to match player positions.
    // Player at gameState index 0 = match.player1Name, index 1 = match.player2Name
    // (newGame is called with [match.player1Name, match.player2Name])
    // Use current_set_legs for current set + sets_won * legs_to_win for completed sets
    const totalLegsForPlayer = (idx: number): number => {
      const completedSetLegs = (gameState.sets_won[idx] ?? 0) * gameState.legs_to_win
      const currentSetLegs = gameState.current_set_legs[idx] ?? 0
      return completedSetLegs + currentSetLegs
    }

    const p1LegsWon = totalLegsForPlayer(0)
    const p2LegsWon = totalLegsForPlayer(1)

    // Update match
    await db.update(tournamentMatches)
      .set({
        status: 'completed',
        winnerName,
        loserName,
        gameId,
        player1LegsWon: p1LegsWon,
        player2LegsWon: p2LegsWon,
      })
      .where(eq(tournamentMatches.id, matchId))

    // Load tournament
    const [tournament] = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, match.tournamentId))

    if (!tournament)
      return

    if (match.phase === 'knockout') {
      await this.advanceKnockout(match.tournamentId, match, winnerName)
    }
    else if (match.phase === 'group') {
      await this.updateStandings(match.tournamentId, match, winnerName, loserName, p1LegsWon, p2LegsWon)
      await this.checkGroupPhaseComplete(match.tournamentId, tournament.format)
    }
    else if (match.phase === 'main') {
      // League format
      await this.updateStandings(match.tournamentId, match, winnerName, loserName, p1LegsWon, p2LegsWon)
      await this.checkLeagueComplete(match.tournamentId)
    }
  }

  async resetMatch(userId: string, tournamentId: number, matchId: number) {
    const [tournament] = await db
      .select()
      .from(tournaments)
      .where(and(eq(tournaments.id, tournamentId), eq(tournaments.userId, userId)))

    if (!tournament) {
      throw createError({ statusCode: 404, message: 'Tournament not found' })
    }

    await db.update(tournamentMatches)
      .set({ status: 'pending' })
      .where(and(eq(tournamentMatches.id, matchId), eq(tournamentMatches.tournamentId, tournamentId)))
  }

  private async advanceKnockout(tournamentId: number, match: typeof tournamentMatches.$inferSelect, winnerName: string) {
    // Find the next round match
    const nextRound = match.round + 1
    const nextPosition = Math.floor(match.position / 2)
    const isPlayer1 = match.position % 2 === 0

    const [nextMatch] = await db
      .select()
      .from(tournamentMatches)
      .where(and(
        eq(tournamentMatches.tournamentId, tournamentId),
        eq(tournamentMatches.phase, match.phase),
        eq(tournamentMatches.round, nextRound),
        eq(tournamentMatches.position, nextPosition),
      ))

    if (nextMatch) {
      // Place winner in next match
      const updateData = isPlayer1
        ? { player1Name: winnerName }
        : { player2Name: winnerName }

      await db.update(tournamentMatches)
        .set(updateData)
        .where(eq(tournamentMatches.id, nextMatch.id))
    }
    else {
      // No next match — this was the final. Tournament complete!
      await db.update(tournaments)
        .set({ status: 'completed', winnerName, updatedAt: new Date() })
        .where(eq(tournaments.id, tournamentId))
    }
  }

  private async updateStandings(
    tournamentId: number,
    match: typeof tournamentMatches.$inferSelect,
    winnerName: string,
    loserName: string,
    p1Legs: number,
    p2Legs: number,
  ) {
    // p1Legs/p2Legs correspond to match.player1Name/player2Name
    const winnerLegs = winnerName === match.player1Name ? p1Legs : p2Legs
    const loserLegs = winnerName === match.player1Name ? p2Legs : p1Legs

    // Update winner
    const [winnerStanding] = await db
      .select()
      .from(tournamentStandings)
      .where(and(
        eq(tournamentStandings.tournamentId, tournamentId),
        eq(tournamentStandings.playerName, winnerName),
      ))

    if (winnerStanding) {
      await db.update(tournamentStandings)
        .set({
          played: winnerStanding.played + 1,
          won: winnerStanding.won + 1,
          points: winnerStanding.points + 3,
          legsWon: winnerStanding.legsWon + winnerLegs,
          legsLost: winnerStanding.legsLost + loserLegs,
          legDifference: winnerStanding.legDifference + winnerLegs - loserLegs,
        })
        .where(eq(tournamentStandings.id, winnerStanding.id))
    }

    // Update loser
    const [loserStanding] = await db
      .select()
      .from(tournamentStandings)
      .where(and(
        eq(tournamentStandings.tournamentId, tournamentId),
        eq(tournamentStandings.playerName, loserName),
      ))

    if (loserStanding) {
      await db.update(tournamentStandings)
        .set({
          played: loserStanding.played + 1,
          lost: loserStanding.lost + 1,
          legsWon: loserStanding.legsWon + loserLegs,
          legsLost: loserStanding.legsLost + winnerLegs,
          legDifference: loserStanding.legDifference + loserLegs - winnerLegs,
        })
        .where(eq(tournamentStandings.id, loserStanding.id))
    }
  }

  private async checkGroupPhaseComplete(tournamentId: number, format: string) {
    // Check if all group matches are done
    const pendingGroupMatches = await db
      .select()
      .from(tournamentMatches)
      .where(and(
        eq(tournamentMatches.tournamentId, tournamentId),
        eq(tournamentMatches.phase, 'group'),
      ))

    const allDone = pendingGroupMatches.every(m => m.status === 'completed')
    if (!allDone)
      return

    if (format === 'group_knockout') {
      await this.transitionToKnockout(tournamentId)
    }
    else {
      // group_only — find overall winner (most points)
      await this.finishGroupOnly(tournamentId)
    }
  }

  private async checkLeagueComplete(tournamentId: number) {
    const matches = await db
      .select()
      .from(tournamentMatches)
      .where(eq(tournamentMatches.tournamentId, tournamentId))

    const allDone = matches.every(m => m.status === 'completed')
    if (!allDone)
      return

    // League complete — determine winner by points then leg difference
    const standings = await db
      .select()
      .from(tournamentStandings)
      .where(eq(tournamentStandings.tournamentId, tournamentId))

    standings.sort((a, b) => b.points - a.points || b.legDifference - a.legDifference)

    const winner = standings[0]
    if (winner) {
      await db.update(tournaments)
        .set({ status: 'completed', winnerName: winner.playerName, updatedAt: new Date() })
        .where(eq(tournaments.id, tournamentId))
    }
  }

  private async finishGroupOnly(tournamentId: number) {
    const standings = await db
      .select()
      .from(tournamentStandings)
      .where(eq(tournamentStandings.tournamentId, tournamentId))

    standings.sort((a, b) => b.points - a.points || b.legDifference - a.legDifference)

    const winner = standings[0]
    if (winner) {
      await db.update(tournaments)
        .set({ status: 'completed', winnerName: winner.playerName, updatedAt: new Date() })
        .where(eq(tournaments.id, tournamentId))
    }
  }

  private async transitionToKnockout(tournamentId: number) {
    const [tournament] = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, tournamentId))

    if (!tournament)
      return

    const advanceCount = tournament.advancePerGroup ?? 2
    const groupCount = tournament.groupCount ?? 2

    // Get standings per group, sorted
    const allStandings = await db
      .select()
      .from(tournamentStandings)
      .where(eq(tournamentStandings.tournamentId, tournamentId))

    const groupedStandings: Map<number, typeof allStandings> = new Map()
    for (const s of allStandings) {
      const gi = s.groupIndex ?? 0
      if (!groupedStandings.has(gi))
        groupedStandings.set(gi, [])
      groupedStandings.get(gi)!.push(s)
    }

    // Sort each group and take top N
    const advancingPlayers: string[] = []
    for (let g = 0; g < groupCount; g++) {
      const group = groupedStandings.get(g) ?? []
      group.sort((a, b) => b.points - a.points || b.legDifference - a.legDifference)
      const advancing = group.slice(0, advanceCount)
      advancingPlayers.push(...advancing.map(s => s.playerName))
    }

    // Crossover seeding: A1, B1, A2, B2, ... (interleave group positions)
    const seeded: string[] = []
    for (let pos = 0; pos < advanceCount; pos++) {
      for (let g = 0; g < groupCount; g++) {
        const group = groupedStandings.get(g) ?? []
        group.sort((a, b) => b.points - a.points || b.legDifference - a.legDifference)
        if (group[pos]) {
          seeded.push(group[pos]!.playerName)
        }
      }
    }

    // Generate knockout bracket with seeded players
    if (seeded.length >= 2) {
      const knockoutMatches = generateKnockoutBracket(seeded)
      if (knockoutMatches.length > 0) {
        await db.insert(tournamentMatches).values(
          knockoutMatches.map(m => ({ tournamentId, ...m })),
        )
      }
    }
  }

  async getTournament(userId: string, id: number) {
    const [tournament] = await db
      .select()
      .from(tournaments)
      .where(and(eq(tournaments.id, id), eq(tournaments.userId, userId)))

    if (!tournament) {
      throw createError({ statusCode: 404, message: 'Tournament not found' })
    }

    const participants = await db
      .select()
      .from(tournamentParticipants)
      .where(eq(tournamentParticipants.tournamentId, id))

    const matches = await db
      .select()
      .from(tournamentMatches)
      .where(eq(tournamentMatches.tournamentId, id))

    const standings = await db
      .select()
      .from(tournamentStandings)
      .where(eq(tournamentStandings.tournamentId, id))

    return {
      ...tournament,
      playerCount: participants.length,
      participants,
      matches,
      standings,
    }
  }

  async getList(userId: string, status?: string, limit = 50, offset = 0) {
    const query = db
      .select()
      .from(tournaments)
      .where(eq(tournaments.userId, userId))
      .orderBy(desc(tournaments.updatedAt))
      .limit(limit)
      .offset(offset)

    const rows = await query

    // Filter by status in JS if provided (simpler than dynamic where)
    const filtered = status ? rows.filter(r => r.status === status) : rows

    // Get participant counts
    const result = await Promise.all(
      filtered.map(async (t) => {
        const [_countRow] = await db
          .select()
          .from(tournamentParticipants)
          .where(eq(tournamentParticipants.tournamentId, t.id))

        const participants = await db
          .select()
          .from(tournamentParticipants)
          .where(eq(tournamentParticipants.tournamentId, t.id))

        return { ...t, playerCount: participants.length }
      }),
    )

    return result
  }

  async deleteTournament(userId: string, id: number) {
    const [tournament] = await db
      .select()
      .from(tournaments)
      .where(and(eq(tournaments.id, id), eq(tournaments.userId, userId)))

    if (!tournament) {
      throw createError({ statusCode: 404, message: 'Tournament not found' })
    }

    if (tournament.status === 'in_progress') {
      throw createError({ statusCode: 409, message: 'Cannot delete an in-progress tournament' })
    }

    await db.delete(tournaments).where(eq(tournaments.id, id))
    return { deleted: true }
  }

  async scheduleFixtures(
    userId: string,
    tournamentId: number,
    startDate: string,
    intervalDays: number = 7,
    matchesPerDay: number = 4,
  ) {
    // Verify ownership
    const [tournament] = await db
      .select()
      .from(tournaments)
      .where(and(eq(tournaments.id, tournamentId), eq(tournaments.userId, userId)))

    if (!tournament) {
      throw createError({ statusCode: 404, message: 'Tournament not found' })
    }

    // Only schedule league / group formats (they have fixed match lists)
    if (tournament.format === 'knockout') {
      throw createError({ statusCode: 400, message: 'Knockout tournaments do not support fixture scheduling' })
    }

    // Load all pending/in_progress matches (don't reschedule completed ones)
    const matches = await db
      .select()
      .from(tournamentMatches)
      .where(and(
        eq(tournamentMatches.tournamentId, tournamentId),
      ))

    // Sort matches by round then position for deterministic ordering
    const sortedMatches = [...matches].sort((a, b) => {
      if (a.round !== b.round)
        return a.round - b.round
      return a.position - b.position
    })

    // Distribute matches across dates
    const start = new Date(startDate)
    if (Number.isNaN(start.getTime())) {
      throw createError({ statusCode: 400, message: 'Invalid start date' })
    }

    let currentDate = new Date(start)
    let matchesOnCurrentDate = 0

    for (const match of sortedMatches) {
      if (matchesOnCurrentDate >= matchesPerDay) {
        currentDate = new Date(currentDate.getTime() + intervalDays * 24 * 60 * 60 * 1000)
        matchesOnCurrentDate = 0
      }

      await db.update(tournamentMatches)
        .set({ scheduledAt: new Date(currentDate) })
        .where(eq(tournamentMatches.id, match.id))

      matchesOnCurrentDate++
    }

    return this.getTournament(userId, tournamentId)
  }

  async getMatchTournamentId(matchId: number): Promise<number | null> {
    const [row] = await db
      .select({ tournamentId: tournamentMatches.tournamentId })
      .from(tournamentMatches)
      .where(eq(tournamentMatches.id, matchId))

    return row?.tournamentId ?? null
  }
}

export const tournamentManager = new TournamentManager()
