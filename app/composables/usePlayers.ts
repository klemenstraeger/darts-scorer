export interface PlayerRecord {
  id: number
  name: string
  avatarStyle: string | null
  avatarSeed: string | null
  createdAt: string
}

// Module-level shared state — singleton across all components
const players = ref<PlayerRecord[]>([])
let fetchPromise: Promise<void> | null = null

async function fetchPlayers() {
  try {
    players.value = await $fetch<PlayerRecord[]>('/api/players')
  }
  catch {
    // silently fail — list stays empty
  }
  fetchPromise = null
}

export function usePlayers() {
  function ensureLoaded() {
    if (players.value.length === 0 && !fetchPromise) {
      fetchPromise = fetchPlayers()
    }
  }

  function getPlayerByName(name: string): PlayerRecord | undefined {
    return players.value.find(p => p.name === name)
  }

  function getAvatarProps(name: string) {
    const player = getPlayerByName(name)
    return {
      name,
      avatarSeed: player?.avatarSeed ?? null,
      avatarStyle: player?.avatarStyle ?? null,
    }
  }

  function injectPlayers(records: PlayerRecord[]) {
    players.value = records
  }

  async function createPlayer(data: { name: string, avatarStyle?: string, avatarSeed?: string }): Promise<{ ok: boolean, error?: string }> {
    try {
      await $fetch('/api/players', { method: 'POST', body: data })
      await fetchPlayers()
      return { ok: true }
    }
    catch (e: any) {
      return { ok: false, error: e.data?.message || 'Failed to create player' }
    }
  }

  return {
    players: readonly(players),
    fetchPlayers,
    ensureLoaded,
    getPlayerByName,
    getAvatarProps,
    createPlayer,
    injectPlayers,
  }
}
