<script setup lang="ts">
import type { Multiplier } from '~/types/game'
import type { TrainingModeState } from '~/types/training'
import { TrainingEngine } from '#shared/training/training-engine'
import { TRAINING_MODES } from '~/types/training'

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
  if (!state.value)
    return null
  return TRAINING_MODES.find(m => m.mode === state.value!.mode)
})

const confirmStop = ref(false)

function onScore(segment: number, multiplier: number) {
  if (!state.value || state.value.isComplete)
    return
  handleThrow(segment, multiplier as Multiplier)
}

function handleNewSession() {
  if (!state.value)
    return
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
  if (!state.value?.isComplete)
    return null
  const engine = new TrainingEngine(JSON.parse(JSON.stringify(state.value)))
  return engine.getStats()
})
</script>

<template>
  <div v-if="state" class="h-full flex flex-col overflow-hidden px-sm md:px-md">
    <!-- Top bar -->
    <div class="flex items-center justify-between py-xs shrink-0">
      <div>
        <button
          class="inline-flex items-center gap-xs bg-transparent border-none text-fg-muted text-[0.8rem] font-semibold cursor-pointer px-sm py-xs rounded-sm transition-all duration-fast hover:text-[var(--red)] hover:bg-[var(--surface-2)]"
          @click="confirmStop ? handleStop() : (confirmStop = true)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {{ confirmStop ? 'Confirm Stop?' : 'Stop' }}
        </button>
      </div>
      <span class="text-[0.85rem] font-extrabold uppercase tracking-widest" :style="{ color: modeInfo?.color }">
        {{ modeInfo?.name ?? state.mode }}
      </span>
      <div>
        <span class="text-[0.8rem] font-semibold text-fg-muted tabular-nums">{{ state.throws.length }} darts</span>
      </div>
    </div>

    <!-- Mode-specific display -->
    <div class="shrink-0 py-sm">
      <TrainingHeader :state="(state as TrainingModeState)" />
    </div>

    <!-- Score input -->
    <div class="flex-1 min-h-0 flex flex-col gap-xs">
      <ManualScoreInput
        :disabled="state.isComplete"
        @score="onScore"
      />

      <div class="flex gap-sm shrink-0 pb-xs">
        <button
          class="flex-1 min-h-[48px] rounded-lg text-base font-bold uppercase tracking-wider bg-surface-1 border-2 border-black text-fg-secondary shadow-md cursor-pointer transition-all duration-fast hover:not-disabled:-translate-x-0.5 hover:not-disabled:-translate-y-0.5 hover:not-disabled:shadow-lg hover:not-disabled:bg-[var(--surface-2)] active:not-disabled:translate-x-0.5 active:not-disabled:translate-y-0.5 active:not-disabled:shadow-none disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="state.isComplete || state.throws.length === 0"
          @click="undoThrow"
        >
          Undo
        </button>
      </div>
    </div>

    <!-- Event flash overlay -->
    <Transition name="fade">
      <div v-if="lastEvent === 'target_hit'" class="fixed inset-0 flex items-center justify-center z-100 pointer-events-none bg-black/40">
        <span class="text-[3rem] font-black text-[var(--green)]" style="animation: flash-appear 0.3s var(--ease-spring);">Hit!</span>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="lastEvent === 'target_missed'" class="fixed inset-0 flex items-center justify-center z-100 pointer-events-none bg-black/40">
        <span class="text-[2.5rem] font-black text-fg-muted" style="animation: flash-appear 0.3s var(--ease-spring);">Miss</span>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="lastEvent === 'shanghai'" class="fixed inset-0 flex items-center justify-center z-100 pointer-events-none bg-black/50">
        <span class="text-[4rem] font-black text-[var(--yellow)]" style="animation: flash-appear 0.4s var(--ease-spring);">Shanghai!</span>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="lastEvent === 'failed'" class="fixed inset-0 flex items-center justify-center z-100 pointer-events-none bg-black/60">
        <span class="text-[4rem] font-black text-[var(--red)]" style="animation: flash-appear 0.4s var(--ease-spring);">Failed!</span>
      </div>
    </Transition>

    <!-- Audio FAB -->
    <button
      class="fixed bottom-[12px] right-[12px] md:bottom-[24px] md:right-[24px] w-10 h-10 rounded-full bg-surface-1 border-2 border-black text-fg-secondary cursor-pointer flex items-center justify-center z-10 shadow-[3px_3px_0_black] transition-all duration-fast hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_black] hover:text-[var(--yellow)]"
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
