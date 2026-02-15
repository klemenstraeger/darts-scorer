<script setup lang="ts">
const props = defineProps<{
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
  <div class="replay-controls">
    <!-- Timeline scrubber -->
    <div class="scrubber-row">
      <span class="position-label tabular-nums">
        {{ currentPosition }} / {{ totalPositions }}
      </span>
      <input
        type="range"
        class="scrubber"
        :min="0"
        :max="totalPositions"
        :value="currentPosition"
        @input="onSeek"
      />
    </div>

    <!-- Playback buttons -->
    <div class="controls-row">
      <button
        class="control-btn"
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
        class="control-btn"
        title="Step back"
        :disabled="!canStepBack"
        @click="emit('stepBack')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="19 20 9 12 19 4 19 20" />
        </svg>
      </button>

      <button
        class="control-btn play-btn"
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
        class="control-btn"
        title="Step forward"
        :disabled="!canStepForward"
        @click="emit('stepForward')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="5 4 15 12 5 20 5 4" />
        </svg>
      </button>

      <button
        class="control-btn"
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
      <div class="speed-group">
        <button
          v-for="s in speeds"
          :key="s"
          class="speed-btn"
          :class="{ active: speed === s }"
          @click="emit('setSpeed', s)"
        >
          {{ s }}x
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.replay-controls {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--surface-glass);
  backdrop-filter: blur(var(--blur-glass));
  -webkit-backdrop-filter: blur(var(--blur-glass));
  border: 1px solid var(--surface-glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.scrubber-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.position-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  min-width: 70px;
  text-align: center;
  font-weight: 500;
}

.scrubber {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--surface-3);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.scrubber::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--gold);
  cursor: pointer;
  box-shadow: 0 0 8px var(--gold-glow);
  transition: transform var(--duration-fast);
}

.scrubber::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.scrubber::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--gold);
  cursor: pointer;
  border: none;
  box-shadow: 0 0 8px var(--gold-glow);
}

.controls-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.control-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--surface-2);
  color: var(--text-secondary);
  cursor: pointer;
  transition:
    background var(--duration-fast),
    color var(--duration-fast),
    border-color var(--duration-fast),
    transform var(--duration-fast);
}

.control-btn:hover:not(:disabled) {
  background: var(--surface-3);
  color: var(--text-primary);
  border-color: var(--border-default);
  transform: translateY(-1px);
}

.control-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.control-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.play-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--gold-gradient);
  border-color: transparent;
  color: var(--text-inverse);
}

.play-btn:hover:not(:disabled) {
  background: var(--gold-gradient);
  color: var(--text-inverse);
  box-shadow: var(--shadow-glow-gold);
  border-color: transparent;
}

.speed-group {
  display: flex;
  gap: 2px;
  margin-left: var(--spacing-md);
  background: var(--surface-2);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
}

.speed-btn {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background var(--duration-fast),
    color var(--duration-fast);
}

.speed-btn:hover {
  background: var(--surface-3);
  color: var(--text-secondary);
}

.speed-btn.active {
  background: rgba(255, 215, 0, 0.15);
  color: var(--gold);
}
</style>
