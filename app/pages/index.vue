<script setup lang="ts">
// Redirect logged-in users to dashboard
// if (import.meta.client) {
//   watchEffect(() => {
//     if (user.value)
//       navigateTo('/dashboard')
//   })
// }

useHead({
  title: 'Darts Scorer — Professional Darts Scoring & Tournament Management',
  meta: [
    { name: 'description', content: 'Free professional darts scoring app with real-time game tracking, tournament management, detailed statistics, and AI opponents. Works offline as a PWA.' },
    { property: 'og:title', content: 'Darts Scorer — Professional Darts Scoring & Tournament Management' },
    { property: 'og:description', content: 'Free professional darts scoring app with real-time game tracking, tournament management, detailed statistics, and AI opponents.' },
    { property: 'og:type', content: 'website' },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': 'Darts Scorer',
        'description': 'Professional darts scoring app with tournament management and statistics',
        'applicationCategory': 'SportsApplication',
        'operatingSystem': 'Any',
        'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
      }),
    },
  ],
})

definePageMeta({ layout: false })

const features = [
  {
    icon: 'target',
    color: 'yellow',
    title: 'Real-Time Scoring',
    description: 'Track 501, 301, and more with instant score updates, checkout suggestions, and throw-by-throw history.',
  },
  {
    icon: 'trophy',
    color: 'blue',
    title: 'Tournament Management',
    description: 'Organize round-robin and knockout tournaments with automatic bracket generation and live standings.',
  },
  {
    icon: 'bot',
    color: 'purple',
    title: 'Play vs AI Bots',
    description: 'Practice against AI opponents with four difficulty levels — from casual to pro-level challenge.',
  },
  {
    icon: 'chart',
    color: 'green',
    title: 'Detailed Statistics',
    description: 'Track averages, checkout percentages, scoring trends, and performance over time with visual charts.',
  },
]

const steps = [
  { number: 1, title: 'Enter Names', description: 'Type player names and pick your game mode' },
  { number: 2, title: 'Start Scoring', description: 'Tap or click to score — instant, accurate, beautiful' },
  { number: 3, title: 'Save Your Stats', description: 'Create a free account to track progress over time' },
]

const highlights = [
  { label: '100% Free', sublabel: 'No ads, no premium tiers' },
  { label: 'Works Offline', sublabel: 'Full PWA — no internet needed' },
  { label: 'Install as App', sublabel: 'Add to home screen on any device' },
]

const iconBgClass: Record<string, string> = {
  yellow: 'bg-yellow-light text-yellow',
  blue: 'bg-blue-light text-blue',
  purple: 'bg-purple-light text-purple',
  green: 'bg-green-light text-green',
}
</script>

<template>
  <div class="overflow-x-hidden bg-surface-0">
    <!-- ── Hero ────────────────────────────────────────────────────── -->
    <section class="relative min-h-screen max-sm:min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div class="absolute w-[300px] h-[300px] rounded-full border-2 border-black opacity-6" />
        <div class="absolute w-[500px] h-[500px] rounded-full border-2 border-black opacity-6" />
        <div class="absolute w-[700px] h-[700px] rounded-full border-2 border-black opacity-6" />
      </div>

      <div class="relative z-1 flex flex-col items-center gap-xl p-2xl text-center">
        <div class="anim-fade-in" style="--delay: 0ms; --from-scale: 0.8;">
          <DartsLogo :size="120" />
        </div>

        <h1 class="anim-fade-in-up font-black leading-[1.05] tracking-tight text-[clamp(3rem,8vw,5rem)]" style="--delay: 200ms;">
          <span class="block text-fg">Darts</span>
          <span class="block text-yellow font-black">Scorer</span>
        </h1>

        <p class="anim-fade-in-up text-fg-secondary max-w-[500px] leading-relaxed text-[clamp(1rem,2.5vw,1.25rem)]" style="--delay: 350ms;">
          Professional scoring, tournament management, and statistics
        </p>

        <div class="anim-fade-in-up flex gap-md mt-md max-[480px]:flex-col max-[480px]:w-full max-[480px]:max-w-[280px]" style="--delay: 500ms;">
          <NuxtLink to="/play" class="inline-flex items-center justify-center gap-sm px-2xl py-md text-base font-extrabold bg-yellow border-2 border-black rounded-lg shadow-md transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
            Play Now
          </NuxtLink>
          <NuxtLink to="/login" class="inline-flex items-center justify-center gap-sm px-2xl py-md text-base font-bold bg-surface-2 border-2 border-black rounded-lg shadow-md transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
            Sign In
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ── Features ────────────────────────────────────────────────── -->
    <section id="features" class="px-xl py-3xl max-w-[1000px] mx-auto max-sm:px-lg max-sm:py-2xl">
      <h2 class="text-center font-extrabold text-fg mb-sm text-[clamp(1.5rem,4vw,2.2rem)]">
        Everything You Need
      </h2>
      <p class="text-center text-fg-muted max-w-[520px] mx-auto mb-2xl leading-relaxed text-[clamp(0.9rem,2vw,1.05rem)]">
        A complete darts companion built for players who take their game seriously.
      </p>

      <div class="grid grid-cols-2 gap-lg max-sm:grid-cols-1">
        <div
          v-for="(feature, i) in features"
          :key="feature.title"
          class="bg-surface-1 border-2 border-black rounded-lg shadow-md p-2xl flex flex-col gap-md transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-lg anim-fade-in-up"
          :style="{ '--delay': `${i * 100}ms` }"
        >
          <div
            class="w-12 h-12 flex items-center justify-center rounded-md border-2 border-black"
            :class="iconBgClass[feature.color]"
          >
            <svg v-if="feature.icon === 'target'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
            </svg>
            <svg v-else-if="feature.icon === 'trophy'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
            <svg v-else-if="feature.icon === 'bot'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="8.5" cy="16" r="1.5" /><circle cx="15.5" cy="16" r="1.5" /><path d="M12 2v5M7 7h10" />
            </svg>
            <svg v-else-if="feature.icon === 'chart'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <h3 class="text-[1.1rem] font-bold text-fg">
            {{ feature.title }}
          </h3>
          <p class="text-[0.9rem] text-fg-secondary leading-relaxed">
            {{ feature.description }}
          </p>
        </div>
      </div>
    </section>

    <!-- ── How It Works ────────────────────────────────────────────── -->
    <section class="px-xl pt-xl pb-3xl max-w-[1000px] mx-auto max-sm:px-lg max-sm:py-2xl">
      <h2 class="text-center font-extrabold text-fg mb-sm text-[clamp(1.5rem,4vw,2.2rem)]">
        Get Started in Seconds
      </h2>
      <p class="text-center text-fg-muted max-w-[520px] mx-auto mb-2xl leading-relaxed text-[clamp(0.9rem,2vw,1.05rem)]">
        From landing to first throw in under a minute.
      </p>

      <div class="grid grid-cols-3 gap-lg max-sm:grid-cols-1">
        <div
          v-for="(step, i) in steps"
          :key="step.number"
          class="flex flex-col items-center text-center gap-md p-2xl bg-surface-1 border-2 border-black rounded-lg shadow-sm transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md anim-fade-in-up"
          :style="{ '--delay': `${i * 120}ms` }"
        >
          <div class="w-11 h-11 flex items-center justify-center rounded-full bg-yellow border-2 border-black text-white text-[1.1rem] font-extrabold">
            {{ step.number }}
          </div>
          <h3 class="text-[1.05rem] font-bold text-fg">
            {{ step.title }}
          </h3>
          <p class="text-[0.85rem] text-fg-muted leading-relaxed">
            {{ step.description }}
          </p>
        </div>
      </div>
    </section>

    <!-- ── Highlights ──────────────────────────────────────────────── -->
    <section class="border-y-2 border-black bg-surface-1 px-xl py-2xl">
      <div class="flex justify-center gap-3xl max-w-[800px] mx-auto max-sm:flex-col max-sm:items-center max-sm:gap-xl">
        <div
          v-for="(item, i) in highlights"
          :key="item.label"
          class="flex flex-col items-center text-center gap-xs anim-fade-in"
          :style="{ '--delay': `${i * 100}ms` }"
        >
          <span class="text-[1.1rem] font-extrabold text-yellow">{{ item.label }}</span>
          <span class="text-[0.85rem] text-fg-muted">{{ item.sublabel }}</span>
        </div>
      </div>
    </section>

    <!-- ── Final CTA ───────────────────────────────────────────────── -->
    <section class="px-xl py-3xl max-w-[1000px] mx-auto flex justify-center max-sm:px-lg max-sm:py-2xl">
      <div class="flex flex-col items-center gap-lg p-3xl text-center max-w-[560px] w-full bg-yellow border-2 border-black shadow-lg rounded-lg anim-fade-in-up">
        <h2 class="font-extrabold text-fg text-[clamp(1.3rem,3vw,1.8rem)]">
          Ready to Level Up Your Darts Game?
        </h2>
        <p class="text-[0.95rem] text-fg-secondary leading-relaxed">
          Join players using Darts Scorer for professional-grade game tracking.
        </p>
        <NuxtLink to="/play" class="inline-flex items-center justify-center gap-sm px-3xl py-md text-[1.05rem] font-extrabold bg-surface-1 border-2 border-black rounded-lg shadow-md transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
          Start Playing Now
        </NuxtLink>
      </div>
    </section>

    <!-- ── Footer ──────────────────────────────────────────────────── -->
    <footer class="px-xl py-2xl border-t-2 border-black">
      <div class="flex items-center justify-between max-w-[1000px] mx-auto max-sm:flex-col max-sm:gap-lg">
        <div class="flex items-center gap-sm">
          <DartsLogo :size="24" />
          <span class="text-[0.9rem] font-bold text-fg-secondary">Darts Scorer</span>
        </div>
        <nav class="flex gap-lg">
          <NuxtLink to="/login" class="text-[0.85rem] text-fg-muted no-underline transition-colors duration-100 hover:text-yellow">
            Login
          </NuxtLink>
        </nav>
        <p class="text-[0.75rem] text-fg-muted">
          &copy; {{ new Date().getFullYear() }} Darts Scorer
        </p>
      </div>
    </footer>
  </div>
</template>
