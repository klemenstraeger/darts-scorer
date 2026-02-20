<script setup lang="ts">
import type { AroundTheClockVariant, TrainingConfig, TrainingMode } from '~/types/training'
import { TRAINING_MODES } from '~/types/training'

withDefaults(defineProps<{
  showHeader?: boolean
}>(), {
  showHeader: true,
})

const { hasActiveSession, checkActiveSession, newSession } = useTrainingState()

// Check for active session on mount
onMounted(() => {
  checkActiveSession()
})

// Mode configuration state
const selectedMode = ref<TrainingMode | null>(null)

// Config overrides
const rounds = ref(10)
const targetScore = ref(60)
const variant = ref<AroundTheClockVariant>('singles')
const targetSegment = ref(20)

function selectMode(mode: TrainingMode) {
  selectedMode.value = mode
}

function startSession() {
  if (!selectedMode.value)
    return
  const config: TrainingConfig = {
    mode: selectedMode.value,
    rounds: rounds.value,
    targetScore: targetScore.value,
    variant: variant.value,
    targetSegment: targetSegment.value,
  }
  newSession(config)
  navigateTo('/training/play')
}

function resumeSession() {
  navigateTo('/training/play')
}

const modeIcons: Record<string, string> = {
  'target': '🎯',
  'clock': '🕐',
  'zap': '⚡',
  'crosshair': '🔘',
  'grid': '📊',
  'check-circle': '✅',
  'star': '⭐',
}
</script>

<template>
  <div class="flex flex-col w-full">
    <div v-if="showHeader" class="text-center mb-xl">
      <h1 class="text-[2rem] font-black text-fg max-sm:text-[1.6rem]">
        Solo Training
      </h1>
      <p class="text-fg-muted text-[0.9rem] mt-xs">
        Choose a practice mode to improve your game
      </p>
    </div>

    <!-- Resume session banner -->
    <div
      v-if="hasActiveSession"
      class="w-full px-xl py-lg flex items-center justify-between bg-surface-1 border-2 border-black shadow-md mb-xl"
    >
      <div class="flex items-center gap-md">
        <span class="block w-2.5 h-2.5 rounded-full bg-green" style="animation: pulse-scale 2s ease-in-out infinite;" />
        <div class="flex flex-col gap-[2px]">
          <span class="text-[0.9rem] font-bold text-fg">Training in progress</span>
          <span class="text-[0.75rem] text-fg-muted">Pick up where you left off</span>
        </div>
      </div>
      <Button variant="default" @click="resumeSession">
        Resume
      </Button>
    </div>

    <!-- Mode selection grid or config panel -->
    <Transition name="fade" mode="out-in">
      <!-- Mode grid -->
      <div v-if="!selectedMode" key="grid" class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-md max-[480px]:grid-cols-1">
        <button
          v-for="mode in TRAINING_MODES"
          :key="mode.mode"
          class="flex flex-col items-center gap-sm p-lg bg-surface-1 border-2 border-black rounded-lg cursor-pointer transition-all duration-200 text-center shadow-md hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          @click="selectMode(mode.mode)"
        >
          <span class="text-[2rem]" :style="{ color: mode.color }">
            {{ modeIcons[mode.icon] ?? '🎯' }}
          </span>
          <span class="text-[0.95rem] font-bold text-fg">{{ mode.name }}</span>
          <span class="text-[0.75rem] text-fg-muted leading-[1.4]">{{ mode.description }}</span>
        </button>
      </div>

      <!-- Config panel -->
      <div v-else key="config" class="flex flex-col gap-lg">
        <button
          class="inline-flex items-center gap-xs bg-transparent border-none text-fg-muted font-sans text-[0.85rem] font-semibold cursor-pointer py-xs px-0 transition-colors duration-150 hover:text-fg"
          @click="selectedMode = null"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>

        <div class="flex items-center gap-md">
          <span class="text-[2rem]" :style="{ color: TRAINING_MODES.find(m => m.mode === selectedMode)?.color }">
            {{ modeIcons[TRAINING_MODES.find(m => m.mode === selectedMode)?.icon ?? ''] ?? '🎯' }}
          </span>
          <h2 class="text-[1.5rem] font-extrabold text-fg">
            {{ TRAINING_MODES.find(m => m.mode === selectedMode)?.name }}
          </h2>
        </div>

        <div class="flex flex-col gap-md p-lg bg-surface-1 border-2 border-black rounded-md shadow-md">
          <!-- Scoring Practice options -->
          <template v-if="selectedMode === 'scoring-practice'">
            <div class="flex items-center justify-between gap-md">
              <label class="text-[0.85rem] font-semibold text-fg-secondary">Rounds</label>
              <select v-model.number="rounds" class="tp-config-select">
                <option :value="5">
                  5
                </option>
                <option :value="10">
                  10
                </option>
                <option :value="15">
                  15
                </option>
                <option :value="20">
                  20
                </option>
              </select>
            </div>
            <div class="flex items-center justify-between gap-md">
              <label class="text-[0.85rem] font-semibold text-fg-secondary">Target (3-dart avg)</label>
              <select v-model.number="targetScore" class="tp-config-select">
                <option :value="40">
                  40+ (Beginner)
                </option>
                <option :value="60">
                  60+ (Intermediate)
                </option>
                <option :value="80">
                  80+ (Advanced)
                </option>
                <option :value="100">
                  100+ (Pro)
                </option>
              </select>
            </div>
          </template>

          <!-- Around the Clock options -->
          <template v-else-if="selectedMode === 'around-the-clock'">
            <div class="flex items-center justify-between gap-md">
              <label class="text-[0.85rem] font-semibold text-fg-secondary">Variant</label>
              <select v-model="variant" class="tp-config-select">
                <option value="singles">
                  Singles (any hit)
                </option>
                <option value="doubles">
                  Doubles only
                </option>
                <option value="trebles">
                  Trebles only
                </option>
              </select>
            </div>
          </template>

          <!-- Bob's 27 — no config needed -->
          <template v-else-if="selectedMode === 'bobs-27'">
            <p class="text-[0.85rem] text-fg-muted leading-[1.5]">
              Start at 27 points. Hit doubles to add, miss all 3 to subtract. Score below 0 = failed.
            </p>
          </template>

          <!-- 100 Darts at Target options -->
          <template v-else-if="selectedMode === 'hundred-darts'">
            <div class="flex items-center justify-between gap-md">
              <label class="text-[0.85rem] font-semibold text-fg-secondary">Target Segment</label>
              <select v-model.number="targetSegment" class="tp-config-select">
                <option v-for="n in 20" :key="n" :value="n">
                  {{ n }}
                </option>
                <option :value="25">
                  Bull
                </option>
              </select>
            </div>
          </template>

          <!-- Cricket — no config needed -->
          <template v-else-if="selectedMode === 'cricket'">
            <p class="text-[0.85rem] text-fg-muted leading-[1.5]">
              Close all cricket numbers (15-20 + Bull). 3 marks each: Single=1, Double=2, Treble=3.
            </p>
          </template>

          <!-- Checkout Practice options -->
          <template v-else-if="selectedMode === 'checkout-practice'">
            <div class="flex items-center justify-between gap-md">
              <label class="text-[0.85rem] font-semibold text-fg-secondary">Number of targets</label>
              <select v-model.number="rounds" class="tp-config-select">
                <option :value="5">
                  5
                </option>
                <option :value="10">
                  10
                </option>
                <option :value="15">
                  15
                </option>
                <option :value="20">
                  20
                </option>
              </select>
            </div>
          </template>

          <!-- Shanghai — no config needed -->
          <template v-else-if="selectedMode === 'shanghai'">
            <p class="text-[0.85rem] text-fg-muted leading-[1.5]">
              20 rounds targeting 1-20. Score on target number only. Hit S+D+T in one round for Shanghai bonus!
            </p>
          </template>
        </div>

        <Button variant="default" size="lg" class="w-full text-[1.05rem]" @click="startSession">
          Start Training
        </Button>
      </div>
    </Transition>

    <!-- Stats link -->
    <div class="text-center mt-xl">
      <NuxtLink to="/training/stats" class="inline-flex items-center gap-xs text-fg-muted no-underline text-[0.85rem] font-semibold transition-colors duration-150 hover:text-yellow">
        View Training Stats
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </NuxtLink>
    </div>
  </div>
</template>

<style>
/* Select inputs need custom styling that can't be pure Tailwind (font-family, appearance) */
.tp-config-select {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--surface-1);
  border: 2px solid black;
  border-radius: var(--radius-sm);
  color: var(--fg);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  min-width: 160px;
}
</style>
