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
  <div class="standings-wrapper">
    <table class="standings-table">
      <thead>
        <tr>
          <th class="col-pos">
            #
          </th>
          <th class="col-name">
            Player
          </th>
          <th class="col-num sortable" @click="toggleSort('played')">
            P{{ sortIndicator('played') }}
          </th>
          <th class="col-num sortable" @click="toggleSort('won')">
            W{{ sortIndicator('won') }}
          </th>
          <th class="col-num sortable" @click="toggleSort('lost')">
            L{{ sortIndicator('lost') }}
          </th>
          <th class="col-num sortable" @click="toggleSort('legsWon')">
            F{{ sortIndicator('legsWon') }}
          </th>
          <th class="col-num sortable" @click="toggleSort('legsLost')">
            A{{ sortIndicator('legsLost') }}
          </th>
          <th class="col-num sortable" @click="toggleSort('legDifference')">
            +/-{{ sortIndicator('legDifference') }}
          </th>
          <th class="col-num sortable" @click="toggleSort('points')">
            Pts{{ sortIndicator('points') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(s, i) in sorted"
          :key="s.id"
          :class="{ advancing: advanceCount && i < advanceCount }"
        >
          <td class="col-pos">
            {{ i + 1 }}
          </td>
          <td class="col-name">
            <span class="flex items-center gap-xs"><PlayerAvatar v-bind="getAvatarProps(s.playerName)" :size="18" />{{ s.playerName }}</span>
          </td>
          <td class="col-num">
            {{ s.played }}
          </td>
          <td class="col-num">
            {{ s.won }}
          </td>
          <td class="col-num">
            {{ s.lost }}
          </td>
          <td class="col-num">
            {{ s.legsWon }}
          </td>
          <td class="col-num">
            {{ s.legsLost }}
          </td>
          <td class="col-num" :class="{ positive: s.legDifference > 0, negative: s.legDifference < 0 }">
            {{ s.legDifference > 0 ? '+' : '' }}{{ s.legDifference }}
          </td>
          <td class="col-num font-bold">
            {{ s.points }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.standings-wrapper {
  overflow-x: auto;
}

.standings-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.standings-table th {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: left;
  border-bottom: 1px solid var(--border-subtle);
  white-space: nowrap;
}

.standings-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: color var(--duration-fast);
}

.standings-table th.sortable:hover {
  color: var(--text-primary);
}

.standings-table td {
  padding: var(--spacing-sm) var(--spacing-sm);
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-subtle);
}

.col-pos {
  width: 30px;
  font-weight: 700;
  color: var(--text-muted);
}

.col-name {
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.col-num {
  text-align: center;
  width: 36px;
  font-variant-numeric: tabular-nums;
}

tr.advancing .col-pos {
  color: var(--gold);
}

tr.advancing .col-name {
  color: var(--gold);
}

.positive { color: var(--green); }
.negative { color: var(--red); }

@media (max-width: 480px) {
  .col-num {
    width: 28px;
  }

  .standings-table th,
  .standings-table td {
    padding: var(--spacing-xs) 3px;
  }
}
</style>
