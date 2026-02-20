<script setup lang="ts">
import type { CheckoutMode } from '~/types/game'
import type { TournamentFormat } from '~/types/tournament'
import { FORMAT_LABELS } from '~/types/tournament'

const props = defineProps<{
  name: string
  format: TournamentFormat
  players: string[]
  gameMode: '501' | '301'
  checkout: CheckoutMode
  legsToWin: number
  setsToWin: number
  groupCount?: number
  advancePerGroup?: number
  teamMode?: 'doubles' | null
}>()

const { getAvatarProps } = usePlayers()

const isGroupFormat = computed(() =>
  props.format === 'group_only' || props.format === 'group_knockout',
)

const checkoutLabel = computed(() =>
  props.checkout === 'double_out' ? 'Double Out' : 'Single Out',
)
</script>

<template>
  <div class="flex flex-col items-center gap-lg p-xl bg-surface-1 border-2 border-black rounded-lg shadow-md w-full">
    <!-- Tournament name -->
    <h3 class="text-[1.2rem] font-extrabold text-fg text-center">
      {{ name || 'Untitled Tournament' }}
    </h3>

    <!-- Format badge -->
    <div class="flex gap-sm flex-wrap justify-center">
      <span class="px-lg py-xs bg-yellow-light border-2 border-black rounded-sm text-[0.8rem] font-bold text-black">{{ FORMAT_LABELS[format] }}</span>
      <span v-if="teamMode" class="px-lg py-xs bg-yellow-light border-2 border-black rounded-sm text-[0.8rem] font-bold text-black">Doubles</span>
    </div>

    <!-- Players / Teams -->
    <div class="flex flex-col gap-sm w-full items-center">
      <span class="text-[0.7rem] font-semibold text-fg-muted uppercase tracking-widest">{{ players.length }} {{ teamMode ? 'Teams' : 'Players' }}</span>
      <div class="flex gap-md overflow-x-auto max-w-full py-xs justify-center flex-wrap">
        <div
          v-for="pName in players"
          :key="pName"
          class="flex flex-col items-center gap-[2px] shrink-0"
        >
          <PlayerAvatar v-bind="getAvatarProps(pName)" :size="32" />
          <span class="text-[0.65rem] font-semibold text-fg-secondary max-w-[50px] overflow-hidden text-ellipsis whitespace-nowrap text-center">{{ pName }}</span>
        </div>
      </div>
    </div>

    <!-- Settings tags -->
    <div class="flex flex-wrap gap-sm justify-center">
      <span class="px-md py-xs bg-yellow-light border-2 border-black rounded-sm text-[0.75rem] font-semibold text-black">{{ gameMode }}</span>
      <span class="px-md py-xs bg-surface-2 border-2 border-black rounded-sm text-[0.75rem] font-semibold text-fg-secondary">{{ checkoutLabel }}</span>
      <span class="px-md py-xs bg-surface-2 border-2 border-black rounded-sm text-[0.75rem] font-semibold text-fg-secondary">{{ legsToWin }} {{ legsToWin === 1 ? 'Leg' : 'Legs' }}</span>
      <span v-if="setsToWin > 1" class="px-md py-xs bg-surface-2 border-2 border-black rounded-sm text-[0.75rem] font-semibold text-fg-secondary">{{ setsToWin }} Sets</span>
      <span v-if="isGroupFormat && groupCount" class="px-md py-xs bg-surface-2 border-2 border-black rounded-sm text-[0.75rem] font-semibold text-fg-secondary">{{ groupCount }} Groups</span>
      <span v-if="format === 'group_knockout' && advancePerGroup" class="px-md py-xs bg-surface-2 border-2 border-black rounded-sm text-[0.75rem] font-semibold text-fg-secondary">Top {{ advancePerGroup }} advance</span>
    </div>
  </div>
</template>
