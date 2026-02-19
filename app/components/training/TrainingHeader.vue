<script setup lang="ts">
import type { TrainingModeState } from '~/types/training'

const _props = defineProps<{
  state: TrainingModeState
}>()
</script>

<template>
  <div class="training-display">
    <ScoringPracticeDisplay v-if="state.mode === 'scoring-practice'" :state="state" />
    <AroundTheClockDisplay v-else-if="state.mode === 'around-the-clock'" :state="state" />
    <Bobs27Display v-else-if="state.mode === 'bobs-27'" :state="state" />
    <HundredDartsDisplay v-else-if="state.mode === 'hundred-darts'" :state="state" />
    <CricketDisplay v-else-if="state.mode === 'cricket'" :state="state" />
    <CheckoutPracticeDisplay v-else-if="state.mode === 'checkout-practice'" :state="state" />
    <ShanghaiDisplay v-else-if="state.mode === 'shanghai'" :state="state" />
  </div>
</template>
