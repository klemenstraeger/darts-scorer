<script setup lang="ts">
import type { TournamentMatch, TournamentStanding, TournamentFormat } from '~/types/tournament'

const props = defineProps<{
  format: TournamentFormat
  matches: TournamentMatch[]
  standings: TournamentStanding[]
  groupCount: number | null
  advancePerGroup: number | null
  liveMatchId?: number
  compact?: boolean
}>()

const selectedGroup = ref(0)

const knockoutMatches = computed(() =>
  props.matches.filter(m => m.phase === 'knockout'),
)

const groupMatches = computed(() =>
  props.matches.filter(m => m.phase === 'group'),
)

const leagueMatches = computed(() =>
  props.matches.filter(m => m.phase === 'main'),
)

const currentGroupMatches = computed(() =>
  groupMatches.value.filter(m => m.groupIndex === selectedGroup.value),
)

const currentGroupStandings = computed(() =>
  props.standings.filter(s => s.groupIndex === selectedGroup.value),
)

const hasKnockoutPhase = computed(() => knockoutMatches.value.length > 0)
const hasGroups = computed(() => props.format === 'group_only' || props.format === 'group_knockout')
const isLeague = computed(() => props.format === 'league')
const isKnockout = computed(() => props.format === 'knockout')

const activeTab = ref<'groups' | 'knockout'>('groups')

// Auto-switch to knockout tab when group phase is complete
watch(() => hasKnockoutPhase.value, (has) => {
  if (has && props.format === 'group_knockout') {
    const allGroupsDone = groupMatches.value.every(m => m.status === 'completed')
    if (allGroupsDone) activeTab.value = 'knockout'
  }
}, { immediate: true })

// Relevant matches for match list (completed + in-progress, sorted by status)
const relevantMatches = computed(() => {
  const all = props.format === 'league' ? leagueMatches.value : props.matches
  const active = all.filter(m => m.status === 'in_progress')
  const completed = all.filter(m => m.status === 'completed').reverse()
  const pending = all.filter(m => m.status === 'pending' && m.player1Name && m.player2Name)
  return [...active, ...pending.slice(0, 3), ...completed.slice(0, 5)]
})
</script>

<template>
  <div class="tournament-view" :class="{ compact }">
    <!-- Knockout -->
    <template v-if="isKnockout">
      <div class="section">
        <div class="bracket-container">
          <KnockoutBracket :matches="knockoutMatches" :show-play-button="false" />
        </div>
      </div>
    </template>

    <!-- League -->
    <template v-if="isLeague">
      <div class="section">
        <span class="section-label">Standings</span>
        <div class="glass-card p-md">
          <StandingsTable :standings="standings" />
        </div>
      </div>
      <div v-if="!compact" class="section">
        <span class="section-label">Matches</span>
        <div class="match-list">
          <MatchCard
            v-for="match in relevantMatches"
            :key="match.id"
            :match="match"
            :show-play-button="false"
            :class="{ 'live-glow': match.id === liveMatchId }"
          />
        </div>
      </div>
    </template>

    <!-- Group formats -->
    <template v-if="hasGroups">
      <!-- Tab switch for group_knockout -->
      <div v-if="format === 'group_knockout' && hasKnockoutPhase" class="section">
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
        <div class="section">
          <GroupTabs
            v-if="groupCount && groupCount > 1"
            :group-count="groupCount"
            v-model="selectedGroup"
          />
          <div class="glass-card p-md">
            <StandingsTable
              :standings="currentGroupStandings"
              :advance-count="format === 'group_knockout' ? (advancePerGroup ?? undefined) : undefined"
            />
          </div>
        </div>
        <div v-if="!compact" class="section">
          <span class="section-label">Matches</span>
          <div class="match-list">
            <MatchCard
              v-for="match in currentGroupMatches"
              :key="match.id"
              :match="match"
              :show-play-button="false"
              :class="{ 'live-glow': match.id === liveMatchId }"
            />
          </div>
        </div>
      </template>

      <!-- Knockout view -->
      <template v-if="activeTab === 'knockout' && hasKnockoutPhase">
        <div class="section">
          <span class="section-label">Knockout Stage</span>
          <div class="bracket-container">
            <KnockoutBracket :matches="knockoutMatches" :show-play-button="false" />
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.tournament-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.tournament-view.compact {
  font-size: 0.9em;
}

.section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.section-label {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.bracket-container {
  overflow-x: auto;
}

.match-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.live-glow {
  border-color: var(--gold) !important;
  box-shadow: 0 0 16px var(--gold-glow) !important;
}

/* ── Mode toggle (same pattern as tournament page) ── */
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
  padding: var(--spacing-xs) var(--spacing-md);
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: 0.8rem;
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
