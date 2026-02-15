<script setup lang="ts">
import type { Player } from '~/types/game'

defineProps<{
  players: Player[]
  currentPlayerIndex: number
}>()
</script>

<template>
  <div class="scoreboard flex gap-md w-full max-xs:gap-sm" :class="`players-${players.length}`">
    <PlayerCard
      v-for="(player, i) in players"
      :key="i"
      :player="player"
      :is-active="i === currentPlayerIndex"
    />
  </div>
</template>

<style scoped>
/* 3-4 players: wrap into 2-col grid */
.scoreboard.players-3,
.scoreboard.players-4 {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
</style>
