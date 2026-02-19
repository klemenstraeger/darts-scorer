<script setup lang="ts">
import type { Turn } from '~/types/game'
import { isVisitScoreTurn, turnTotal } from '~/types/game'

const props = defineProps<{
  turnHistory: Turn[]
  playerNames: string[]
}>()

const { getAvatarProps } = usePlayers()

// Show most recent turns first, limited to last 20
const recentTurns = computed(() => {
  return [...props.turnHistory].reverse().slice(0, 20)
})
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div v-if="recentTurns.length === 0" class="text-fg-muted text-[0.75rem] italic p-xs">
      No turns yet
    </div>
    <TransitionGroup name="list" tag="div" class="turn-list">
      <div
        v-for="(turn, i) in recentTurns"
        :key="`${turn.player_index}-${turnHistory.length - i}`"
        class="turn-entry"
        :class="{ busted: turn.busted }"
      >
        <PlayerAvatar
          v-bind="getAvatarProps(playerNames[turn.player_index] ?? '')"
          :size="16"
        />
        <span class="text-[0.65rem] font-bold text-fg-muted uppercase whitespace-nowrap min-w-[36px]">
          {{ playerNames[turn.player_index] ?? `P${turn.player_index + 1}` }}
        </span>
        <div v-if="isVisitScoreTurn(turn)" class="throw-badges">
          <span class="visit-badge">{{ turnTotal(turn) }} pts</span>
        </div>
        <div v-else class="throw-badges">
          <ThrowBadge
            v-for="(t, j) in turn.throws"
            :key="j"
            :throw="t"
          />
        </div>
        <span
          class="text-[0.7rem] font-bold text-fg-secondary ml-auto whitespace-nowrap tabular-nums"
          :class="{ 'text-red': turn.busted }"
        >
          {{ turn.busted ? 'BUST' : `= ${turnTotal(turn)}` }}
        </span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.turn-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.turn-entry {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  transition: background var(--duration-fast);
  cursor: default;
  flex-shrink: 0;
}

.turn-entry.busted {
  background: rgba(239, 68, 68, 0.06);
  border-color: rgba(239, 68, 68, 0.15);
}

.throw-badges {
  display: flex;
  gap: 3px;
  flex-wrap: nowrap;
  min-width: 0;
}

.throw-badges :deep(.throw-badge) {
  font-size: 0.65rem;
  padding: 1px 5px;
}

.throw-badges :deep(.badge-points) {
  font-size: 0.6rem;
}

.visit-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  background: rgba(255, 215, 0, 0.08);
  border: 1px solid rgba(255, 215, 0, 0.15);
  color: var(--gold);
  white-space: nowrap;
}

/* List transition */
.list-enter-active {
  transition: all var(--duration-normal) var(--ease-out);
}
.list-leave-active {
  transition: all var(--duration-fast) var(--ease-out);
}
.list-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.list-leave-to {
  opacity: 0;
}
</style>
