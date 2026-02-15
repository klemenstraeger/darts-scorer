<script setup lang="ts">
import type { TournamentDetail, TournamentMatch, TournamentStanding } from '~/types/tournament'
import { FORMAT_LABELS } from '~/types/tournament'

const route = useRoute()
const tournamentId = computed(() => Number(route.params.id))

const { hasActiveGame, checkActiveGame, hasGame, newGame } = useGameState()
const { setContext } = useTournamentContext()
const { ensureLoaded: ensurePlayers } = usePlayers()

const tournament = ref<TournamentDetail | null>(null)
const loading = ref(true)
const error = ref('')
const playingMatch = ref(false)
const selectedGroup = ref(0)
const activeTab = ref<'groups' | 'knockout'>('groups')
const confirmMatchId = ref<number | null>(null)
const spectateUrlCopied = ref(false)
const cameraUrlCopied = ref(false)

function copySpectateUrl() {
  const url = `${window.location.origin}/spectate/${tournamentId.value}`
  navigator.clipboard.writeText(url)
  spectateUrlCopied.value = true
  setTimeout(() => { spectateUrlCopied.value = false }, 2000)
}

function copyCameraUrl() {
  const url = `${window.location.origin}/camera/${tournamentId.value}`
  navigator.clipboard.writeText(url)
  cameraUrlCopied.value = true
  setTimeout(() => { cameraUrlCopied.value = false }, 2000)
}

async function fetchTournament() {
  loading.value = true
  error.value = ''
  try {
    tournament.value = await $fetch<TournamentDetail>(`/api/tournament/${tournamentId.value}`)
  } catch (e: any) {
    error.value = e.data?.message || 'Failed to load tournament'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTournament()
  checkActiveGame()
  ensurePlayers()
})

// Computed helpers
const isKnockout = computed(() => tournament.value?.format === 'knockout')
const isLeague = computed(() => tournament.value?.format === 'league')
const isGroupOnly = computed(() => tournament.value?.format === 'group_only')
const isGroupKnockout = computed(() => tournament.value?.format === 'group_knockout')
const hasGroups = computed(() => isGroupOnly.value || isGroupKnockout.value)

const knockoutMatches = computed(() =>
  tournament.value?.matches.filter(m => m.phase === 'knockout') ?? [],
)

const groupMatches = computed(() =>
  tournament.value?.matches.filter(m => m.phase === 'group') ?? [],
)

const leagueMatches = computed(() =>
  tournament.value?.matches.filter(m => m.phase === 'main') ?? [],
)

const currentGroupMatches = computed(() =>
  groupMatches.value.filter(m => m.groupIndex === selectedGroup.value),
)

const currentGroupStandings = computed(() =>
  (tournament.value?.standings ?? []).filter(s => s.groupIndex === selectedGroup.value),
)

const leagueStandings = computed(() =>
  tournament.value?.standings ?? [],
)

const hasKnockoutPhase = computed(() => knockoutMatches.value.length > 0)
const groupPhaseDone = computed(() =>
  groupMatches.value.length > 0 && groupMatches.value.every(m => m.status === 'completed'),
)

// Settings summary
const settingsSummary = computed(() => {
  if (!tournament.value) return ''
  const t = tournament.value
  const parts = [t.gameMode, t.checkout === 'double_out' ? 'DO' : 'SO']
  if (t.legsToWin > 1) parts.push(`${t.legsToWin} legs`)
  if (t.setsToWin > 1) parts.push(`${t.setsToWin} sets`)
  return parts.join(' / ')
})

function playMatch(matchId: number) {
  // Check if there's an active game that would be replaced
  if (hasActiveGame.value || hasGame.value) {
    confirmMatchId.value = matchId
    return
  }
  doPlayMatch(matchId)
}

async function doPlayMatch(matchId: number) {
  confirmMatchId.value = null
  if (playingMatch.value) return
  playingMatch.value = true
  try {
    const config = await $fetch<{
      player1Name: string
      player2Name: string
      gameMode: string
      checkout: string
      legsToWin: number
      setsToWin: number
      matchId: number
      tournamentId: number
    }>(`/api/tournament/${tournamentId.value}/match/${matchId}/start`, {
      method: 'POST',
    })
    newGame(config.gameMode, [config.player1Name, config.player2Name], {
      checkout: config.checkout,
      legs_to_win: config.legsToWin,
      sets_to_win: config.setsToWin,
    })
    setContext(config.matchId, config.tournamentId)
    navigateTo('/game')
  } catch (e: any) {
    error.value = e.data?.message || 'Failed to start match'
    playingMatch.value = false
  }
}

async function deleteTournament() {
  if (!confirm('Delete this tournament?')) return
  try {
    await $fetch(`/api/tournament/${tournamentId.value}`, { method: 'DELETE' })
    navigateTo('/tournaments')
  } catch (e: any) {
    error.value = e.data?.message || 'Failed to delete'
  }
}
</script>

<template>
  <div class="flex flex-col items-center gap-xl px-lg py-xl max-w-[900px] mx-auto w-full max-sm:px-md">
    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-2xl w-full">
      <span class="text-fg-muted text-sm">Loading...</span>
    </div>

    <!-- Error -->
    <div v-else-if="error && !tournament" class="glass-card w-full p-2xl text-center">
      <p class="text-red text-[0.9rem] font-semibold">{{ error }}</p>
      <NuxtLink to="/tournaments" class="btn btn-secondary mt-md">Back to Tournaments</NuxtLink>
    </div>

    <!-- Tournament detail -->
    <template v-else-if="tournament">
      <!-- Header -->
      <div class="w-full flex flex-col gap-sm">
        <div class="flex flex-col gap-sm sm:flex-row sm:items-start sm:justify-between sm:gap-md">
          <div class="flex flex-col gap-xs min-w-0">
            <h1 class="text-[1.8rem] font-black text-fg leading-tight truncate max-sm:text-[1.3rem]">
              {{ tournament.name }}
            </h1>
            <div class="flex items-center gap-sm flex-wrap">
              <FormatBadge :format="tournament.format" />
              <span class="text-[0.75rem] text-fg-muted">{{ settingsSummary }}</span>
              <span class="text-[0.75rem] text-fg-muted">{{ tournament.playerCount }} players</span>
            </div>
          </div>
          <div class="flex items-center gap-sm shrink-0 flex-wrap">
            <span
              v-if="tournament.status === 'completed' && tournament.winnerName"
              class="text-[0.85rem] font-bold text-gold"
            >
              Winner: {{ tournament.winnerName }}
            </span>
            <button
              class="btn btn-secondary text-[0.75rem]"
              @click="copySpectateUrl"
            >
              {{ spectateUrlCopied ? 'Copied!' : 'Spectate URL' }}
            </button>
            <button
              class="btn btn-secondary text-[0.75rem]"
              @click="copyCameraUrl"
            >
              {{ cameraUrlCopied ? 'Copied!' : 'Camera URL' }}
            </button>
            <button
              v-if="tournament.status !== 'in_progress'"
              class="btn btn-danger text-[0.75rem]"
              @click="deleteTournament"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Error banner -->
      <div v-if="error" class="w-full text-red text-[0.85rem] font-semibold text-center">{{ error }}</div>

      <!-- Knockout format -->
      <div v-if="isKnockout" class="w-full flex flex-col gap-lg">
        <span class="text-[0.75rem] font-semibold text-fg-muted uppercase tracking-widest">Bracket</span>
        <KnockoutBracket
          :matches="knockoutMatches"
          show-play-button
          @play="playMatch"
        />
      </div>

      <!-- League format -->
      <template v-if="isLeague">
        <div class="w-full flex flex-col gap-lg">
          <span class="text-[0.75rem] font-semibold text-fg-muted uppercase tracking-widest">Standings</span>
          <div class="glass-card p-md">
            <StandingsTable :standings="leagueStandings" />
          </div>
        </div>

        <div class="w-full flex flex-col gap-md">
          <span class="text-[0.75rem] font-semibold text-fg-muted uppercase tracking-widest">Matches</span>
          <div class="flex flex-col gap-sm">
            <MatchCard
              v-for="match in leagueMatches"
              :key="match.id"
              :match="match"
              show-play-button
              @play="playMatch"
            />
          </div>
        </div>
      </template>

      <!-- Group formats -->
      <template v-if="hasGroups">
        <!-- Tab switch for group_knockout when knockout is available -->
        <div v-if="isGroupKnockout && hasKnockoutPhase" class="w-full">
          <div class="mode-toggle">
            <button
              class="mode-option"
              :class="{ active: activeTab === 'groups' }"
              @click="activeTab = 'groups'"
            >
              Groups
            </button>
            <button
              class="mode-option"
              :class="{ active: activeTab === 'knockout' }"
              @click="activeTab = 'knockout'"
            >
              Knockout
            </button>
            <div
              class="mode-pill"
              :style="{ transform: activeTab === 'knockout' ? 'translateX(100%)' : 'translateX(0)' }"
            ></div>
          </div>
        </div>

        <!-- Groups view -->
        <template v-if="activeTab === 'groups' || !hasKnockoutPhase">
          <div class="w-full flex flex-col gap-lg">
            <GroupTabs
              v-if="tournament.groupCount && tournament.groupCount > 1"
              :group-count="tournament.groupCount"
              v-model="selectedGroup"
            />

            <div class="glass-card p-md">
              <StandingsTable
                :standings="currentGroupStandings"
                :advance-count="isGroupKnockout ? tournament.advancePerGroup ?? undefined : undefined"
              />
            </div>

            <div class="flex flex-col gap-sm">
              <span class="text-[0.75rem] font-semibold text-fg-muted uppercase tracking-widest">Matches</span>
              <MatchCard
                v-for="match in currentGroupMatches"
                :key="match.id"
                :match="match"
                show-play-button
                @play="playMatch"
              />
              <div v-if="currentGroupMatches.length === 0" class="text-[0.8rem] text-fg-muted text-center py-md">
                No matches in this group
              </div>
            </div>
          </div>
        </template>

        <!-- Knockout view (group_knockout after transition) -->
        <template v-if="activeTab === 'knockout' && hasKnockoutPhase">
          <div class="w-full flex flex-col gap-lg">
            <span class="text-[0.75rem] font-semibold text-fg-muted uppercase tracking-widest">Knockout Stage</span>
            <KnockoutBracket
              :matches="knockoutMatches"
              show-play-button
              @play="playMatch"
            />
          </div>
        </template>

        <!-- Group phase complete notice -->
        <div
          v-if="groupPhaseDone && isGroupKnockout && !hasKnockoutPhase"
          class="glass-card w-full p-lg text-center"
        >
          <p class="text-fg-muted text-[0.85rem]">Group phase complete. Knockout bracket generating...</p>
        </div>
      </template>
    </template>

    <!-- Abandon game confirm modal -->
    <Teleport to="body">
      <div v-if="confirmMatchId" class="modal-overlay" @click.self="confirmMatchId = null">
        <div class="glass-card-heavy w-full max-w-[380px] p-2xl flex flex-col gap-lg">
          <h3 class="text-[1.1rem] font-bold text-fg">Abandon Current Game?</h3>
          <p class="text-fg-secondary text-[0.9rem] leading-relaxed">Starting this tournament match will end your current game in progress.</p>
          <div class="flex gap-md justify-end">
            <button class="btn btn-secondary" @click="confirmMatchId = null">Cancel</button>
            <button class="btn btn-gold" @click="doPlayMatch(confirmMatchId!)">Start Match</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: var(--spacing-lg);
}
/* ── Mode toggle (reused pattern) ── */
.mode-toggle {
  position: relative;
  display: flex;
  background: var(--surface-2);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border-subtle);
}

.mode-option {
  position: relative;
  z-index: 1;
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-lg);
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: color var(--duration-normal) var(--ease-out);
  text-align: center;
}

.mode-option.active {
  color: var(--text-inverse);
}

.mode-pill {
  position: absolute;
  top: 2px;
  left: 2px;
  width: calc(50% - 2px);
  height: calc(100% - 4px);
  background: var(--gold-gradient);
  border-radius: calc(var(--radius-md) - 2px);
  transition: transform var(--duration-normal) var(--ease-spring);
}
</style>
