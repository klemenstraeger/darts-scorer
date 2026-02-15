<script setup lang="ts">
const colorMode = useColorMode()

function toggle(e: MouseEvent) {
  const newMode = colorMode.value === 'dark' ? 'light' : 'dark'

  // Fallback for browsers without View Transition API
  if (!document.startViewTransition) {
    colorMode.preference = newMode
    return
  }

  // Capture click position for the circular reveal origin
  const x = e.clientX
  const y = e.clientY
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  )

  document.documentElement.style.setProperty('--reveal-x', `${x}px`)
  document.documentElement.style.setProperty('--reveal-y', `${y}px`)
  document.documentElement.style.setProperty('--reveal-r', `${radius}px`)

  const transition = document.startViewTransition(() => {
    colorMode.preference = newMode
  })

  transition.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${radius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 500,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        pseudoElement: '::view-transition-new(root)',
      },
    )
  })
}
</script>

<template>
  <button
    class="theme-toggle flex items-center justify-center p-xs bg-transparent border-none text-fg-muted rounded-sm cursor-pointer transition-all duration-fast ease-out hover:text-gold hover:bg-surface-2"
    :title="colorMode.value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
    @click="toggle"
  >
    <Transition name="icon-spin" mode="out-in">
      <!-- Sun icon (shown in dark mode) -->
      <svg v-if="colorMode.value === 'dark'" key="sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
      <!-- Moon icon (shown in light mode) -->
      <svg v-else key="moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </Transition>
  </button>
</template>

<style scoped>
/* Icon spin transition */
.icon-spin-enter-active {
  transition: transform 300ms var(--ease-spring), opacity 200ms ease;
}
.icon-spin-leave-active {
  transition: transform 200ms var(--ease-out), opacity 150ms ease;
}
.icon-spin-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.5);
}
.icon-spin-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.5);
}
</style>
