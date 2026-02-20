<script setup lang="ts">
import type { TournamentFormat, TournamentMatch, TournamentStanding } from '~/types/tournament'

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
    if (allGroupsDone)
      activeTab.value = 'knockout'
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
  <div class="flex flex-col gap-md h-full overflow-y-auto overflow-x-hidden" :class="{ 'text-[0.9em]': compact }">
    <!-- Knockout -->
    <template v-if="isKnockout">
      <div class="flex flex-col gap-sm">
        <div class="overflow-x-auto">
          <KnockoutBracket :matches="knockoutMatches" :show-play-button="false" />
        </div>
      </div>
    </template>

    <!-- League -->
    <template v-if="isLeague">
      <div class="flex flex-col gap-sm">
        <span class="text-[0.65rem] font-bold text-fg-muted uppercase tracking-[1px]">Standings</span>
        <div class="bg-surface-1 border-2 border-black rounded-md shadow-md p-md">
          <StandingsTable :standings="standings" />
        </div>
      </div>
      <div v-if="!compact" class="flex flex-col gap-sm">
        <span class="text-[0.65rem] font-bold text-fg-muted uppercase tracking-[1px]">Matches</span>
        <div class="flex flex-col gap-xs">
          <MatchCard
            v-for="match in relevantMatches"
            :key="match.id"
            :match="match"
            :show-play-button="false"
            :class="{ 'spectator-live-glow': match.id === liveMatchId }"
          />
        </div>
      </div>
    </template>

    <!-- Group formats -->
    <template v-if="hasGroups">
      <!-- Tab switch for group_knockout -->
      <div v-if="format === 'group_knockout' && hasKnockoutPhase" class="flex flex-col gap-sm">
        <div class="spectator-mode-toggle">
          <button
            class="spectator-mode-option"
            :class="{ active: activeTab === 'groups' }"
            @click="activeTab = 'groups'"
          >
            Groups
          </button>
          <button
            class="spectator-mode-option"
            :class="{ active: activeTab === 'knockout' }"
            @click="activeTab = 'knockout'"
          >
            Knockout
          </button>
          <div
            class="spectator-mode-pill"
            :style="{ transform: activeTab === 'knockout' ? 'translateX(100%)' : 'translateX(0)' }"
          />
        </div>
      </div>

      <!-- Groups view -->
      <template v-if="activeTab === 'groups' || !hasKnockoutPhase">
        <div class="flex flex-col gap-sm">
          <GroupTabs
            v-if="groupCount && groupCount > 1"
            v-model="selectedGroup"
            :group-count="groupCount"
          />
          <div class="bg-surface-1 border-2 border-black rounded-md shadow-md p-md">
            <StandingsTable
              :standings="currentGroupStandings"
              :advance-count="format === 'group_knockout' ? (advancePerGroup ?? undefined) : undefined"
            />
          </div>
        </div>
        <div v-if="!compact" class="flex flex-col gap-sm">
          <span class="text-[0.65rem] font-bold text-fg-muted uppercase tracking-[1px]">Matches</span>
          <div class="flex flex-col gap-xs">
            <MatchCard
              v-for="match in currentGroupMatches"
              :key="match.id"
              :match="match"
              :show-play-button="false"
              :class="{ 'spectator-live-glow': match.id === liveMatchId }"
            />
          </div>
        </div>
      </template>

      <!-- Knockout view -->
      <template v-if="activeTab === 'knockout' && hasKnockoutPhase">
        <div class="flex flex-col gap-sm">
          <span class="text-[0.65rem] font-bold text-fg-muted uppercase tracking-[1px]">Knockout Stage</span>
          <div class="overflow-x-auto">
            <KnockoutBracket :matches="knockoutMatches" :show-play-button="false" />
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<style>
/* Mode toggle — requires positional children (pill element) */
.spectator-mode-toggle {
  position: relative;
  display: flex;
  background: var(--surface-1);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 2px solid black;
}

.spectator-mode-option {
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

.spectator-mode-option.active {
  color: var(--text-inverse);
}

.spectator-mode-pill {
  position: absolute;
  top: 2px;
  left: 2px;
  width: calc(50% - 2px);
  height: calc(100% - 4px);
  background: var(--yellow);
  border-radius: calc(var(--radius-md) - 2px);
  transition: transform var(--duration-normal) var(--ease-spring);
}

/* Live glow on match cards */
.spectator-live-glow {
  border-color: var(--yellow) !important;
  box-shadow: 4px 4px 0 black !important;
}
</style>
