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
  <div class="video-container" :class="{ connected: isConnected }">
    <video
      v-show="stream"
      ref="videoEl"
      class="video-stream"
      autoplay
      playsinline
      muted
    />

    <!-- Connecting overlay -->
    <div v-if="isConnecting" class="video-overlay">
      <span class="text-fg-muted text-sm">Connecting camera...</span>
    </div>

    <!-- No stream placeholder -->
    <div v-if="!stream && !isConnecting" class="video-overlay">
      <svg class="camera-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9.75a2.25 2.25 0 002.25-2.25V7.5a2.25 2.25 0 00-2.25-2.25H4.5A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.video-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: var(--surface-1);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 2px solid var(--border-subtle);
  transition: border-color 0.3s ease;
}

.video-container.connected {
  border-color: #4ade80;
  box-shadow: 0 0 12px rgba(74, 222, 128, 0.2);
}

.video-stream {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.video-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-1);
}

.camera-icon {
  width: 32px;
  height: 32px;
  color: var(--text-muted);
  opacity: 0.4;
}
</style>
