<script setup lang="ts">
definePageMeta({ layout: 'spectate' })

const route = useRoute()
const tournamentId = computed(() => Number(route.params.id))
const user = useSupabaseUser()

// Auth check — camera requires login
const needsLogin = computed(() => !user.value)

const {
  state, localStream, errorMsg,
  facingMode, zoomLevel, minZoom, maxZoom, zoomSupported, switchingCamera,
  startBroadcast, stopBroadcast, switchCamera, applyZoom,
} = useBroadcaster(tournamentId)

const debouncedApplyZoom = useDebounceFn(applyZoom, 200)

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

const zoomPercent = computed({
  get: () => {
    if (maxZoom.value <= minZoom.value) return 0
    return ((zoomLevel.value - minZoom.value) / (maxZoom.value - minZoom.value)) * 100
  },
  set: (pct: number) => {
    const zoom = minZoom.value + (pct / 100) * (maxZoom.value - minZoom.value)
    debouncedApplyZoom(Math.round(zoom * 10) / 10)
  },
})

async function handleStop() {
  await stopBroadcast()
  navigateTo(`/tournaments/${tournamentId.value}`)
}
</script>

<template>
  <div class="relative w-screen h-screen bg-black overflow-hidden">
    <!-- Not logged in -->
    <div v-if="needsLogin" class="flex flex-col items-center justify-center h-full">
      <p class="text-fg-muted text-sm">
        Login required to broadcast.
      </p>
      <NuxtLink
        to="/login"
        class="mt-md inline-flex items-center justify-center px-xl py-sm bg-[var(--yellow)] text-black border-2 border-black rounded-md font-bold text-sm shadow-md hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-fast"
      >
        Login
      </NuxtLink>
    </div>

    <!-- Camera view -->
    <template v-else>
      <video
        ref="videoEl"
        class="w-full h-full object-cover"
        autoplay
        playsinline
        muted
      />

      <!-- Status overlay -->
      <div class="fixed top-0 left-0 right-0 flex items-center justify-between px-lg py-md bg-white border-b-2 border-black z-10">
        <div
          class="flex items-center gap-sm px-md py-xs rounded-full text-[0.85rem] font-semibold"
          :class="{
            'text-[var(--green)]': state === 'connected',
            'text-[var(--red)]': state === 'error',
            'text-fg-muted': state !== 'connected' && state !== 'error',
          }"
        >
          <span
            v-if="state === 'connected'"
            class="w-2 h-2 rounded-full bg-[var(--green)]"
            style="animation: pulse-opacity 1.5s ease-in-out infinite;"
          />
          <span>{{ statusText }}</span>
        </div>
        <Button variant="destructive" size="sm" @click="handleStop">
          Stop
        </Button>
      </div>

      <!-- Camera controls overlay (bottom) -->
      <div class="fixed bottom-0 left-0 right-0 z-10 px-lg py-md bg-white border-t-2 border-black flex items-center gap-md">
        <!-- Camera switch button -->
        <button
          class="flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-black shadow-[2px_2px_0px_black] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-40"
          :disabled="switchingCamera || state === 'starting'"
          :title="facingMode === 'environment' ? 'Switch to front camera' : 'Switch to rear camera'"
          @click="switchCamera"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-5 h-5"
            :class="{ 'animate-spin': switchingCamera }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M20 7h-9" />
            <path d="M14 17H5" />
            <polyline points="17 4 20 7 17 10" />
            <polyline points="7 14 4 17 7 20" />
          </svg>
        </button>

        <!-- Zoom slider (only if supported) -->
        <template v-if="zoomSupported">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-4 h-4 shrink-0 text-fg-muted"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
          <input
            type="range"
            class="flex-1 h-2 appearance-none bg-gray-200 border border-black rounded-full accent-black cursor-pointer"
            :min="0"
            :max="100"
            :step="1"
            :value="zoomPercent"
            @input="zoomPercent = Number(($event.target as HTMLInputElement).value)"
          >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-5 h-5 shrink-0 text-fg-muted"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
          <span class="text-xs font-bold tabular-nums w-10 text-right">{{ zoomLevel.toFixed(1) }}×</span>
        </template>

        <!-- No zoom support notice -->
        <template v-else-if="state !== 'starting'">
          <span class="text-xs text-fg-muted">Zoom not supported on this device</span>
        </template>
      </div>
    </template>
  </div>
</template>
