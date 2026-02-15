# Feature 17 — Customizable Dartboard Themes

**Priority:** 12 (Low) | **Effort:** Small | **Impact:** Low
**Depends on:** Nothing

---

## Summary

Visual personalization through different dartboard color schemes. Four built-in themes: Classic, Neon, Monochrome, and High Contrast. Theme preference saved in localStorage.

---

## Theme Definitions

### `app/utils/dartboard-themes.ts` (NEW)

```ts
export interface DartboardTheme {
  id: string
  name: string
  colors: {
    black: string         // "black" segments (normally black)
    white: string         // "white" segments (normally cream)
    red: string           // red segments
    green: string         // green segments
    wireColor: string     // wire/grid color
    numberColor: string   // segment numbers
    background: string    // board background (outside double ring)
    bullOuter: string     // outer bull (green)
    bullInner: string     // inner bull (red)
  }
}

export const DARTBOARD_THEMES: Record<string, DartboardTheme> = {
  classic: {
    id: 'classic',
    name: 'Classic',
    colors: {
      black: '#1a1a2e',
      white: '#f5f0e6',
      red: '#cc3333',
      green: '#2d8a4e',
      wireColor: '#999',
      numberColor: '#eee',
      background: '#111',
      bullOuter: '#2d8a4e',
      bullInner: '#cc3333',
    },
  },
  neon: {
    id: 'neon',
    name: 'Neon',
    colors: {
      black: '#0a0a1a',
      white: '#1a1a3a',
      red: '#ff1744',
      green: '#00e676',
      wireColor: '#00bcd4',
      numberColor: '#e0e0ff',
      background: '#050510',
      bullOuter: '#00e676',
      bullInner: '#ff1744',
    },
  },
  monochrome: {
    id: 'monochrome',
    name: 'Monochrome',
    colors: {
      black: '#1a1a1a',
      white: '#e0e0e0',
      red: '#666',
      green: '#444',
      wireColor: '#888',
      numberColor: '#ccc',
      background: '#0a0a0a',
      bullOuter: '#444',
      bullInner: '#666',
    },
  },
  'high-contrast': {
    id: 'high-contrast',
    name: 'High Contrast',
    colors: {
      black: '#000000',
      white: '#ffffff',
      red: '#ff0000',
      green: '#00ff00',
      wireColor: '#ffff00',
      numberColor: '#ffffff',
      background: '#000000',
      bullOuter: '#00ff00',
      bullInner: '#ff0000',
    },
  },
}

export const DEFAULT_THEME = 'classic'
```

---

## DartBoard.vue Changes

The current `DartBoard.vue` component likely uses hardcoded SVG colors. Refactor to use theme colors:

### Current (hardcoded):
```html
<path d="..." fill="#cc3333" />  <!-- red segment -->
<path d="..." fill="#2d8a4e" />  <!-- green segment -->
```

### Refactored (themed):
```vue
<script setup lang="ts">
const props = defineProps<{
  disabled?: boolean
  highlightSegments?: { segment: number; multiplier: number }[]
  theme?: string
}>()

const { getTheme } = useDartboardTheme()
const currentTheme = computed(() => getTheme(props.theme))
</script>

<template>
  <!-- Use currentTheme.colors.red, currentTheme.colors.green, etc. -->
  <svg>
    <path :fill="isRedSegment ? currentTheme.colors.red : currentTheme.colors.green" ... />
  </svg>
</template>
```

### How the SVG uses colors:

The dartboard has a repeating pattern:
- **Even-positioned segments**: red/black
- **Odd-positioned segments**: green/white
- **Inner/outer rings**: multiplier areas use red/green
- **Bull**: outer = green, inner = red
- **Wires**: thin lines separating segments

Map each SVG path's current color to the theme's color palette.

---

## Settings Composable

### `app/composables/useSettings.ts` (NEW)

```ts
interface AppSettings {
  dartboardTheme: string
  // Future: audioEnabled, announcer, etc.
}

const SETTINGS_KEY = 'darts-scorer:settings'

export function useSettings() {
  const settings = useLocalStorage<AppSettings>(SETTINGS_KEY, {
    dartboardTheme: 'classic',
  })

  return {
    settings,
    dartboardTheme: computed({
      get: () => settings.value.dartboardTheme,
      set: (v: string) => { settings.value.dartboardTheme = v },
    }),
  }
}
```

---

## Theme Selector UI

Add to profile/settings page or as a section in a new settings page:

### `app/pages/settings.vue` or within `app/pages/profile-setup.vue`

```vue
<div class="theme-selector">
  <span class="settings-label">Dartboard Theme</span>
  <div class="theme-grid">
    <button
      v-for="theme in themes"
      :key="theme.id"
      class="theme-preview"
      :class="{ active: currentTheme === theme.id }"
      @click="setTheme(theme.id)"
    >
      <!-- Mini dartboard preview with theme colors -->
      <MiniDartBoard :theme="theme.id" :size="80" />
      <span>{{ theme.name }}</span>
    </button>
  </div>
</div>
```

The existing `MiniDartBoard.vue` component can be extended to accept a theme prop for preview rendering.

---

## Files to Create

| File | Description |
|------|-------------|
| `app/utils/dartboard-themes.ts` | Theme definitions (4 themes) |
| `app/composables/useSettings.ts` | User settings (localStorage-based) |

## Files to Modify

| File | Change |
|------|--------|
| `app/components/DartBoard.vue` | Replace hardcoded colors with theme-derived colors. Accept `theme` prop |
| `app/components/MiniDartBoard.vue` | Accept `theme` prop for preview |
| `app/pages/game.vue` | Pass current theme to DartBoard |
| `app/pages/profile-setup.vue` or new settings page | Theme selector UI |

---

## Implementation Notes

- Theme preference is **local only** (localStorage). No DB storage needed.
- The `useSettings()` composable will also be used by Sound Effects (#10) and Announcer (#18) features.
- SVG colors can be set via `:fill` bindings or CSS custom properties.

### CSS Custom Properties approach (alternative):

```css
/* Applied to the dartboard container based on theme */
.dartboard[data-theme="neon"] {
  --board-red: #ff1744;
  --board-green: #00e676;
  --board-black: #0a0a1a;
  --board-white: #1a1a3a;
}
```

Then in SVG: `fill="var(--board-red)"`

---

## Testing Strategy

1. Each theme applies correct colors to all board elements
2. Theme persists across page reloads
3. Theme selector shows accurate previews
4. Default theme (classic) matches current appearance
5. DartBoard click-to-score still works with all themes
6. High contrast theme is genuinely accessible
