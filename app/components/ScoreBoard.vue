<script setup lang="ts">
import type { Player } from '~/types/game'

defineProps<{
  players: Player[]
  currentPlayerIndex: number
}>()
</script>

<template>
  <div
    class="flex gap-md w-full max-xs:gap-sm"
    :class="{ 'grid grid-cols-2': players.length >= 3 }"
  >
    <PlayerCard
      v-for="(player, i) in players"
      :key="i"
      :player="player"
      :is-active="i === currentPlayerIndex"
    />
  </div>
</template>
