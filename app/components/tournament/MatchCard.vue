<script setup lang="ts">
import type { TournamentMatch } from '~/types/tournament'

const props = defineProps<{
  match: TournamentMatch
  showPlayButton?: boolean
}>()

const emit = defineEmits<{
  play: [matchId: number]
}>()

const { getAvatarProps } = usePlayers()

const isPlayable = computed(() =>
  props.match.status === 'pending'
  && props.match.player1Name
  && props.match.player2Name,
)

const _scoreDisplay = computed(() => {
  if (props.match.status !== 'completed')
    return null
  return `${props.match.player1LegsWon} - ${props.match.player2LegsWon}`
})
</script>

<template>
  <div
    class="flex items-center gap-sm px-md py-sm bg-surface-1 border-2 border-black rounded-md shadow-sm"
    :class="{
      'border-yellow': (isPlayable && showPlayButton) || match.status === 'in_progress',
      'border-[3px]': match.status === 'in_progress',
      'opacity-85': match.status === 'completed',
    }"
  >
    <div class="flex-1 flex items-center gap-sm min-w-0">
      <div class="flex-1 flex items-center justify-between gap-xs min-w-0">
        <div class="flex items-center gap-xs min-w-0">
          <PlayerAvatar v-if="match.player1Name" v-bind="getAvatarProps(match.player1Name)" :size="20" />
          <span class="text-[0.8rem] font-semibold whitespace-nowrap overflow-hidden text-ellipsis" :class="match.winnerName === match.player1Name ? 'text-yellow font-bold' : 'text-fg-secondary'">{{ match.player1Name || 'TBD' }}</span>
        </div>
        <span v-if="match.status === 'completed'" class="text-[0.85rem] font-extrabold tabular-nums" :class="match.winnerName === match.player1Name ? 'text-yellow' : 'text-fg'">{{ match.player1LegsWon }}</span>
      </div>
      <div class="shrink-0 w-9 text-center">
        <span v-if="match.status === 'in_progress'" class="text-[0.6rem] font-extrabold text-yellow uppercase" style="animation: pulse-opacity 1.5s ease-in-out infinite;">LIVE</span>
        <span v-else class="text-[0.65rem] font-semibold text-fg-muted uppercase">vs</span>
      </div>
      <div class="flex-1 flex items-center justify-between gap-xs min-w-0 flex-row-reverse">
        <div class="flex items-center gap-xs min-w-0">
          <PlayerAvatar v-if="match.player2Name" v-bind="getAvatarProps(match.player2Name)" :size="20" />
          <span class="text-[0.8rem] font-semibold whitespace-nowrap overflow-hidden text-ellipsis" :class="match.winnerName === match.player2Name ? 'text-yellow font-bold' : 'text-fg-secondary'">{{ match.player2Name || 'TBD' }}</span>
        </div>
        <span v-if="match.status === 'completed'" class="text-[0.85rem] font-extrabold tabular-nums" :class="match.winnerName === match.player2Name ? 'text-yellow' : 'text-fg'">{{ match.player2LegsWon }}</span>
      </div>
    </div>
    <Button
      v-if="isPlayable && showPlayButton"
      variant="default"
      size="sm"
      class="shrink-0 text-[0.75rem] px-md py-xs"
      @click.stop="emit('play', match.id)"
    >
      Play
    </Button>
  </div>
</template>
