<script setup lang="ts">
import type { TournamentDetail } from '~/types/tournament'

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

// Fixtures / scheduling state
const leagueTab = ref<'standings' | 'fixtures' | 'matches'>('standings')
const showScheduleModal = ref(false)
const scheduleStartDate = ref('')
const scheduleIntervalDays = ref(7)
const scheduleMatchesPerDay = ref(4)
const scheduling = ref(false)
const scheduleError = ref('')

function copySpectateUrl() {
  const url = `${window.location.origin}/spectate/${tournamentId.value}`
  navigator.clipboard.writeText(url)
  spectateUrlCopied.value = true
  setTimeout(() => {
    spectateUrlCopied.value = false
  }, 2000)
}

function copyCameraUrl() {
  const url = `${window.location.origin}/camera/${tournamentId.value}`
  navigator.clipboard.writeText(url)
  cameraUrlCopied.value = true
  setTimeout(() => {
    cameraUrlCopied.value = false
  }, 2000)
}

async function fetchTournament() {
  loading.value = true
  error.value = ''
  try {
    tournament.value = await $fetch<TournamentDetail>(`/api/tournament/${tournamentId.value}`)
  }
  catch (e: any) {
    error.value = e.data?.message || 'Failed to load tournament'
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTournament()
  checkActiveGame()
  ensurePlayers()

  // Default schedule start date to tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  scheduleStartDate.value = tomorrow.toISOString().split('T')[0]!
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

const hasScheduledFixtures = computed(() =>
  leagueMatches.value.some(m => m.scheduledAt != null),
)

// Settings summary
const settingsSummary = computed(() => {
  if (!tournament.value)
    return ''
  const t = tournament.value
  const parts = [t.gameMode, t.checkout === 'double_out' ? 'DO' : 'SO']
  if (t.legsToWin > 1)
    parts.push(`${t.legsToWin} legs`)
  if (t.setsToWin > 1)
    parts.push(`${t.setsToWin} sets`)
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
  if (playingMatch.value)
    return
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
      teamMode?: 'doubles' | null
      playerOrder?: string[]
    }>(`/api/tournament/${tournamentId.value}/match/${matchId}/start`, {
      method: 'POST',
    })

    // Doubles: create a 4-player game with interleaved team member order
    const playerNames = config.teamMode === 'doubles' && config.playerOrder
      ? config.playerOrder
      : [config.player1Name, config.player2Name]

    newGame(config.gameMode, playerNames, {
      checkout: config.checkout,
      legs_to_win: config.legsToWin,
      sets_to_win: config.setsToWin,
    })
    setContext(config.matchId, config.tournamentId)
    navigateTo('/game')
  }
  catch (e: any) {
    error.value = e.data?.message || 'Failed to start match'
    playingMatch.value = false
  }
}

async function applySchedule() {
  if (scheduling.value)
    return
  scheduling.value = true
  scheduleError.value = ''
  try {
    tournament.value = await $fetch<TournamentDetail>(`/api/tournament/${tournamentId.value}/schedule`, {
      method: 'POST',
      body: {
        startDate: scheduleStartDate.value,
        intervalDays: scheduleIntervalDays.value,
        matchesPerDay: scheduleMatchesPerDay.value,
      },
    })
    showScheduleModal.value = false
    // Switch to fixtures tab to show results
    leagueTab.value = 'fixtures'
  }
  catch (e: any) {
    scheduleError.value = e.data?.message || 'Failed to schedule fixtures'
  }
  finally {
    scheduling.value = false
  }
}

async function deleteTournament() {
  // eslint-disable-next-line no-alert
  if (!confirm('Delete this tournament?'))
    return
  try {
    await $fetch(`/api/tournament/${tournamentId.value}`, { method: 'DELETE' })
    navigateTo('/tournaments')
  }
  catch (e: any) {
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
      <p class="text-red text-[0.9rem] font-semibold">
        {{ error }}
      </p>
      <NuxtLink to="/tournaments" class="btn btn-secondary mt-md">
        Back to Tournaments
      </NuxtLink>
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
              <span v-if="tournament.teamMode" class="text-[0.65rem] font-bold text-gold uppercase tracking-wide px-sm py-[1px] rounded-full border border-gold/30 bg-gold/10">Doubles</span>
              <span class="text-[0.75rem] text-fg-muted">{{ settingsSummary }}</span>
              <span class="text-[0.75rem] text-fg-muted">{{ tournament.playerCount }} {{ tournament.teamMode ? 'teams' : 'players' }}</span>
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
      <div v-if="error" class="w-full text-red text-[0.85rem] font-semibold text-center">
        {{ error }}
      </div>

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
        <!-- League tab navigation -->
        <div class="w-full">
          <div class="league-tabs">
            <button
              class="league-tab"
              :class="{ active: leagueTab === 'standings' }"
              @click="leagueTab = 'standings'"
            >
              Standings
            </button>
            <button
              class="league-tab"
              :class="{ active: leagueTab === 'fixtures' }"
              @click="leagueTab = 'fixtures'"
            >
              Fixtures
            </button>
            <button
              class="league-tab"
              :class="{ active: leagueTab === 'matches' }"
              @click="leagueTab = 'matches'"
            >
              All Matches
            </button>
          </div>
        </div>

        <!-- Standings tab -->
        <div v-if="leagueTab === 'standings'" class="w-full flex flex-col gap-lg">
          <div class="glass-card p-md">
            <StandingsTable :standings="leagueStandings" />
          </div>
        </div>

        <!-- Fixtures tab -->
        <div v-if="leagueTab === 'fixtures'" class="w-full flex flex-col gap-lg">
          <div class="flex items-center justify-between">
            <span class="text-[0.75rem] font-semibold text-fg-muted uppercase tracking-widest">Fixture Calendar</span>
            <button
              class="btn btn-secondary text-[0.75rem]"
              @click="showScheduleModal = true"
            >
              {{ hasScheduledFixtures ? 'Reschedule' : 'Schedule Fixtures' }}
            </button>
          </div>
          <FixtureCalendar
            :matches="leagueMatches"
            show-play-button
            @play="playMatch"
          />
        </div>

        <!-- All Matches tab (flat list) -->
        <div v-if="leagueTab === 'matches'" class="w-full flex flex-col gap-md">
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
            />
          </div>
        </div>

        <!-- Groups view -->
        <template v-if="activeTab === 'groups' || !hasKnockoutPhase">
          <div class="w-full flex flex-col gap-lg">
            <GroupTabs
              v-if="tournament.groupCount && tournament.groupCount > 1"
              v-model="selectedGroup"
              :group-count="tournament.groupCount"
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
          <p class="text-fg-muted text-[0.85rem]">
            Group phase complete. Knockout bracket generating...
          </p>
        </div>
      </template>
    </template>

    <!-- Abandon game confirm modal -->
    <Teleport to="body">
      <div v-if="confirmMatchId" class="modal-overlay" @click.self="confirmMatchId = null">
        <div class="glass-card-heavy w-full max-w-[380px] p-2xl flex flex-col gap-lg">
          <h3 class="text-[1.1rem] font-bold text-fg">
            Abandon Current Game?
          </h3>
          <p class="text-fg-secondary text-[0.9rem] leading-relaxed">
            Starting this tournament match will end your current game in progress.
          </p>
          <div class="flex gap-md justify-end">
            <button class="btn btn-secondary" @click="confirmMatchId = null">
              Cancel
            </button>
            <button class="btn btn-gold" @click="doPlayMatch(confirmMatchId!)">
              Start Match
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Schedule fixtures modal -->
    <Teleport to="body">
      <div v-if="showScheduleModal" class="modal-overlay" @click.self="showScheduleModal = false">
        <div class="glass-card-heavy w-full max-w-[420px] p-2xl flex flex-col gap-lg">
          <h3 class="text-[1.1rem] font-bold text-fg">
            Schedule Fixtures
          </h3>
          <p class="text-fg-secondary text-[0.85rem] leading-relaxed">
            Distribute matches across dates. Existing schedules will be overwritten.
          </p>

          <div class="flex flex-col gap-md">
            <div class="schedule-field">
              <label class="schedule-label">Start Date</label>
              <input
                v-model="scheduleStartDate"
                type="date"
                class="schedule-input"
              >
            </div>

            <div class="schedule-field">
              <label class="schedule-label">Days Between Match Days</label>
              <select v-model.number="scheduleIntervalDays" class="schedule-input">
                <option :value="1">
                  Every day
                </option>
                <option :value="2">
                  Every 2 days
                </option>
                <option :value="3">
                  Every 3 days
                </option>
                <option :value="7">
                  Weekly
                </option>
                <option :value="14">
                  Every 2 weeks
                </option>
              </select>
            </div>

            <div class="schedule-field">
              <label class="schedule-label">Matches Per Day</label>
              <select v-model.number="scheduleMatchesPerDay" class="schedule-input">
                <option :value="1">
                  1
                </option>
                <option :value="2">
                  2
                </option>
                <option :value="3">
                  3
                </option>
                <option :value="4">
                  4
                </option>
                <option :value="6">
                  6
                </option>
                <option :value="8">
                  8
                </option>
              </select>
            </div>
          </div>

          <div v-if="scheduleError" class="text-red text-[0.8rem] font-semibold">
            {{ scheduleError }}
          </div>

          <div class="flex gap-md justify-end">
            <button class="btn btn-secondary" @click="showScheduleModal = false">
              Cancel
            </button>
            <button
              class="btn btn-gold"
              :disabled="scheduling || !scheduleStartDate"
              @click="applySchedule"
            >
              {{ scheduling ? 'Scheduling...' : 'Apply Schedule' }}
            </button>
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

/* ── League tabs ── */
.league-tabs {
  display: flex;
  gap: 0;
  background: var(--surface-2);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
}

.league-tab {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: color var(--duration-normal), background var(--duration-normal);
  text-align: center;
  position: relative;
}

.league-tab:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 25%;
  height: 50%;
  width: 1px;
  background: var(--border-subtle);
}

.league-tab.active {
  color: var(--text-inverse);
  background: var(--gold-gradient);
}

.league-tab:hover:not(.active) {
  color: var(--text-primary);
}

/* ── Schedule modal fields ── */
.schedule-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.schedule-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.schedule-input {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  outline: none;
  transition: border-color var(--duration-fast);
}

.schedule-input:focus {
  border-color: var(--gold);
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
