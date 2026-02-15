import type { DriveStep, Config } from 'driver.js'

interface OnboardingState {
  dashboard: boolean
  game: boolean
}

const STORAGE_KEY = 'darts-scorer:onboarding'

function loadState(): OnboardingState {
  if (!import.meta.client) return { dashboard: false, game: false }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { dashboard: false, game: false }
}

function saveState(state: OnboardingState) {
  if (!import.meta.client) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

const state = reactive<OnboardingState>(loadState())

export function useOnboarding() {
  function shouldShowTour(page: keyof OnboardingState): boolean {
    return !state[page]
  }

  function completeTour(page: keyof OnboardingState) {
    state[page] = true
    saveState(state)
  }

  function resetTours() {
    state.dashboard = false
    state.game = false
    saveState(state)
  }

  async function startTour(
    steps: DriveStep[],
    page: keyof OnboardingState,
    options?: Partial<Config>,
  ) {
    const [{ driver }] = await Promise.all([
      import('driver.js'),
      import('driver.js/dist/driver.css'),
    ])

    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayColor: 'rgba(0, 0, 0, 0.7)',
      stagePadding: 8,
      stageRadius: 12,
      popoverClass: 'darts-tour-popover',
      ...options,
      steps,
      onDestroyed: (element, step, opts) => {
        completeTour(page)
        options?.onDestroyed?.(element, step, opts)
      },
    })

    driverObj.drive()
  }

  return {
    shouldShowTour,
    completeTour,
    resetTours,
    startTour,
  }
}
