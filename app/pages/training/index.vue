<script setup lang="ts">
import type { TrainingMode, TrainingConfig, AroundTheClockVariant } from '~/types/training'
import { TRAINING_MODES } from '~/types/training'

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
  if (!selectedMode.value) return
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
  target: '🎯',
  clock: '🕐',
  zap: '⚡',
  crosshair: '🔘',
  grid: '📊',
  'check-circle': '✅',
  star: '⭐',
}
</script>

<template>
  <div class="training-page px-lg py-xl max-w-[700px] mx-auto w-full max-sm:px-md">
    <div class="text-center mb-xl">
      <h1 class="text-[2rem] font-black text-fg max-sm:text-[1.6rem]">Solo Training</h1>
      <p class="text-fg-muted text-[0.9rem] mt-xs">Choose a practice mode to improve your game</p>
    </div>

    <!-- Resume session banner -->
    <div
      v-if="hasActiveSession"
      class="glass-card w-full px-xl py-lg flex items-center justify-between border border-border-gold mb-xl"
    >
      <div class="flex items-center gap-md">
        <span class="pulse-dot" />
        <div class="flex flex-col gap-[2px]">
          <span class="text-[0.9rem] font-bold text-fg">Training in progress</span>
          <span class="text-[0.75rem] text-fg-muted">Pick up where you left off</span>
        </div>
      </div>
      <button class="btn btn-gold" @click="resumeSession">Resume</button>
    </div>

    <!-- Mode selection grid or config panel -->
    <Transition name="fade" mode="out-in">
      <!-- Mode grid -->
      <div v-if="!selectedMode" key="grid" class="mode-grid">
        <button
          v-for="mode in TRAINING_MODES"
          :key="mode.mode"
          class="mode-card"
          @click="selectMode(mode.mode)"
        >
          <span class="mode-icon" :style="{ color: mode.color }">
            {{ modeIcons[mode.icon] ?? '🎯' }}
          </span>
          <span class="mode-name">{{ mode.name }}</span>
          <span class="mode-desc">{{ mode.description }}</span>
        </button>
      </div>

      <!-- Config panel -->
      <div v-else key="config" class="config-panel">
        <button class="back-btn" @click="selectedMode = null">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>

        <div class="config-header">
          <span class="config-icon" :style="{ color: TRAINING_MODES.find(m => m.mode === selectedMode)?.color }">
            {{ modeIcons[TRAINING_MODES.find(m => m.mode === selectedMode)?.icon ?? ''] ?? '🎯' }}
          </span>
          <h2 class="config-title">{{ TRAINING_MODES.find(m => m.mode === selectedMode)?.name }}</h2>
        </div>

        <div class="config-options glass-card p-lg">
          <!-- Scoring Practice options -->
          <template v-if="selectedMode === 'scoring-practice'">
            <div class="config-row">
              <label class="config-label">Rounds</label>
              <select v-model.number="rounds" class="config-select">
                <option :value="5">5</option>
                <option :value="10">10</option>
                <option :value="15">15</option>
                <option :value="20">20</option>
              </select>
            </div>
            <div class="config-row">
              <label class="config-label">Target (3-dart avg)</label>
              <select v-model.number="targetScore" class="config-select">
                <option :value="40">40+ (Beginner)</option>
                <option :value="60">60+ (Intermediate)</option>
                <option :value="80">80+ (Advanced)</option>
                <option :value="100">100+ (Pro)</option>
              </select>
            </div>
          </template>

          <!-- Around the Clock options -->
          <template v-else-if="selectedMode === 'around-the-clock'">
            <div class="config-row">
              <label class="config-label">Variant</label>
              <select v-model="variant" class="config-select">
                <option value="singles">Singles (any hit)</option>
                <option value="doubles">Doubles only</option>
                <option value="trebles">Trebles only</option>
              </select>
            </div>
          </template>

          <!-- Bob's 27 — no config needed -->
          <template v-else-if="selectedMode === 'bobs-27'">
            <p class="config-info">Start at 27 points. Hit doubles to add, miss all 3 to subtract. Score below 0 = failed.</p>
          </template>

          <!-- 100 Darts at Target options -->
          <template v-else-if="selectedMode === 'hundred-darts'">
            <div class="config-row">
              <label class="config-label">Target Segment</label>
              <select v-model.number="targetSegment" class="config-select">
                <option v-for="n in 20" :key="n" :value="n">{{ n }}</option>
                <option :value="25">Bull</option>
              </select>
            </div>
          </template>

          <!-- Cricket — no config needed -->
          <template v-else-if="selectedMode === 'cricket'">
            <p class="config-info">Close all cricket numbers (15-20 + Bull). 3 marks each: Single=1, Double=2, Treble=3.</p>
          </template>

          <!-- Checkout Practice options -->
          <template v-else-if="selectedMode === 'checkout-practice'">
            <div class="config-row">
              <label class="config-label">Number of targets</label>
              <select v-model.number="rounds" class="config-select">
                <option :value="5">5</option>
                <option :value="10">10</option>
                <option :value="15">15</option>
                <option :value="20">20</option>
              </select>
            </div>
          </template>

          <!-- Shanghai — no config needed -->
          <template v-else-if="selectedMode === 'shanghai'">
            <p class="config-info">20 rounds targeting 1-20. Score on target number only. Hit S+D+T in one round for Shanghai bonus!</p>
          </template>
        </div>

        <button class="start-btn" @click="startSession">
          Start Training
        </button>
      </div>
    </Transition>

    <!-- Stats link -->
    <div class="text-center mt-xl">
      <NuxtLink to="/training/stats" class="stats-link">
        View Training Stats
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.mode-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

@media (max-width: 480px) {
  .mode-grid {
    grid-template-columns: 1fr;
  }
}

.mode-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  background: var(--surface-glass);
  backdrop-filter: blur(var(--blur-glass));
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-out);
  text-align: center;
}

.mode-card:hover {
  border-color: var(--border-gold);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.mode-card:active {
  transform: scale(0.98);
}

.mode-icon {
  font-size: 2rem;
}

.mode-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}

.mode-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
  line-height: 1.4;
}

/* Config panel */
.config-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  background: none;
  border: none;
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: var(--spacing-xs) 0;
  transition: color var(--duration-fast);
}

.back-btn:hover {
  color: var(--text-primary);
}

.config-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.config-icon {
  font-size: 2rem;
}

.config-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
}

.config-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.config-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.config-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.config-select {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  min-width: 160px;
}

.config-info {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.start-btn {
  width: 100%;
  padding: var(--spacing-md);
  background: var(--gold-gradient);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--radius-lg);
  font-family: var(--font-sans);
  font-size: 1.05rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: var(--shadow-glow-gold);
  transition: transform var(--duration-fast), box-shadow var(--duration-normal);
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-glow-gold), 0 8px 30px rgba(255, 215, 0, 0.2);
}

.start-btn:active {
  transform: scale(0.97);
}

.stats-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  transition: color var(--duration-fast);
}

.stats-link:hover {
  color: var(--gold);
}

/* Resume pulse */
.pulse-dot {
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--green);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
