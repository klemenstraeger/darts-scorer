import { TrainingEngine } from '#shared/training/training-engine'
import type { TrainingConfig, TrainingModeState, TrainingEvent } from '#shared/training/training-models'
import type { Multiplier } from '#shared/game-models'

const STORAGE_KEY = 'darts-scorer:active-training'

interface PersistedTraining {
  state: TrainingModeState
}

// Module-level state shared across all consumers
let engine: TrainingEngine | null = null
const hasActiveSession = ref(false)

function persistToStorage() {
  if (!engine?.state || !import.meta.client) return
  const data: PersistedTraining = {
    state: JSON.parse(JSON.stringify(engine.state)),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function clearStorage() {
  if (!import.meta.client) return
  localStorage.removeItem(STORAGE_KEY)
}

function readStorage(): PersistedTraining | null {
  if (!import.meta.client) return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function useTrainingState() {
  const store = useTrainingStore()
  const { play, vibrate } = useAudio()

  function syncToStore() {
    if (!engine?.state) return
    store.updateState(JSON.parse(JSON.stringify(engine.state)))
  }

  function newSession(config: TrainingConfig) {
    store.reset()
    engine = new TrainingEngine()
    engine.newSession(config)
    syncToStore()
    persistToStorage()
    hasActiveSession.value = true
  }

  function handleThrow(segment: number, multiplier: Multiplier) {
    if (!engine?.state) return
    if (engine.state.isComplete) return

    const result = engine.manualScore(segment, multiplier)
    syncToStore()

    // Process events
    for (const evt of result.events) {
      store.triggerEvent(evt)
      handleEventAudio(evt)
    }

    if (engine.state.isComplete) {
      store.sessionComplete = true
      // Save completed session to server
      const stats = engine.getStats()
      $fetch('/api/training/save', {
        method: 'POST',
        body: {
          session: JSON.parse(JSON.stringify(engine.state)),
          throws: engine.state.throws,
          stats,
        },
      }).catch((err) => {
        console.warn('Failed to save training session:', err)
      })
      clearStorage()
    } else {
      persistToStorage()
    }
  }

  function handleEventAudio(event: TrainingEvent) {
    switch (event) {
      case 'target_hit':
        play('throw', 0.5)
        vibrate(15)
        break
      case 'target_missed':
        play('bust', 0.3)
        vibrate([30, 20, 30])
        break
      case 'round_complete':
        play('checkout')
        vibrate([30, 20, 60])
        break
      case 'session_complete':
        play('game-won')
        vibrate([50, 30, 50, 30, 200])
        break
      case 'shanghai':
        play('180')
        vibrate([30, 20, 30, 20, 100])
        break
      case 'failed':
        play('bust')
        vibrate([50, 30, 50])
        break
    }
  }

  function undoThrow() {
    if (!engine?.state) return
    engine.undo()
    // Un-complete the store if needed
    if (!engine.state.isComplete) {
      store.sessionComplete = false
    }
    syncToStore()
    persistToStorage()
  }

  function loadSession() {
    store.reset()
    const persisted = readStorage()
    if (!persisted?.state) return
    engine = new TrainingEngine(persisted.state)
    syncToStore()
    hasActiveSession.value = true
  }

  function stopSession() {
    engine?.stopSession()
    engine = null
    store.reset()
    clearStorage()
    hasActiveSession.value = false
  }

  function checkActiveSession(): boolean {
    const persisted = readStorage()
    const active = !!persisted?.state && !persisted.state.isComplete
    hasActiveSession.value = active
    return active
  }

  return {
    state: computed(() => store.state),
    lastEvent: computed(() => store.lastEvent),
    sessionComplete: computed(() => store.sessionComplete),
    hasActiveSession: readonly(hasActiveSession),
    newSession,
    handleThrow,
    undoThrow,
    loadSession,
    stopSession,
    checkActiveSession,
  }
}
