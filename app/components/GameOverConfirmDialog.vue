<script setup lang="ts">
import type { GameState } from '~/types/game'
import { throwLabel } from '~/types/game'
import { getCheckoutDart } from '#shared/game-models'

const props = defineProps<{
  state: GameState
  canUndo: boolean
}>()

defineEmits<{
  confirm: []
  cancel: []
}>()

const winnerName = computed(() => {
  if (props.state.winner_index == null) return ''
  return props.state.players[props.state.winner_index]?.name ?? ''
})

const checkoutDartLabel = computed(() => {
  if (props.state.winner_index == null) return null
  const winner = props.state.players[props.state.winner_index]
  if (!winner) return null
  const dart = getCheckoutDart(winner)
  return dart ? throwLabel(dart) : null
})
</script>

<template>
  <div class="confirm-overlay">
    <div class="confirm-card">
      <div class="confirm-title">Confirm Game Over?</div>
      <div class="confirm-detail">
        <span class="confirm-winner">{{ winnerName }}</span> checked out
        <span v-if="checkoutDartLabel" class="confirm-dart">{{ checkoutDartLabel }}</span>
      </div>
      <div class="confirm-actions">
        <button class="btn btn-gold" @click="$emit('confirm')">
          Confirm Result
        </button>
        <button
          class="btn btn-secondary"
          :disabled="!canUndo"
          @click="$emit('cancel')"
        >
          Undo Last Throw
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 110;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
}

.confirm-card {
  background: var(--surface-1);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl) var(--spacing-2xl);
  text-align: center;
  max-width: 360px;
  width: 90vw;
  animation: scale-in 0.3s var(--ease-spring);
}

.confirm-title {
  font-size: 1.5rem;
  font-weight: 800;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--spacing-md);
}

.confirm-detail {
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xl);
}

.confirm-winner {
  font-weight: 700;
  color: var(--text-primary);
}

.confirm-dart {
  display: inline-block;
  font-weight: 700;
  color: var(--gold);
  background: rgba(255, 215, 0, 0.08);
  border: 1px solid rgba(255, 215, 0, 0.15);
  border-radius: var(--radius-sm);
  padding: 1px 6px;
  margin-left: 4px;
}

.confirm-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

@keyframes scale-in {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
