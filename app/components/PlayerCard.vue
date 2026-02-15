<script setup lang="ts">
import type { Player } from '~/types/game'
import { threeDartAverage } from '~/types/game'

const props = defineProps<{
  player: Player
  isActive: boolean
}>()

const average = computed(() => threeDartAverage(props.player).toFixed(1))
const dartsThrown = computed(() =>
  props.player.turns.reduce((sum, t) => sum + t.throws.length, 0)
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
    setTimeout(() => { scoreFlash.value = false }, 500)

    // Count animation
    if (animationFrame) cancelAnimationFrame(animationFrame)
    const start = performance.now()
    const duration = 400
    const from = displayScore.value

    function step(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      displayScore.value = Math.round(from + (newScore - from) * eased)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(step)
      } else {
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
    class="player-card glass-card flex-1 min-w-0 text-center"
    :class="{ active: isActive, flash: scoreFlash }"
  >
    <div class="player-name text-[0.85rem] font-semibold text-fg-muted mb-xs uppercase tracking-[1px]">
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

<style scoped>
.player-card {
  padding: var(--spacing-lg) var(--spacing-xl);
  border: 2px solid transparent;
  transition:
    border-color var(--duration-normal) var(--ease-out),
    box-shadow var(--duration-normal) var(--ease-out);
}

@media (max-width: 480px) {
  .player-card {
    padding: var(--spacing-md) var(--spacing-lg);
  }
}

.player-card.active {
  border-color: var(--gold);
  box-shadow: var(--shadow-glow-gold);
}

.player-card.flash {
  box-shadow:
    var(--shadow-glow-gold),
    0 0 30px rgba(255, 215, 0, 0.3);
}

.active .player-name {
  color: var(--gold);
}
</style>
