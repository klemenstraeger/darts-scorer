export interface TeamMember {
  id: number
  playerName: string
  position: number
}

export interface TeamRecord {
  id: number
  name: string
  members: readonly TeamMember[]
  createdAt: string
}

// Module-level shared state — singleton across all components
const teams = ref<TeamRecord[]>([])
let fetchPromise: Promise<void> | null = null

async function fetchTeams() {
  try {
    teams.value = await $fetch<TeamRecord[]>('/api/teams')
  }
  catch {
    // silently fail — list stays empty
  }
  fetchPromise = null
}

export function useTeams() {
  function ensureLoaded() {
    if (teams.value.length === 0 && !fetchPromise) {
      fetchPromise = fetchTeams()
    }
  }

  function getTeamByName(name: string): TeamRecord | undefined {
    return teams.value.find(t => t.name === name)
  }

  return {
    teams: readonly(teams),
    fetchTeams,
    ensureLoaded,
    getTeamByName,
  }
}
