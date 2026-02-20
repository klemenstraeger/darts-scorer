<script setup lang="ts">
const props = defineProps<{
  stream: MediaStream | null
  status: string
}>()

const videoEl = ref<HTMLVideoElement | null>(null)

watch(() => props.stream, (stream) => {
  if (videoEl.value) {
    videoEl.value.srcObject = stream
  }
})

onMounted(() => {
  if (videoEl.value && props.stream) {
    videoEl.value.srcObject = props.stream
  }
})

const isConnected = computed(() => props.status === 'connected')
const isConnecting = computed(() => props.status === 'connecting')
</script>

<template>
  <div
    class="relative w-full aspect-video bg-surface-1 rounded-lg overflow-hidden border-2 border-black shadow-md transition-[border-color] duration-300 ease-linear"
    :class="{ '!border-green': isConnected }"
  >
    <video
      v-show="stream"
      ref="videoEl"
      class="w-full h-full object-contain"
      autoplay
      playsinline
      muted
    />

    <!-- Connecting overlay -->
    <div v-if="isConnecting" class="absolute inset-0 flex items-center justify-center bg-surface-1">
      <span class="text-fg-muted text-sm">Connecting camera...</span>
    </div>

    <!-- No stream placeholder -->
    <div v-if="!stream && !isConnecting" class="absolute inset-0 flex items-center justify-center bg-surface-1">
      <svg class="w-[32px] h-[32px] text-fg-muted opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9.75a2.25 2.25 0 002.25-2.25V7.5a2.25 2.25 0 00-2.25-2.25H4.5A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
    </div>
  </div>
</template>
