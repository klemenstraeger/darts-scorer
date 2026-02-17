<script setup lang="ts">
import type { TrainingModeState } from '~/types/training'
import type { Multiplier } from '~/types/game'
import { TRAINING_MODES } from '~/types/training'
import { TrainingEngine } from '#shared/training/training-engine'

const {
  state,
  lastEvent,
  sessionComplete,
  hasActiveSession,
  handleThrow,
  undoThrow,
  loadSession,
  stopSession,
  newSession,
} = useTrainingState()

const { audioEnabled, toggle: toggleAudio } = useAudio()

// Load session on mount
onMounted(() => {
  loadSession()
})

// Redirect if no active session
watch(hasActiveSession, (active) => {
  if (!active && !sessionComplete.value) {
    navigateTo('/training')
  }
})

const modeInfo = computed(() => {
  if (!state.value) return null
  return TRAINING_MODES.find(m => m.mode === state.value!.mode)
})

const showDartboard = ref(false)
const confirmStop = ref(false)

function onScore(segment: number, multiplier: number) {
  if (!state.value || state.value.isComplete) return
  handleThrow(segment, multiplier as Multiplier)
}

function handleNewSession() {
  if (!state.value) return
  const config = { ...state.value.config }
  stopSession()
  newSession(config)
}

function handleStop() {
  stopSession()
  navigateTo('/training')
}

// Compute stats for completion overlay
const completionStats = computed(() => {
  if (!state.value?.isComplete) return null
  const engine = new TrainingEngine(JSON.parse(JSON.stringify(state.value)))
  return engine.getStats()
})
</script>

<template>
  <div class="training-play" v-if="state">
    <!-- Top bar -->
    <div class="play-header">
      <div class="play-header-left">
        <button class="play-back-btn" @click="confirmStop ? handleStop() : (confirmStop = true)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {{ confirmStop ? 'Confirm Stop?' : 'Stop' }}
        </button>
      </div>
      <span class="play-mode-name" :style="{ color: modeInfo?.color }">
        {{ modeInfo?.name ?? state.mode }}
      </span>
      <div class="play-header-right">
        <span class="play-darts-count">{{ state.throws.length }} darts</span>
      </div>
    </div>

    <!-- Mode-specific display -->
    <div class="play-display">
      <TrainingHeader :state="(state as TrainingModeState)" />
    </div>

    <!-- Score input -->
    <div class="play-input">
      <ManualScoreInput
        :disabled="state.isComplete"
        @score="onScore"
      />

      <div class="play-actions">
        <button
          class="btn btn-undo flex-1"
          :disabled="state.isComplete || state.throws.length === 0"
          @click="undoThrow"
        >
          Undo
        </button>
      </div>
    </div>

    <!-- Event flash overlay -->
    <Transition name="fade">
      <div v-if="lastEvent === 'target_hit'" class="overlay bg-black/40">
        <span class="hit-text">Hit!</span>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="lastEvent === 'target_missed'" class="overlay bg-black/40">
        <span class="miss-text">Miss</span>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="lastEvent === 'shanghai'" class="overlay bg-black/50">
        <span class="shanghai-text">Shanghai!</span>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="lastEvent === 'failed'" class="overlay bg-black/60">
        <span class="failed-text">Failed!</span>
      </div>
    </Transition>

    <!-- Audio FAB -->
    <button
      class="audio-fab"
      :title="audioEnabled ? 'Mute' : 'Unmute'"
      @click="toggleAudio()"
    >
      <svg v-if="audioEnabled" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      </svg>
      <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </svg>
    </button>

    <!-- Dartboard FAB -->
    <button
      class="dartboard-fab"
      @click="showDartboard = !showDartboard"
      :title="showDartboard ? 'Close dartboard' : 'Open dartboard'"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    </button>

    <!-- Dartboard overlay -->
    <Transition name="fade">
      <div v-if="showDartboard" class="dartboard-overlay" @click.self="showDartboard = false">
        <div class="dartboard-container">
          <DartBoard
            :disabled="state.isComplete"
            @score="onScore"
          />
          <button class="dartboard-close" @click="showDartboard = false">&times;</button>
        </div>
      </div>
    </Transition>

    <!-- Completion overlay -->
    <TrainingComplete
      v-if="sessionComplete && state.isComplete"
      :state="(state as TrainingModeState)"
      :stats="completionStats"
      @new-session="handleNewSession"
      @back-to-menu="() => {}"
    />
  </div>
</template>

<style scoped>
.training-play {
  display: flex;
  flex-direction: column;
  height: calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 44px);
  margin-bottom: calc(-1 * env(safe-area-inset-bottom, 0px));
  padding: 0 var(--spacing-sm);
  overflow: hidden;
}

@media (min-width: 768px) {
  .training-play {
    padding: 0 var(--spacing-md);
  }
}

.play-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-xs) 0;
  flex-shrink: 0;
}

.play-back-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  background: none;
  border: none;
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  transition: all var(--duration-fast);
}

.play-back-btn:hover {
  color: var(--red);
  background: rgba(239, 68, 68, 0.08);
}

.play-mode-name {
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.play-darts-count {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.play-display {
  flex-shrink: 0;
  padding: var(--spacing-sm) 0;
}

.play-input {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.play-actions {
  display: flex;
  gap: var(--spacing-sm);
  flex-shrink: 0;
  padding-bottom: var(--spacing-xs);
}

.btn-undo {
  min-height: 48px;
  border-radius: var(--radius-lg);
  font-size: 1rem;
  font-weight: 700;
  font-family: var(--font-sans);
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  transition: transform 50ms var(--ease-out), background var(--duration-fast);
}

.btn-undo:active:not(:disabled) {
  transform: scale(0.97);
}

.btn-undo:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-undo:hover:not(:disabled) {
  background: var(--surface-3);
  border-color: var(--border-default);
}

/* Flash overlays */
.overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  pointer-events: none;
}

.hit-text {
  font-size: 3rem;
  font-weight: 900;
  color: var(--green);
  text-shadow: 0 0 40px rgba(34, 197, 94, 0.5);
  animation: flash-appear 0.3s var(--ease-spring);
}

.miss-text {
  font-size: 2.5rem;
  font-weight: 900;
  color: var(--text-muted);
  animation: flash-appear 0.3s var(--ease-spring);
}

.shanghai-text {
  font-size: 4rem;
  font-weight: 900;
  color: var(--gold);
  text-shadow: 0 0 60px var(--gold-glow);
  animation: flash-appear 0.4s var(--ease-spring);
}

.failed-text {
  font-size: 4rem;
  font-weight: 900;
  color: var(--red);
  text-shadow: 0 0 60px var(--red-glow);
  animation: flash-appear 0.4s var(--ease-spring);
}

@keyframes flash-appear {
  from { transform: scale(0.5); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* FABs */
.audio-fab {
  position: fixed;
  bottom: var(--space-md, 12px);
  right: calc(var(--space-md, 12px) + 56px);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--surface-glass);
  backdrop-filter: blur(var(--blur-glass));
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: transform var(--duration-fast), box-shadow var(--duration-fast), border-color var(--duration-fast);
}

.audio-fab:hover {
  transform: scale(1.1);
  border-color: var(--border-gold);
  box-shadow: var(--shadow-glow-gold);
  color: var(--gold);
}

.dartboard-fab {
  position: fixed;
  bottom: var(--space-md, 12px);
  right: var(--space-md, 12px);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--surface-glass);
  backdrop-filter: blur(var(--blur-glass));
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: transform var(--duration-fast), box-shadow var(--duration-fast), border-color var(--duration-fast);
}

.dartboard-fab:hover {
  transform: scale(1.1);
  border-color: var(--border-gold);
  box-shadow: var(--shadow-glow-gold);
  color: var(--gold);
}

@media (min-width: 768px) {
  .audio-fab {
    bottom: var(--space-xl, 24px);
    right: calc(var(--space-xl, 24px) + 60px);
  }
  .dartboard-fab {
    bottom: var(--space-xl, 24px);
    right: var(--space-xl, 24px);
  }
}

.dartboard-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 90;
}

.dartboard-container {
  position: relative;
  width: min(80vw, 80vh, 600px);
  height: min(80vw, 80vh, 600px);
}

.dartboard-container :deep(.dartboard) {
  width: 100%;
  height: 100%;
}

.dartboard-close {
  position: absolute;
  top: -12px;
  right: -12px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--duration-fast);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
