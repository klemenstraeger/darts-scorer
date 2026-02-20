<template>
  <div class="flex flex-col items-center gap-sm p-lg px-xl bg-surface-1 border-2 border-black rounded-md shadow-md text-center animate-[scale-in_0.5s_var(--ease-spring)_0.18s_both]">
    <div class="w-[44px] h-[44px] flex items-center justify-center rounded-md bg-yellow-light text-yellow">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    </div>
    <h4 class="text-base font-bold text-fg">
      Save Your Stats
    </h4>
    <p class="text-[0.8rem] text-fg-secondary leading-relaxed max-w-[320px]">
      Create a free account to save game history, track averages, manage players, and compete in tournaments.
    </p>
    <NuxtLink
      to="/login"
      class="inline-flex items-center justify-center gap-2 px-xl py-sm text-[0.85rem] font-extrabold mt-xs bg-yellow border-2 border-black rounded-md shadow-md text-black transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
    >
      Create Free Account
    </NuxtLink>
  </div>
</template>
