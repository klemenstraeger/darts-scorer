/**
 * Track whether the current active game is a tournament match.
 * Context is set when starting a match and restored from localStorage via useGameState.loadState().
 */

const tournamentMatchId = ref<number | null>(null)
const tournamentId = ref<number | null>(null)

export function useTournamentContext() {
  const isTournamentMatch = computed(() => !!tournamentMatchId.value)

  function setContext(matchId: number, tId: number) {
    tournamentMatchId.value = matchId
    tournamentId.value = tId
  }

  function clear() {
    tournamentMatchId.value = null
    tournamentId.value = null
  }

  return {
    isTournamentMatch,
    tournamentMatchId: readonly(tournamentMatchId),
    tournamentId: readonly(tournamentId),
    setContext,
    clear,
  }
}
