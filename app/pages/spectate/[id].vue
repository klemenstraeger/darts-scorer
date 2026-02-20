<script setup lang="ts">
import type { GameState } from '~/types/game'
import type {
  TournamentFormat,
  TournamentMatch,
  TournamentParticipant,
  TournamentStanding,
} from '~/types/tournament'

definePageMeta({ layout: 'spectate' })

const route = useRoute()
const tournamentId = computed(() => Number(route.params.id))

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
const liveGame = ref<{ matchId: number, state: GameState } | null>(null)
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
      players: { name: string, avatarStyle: string | null, avatarSeed: string | null }[]
      playerStats: Record<string, PlayerStatsData>
      liveGame: { matchId: number, state: GameState } | null
      broadcast: { status: string, offer: unknown, hasAnswer: boolean } | null
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
    }
    else if (!data.broadcast) {
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
  }
  catch (e: any) {
    error.value = e.data?.message || 'Failed to load tournament'
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
  pollTimer = setInterval(fetchData, 2000)
})

onUnmounted(() => {
  if (pollTimer)
    clearInterval(pollTimer)
})

const isLive = computed(() => liveGame.value !== null)

const liveMatchId = computed(() => liveGame.value?.matchId)
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden bg-surface-0">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center h-screen">
      <span class="text-fg-muted text-sm">Loading tournament...</span>
    </div>

    <!-- Error -->
    <div v-else-if="error && !tournament" class="flex items-center justify-center h-screen">
      <p class="text-red text-lg font-bold">
        {{ error }}
      </p>
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
      <div v-if="liveGame && broadcastActive" class="flex-1 min-h-0 p-md grid grid-cols-[3fr_2fr] grid-rows-[minmax(0,3fr)_minmax(0,2fr)] gap-md">
        <div class="flex items-center justify-center overflow-hidden">
          <SpectatorVideoStream :stream="remoteStream" :status="viewerState" />
        </div>
        <div class="min-h-0 overflow-y-auto overflow-x-hidden">
          <SpectatorLiveGame :game-state="liveGame.state" />
        </div>
        <div class="min-h-0 overflow-y-auto overflow-x-hidden">
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
        <div class="min-h-0 overflow-y-auto overflow-x-hidden">
          <SpectatorPlayerStats
            :participants="participants"
            :matches="matches"
            :player-stats="playerStats"
          />
        </div>
      </div>

      <!-- State 2: Live + No Camera — tri-panel -->
      <div v-else-if="liveGame" class="flex-1 min-h-0 p-md grid grid-cols-[2fr_3fr_2fr] gap-md">
        <div class="min-h-0 overflow-y-auto overflow-x-hidden">
          <SpectatorLiveGame :game-state="liveGame.state" />
        </div>
        <div class="min-h-0 overflow-y-auto overflow-x-hidden">
          <SpectatorTournamentView
            :format="tournament.format"
            :matches="matches"
            :standings="standings"
            :group-count="tournament.groupCount"
            :advance-per-group="tournament.advancePerGroup"
            :live-match-id="liveMatchId"
          />
        </div>
        <div class="min-h-0 overflow-y-auto overflow-x-hidden">
          <SpectatorPlayerStats
            :participants="participants"
            :matches="matches"
            :player-stats="playerStats"
          />
        </div>
      </div>

      <!-- State 3: No Live + Camera — camera-split -->
      <div v-else-if="broadcastActive" class="flex-1 min-h-0 p-md grid grid-cols-[3fr_2fr] gap-md">
        <div class="flex items-center justify-center overflow-hidden">
          <SpectatorVideoStream :stream="remoteStream" :status="viewerState" />
        </div>
        <div class="flex flex-col gap-md overflow-y-auto min-h-0">
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
      <div v-else class="flex-1 min-h-0 p-md grid grid-cols-[3fr_2fr] gap-md">
        <div class="min-h-0 overflow-hidden">
          <SpectatorTournamentView
            :format="tournament.format"
            :matches="matches"
            :standings="standings"
            :group-count="tournament.groupCount"
            :advance-per-group="tournament.advancePerGroup"
          />
        </div>
        <div class="min-h-0 overflow-y-auto flex flex-col gap-md">
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
