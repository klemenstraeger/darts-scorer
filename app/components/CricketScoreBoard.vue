<script setup lang="ts">
import type { CricketPlayerState } from '~/types/game'
import { CRICKET_TARGETS } from '~/types/game'

const props = defineProps<{
  players: { name: string }[]
  cricketStates: CricketPlayerState[]
  currentPlayerIndex: number
}>()

function targetLabel(target: number): string {
  return target === 25 ? 'BULL' : String(target)
}

function getMarks(playerIdx: number, target: number): number {
  const state = props.cricketStates[playerIdx]
  if (!state) return 0
  return state.marks[target] ?? 0
}

function isClosed(playerIdx: number, target: number): boolean {
  return getMarks(playerIdx, target) >= 3
}

function isClosedByAll(target: number): boolean {
  return props.players.every((_, i) => isClosed(i, target))
}
</script>

<template>
  <div class="cricket-board">
    <!-- Header row: Player names -->
    <div class="cricket-grid" :style="{ gridTemplateColumns: `1fr repeat(${players.length}, 1fr)` }">
      <div class="cricket-cell cricket-header" />
      <div
        v-for="(player, i) in players"
        :key="i"
        class="cricket-cell cricket-header"
        :class="{ 'cricket-active': i === currentPlayerIndex }"
      >
        <span class="cricket-player-name">{{ player.name }}</span>
        <span class="cricket-player-score">{{ cricketStates[i]?.cricket_score ?? 0 }}</span>
      </div>
    </div>

    <!-- Target rows -->
    <div
      v-for="target in CRICKET_TARGETS"
      :key="target"
      class="cricket-grid"
      :style="{ gridTemplateColumns: `1fr repeat(${players.length}, 1fr)` }"
    >
      <div
        class="cricket-cell cricket-target"
        :class="{ 'cricket-target-closed': isClosedByAll(target) }"
      >
        {{ targetLabel(target) }}
      </div>
      <div
        v-for="(_, i) in players"
        :key="i"
        class="cricket-cell cricket-marks"
        :class="{
          'cricket-active': i === currentPlayerIndex,
          'cricket-closed': isClosed(i, target),
        }"
      >
        <CricketMarks :count="getMarks(i, target)" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.cricket-board {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--border-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
  width: 100%;
}

.cricket-grid {
  display: grid;
  gap: 1px;
}

.cricket-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--surface-1);
  min-height: 40px;
}

.cricket-header {
  flex-direction: column;
  gap: 2px;
  padding: var(--spacing-sm) var(--spacing-xs);
  background: var(--surface-2);
}

.cricket-header.cricket-active {
  background: rgba(255, 215, 0, 0.08);
  border-bottom: 2px solid var(--gold);
}

.cricket-player-name {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}

.cricket-player-score {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
  tabular-nums: true;
  font-variant-numeric: tabular-nums;
}

.cricket-target {
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--gold);
  background: var(--surface-2);
  letter-spacing: 0.05em;
}

.cricket-target-closed {
  color: var(--text-muted);
  text-decoration: line-through;
  opacity: 0.5;
}

.cricket-marks {
  min-width: 48px;
}

.cricket-marks.cricket-active {
  background: rgba(255, 215, 0, 0.04);
}

.cricket-marks.cricket-closed {
  background: rgba(76, 175, 80, 0.06);
}
</style>
