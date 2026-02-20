<script setup lang="ts">
import type { GameState } from '~/types/game'
import { count180s, getCheckoutDart, highestTurnScore, totalDartsThrown } from '#shared/game-models'
import { threeDartAverage, throwLabel } from '~/types/game'

const props = defineProps<{
  state: GameState
  isTournamentMatch: boolean
  tournamentId: number | null
}>()

defineEmits<{
  dismiss: []
  clearTournament: []
}>()

const { getAvatarProps } = usePlayers()
const { isAuthenticated } = useAuth()

const isMatch = computed(() => props.state.legs_to_win > 1 || props.state.sets_to_win > 1)
const hasSets = computed(() => props.state.sets_to_win > 1)

const winnerName = computed(() => {
  if (props.state.winner_index == null)
    return ''
  return props.state.players[props.state.winner_index]?.name ?? ''
})
</script>

<template>
  <div class="fixed inset-0 flex items-center justify-center z-100 bg-black/50 overflow-y-auto p-md">
    <div class="text-center max-w-[520px] w-full bg-surface-1 border-[3px] border-black rounded-lg p-xl shadow-[8px_8px_0_black]">
      <!-- Title -->
      <div class="text-[2.5rem] font-extrabold text-yellow mb-sm" style="animation: scale-in 0.5s var(--ease-spring);">
        Game Over
      </div>

      <!-- Winner -->
      <div class="flex items-center justify-center gap-md mb-lg" style="animation: scale-in 0.5s var(--ease-spring) 0.1s both;">
        <PlayerAvatar v-if="winnerName" v-bind="getAvatarProps(winnerName)" :size="56" />
        <div>
          <div class="text-[1.5rem] font-bold text-fg">
            {{ winnerName }}
          </div>
          <div class="text-[0.7rem] font-extrabold tracking-[2px] text-yellow uppercase">
            WINNER
          </div>
        </div>
      </div>

      <!-- Player stat cards -->
      <div class="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-sm mb-xl" style="animation: scale-in 0.5s var(--ease-spring) 0.15s both;">
        <div
          v-for="(player, i) in state.players"
          :key="i"
          class="bg-surface-1 border-2 border-black rounded-md p-md shadow-sm"
          :class="i === state.winner_index ? 'border-yellow bg-yellow-light' : ''"
        >
          <div class="flex items-center gap-sm mb-sm pb-sm border-b-2 border-black/10">
            <PlayerAvatar v-bind="getAvatarProps(player.name)" :size="32" />
            <span class="text-[0.85rem] font-bold text-fg uppercase tracking-[0.5px]">{{ player.name }}</span>
          </div>
          <div class="grid grid-cols-3 gap-x-sm gap-y-xs">
            <div class="flex flex-col items-center">
              <span class="text-[1.1rem] font-extrabold text-fg tabular-nums">{{ threeDartAverage(player).toFixed(1) }}</span>
              <span class="text-[0.65rem] font-semibold text-fg-secondary uppercase tracking-[0.5px]">Avg</span>
            </div>
            <div class="flex flex-col items-center">
              <span class="text-[1.1rem] font-extrabold text-fg tabular-nums">{{ totalDartsThrown(player) }}</span>
              <span class="text-[0.65rem] font-semibold text-fg-secondary uppercase tracking-[0.5px]">Darts</span>
            </div>
            <div class="flex flex-col items-center">
              <span class="text-[1.1rem] font-extrabold text-fg tabular-nums">{{ highestTurnScore(player) }}</span>
              <span class="text-[0.65rem] font-semibold text-fg-secondary uppercase tracking-[0.5px]">Best</span>
            </div>
            <div v-if="count180s(player) > 0" class="flex flex-col items-center">
              <span class="text-[1.1rem] font-extrabold text-yellow tabular-nums">{{ count180s(player) }}</span>
              <span class="text-[0.65rem] font-semibold text-fg-secondary uppercase tracking-[0.5px]">180s</span>
            </div>
            <div v-if="i === state.winner_index && getCheckoutDart(player)" class="flex flex-col items-center">
              <span class="text-[1.1rem] font-extrabold text-yellow tabular-nums">{{ throwLabel(getCheckoutDart(player)!) }}</span>
              <span class="text-[0.65rem] font-semibold text-fg-secondary uppercase tracking-[0.5px]">Checkout</span>
            </div>
            <div v-if="isMatch" class="flex flex-col items-center">
              <span class="text-[1.1rem] font-extrabold text-fg tabular-nums">
                <template v-if="hasSets">{{ state.sets_won[i] ?? 0 }}s </template>{{ player.legs_won }}l
              </span>
              <span class="text-[0.65rem] font-semibold text-fg-secondary uppercase tracking-[0.5px]">{{ hasSets ? 'Sets/Legs' : 'Legs' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Signup prompt for anonymous users -->
      <SignupPrompt v-if="!isAuthenticated" />

      <!-- Action buttons -->
      <div class="flex gap-md justify-center" style="animation: scale-in 0.5s var(--ease-spring) 0.2s both;">
        <NuxtLink
          v-if="isTournamentMatch"
          :to="`/tournaments/${tournamentId}`"
          class="inline-flex items-center justify-center px-xl py-md bg-yellow border-2 border-black rounded-lg text-fg-inverse font-extrabold text-[0.95rem] no-underline shadow-md transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          @click="$emit('clearTournament')"
        >
          Back to Tournament
        </NuxtLink>
        <template v-else>
          <Button variant="default" size="lg" @click="$emit('dismiss')">
            Continue
          </Button>
          <NuxtLink
            :to="isAuthenticated ? '/dashboard' : '/play'"
            class="inline-flex items-center justify-center px-xl py-md bg-surface-1 border-2 border-black rounded-lg text-fg font-extrabold text-[0.95rem] no-underline shadow-md transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            New Game
          </NuxtLink>
        </template>
      </div>
    </div>
  </div>
</template>
