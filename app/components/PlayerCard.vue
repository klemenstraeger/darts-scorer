<script setup lang="ts">
import type { Player } from '~/types/game'
import { threeDartAverage } from '~/types/game'

const props = defineProps<{
  player: Player
  isActive: boolean
}>()

const average = computed(() => threeDartAverage(props.player).toFixed(1))
const dartsThrown = computed(() =>
  props.player.turns.reduce((sum, t) => sum + t.throws.length, 0),
)

// Animated score display
const displayScore = ref(props.player.score)
const scoreFlash = ref(false)
let animationFrame: number | null = null

watch(
  () => props.player.score,
  (newScore, oldScore) => {
    if (oldScore === undefined) {
      displayScore.value = newScore
      return
    }

    // Flash effect
    scoreFlash.value = true
    setTimeout(() => {
      scoreFlash.value = false
    }, 500)

    // Count animation
    if (animationFrame)
      cancelAnimationFrame(animationFrame)
    const start = performance.now()
    const duration = 400
    const from = displayScore.value

    function step(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - progress) ** 3 // ease-out cubic
      displayScore.value = Math.round(from + (newScore - from) * eased)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(step)
      }
      else {
        displayScore.value = newScore
        animationFrame = null
      }
    }

    animationFrame = requestAnimationFrame(step)
  },
)
</script>

<template>
  <div
    class="player-card bg-surface-1 rounded-lg flex-1 min-w-0 text-center p-lg px-xl max-xs:p-md max-xs:px-lg border-2 border-black shadow-sm transition-all duration-150 ease-out"
    :class="{
      'border-yellow bg-yellow-light shadow-md': isActive,
      'shadow-lg': scoreFlash,
    }"
  >
    <div
      class="text-[0.85rem] font-semibold text-fg-muted mb-xs uppercase tracking-[1px]"
      :class="{ 'text-yellow': isActive }"
    >
      {{ player.name }}
    </div>
    <div class="text-[3.5rem] max-xs:text-[2.2rem] font-black text-fg leading-none my-sm tabular-nums">
      {{ displayScore }}
    </div>
    <div class="flex justify-center gap-lg mt-sm">
      <div class="flex flex-col items-center">
        <span class="text-[0.65rem] text-fg-muted uppercase">Avg</span>
        <span class="text-[0.9rem] text-fg-secondary font-semibold tabular-nums">{{ average }}</span>
      </div>
      <div class="flex flex-col items-center">
        <span class="text-[0.65rem] text-fg-muted uppercase">Darts</span>
        <span class="text-[0.9rem] text-fg-secondary font-semibold tabular-nums">{{ dartsThrown }}</span>
      </div>
      <div class="flex flex-col items-center">
        <span class="text-[0.65rem] text-fg-muted uppercase">Legs</span>
        <span class="text-[0.9rem] text-fg-secondary font-semibold tabular-nums">{{ player.legs_won }}</span>
      </div>
    </div>
  </div>
</template>
