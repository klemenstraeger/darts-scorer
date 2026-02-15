<script setup lang="ts">
definePageMeta({ layout: 'spectate' })

const route = useRoute()
const tournamentId = computed(() => Number(route.params.id))
const user = useSupabaseUser()

// Auth check — camera requires login
const needsLogin = computed(() => !user.value)

const { state, localStream, errorMsg, startBroadcast, stopBroadcast } = useBroadcaster(tournamentId)

const videoEl = ref<HTMLVideoElement | null>(null)

// Bind stream to video element
watch(localStream, (stream) => {
  if (videoEl.value) {
    videoEl.value.srcObject = stream
  }
})

onMounted(() => {
  if (!needsLogin.value) {
    startBroadcast()
  }
})

const statusText = computed(() => {
  switch (state.value) {
    case 'starting': return 'Starting camera...'
    case 'waiting': return 'Waiting for spectate view...'
    case 'connected': return 'Live'
    case 'error': return errorMsg.value || 'Connection error'
    default: return ''
  }
})

const statusClass = computed(() => {
  if (state.value === 'connected') return 'status-live'
  if (state.value === 'error') return 'status-error'
  return 'status-waiting'
})

async function handleStop() {
  await stopBroadcast()
  navigateTo(`/tournaments/${tournamentId.value}`)
}
</script>

<template>
  <div class="camera-page">
    <!-- Not logged in -->
    <div v-if="needsLogin" class="auth-prompt">
      <p class="text-fg-muted text-sm">Login required to broadcast.</p>
      <NuxtLink to="/login" class="btn btn-gold mt-md">Login</NuxtLink>
    </div>

    <!-- Camera view -->
    <template v-else>
      <video
        ref="videoEl"
        class="camera-preview"
        autoplay
        playsinline
        muted
      />

      <!-- Status overlay -->
      <div class="status-bar">
        <div class="status-indicator" :class="statusClass">
          <span v-if="state === 'connected'" class="pulse-dot" />
          <span class="status-text">{{ statusText }}</span>
        </div>
        <button class="stop-btn" @click="handleStop">
          Stop
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.camera-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: #000;
  overflow: hidden;
}

.auth-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.camera-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  background: linear-gradient(to bottom, rgba(0,0,0,0.7), transparent);
  z-index: 10;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  font-size: 0.85rem;
  font-weight: 600;
}

.status-waiting {
  color: var(--text-muted);
}

.status-live {
  color: #4ade80;
}

.status-error {
  color: #f87171;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4ade80;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.stop-btn {
  padding: var(--spacing-xs) var(--spacing-lg);
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  backdrop-filter: blur(8px);
}

.stop-btn:active {
  transform: scale(0.95);
}
</style>
