import { DEFAULT_THEME_ID, getThemeById } from '~/utils/dartboard-themes'
import type { DartboardTheme } from '~/utils/dartboard-themes'
import type { CheckoutMode, GameMode, PlayerDescriptor } from '#shared/game-models'

const STORAGE_KEY = 'darts-scorer:settings'

export interface LastGameSettings {
  mode: GameMode
  checkout: CheckoutMode
  legs_to_win: number
  sets_to_win: number
  players: PlayerDescriptor[]
}

interface AppSettings {
  dartboardTheme: string
  lastGameSettings: LastGameSettings | null
}

const settings = reactive<AppSettings>({
  dartboardTheme: DEFAULT_THEME_ID,
  lastGameSettings: null,
})

let loaded = false

function load() {
  if (loaded) return
  loaded = true
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppSettings>
      if (parsed.dartboardTheme) settings.dartboardTheme = parsed.dartboardTheme
      if (parsed.lastGameSettings) settings.lastGameSettings = parsed.lastGameSettings
    }
  } catch {
    // ignore corrupt data
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // storage full, ignore
  }
}

export function useSettings() {
  if (import.meta.client) load()

  const dartboardTheme = computed<DartboardTheme>({
    get: () => getThemeById(settings.dartboardTheme),
    set: (theme: DartboardTheme) => {
      settings.dartboardTheme = theme.id
      save()
    },
  })

  function setDartboardThemeId(id: string) {
    settings.dartboardTheme = id
    save()
  }

  function saveLastGameSettings(gameSettings: LastGameSettings) {
    settings.lastGameSettings = gameSettings
    save()
  }

  function getLastGameSettings(): LastGameSettings | null {
    return settings.lastGameSettings
  }

  return {
    dartboardTheme,
    dartboardThemeId: computed(() => settings.dartboardTheme),
    setDartboardThemeId,
    saveLastGameSettings,
    getLastGameSettings,
    lastGameSettings: computed(() => settings.lastGameSettings),
  }
}
