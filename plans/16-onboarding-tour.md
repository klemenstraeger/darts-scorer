# Feature 16 — Onboarding Tour

**Priority:** 11 (Medium) | **Effort:** Small | **Impact:** Medium
**Depends on:** Nothing

---

## Summary

A step-by-step guided tour for first-time users that highlights key UI elements and explains how to use the app. Uses lightweight tooltips with step counter and next/skip buttons.

---

## Library Choice

**Recommended:** [`driver.js`](https://driverjs.com/) v1.x

- Lightweight (~5KB gzipped)
- No dependencies
- Supports highlighting specific elements
- Step-by-step guided tours
- Customizable styling
- Works well with Vue/Nuxt

**Alternative:** Build a minimal custom solution with a composable + tooltip component (avoids dependency but more work).

---

## Tour Steps

### Home Page Tour (first visit)

| Step | Target | Message |
|------|--------|---------|
| 1 | Player picker | "Select players for your game. Tap to add, drag to reorder." |
| 2 | Bot buttons | "Add AI opponents at different difficulty levels." |
| 3 | Quick Start button | "Jump into a quick 501 game with default settings." |
| 4 | Wizard next button | "Or customize your game: mode, checkout, legs, and sets." |
| 5 | Navigation bar | "Use the nav bar to access tournaments, stats, and players." |

### Game Page Tour (first game)

| Step | Target | Message |
|------|--------|---------|
| 1 | Score display | "Your remaining score. First to reach 0 wins." |
| 2 | Numpad | "Tap the number you hit. Use S/D/T for single, double, triple." |
| 3 | Current turn slots | "Your 3 darts for this turn appear here." |
| 4 | Checkout hint | "When a checkout is possible, the suggested darts show here." |
| 5 | Undo button | "Made a mistake? Tap undo to reverse your last dart." |
| 6 | Dartboard FAB | "Open the interactive dartboard for click-to-score." |

---

## Composable

### `app/composables/useOnboarding.ts` (NEW)

```ts
const ONBOARDING_KEY = 'darts-scorer:onboarding'

interface OnboardingState {
  home: boolean      // home page tour completed
  game: boolean      // game page tour completed
  stats: boolean     // stats page tour completed
}

export function useOnboarding() {
  const state = useLocalStorage<OnboardingState>(ONBOARDING_KEY, {
    home: false,
    game: false,
    stats: false,
  })

  function shouldShowTour(page: keyof OnboardingState): boolean {
    return !state.value[page]
  }

  function completeTour(page: keyof OnboardingState) {
    state.value[page] = true
  }

  function resetTours() {
    state.value = { home: false, game: false, stats: false }
  }

  async function startTour(steps: TourStep[]) {
    const { driver } = await import('driver.js')
    await import('driver.js/dist/driver.css')

    const driverObj = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      steps: steps.map(s => ({
        element: s.target,
        popover: {
          title: s.title,
          description: s.description,
          side: s.side ?? 'bottom',
        },
      })),
      onDestroyed: () => {
        // Mark tour as completed
      },
    })

    driverObj.drive()
    return driverObj
  }

  return {
    shouldShowTour,
    completeTour,
    resetTours,
    startTour,
  }
}

interface TourStep {
  target: string      // CSS selector
  title: string
  description: string
  side?: 'top' | 'bottom' | 'left' | 'right'
}
```

---

## Page Integration

### `app/pages/index.vue`

```ts
const { shouldShowTour, completeTour, startTour } = useOnboarding()

onMounted(async () => {
  if (shouldShowTour('home')) {
    // Small delay for DOM to render
    await nextTick()
    setTimeout(async () => {
      await startTour([
        { target: '.player-picker', title: 'Select Players', description: 'Tap to select players...' },
        { target: '.bot-diff-btn', title: 'Add Bots', description: 'Add AI opponents...' },
        { target: '.quick-start-btn', title: 'Quick Start', description: 'Jump into a quick game...' },
        { target: '.wizard-shell .btn-next', title: 'Customize', description: 'Or customize settings...' },
        { target: 'nav', title: 'Navigation', description: 'Access all features here.' },
      ])
      completeTour('home')
    }, 500)
  }
})
```

### `app/pages/game.vue`

```ts
onMounted(async () => {
  if (shouldShowTour('game')) {
    setTimeout(async () => {
      await startTour([
        { target: '.player-card', title: 'Score', description: 'Your remaining score...' },
        { target: '.numpad', title: 'Score Input', description: 'Tap the number you hit...' },
        { target: '.ct-slot', title: 'Your Darts', description: 'Three darts per turn...' },
        { target: '.btn-undo', title: 'Undo', description: 'Reverse your last dart...' },
        { target: '.dartboard-fab', title: 'Dartboard', description: 'Open the visual dartboard...' },
      ])
      completeTour('game')
    }, 500)
  }
})
```

---

## Styling

Customize driver.js to match the app's dark theme:

```css
/* In main.css or scoped */
.driver-popover {
  background: var(--surface-glass) !important;
  backdrop-filter: blur(var(--blur-glass)) !important;
  border: 1px solid var(--border-gold) !important;
  color: var(--text-primary) !important;
  border-radius: var(--radius-lg) !important;
}

.driver-popover .driver-popover-title {
  color: var(--gold) !important;
  font-weight: 800 !important;
}

.driver-popover .driver-popover-description {
  color: var(--text-secondary) !important;
}

.driver-popover-navigation-btns .driver-popover-next-btn {
  background: var(--gold-gradient) !important;
  color: var(--text-inverse) !important;
}

.driver-overlay {
  background: rgba(0, 0, 0, 0.7) !important;
}
```

---

## Re-trigger Tour

Add "Replay Tour" option in settings or help menu:

```vue
<!-- In profile or settings page -->
<button @click="resetTours()">Replay Guided Tour</button>
```

---

## Files to Create

| File | Description |
|------|-------------|
| `app/composables/useOnboarding.ts` | Tour state management + driver.js integration |

## Files to Modify

| File | Change |
|------|--------|
| `app/pages/index.vue` | Trigger home tour on first visit |
| `app/pages/game.vue` | Trigger game tour on first game |
| `app/assets/css/main.css` | Custom driver.js theme styles |
| `package.json` | Add `driver.js` dependency |

---

## Testing Strategy

1. Tour shows on first visit, not on subsequent visits
2. Skip button completes tour early
3. Tour state persists in localStorage
4. Reset tours feature works
5. Tour doesn't break on missing elements (graceful degradation)
6. Dark theme styling renders correctly
