<script setup lang="ts">
import { FORMAT_LABELS, type TournamentFormat } from '~/types/tournament'

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
  if (props.setsToWin > 1) parts.push(`Best of ${props.setsToWin * 2 - 1} sets`)
  else if (props.legsToWin > 1) parts.push(`Best of ${props.legsToWin * 2 - 1} legs`)
  return parts.join(' / ')
})

const isFullscreen = ref(false)

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
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
  <div class="spectator-header">
    <div class="header-left">
      <h1 class="header-title">{{ name }}</h1>
      <FormatBadge :format="format" />
      <span class="header-settings">{{ settingsStr }}</span>
    </div>
    <div class="header-right">
      <span v-if="winnerName" class="winner-badge">
        {{ winnerName }} wins!
      </span>
      <span v-if="isLive" class="live-badge">
        <span class="live-dot"></span>
        LIVE
      </span>
      <button class="fullscreen-btn" @click="toggleFullscreen" :title="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'">
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

<style scoped>
.spectator-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--surface-glass);
  backdrop-filter: blur(var(--blur-glass));
  -webkit-backdrop-filter: blur(var(--blur-glass));
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  min-width: 0;
}

.header-title {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-settings {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
  white-space: nowrap;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-shrink: 0;
}

.winner-badge {
  font-size: 0.85rem;
  font-weight: 700;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px var(--spacing-sm);
  background: var(--red-tint);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-full, 999px);
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--red);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--red);
  animation: pulse-dot 1.5s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}

.fullscreen-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  cursor: pointer;
  transition: color var(--duration-fast), border-color var(--duration-fast);
}

.fullscreen-btn:hover {
  color: var(--text-primary);
  border-color: var(--border-default);
}
</style>
