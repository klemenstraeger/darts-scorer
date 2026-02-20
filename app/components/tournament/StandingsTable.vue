<script setup lang="ts">
import type { TournamentStanding } from '~/types/tournament'

const props = defineProps<{
  standings: TournamentStanding[]
  advanceCount?: number
}>()

const { getAvatarProps } = usePlayers()

type SortColumn = 'points' | 'played' | 'won' | 'lost' | 'legsWon' | 'legsLost' | 'legDifference'

const sortColumn = ref<SortColumn>('points')
const sortAsc = ref(false)

function toggleSort(col: SortColumn) {
  if (sortColumn.value === col) {
    sortAsc.value = !sortAsc.value
  }
  else {
    sortColumn.value = col
    // Default to descending for most columns, ascending for losses
    sortAsc.value = col === 'lost' || col === 'legsLost'
  }
}

function sortIndicator(col: SortColumn): string {
  if (sortColumn.value !== col)
    return ''
  return sortAsc.value ? ' \u25B2' : ' \u25BC'
}

const sorted = computed(() => {
  const col = sortColumn.value
  const dir = sortAsc.value ? 1 : -1
  return [...props.standings].sort((a, b) => {
    const diff = (a[col] - b[col]) * dir
    if (diff !== 0)
      return diff
    // Tiebreaker: points then leg difference
    if (col !== 'points') {
      const ptsDiff = b.points - a.points
      if (ptsDiff !== 0)
        return ptsDiff
    }
    return b.legDifference - a.legDifference
  })
})
</script>

<template>
  <div class="overflow-x-auto">
    <table class="standings-table">
      <thead>
        <tr>
          <th class="standings-col-pos">
            #
          </th>
          <th class="standings-col-name">
            Player
          </th>
          <th class="standings-col-num standings-sortable" @click="toggleSort('played')">
            P{{ sortIndicator('played') }}
          </th>
          <th class="standings-col-num standings-sortable" @click="toggleSort('won')">
            W{{ sortIndicator('won') }}
          </th>
          <th class="standings-col-num standings-sortable" @click="toggleSort('lost')">
            L{{ sortIndicator('lost') }}
          </th>
          <th class="standings-col-num standings-sortable" @click="toggleSort('legsWon')">
            F{{ sortIndicator('legsWon') }}
          </th>
          <th class="standings-col-num standings-sortable" @click="toggleSort('legsLost')">
            A{{ sortIndicator('legsLost') }}
          </th>
          <th class="standings-col-num standings-sortable" @click="toggleSort('legDifference')">
            +/-{{ sortIndicator('legDifference') }}
          </th>
          <th class="standings-col-num standings-sortable" @click="toggleSort('points')">
            Pts{{ sortIndicator('points') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(s, i) in sorted"
          :key="s.id"
          :class="{ 'standings-advancing': advanceCount && i < advanceCount }"
        >
          <td class="standings-col-pos">
            {{ i + 1 }}
          </td>
          <td class="standings-col-name">
            <span class="flex items-center gap-xs"><PlayerAvatar v-bind="getAvatarProps(s.playerName)" :size="18" />{{ s.playerName }}</span>
          </td>
          <td class="standings-col-num">
            {{ s.played }}
          </td>
          <td class="standings-col-num">
            {{ s.won }}
          </td>
          <td class="standings-col-num">
            {{ s.lost }}
          </td>
          <td class="standings-col-num">
            {{ s.legsWon }}
          </td>
          <td class="standings-col-num">
            {{ s.legsLost }}
          </td>
          <td class="standings-col-num" :class="{ 'text-green': s.legDifference > 0, 'text-red': s.legDifference < 0 }">
            {{ s.legDifference > 0 ? '+' : '' }}{{ s.legDifference }}
          </td>
          <td class="standings-col-num font-bold">
            {{ s.points }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style>
/* StandingsTable — complex table styling with pseudo-selectors and responsive overrides */
.standings-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
  border: 2px solid black;
}

.standings-table th {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: left;
  border-bottom: 2px solid black;
  white-space: nowrap;
  background: var(--surface-2);
}

.standings-sortable {
  cursor: pointer;
  user-select: none;
}

.standings-sortable:hover {
  color: var(--text-primary);
  background: var(--surface-3);
}

.standings-table td {
  padding: var(--spacing-sm) var(--spacing-sm);
  color: var(--text-secondary);
  border-bottom: 2px solid black;
}

.standings-col-pos {
  width: 30px;
  font-weight: 700;
  color: var(--text-muted);
}

.standings-col-name {
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.standings-col-num {
  text-align: center;
  width: 36px;
  font-variant-numeric: tabular-nums;
}

tr.standings-advancing .standings-col-pos {
  color: var(--yellow);
  font-weight: 800;
}

tr.standings-advancing .standings-col-name {
  color: var(--yellow);
}

tr.standings-advancing {
  background: var(--yellow-light);
}

@media (max-width: 480px) {
  .standings-col-num {
    width: 28px;
  }

  .standings-table th,
  .standings-table td {
    padding: var(--spacing-xs) 3px;
  }
}
</style>
