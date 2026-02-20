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
  'next': []
  'back': []
  'finish': []
}>()

const direction = ref<'forward' | 'backward'>('forward')

const transitionName = computed(() =>
  direction.value === 'forward' ? 'slide-left' : 'slide-right',
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
  if (props.currentStep <= 1)
    return
  direction.value = 'backward'
  emit('update:currentStep', props.currentStep - 1)
  emit('back')
}

// Expose direction so parent can read transition state
defineExpose({ direction })
</script>

<template>
  <div class="w-full">
    <!-- Step indicator dots -->
    <div class="flex justify-center gap-sm mb-xl">
      <span
        v-for="i in totalSteps"
        :key="i"
        class="w-2 h-2 rounded-full transition-all duration-200"
        :class="{
          'bg-yellow scale-[1.35] border-2 border-black': i === currentStep,
          'bg-yellow opacity-50': i < currentStep,
          'bg-surface-3': i > currentStep,
        }"
      />
    </div>

    <!-- Step content with slide transitions -->
    <Transition :name="transitionName" mode="out-in">
      <slot />
    </Transition>

    <!-- Navigation footer -->
    <div class="flex items-center justify-between mt-2xl gap-md">
      <button
        v-if="currentStep > 1"
        class="bg-transparent border-none text-fg-muted font-sans text-[0.85rem] font-semibold cursor-pointer px-md py-sm transition-colors duration-150 hover:text-fg"
        @click="back"
      >
        &larr; Back
      </button>
      <div v-else />

      <Button
        variant="default"
        :size="isLastStep ? 'lg' : 'default'"
        :class="isLastStep ? 'px-3xl text-[1.05rem] font-extrabold uppercase tracking-[0.5px]' : 'px-2xl text-[0.95rem]'"
        :disabled="!canAdvance || loading"
        @click="next"
      >
        {{ loading ? 'Loading...' : isLastStep ? finishLabel : nextLabel }}
      </Button>
    </div>
  </div>
</template>
