import { DEFAULT_THEME_ID, getThemeById } from '~/utils/dartboard-themes'
import type { DartboardTheme } from '~/utils/dartboard-themes'

const STORAGE_KEY = 'darts-scorer:settings'

interface AppSettings {
  dartboardTheme: string
}

const settings = reactive<AppSettings>({
  dartboardTheme: DEFAULT_THEME_ID,
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

  return {
    dartboardTheme,
    dartboardThemeId: computed(() => settings.dartboardTheme),
    setDartboardThemeId,
  }
}
