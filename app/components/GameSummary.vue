<script setup lang="ts">
import type { CheckoutMode } from '~/types/game'

const props = defineProps<{
  players: string[]
  gameMode: '501' | '301'
  checkout: CheckoutMode
  legsToWin: number
  setsToWin: number
}>()

const { getAvatarProps } = usePlayers()

const checkoutLabel = computed(() =>
  props.checkout === 'double_out' ? 'Double Out' : 'Single Out',
)
</script>

<template>
  <div class="flex flex-col items-center gap-xl p-xl bg-surface-1 border-2 border-black rounded-lg shadow-sm w-full">
    <!-- Players row -->
    <div class="flex items-center gap-lg flex-wrap justify-center">
      <template v-for="(name, i) in players" :key="name">
        <div class="flex flex-col items-center gap-xs">
          <PlayerAvatar v-bind="getAvatarProps(name)" :size="44" />
          <span class="text-[0.9rem] font-bold text-fg">{{ name }}</span>
        </div>
        <span v-if="i < players.length - 1" class="text-[0.75rem] font-extrabold text-fg-muted uppercase tracking-[0.05em]">vs</span>
      </template>
    </div>

    <!-- Settings tags -->
    <div class="flex flex-wrap gap-sm justify-center">
      <span class="px-md py-xs bg-yellow-light border-2 border-black rounded-full text-[0.75rem] font-semibold text-yellow">{{ gameMode }}</span>
      <span class="px-md py-xs bg-surface-2 border-2 border-black rounded-full text-[0.75rem] font-semibold text-fg-secondary">{{ checkoutLabel }}</span>
      <span class="px-md py-xs bg-surface-2 border-2 border-black rounded-full text-[0.75rem] font-semibold text-fg-secondary">{{ legsToWin }} {{ legsToWin === 1 ? 'Leg' : 'Legs' }}</span>
      <span v-if="setsToWin > 1" class="px-md py-xs bg-surface-2 border-2 border-black rounded-full text-[0.75rem] font-semibold text-fg-secondary">{{ setsToWin }} Sets</span>
    </div>
  </div>
</template>
