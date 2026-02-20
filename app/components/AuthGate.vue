<script setup lang="ts">
defineProps<{
  feature: string
  description?: string
}>()

const { isAuthenticated } = useAuth()
</script>

<template>
  <template v-if="isAuthenticated">
    <slot />
  </template>
  <div v-else class="flex items-center justify-center min-h-[calc(100vh-120px)] p-xl">
    <div class="flex flex-col items-center gap-lg max-w-[400px] text-center">
      <div class="w-16 h-16 flex items-center justify-center rounded-lg bg-surface-1 border-2 border-black text-fg-muted shadow-sm">
        <!-- Lock icon -->
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <h2 class="text-2xl font-extrabold text-fg">
        {{ feature }}
      </h2>
      <p class="text-[0.9rem] text-fg-secondary leading-relaxed">
        {{ description || `Sign in to access ${feature.toLowerCase()}. It's free!` }}
      </p>
      <div class="flex gap-md mt-sm">
        <NuxtLink
          to="/login"
          class="inline-flex items-center justify-center gap-2 px-xl py-sm text-[0.9rem] font-extrabold bg-yellow border-2 border-black rounded-md shadow-md text-black transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          Sign In
        </NuxtLink>
        <NuxtLink
          to="/play"
          class="inline-flex items-center justify-center gap-2 px-xl py-sm text-[0.9rem] font-bold bg-surface-2 border-2 border-black rounded-md shadow-md text-fg-secondary transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          Play as Guest
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
