<script setup lang="ts">
import type { GameState } from '~/types/game'
import type {
  TournamentFormat,
  TournamentMatch,
  TournamentStanding,
  TournamentParticipant,
} from '~/types/tournament'

definePageMeta({ layout: 'spectate' })

const route = useRoute()
const tournamentId = computed(() => Number(route.params.id))

const colorMode = useColorMode()
let originalMode: string | null = null

const { injectPlayers } = usePlayers()

// Broadcast (WebRTC viewer)
const { state: viewerState, remoteStream, handleOffer, handleBroadcastEnded } = useViewer(tournamentId)
const broadcastActive = computed(() => viewerState.value !== 'idle')

// State
interface TournamentInfo {
  id: number
  name: string
  format: TournamentFormat
  status: string
  gameMode: string
  checkout: string
  legsToWin: number
  setsToWin: number
  groupCount: number | null
  advancePerGroup: number | null
  winnerName: string | null
  playerCount: number
}

interface PlayerStatsData {
  three_dart_average: number
  count_180: number
  count_140_plus: number
  count_100_plus: number
  highest_turn: number | null
}

const tournament = ref<TournamentInfo | null>(null)
const participants = ref<TournamentParticipant[]>([])
const matches = ref<TournamentMatch[]>([])
const standings = ref<TournamentStanding[]>([])
const playerStats = ref<Record<string, PlayerStatsData>>({})
const liveGame = ref<{ matchId: number; state: GameState } | null>(null)
const loading = ref(true)
const error = ref('')
let pollTimer: ReturnType<typeof setInterval> | null = null

async function fetchData() {
  try {
    const data = await $fetch<{
      tournament: TournamentInfo
      participants: TournamentParticipant[]
      matches: TournamentMatch[]
      standings: TournamentStanding[]
      players: { name: string; avatarStyle: string | null; avatarSeed: string | null }[]
      playerStats: Record<string, PlayerStatsData>
      liveGame: { matchId: number; state: GameState } | null
      broadcast: { status: string; offer: unknown; hasAnswer: boolean } | null
    }>(`/api/spectate/${tournamentId.value}`)

    tournament.value = data.tournament
    participants.value = data.participants
    matches.value = data.matches
    standings.value = data.standings
    playerStats.value = data.playerStats
    liveGame.value = data.liveGame

    // Handle broadcast signaling
    if (data.broadcast?.offer && data.broadcast.status === 'waiting') {
      handleOffer(data.broadcast.offer, data.broadcast.hasAnswer)
    } else if (!data.broadcast) {
      handleBroadcastEnded()
    }

    // Inject player avatar data into the shared usePlayers composable
    if (data.players.length > 0) {
      injectPlayers(data.players.map((p, i) => ({
        id: i,
        name: p.name,
        avatarStyle: p.avatarStyle,
        avatarSeed: p.avatarSeed,
        createdAt: '',
      })))
    }

    error.value = ''
  } catch (e: any) {
    error.value = e.data?.message || 'Failed to load tournament'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // Force dark mode for TV/projector
  originalMode = colorMode.preference
  colorMode.preference = 'dark'

  fetchData()
  pollTimer = setInterval(fetchData, 2000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  // Restore original color mode
  if (originalMode) colorMode.preference = originalMode
})

const isLive = computed(() => liveGame.value !== null)

const liveMatchId = computed(() => liveGame.value?.matchId)
</script>

<template>
  <div class="spectate-page">
    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <span class="text-fg-muted text-sm">Loading tournament...</span>
    </div>

    <!-- Error -->
    <div v-else-if="error && !tournament" class="error-state">
      <p class="text-red text-lg font-bold">{{ error }}</p>
    </div>

    <!-- Spectate dashboard -->
    <template v-else-if="tournament">
      <SpectatorHeader
        :name="tournament.name"
        :format="tournament.format"
        :game-mode="tournament.gameMode"
        :checkout="tournament.checkout"
        :legs-to-win="tournament.legsToWin"
        :sets-to-win="tournament.setsToWin"
        :is-live="isLive"
        :winner-name="tournament.winnerName"
      />

      <!-- State 1: Live + Camera — quad grid -->
      <div v-if="liveGame && broadcastActive" class="dashboard quad-panel">
        <div class="panel panel-camera">
          <SpectatorVideoStream :stream="remoteStream" :status="viewerState" />
        </div>
        <div class="panel panel-scores">
          <SpectatorLiveGame :game-state="liveGame.state" />
        </div>
        <div class="panel panel-tournament">
          <SpectatorTournamentView
            :format="tournament.format"
            :matches="matches"
            :standings="standings"
            :group-count="tournament.groupCount"
            :advance-per-group="tournament.advancePerGroup"
            :live-match-id="liveMatchId"
            compact
          />
        </div>
        <div class="panel panel-stats">
          <SpectatorPlayerStats
            :participants="participants"
            :matches="matches"
            :player-stats="playerStats"
          />
        </div>
      </div>

      <!-- State 2: Live + No Camera — tri-panel -->
      <div v-else-if="liveGame" class="dashboard tri-panel">
        <div class="panel panel-live">
          <SpectatorLiveGame :game-state="liveGame.state" />
        </div>
        <div class="panel panel-tournament">
          <SpectatorTournamentView
            :format="tournament.format"
            :matches="matches"
            :standings="standings"
            :group-count="tournament.groupCount"
            :advance-per-group="tournament.advancePerGroup"
            :live-match-id="liveMatchId"
          />
        </div>
        <div class="panel panel-stats">
          <SpectatorPlayerStats
            :participants="participants"
            :matches="matches"
            :player-stats="playerStats"
          />
        </div>
      </div>

      <!-- State 3: No Live + Camera — camera-split -->
      <div v-else-if="broadcastActive" class="dashboard camera-split">
        <div class="panel panel-camera">
          <SpectatorVideoStream :stream="remoteStream" :status="viewerState" />
        </div>
        <div class="panel panel-sidebar-stack">
          <SpectatorTournamentView
            :format="tournament.format"
            :matches="matches"
            :standings="standings"
            :group-count="tournament.groupCount"
            :advance-per-group="tournament.advancePerGroup"
          />
          <SpectatorPlayerStats
            :participants="participants"
            :matches="matches"
            :player-stats="playerStats"
          />
        </div>
      </div>

      <!-- State 4: No Live + No Camera — split -->
      <div v-else class="dashboard split">
        <div class="main-panel">
          <SpectatorTournamentView
            :format="tournament.format"
            :matches="matches"
            :standings="standings"
            :group-count="tournament.groupCount"
            :advance-per-group="tournament.advancePerGroup"
          />
        </div>
        <div class="side-panel side-scroll">
          <SpectatorPlayerStats
            :participants="participants"
            :matches="matches"
            :player-stats="playerStats"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.spectate-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: var(--surface-0);
}

.loading-state,
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.dashboard {
  flex: 1;
  min-height: 0;
  padding: var(--spacing-md);
  display: grid;
  gap: var(--spacing-md);
}

/* ── State 1: Quad-panel (live + camera) ── */
.dashboard.quad-panel {
  grid-template-columns: 3fr 2fr;
  grid-template-rows: minmax(0, 3fr) minmax(0, 2fr);
}

/* ── State 2: Tri-panel (live, no camera) ── */
.dashboard.tri-panel {
  grid-template-columns: 2fr 3fr 2fr;
}

/* ── State 3: Camera-split (no live, camera active) ── */
.dashboard.camera-split {
  grid-template-columns: 3fr 2fr;
}

/* ── State 4: Split (no live, no camera) ── */
.dashboard.split {
  grid-template-columns: 3fr 2fr;
}

/* ── Panel defaults ── */
.panel {
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Camera panel: center video, no scroll */
.panel-camera {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.panel-camera :deep(.video-container) {
  max-height: 100%;
  width: auto;
  max-width: 100%;
}

/* Sidebar stack for State 3 */
.panel-sidebar-stack {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  overflow-y: auto;
  min-height: 0;
}

/* Split layout panels */
.main-panel {
  min-height: 0;
  overflow: hidden;
}

.side-panel {
  min-height: 0;
  overflow: hidden;
}

.side-panel.side-scroll {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
</style>
