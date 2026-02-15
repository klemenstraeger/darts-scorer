<script setup lang="ts">
import type { TournamentStanding } from '~/types/tournament'

const { getAvatarProps } = usePlayers()

const props = defineProps<{
  standings: TournamentStanding[]
  advanceCount?: number
}>()

const sorted = computed(() =>
  [...props.standings].sort((a, b) => b.points - a.points || b.legDifference - a.legDifference),
)
</script>

<template>
  <div class="standings-wrapper">
    <table class="standings-table">
      <thead>
        <tr>
          <th class="col-pos">#</th>
          <th class="col-name">Player</th>
          <th class="col-num">P</th>
          <th class="col-num">W</th>
          <th class="col-num">L</th>
          <th class="col-num">Pts</th>
          <th class="col-num">+/-</th>
          <th class="col-num hide-sm">LW</th>
          <th class="col-num hide-sm">LL</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(s, i) in sorted"
          :key="s.id"
          :class="{ advancing: advanceCount && i < advanceCount }"
        >
          <td class="col-pos">{{ i + 1 }}</td>
          <td class="col-name"><span class="flex items-center gap-xs"><PlayerAvatar v-bind="getAvatarProps(s.playerName)" :size="18" />{{ s.playerName }}</span></td>
          <td class="col-num">{{ s.played }}</td>
          <td class="col-num">{{ s.won }}</td>
          <td class="col-num">{{ s.lost }}</td>
          <td class="col-num font-bold">{{ s.points }}</td>
          <td class="col-num" :class="{ positive: s.legDifference > 0, negative: s.legDifference < 0 }">
            {{ s.legDifference > 0 ? '+' : '' }}{{ s.legDifference }}
          </td>
          <td class="col-num hide-sm">{{ s.legsWon }}</td>
          <td class="col-num hide-sm">{{ s.legsLost }}</td>
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
  .hide-sm { display: none; }
}
</style>
