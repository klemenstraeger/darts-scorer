<script setup lang="ts">
const props = withDefaults(defineProps<{
  totalSteps: number
  currentStep: number
  canAdvance?: boolean
  nextLabel?: string
  finishLabel?: string
  loading?: boolean
}>(), {
  canAdvance: true,
  nextLabel: 'Next',
  finishLabel: 'Start Game',
  loading: false,
})

const emit = defineEmits<{
  'update:currentStep': [step: number]
  next: []
  back: []
  finish: []
}>()

const direction = ref<'forward' | 'backward'>('forward')

const transitionName = computed(() =>
  direction.value === 'forward' ? 'slide-left' : 'slide-right'
)

const isLastStep = computed(() => props.currentStep === props.totalSteps)

function next() {
  if (isLastStep.value) {
    emit('finish')
    return
  }
  direction.value = 'forward'
  emit('update:currentStep', props.currentStep + 1)
  emit('next')
}

function back() {
  if (props.currentStep <= 1) return
  direction.value = 'backward'
  emit('update:currentStep', props.currentStep - 1)
  emit('back')
}

// Expose direction so parent can read transition state
defineExpose({ direction })
</script>

<template>
  <div class="wizard-shell">
    <!-- Step indicator dots -->
    <div class="flex justify-center gap-sm mb-xl">
      <span
        v-for="i in totalSteps"
        :key="i"
        class="step-dot"
        :class="{
          active: i === currentStep,
          completed: i < currentStep,
        }"
      />
    </div>

    <!-- Step content with slide transitions -->
    <Transition :name="transitionName" mode="out-in">
      <slot />
    </Transition>

    <!-- Navigation footer -->
    <div class="wizard-footer">
      <button
        v-if="currentStep > 1"
        class="wizard-back-btn"
        @click="back"
      >
        &larr; Back
      </button>
      <div v-else />

      <button
        class="btn btn-gold wizard-next-btn"
        :class="{ 'btn-finish': isLastStep }"
        :disabled="!canAdvance || loading"
        @click="next"
      >
        {{ loading ? 'Loading...' : isLastStep ? finishLabel : nextLabel }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.wizard-shell {
  width: 100%;
}

/* ── Step indicator dots ─────────────────────────────────────────────── */
.step-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--surface-3);
  transition: all var(--duration-normal) var(--ease-out);
}

.step-dot.active {
  background: var(--gold);
  transform: scale(1.35);
  box-shadow: 0 0 8px var(--gold-glow);
}

.step-dot.completed {
  background: var(--gold-dim);
}

/* ── Navigation footer ───────────────────────────────────────────────── */
.wizard-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--spacing-2xl);
  gap: var(--spacing-md);
}

.wizard-back-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: var(--spacing-sm) var(--spacing-md);
  transition: color var(--duration-fast);
}

.wizard-back-btn:hover {
  color: var(--text-primary);
}

.wizard-next-btn {
  padding: var(--spacing-sm) var(--spacing-2xl);
  font-size: 0.95rem;
}

.wizard-next-btn.btn-finish {
  padding: var(--spacing-md) var(--spacing-3xl);
  font-size: 1.05rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: var(--shadow-glow-gold);
}

.wizard-next-btn.btn-finish:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-glow-gold), 0 8px 30px rgba(255, 215, 0, 0.2);
}

.wizard-next-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Slide transitions ───────────────────────────────────────────────── */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all var(--duration-slow) var(--ease-out);
}

/* Forward: enter from right, leave to left */
.slide-left-enter-from {
  opacity: 0;
  transform: translateX(40px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-40px);
}

/* Backward: enter from left, leave to right */
.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-40px);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(40px);
}
</style>
