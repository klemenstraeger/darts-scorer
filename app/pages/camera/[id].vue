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
    </template>
  </div>
</template>
