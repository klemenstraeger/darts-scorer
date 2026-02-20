<script setup lang="ts">
defineProps<{
  isPlaying: boolean
  speed: number
  currentPosition: number
  totalPositions: number
  canStepBack: boolean
  canStepForward: boolean
}>()

const emit = defineEmits<{
  togglePlay: []
  stepForward: []
  stepBack: []
  goToStart: []
  goToEnd: []
  setSpeed: [speed: number]
  seek: [position: number]
}>()

const speeds = [1, 2, 4]

function onSeek(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  emit('seek', value)
}
</script>

<template>
  <div class="flex flex-col gap-md p-lg bg-surface-1 border-2 border-black rounded-lg shadow-md">
    <!-- Timeline scrubber -->
    <div class="flex items-center gap-md">
      <span class="text-[0.75rem] text-fg-muted min-w-[70px] text-center font-medium tabular-nums">
        {{ currentPosition }} / {{ totalPositions }}
      </span>
      <input
        type="range"
        class="replay-scrubber"
        :min="0"
        :max="totalPositions"
        :value="currentPosition"
        @input="onSeek"
      >
    </div>

    <!-- Playback buttons -->
    <div class="flex items-center justify-center gap-sm">
      <button
        class="inline-flex items-center justify-center w-9 h-9 border-2 border-black rounded-md bg-surface-1 text-fg-secondary cursor-pointer shadow-sm transition-all duration-150 hover:text-fg hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-30 disabled:cursor-not-allowed"
        title="Go to start"
        :disabled="!canStepBack"
        @click="emit('goToStart')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="19 20 9 12 19 4 19 20" />
          <line x1="5" y1="19" x2="5" y2="5" />
        </svg>
      </button>

      <button
        class="inline-flex items-center justify-center w-9 h-9 border-2 border-black rounded-md bg-surface-1 text-fg-secondary cursor-pointer shadow-sm transition-all duration-150 hover:text-fg hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-30 disabled:cursor-not-allowed"
        title="Step back"
        :disabled="!canStepBack"
        @click="emit('stepBack')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="19 20 9 12 19 4 19 20" />
        </svg>
      </button>

      <button
        class="inline-flex items-center justify-center w-11 h-11 rounded-full bg-yellow border-2 border-black text-fg-inverse cursor-pointer shadow-md transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        :title="isPlaying ? 'Pause' : 'Play'"
        @click="emit('togglePlay')"
      >
        <!-- Pause icon -->
        <svg v-if="isPlaying" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
        <!-- Play icon -->
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="6 3 20 12 6 21 6 3" />
        </svg>
      </button>

      <button
        class="inline-flex items-center justify-center w-9 h-9 border-2 border-black rounded-md bg-surface-1 text-fg-secondary cursor-pointer shadow-sm transition-all duration-150 hover:text-fg hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-30 disabled:cursor-not-allowed"
        title="Step forward"
        :disabled="!canStepForward"
        @click="emit('stepForward')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="5 4 15 12 5 20 5 4" />
        </svg>
      </button>

      <button
        class="inline-flex items-center justify-center w-9 h-9 border-2 border-black rounded-md bg-surface-1 text-fg-secondary cursor-pointer shadow-sm transition-all duration-150 hover:text-fg hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-30 disabled:cursor-not-allowed"
        title="Go to end"
        :disabled="!canStepForward"
        @click="emit('goToEnd')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="5 4 15 12 5 20 5 4" />
          <line x1="19" y1="5" x2="19" y2="19" />
        </svg>
      </button>

      <!-- Speed selector -->
      <div class="flex gap-[2px] ml-md bg-surface-2 rounded-md border-2 border-black overflow-hidden">
        <button
          v-for="s in speeds"
          :key="s"
          class="px-sm py-xs border-none bg-transparent text-fg-muted font-sans text-[0.7rem] font-semibold cursor-pointer transition-all duration-150 hover:bg-surface-3 hover:text-fg-secondary"
          :class="speed === s ? 'bg-yellow-light text-yellow' : ''"
          @click="emit('setSpeed', s)"
        >
          {{ s }}x
        </button>
      </div>
    </div>
  </div>
</template>

<style>
/* Range input needs custom styling that can't be pure Tailwind */
.replay-scrubber {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--surface-3);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.replay-scrubber::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--yellow);
  border: 2px solid black;
  cursor: pointer;
  transition: transform var(--duration-fast);
}

.replay-scrubber::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.replay-scrubber::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--yellow);
  cursor: pointer;
  border: 2px solid black;
}
</style>
