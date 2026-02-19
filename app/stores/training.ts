import type { TrainingEvent, TrainingModeState } from '#shared/training/training-models'

export const useTrainingStore = defineStore('training', () => {
  const state = ref<TrainingModeState | null>(null)
  const lastEvent = ref<TrainingEvent | null>(null)
  const sessionComplete = ref(false)

  function updateState(data: TrainingModeState) {
    state.value = data
  }

  function triggerEvent(event: TrainingEvent) {
    lastEvent.value = event
    setTimeout(() => {
      lastEvent.value = null
    }, 2000)
  }

  function reset() {
    state.value = null
    lastEvent.value = null
    sessionComplete.value = false
  }

  return { state, lastEvent, sessionComplete, updateState, triggerEvent, reset }
})
