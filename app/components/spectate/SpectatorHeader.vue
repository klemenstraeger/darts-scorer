<script setup lang="ts">
import type { TournamentFormat } from '~/types/tournament'

const props = defineProps<{
  name: string
  format: TournamentFormat
  gameMode: string
  checkout: string
  legsToWin: number
  setsToWin: number
  isLive: boolean
  winnerName: string | null
}>()

const settingsStr = computed(() => {
  const parts = [props.gameMode, props.checkout === 'double_out' ? 'DO' : 'SO']
  if (props.setsToWin > 1)
    parts.push(`Best of ${props.setsToWin * 2 - 1} sets`)
  else if (props.legsToWin > 1)
    parts.push(`Best of ${props.legsToWin * 2 - 1} legs`)
  return parts.join(' / ')
})

const isFullscreen = ref(false)

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  }
  else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

onMounted(() => {
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})
</script>

<template>
  <div class="flex items-center justify-between px-lg py-sm bg-surface-1 border-b-2 border-black shrink-0">
    <div class="flex items-center gap-md min-w-0">
      <h1 class="text-[1.2rem] font-extrabold text-fg whitespace-nowrap overflow-hidden text-ellipsis">
        {{ name }}
      </h1>
      <FormatBadge :format="format" />
      <span class="text-[0.75rem] text-fg-muted font-semibold whitespace-nowrap">{{ settingsStr }}</span>
    </div>
    <div class="flex items-center gap-md shrink-0">
      <span v-if="winnerName" class="text-[0.85rem] font-bold text-yellow">
        {{ winnerName }} wins!
      </span>
      <span v-if="isLive" class="inline-flex items-center gap-[6px] px-sm py-[3px] bg-red border-2 border-black rounded-full text-[0.7rem] font-extrabold text-white uppercase tracking-[1px]">
        <span class="w-[6px] h-[6px] rounded-full bg-white" style="animation: pulse-opacity 1.5s ease-in-out infinite;" />
        LIVE
      </span>
      <button
        class="flex items-center justify-center w-[32px] h-[32px] rounded-sm bg-surface-1 border-2 border-black text-fg cursor-pointer transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-md active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        :title="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'"
        @click="toggleFullscreen"
      >
        <svg v-if="!isFullscreen" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
        </svg>
      </button>
    </div>
  </div>
</template>
