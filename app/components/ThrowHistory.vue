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
    <TransitionGroup name="list" tag="div" class="flex flex-col gap-[3px] overflow-y-auto flex-1 min-h-0">
      <div
        v-for="(turn, i) in recentTurns"
        :key="`${turn.player_index}-${turnHistory.length - i}`"
        class="flex items-center gap-xs px-sm py-xs rounded-sm bg-surface-1 border-2 border-black cursor-default shrink-0"
        :class="{ 'bg-red-light border-red': turn.busted }"
      >
        <PlayerAvatar
          v-bind="getAvatarProps(playerNames[turn.player_index] ?? '')"
          :size="16"
        />
        <span class="text-[0.65rem] font-bold text-fg-muted uppercase whitespace-nowrap min-w-[36px]">
          {{ playerNames[turn.player_index] ?? `P${turn.player_index + 1}` }}
        </span>
        <div v-if="isVisitScoreTurn(turn)" class="flex gap-[3px] flex-nowrap min-w-0">
          <span class="text-[0.65rem] font-bold px-[6px] py-[1px] rounded-sm bg-yellow-light border-2 border-black text-yellow whitespace-nowrap">{{ turnTotal(turn) }} pts</span>
        </div>
        <div v-else class="throw-history__badges flex gap-[3px] flex-nowrap min-w-0">
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

<style>
.throw-history__badges :deep(.throw-badge) {
  font-size: 0.65rem;
  padding: 1px 5px;
}

.throw-history__badges :deep(.badge-points) {
  font-size: 0.6rem;
}
</style>
