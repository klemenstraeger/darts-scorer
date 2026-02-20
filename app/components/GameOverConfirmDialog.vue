<script setup lang="ts">
import type { GameState } from '~/types/game'
import { getCheckoutDart } from '#shared/game-models'
import { throwLabel } from '~/types/game'

const props = defineProps<{
  state: GameState
  canUndo: boolean
}>()

defineEmits<{
  confirm: []
  cancel: []
}>()

const winnerName = computed(() => {
  if (props.state.winner_index == null)
    return ''
  return props.state.players[props.state.winner_index]?.name ?? ''
})

const checkoutDartLabel = computed(() => {
  if (props.state.winner_index == null)
    return null
  const winner = props.state.players[props.state.winner_index]
  if (!winner)
    return null
  const dart = getCheckoutDart(winner)
  return dart ? throwLabel(dart) : null
})
</script>

<template>
  <div class="fixed inset-0 flex items-center justify-center z-[110] bg-black/50">
    <div class="bg-surface-1 border-[3px] border-black rounded-lg p-xl px-2xl text-center max-w-[360px] w-[90vw] shadow-xl animate-[scale-in_0.3s_var(--ease-spring)]">
      <div class="text-2xl font-extrabold text-yellow mb-md">
        Confirm Game Over?
      </div>
      <div class="text-base text-fg-secondary mb-xl">
        <span class="font-bold text-fg">{{ winnerName }}</span> checked out
        <span v-if="checkoutDartLabel" class="inline-block font-bold text-yellow bg-yellow-light border-2 border-black rounded-sm px-[6px] py-[1px] ml-1">{{ checkoutDartLabel }}</span>
      </div>
      <div class="flex flex-col gap-sm">
        <Button variant="default" @click="$emit('confirm')">
          Confirm Result
        </Button>
        <Button
          variant="secondary"
          :disabled="!canUndo"
          @click="$emit('cancel')"
        >
          Undo Last Throw
        </Button>
      </div>
    </div>
  </div>
</template>
