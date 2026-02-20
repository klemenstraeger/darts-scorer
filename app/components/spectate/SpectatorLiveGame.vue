<script setup lang="ts">
import type { GameState, ThrowResult } from '~/types/game'
import { threeDartAverage, throwPoints, turnTotal } from '~/types/game'

const props = defineProps<{
  gameState: GameState
}>()

const { getAvatarProps } = usePlayers()

const isMatch = computed(() => props.gameState.legs_to_win > 1 || props.gameState.sets_to_win > 1)
const hasSets = computed(() => props.gameState.sets_to_win > 1)

// Animated score display
const displayScores = ref<number[]>([])
let animFrames: (number | null)[] = []

watch(
  () => props.gameState.players.map(p => p.score),
  (newScores, oldScores) => {
    if (!oldScores || displayScores.value.length !== newScores.length) {
      displayScores.value = [...newScores]
      animFrames = Array.from({ length: newScores.length }).fill(null) as (number | null)[]
      return
    }
    newScores.forEach((target, i) => {
      if (target === displayScores.value[i])
        return
      if (animFrames[i])
        cancelAnimationFrame(animFrames[i]!)
      const start = performance.now()
      const from = displayScores.value[i]!
      const duration = 350
      function step(now: number) {
        const p = Math.min((now - start) / duration, 1)
        const eased = 1 - (1 - p) ** 3
        displayScores.value[i] = Math.round(from + (target - from) * eased)
        if (p < 1) {
          animFrames[i] = requestAnimationFrame(step)
        }
        else {
          displayScores.value[i] = target
          animFrames[i] = null
        }
      }
      animFrames[i] = requestAnimationFrame(step)
    })
  },
  { deep: true, immediate: true },
)

function playerAvg(idx: number): string {
  const p = props.gameState.players[idx]
  return p ? threeDartAverage(p).toFixed(1) : '0.0'
}

function _playerDarts(idx: number): number {
  const p = props.gameState.players[idx]
  return p ? p.turns.reduce((s, t) => s + t.throws.length, 0) : 0
}

// Recent completed turns (last 5)
const recentTurns = computed(() => {
  const history = props.gameState.turn_history
  return history.slice(-5).reverse()
})

function turnPlayerName(turn: { player_index: number }): string {
  return props.gameState.players[turn.player_index]?.name ?? ''
}
</script>

<template>
  <div class="flex flex-col gap-sm h-full overflow-hidden">
    <!-- Player panels — stacked vertically to fit column -->
    <div
      v-for="(player, i) in gameState.players"
      :key="i"
      class="flex flex-col items-center gap-xs px-sm py-md bg-surface-1 border-2 border-black rounded-lg shadow-md transition-all duration-200"
      :class="i === gameState.current_player_index ? 'border-yellow shadow-lg' : ''"
    >
      <div class="flex items-center gap-xs w-full justify-center">
        <PlayerAvatar v-bind="getAvatarProps(player.name)" :size="32" />
        <span class="text-[0.85rem] font-bold uppercase tracking-[1px]" :class="i === gameState.current_player_index ? 'text-yellow' : 'text-fg-secondary'">{{ player.name }}</span>
        <div class="flex gap-xs ml-auto">
          <span class="text-[0.65rem] font-semibold text-fg-muted bg-surface-2 px-[5px] py-[1px] rounded-sm tabular-nums whitespace-nowrap">{{ playerAvg(i) }} avg</span>
          <span v-if="hasSets" class="text-[0.65rem] font-semibold text-fg-muted bg-surface-2 px-[5px] py-[1px] rounded-sm tabular-nums whitespace-nowrap">S {{ gameState.sets_won[i] ?? 0 }}</span>
          <span v-if="isMatch" class="text-[0.65rem] font-semibold text-fg-muted bg-surface-2 px-[5px] py-[1px] rounded-sm tabular-nums whitespace-nowrap">L {{ gameState.current_set_legs[i] ?? 0 }}</span>
        </div>
      </div>
      <div class="text-[clamp(2rem,5vw,4rem)] font-black tabular-nums leading-none" :class="i === gameState.current_player_index ? 'text-yellow' : 'text-fg'">
        {{ displayScores[i] ?? player.score }}
      </div>
    </div>

    <!-- Current turn darts -->
    <div class="flex flex-col items-center gap-xs p-sm bg-surface-1 border-2 border-black rounded-md shrink-0">
      <div class="text-[0.6rem] font-bold text-fg-muted uppercase tracking-[1px]">
        Current Turn
      </div>
      <div class="flex items-center gap-xs">
        <span
          v-for="slot in 3"
          :key="slot"
          class="min-w-[48px] flex items-center justify-center"
        >
          <template v-if="gameState.current_turn.throws[slot - 1]">
            <ThrowBadge :throw="gameState.current_turn.throws[slot - 1]!" />
          </template>
          <template v-else>
            <span class="text-[1.2rem] text-fg-muted">&middot;</span>
          </template>
        </span>
        <span v-if="gameState.current_turn.throws.length > 0" class="text-[1rem] font-extrabold text-fg tabular-nums ml-xs">
          = {{ gameState.current_turn.throws.reduce((s: number, t: ThrowResult) => s + throwPoints(t), 0) }}
        </span>
      </div>
    </div>

    <!-- Recent throws -->
    <div v-if="recentTurns.length > 0" class="flex flex-col gap-xs flex-1 min-h-0 overflow-hidden">
      <div class="text-[0.6rem] font-bold text-fg-muted uppercase tracking-[1px]">
        Recent
      </div>
      <div class="flex flex-col gap-[3px] overflow-hidden">
        <div
          v-for="(turn, i) in recentTurns"
          :key="i"
          class="flex items-center gap-xs px-xs py-[2px] bg-surface-2 rounded-sm"
        >
          <span class="text-[0.7rem] font-semibold text-fg-muted min-w-[50px] whitespace-nowrap overflow-hidden text-ellipsis">{{ turnPlayerName(turn) }}</span>
          <span class="flex gap-[3px] flex-1">
            <ThrowBadge v-for="(t, j) in turn.throws" :key="j" :throw="t" />
          </span>
          <span class="text-[0.8rem] font-extrabold tabular-nums min-w-[32px] text-right" :class="turn.busted ? 'text-red' : 'text-fg'">
            {{ turn.busted ? 'BUST' : turnTotal(turn) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
