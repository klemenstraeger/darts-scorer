<script setup lang="ts">
import { CHECKOUTS } from '#shared/checkouts'
import { throwLabel } from '#shared/game-models'
import type { ThrowResult } from '#shared/game-models'
import { TRAINING_MODES } from '~/types/training'
import DartBoard from '~/components/DartBoard.vue'
import DartsLogo from '~/components/DartsLogo.vue'

useHead({
  title: 'Darts Scorer — Professional Darts Scoring & Tournament Management',
  meta: [
    { name: 'description', content: 'Free professional darts scoring app with real-time game tracking, tournament management, detailed statistics, AI opponents, and solo training drills. Works offline as a PWA.' },
    { property: 'og:title', content: 'Darts Scorer — Professional Darts Scoring & Tournament Management' },
    { property: 'og:description', content: 'Professional darts scoring app with tournaments, training drills, stats insights, and live spectate. Works offline as a PWA.' },
    { property: 'og:type', content: 'website' },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': 'Darts Scorer',
        'description': 'Professional darts scoring app with tournaments, training, and statistics',
        'applicationCategory': 'SportsApplication',
        'operatingSystem': 'Any',
        'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
      }),
    },
  ],
})

definePageMeta({ layout: false })

const demoScore = ref(170)
const demoThrows = ref<ThrowResult[]>([])
const demoHighlights = computed(() => demoThrows.value.map((t, index) => ({
  segment: t.segment,
  multiplier: t.multiplier,
  label: String(index + 1),
})))
const demoRound = computed(() => 8)
const demoDartsLabel = computed(() => `${demoThrows.value.length}/3 darts`)
const demoCheckout = computed(() => CHECKOUTS[demoScore.value] ?? [])
const heroDemo = {
  score: 170,
  player: 'P1',
  leg: 'Leg 1',
  darts: ['T20', 'T20', 'D25'],
  visitTotal: 170,
  checkout: CHECKOUTS[170] ?? ['T20', 'T20', 'D25'],
}
const demoLabels = computed(() => demoThrows.value.map(t => throwLabel(t)))
const demoTurnTotal = computed(() => demoThrows.value.reduce((sum, t) => sum + t.segment * t.multiplier, 0))

const counters = [
  { label: 'Training Drills', value: 7, suffix: '' },
  { label: 'Tournament Formats', value: 4, suffix: '' },
  { label: 'Checkout Paths', value: 162, suffix: '' },
  { label: 'Achievements', value: 19, suffix: '' },
  { label: 'Offline Mode', value: 100, suffix: '%'},
]

const deepFeatures = [
  {
    eyebrow: 'Real-Time Scoring',
    title: 'Throw-by-throw precision with instant checkout math',
    description: 'Choose per-dart or per-visit input. Track legs and sets, get live checkout suggestions, and capture every turn with zero guesswork.',
    highlights: ['Per-dart visual dartboard', 'Per-visit quick entry', '162 checkout paths'],
    align: 'left',
  },
  {
    eyebrow: 'AI Opponents',
    title: 'Practice against bots that feel real',
    description: 'Four difficulty levels model dartboard physics, checkouts, and misses that land on adjacent segments. Train for casual nights or pro-level pressure.',
    highlights: ['Easy → Pro levels', 'Checkout IQ', 'Realistic miss logic'],
    align: 'right',
  },
  {
    eyebrow: 'Performance Hub',
    title: 'Stats that reveal your next breakthrough',
    description: 'Track averages, first-9 form, bust rate, and heatmaps. Compare head-to-head rivalries and climb the Elo leaderboard.',
    highlights: ['8 chart types', 'Elo rankings', 'Head-to-head tracker'],
    align: 'left',
  },
]

const gameModes = [
  { title: '501 & 301', description: 'Classic X01 with flexible rules.' },
  { title: 'Double or Single Out', description: 'Choose your preferred finish style.' },
  { title: 'Best-of Legs & Sets', description: 'From quick games to full match nights.' },
  { title: '2–4 Players + Teams', description: 'Solo, friends, or doubles teams.' },
]

const trainingIcons: Record<string, string> = {
  target: '🎯',
  clock: '🕐',
  zap: '⚡',
  crosshair: '🔘',
  grid: '📊',
  'check-circle': '✅',
  star: '⭐',
}

const tournamentFormats = [
  { title: 'Knockout', description: 'Single-elimination bracket with instant advancement.' },
  { title: 'League', description: 'Round-robin standings with form tracking.' },
  { title: 'Groups', description: 'Group stages with configurable advance rules.' },
  { title: 'Groups + Knockout', description: 'Hybrid format for full tournament nights.' },
]

const extraFeatures = [
  {
    title: 'Throw-by-Throw Replay',
    description: 'Scrub every dart with speed control and keyboard shortcuts.',
    icon: 'play',
    color: 'bg-blue-light text-blue',
  },
  {
    title: 'Live Spectate + Camera',
    description: 'Stream matches and stats to spectators in real time.',
    icon: 'eye',
    color: 'bg-cyan-light text-cyan',
  },
  {
    title: 'Achievements & Milestones',
    description: 'Unlock 19 achievements across scoring, wins, and checkouts.',
    icon: 'star',
    color: 'bg-yellow-light text-yellow',
  },
  {
    title: 'Data Export',
    description: 'Export stats to CSV or JSON for deeper analysis.',
    icon: 'download',
    color: 'bg-green-light text-green',
  },
  {
    title: 'Guided Onboarding',
    description: 'Built-in tours help new players start instantly.',
    icon: 'spark',
    color: 'bg-purple-light text-purple',
  },
  {
    title: 'Offline-First PWA',
    description: 'Install once, score anywhere with no signal.',
    icon: 'wifi',
    color: 'bg-orange-light text-orange',
  },
]

const highlights = [
  { label: '100% Free', sublabel: 'No ads, no premium tiers' },
  { label: 'Works Offline', sublabel: 'Full PWA — no internet needed' },
  { label: 'Install as App', sublabel: 'Add to home screen on any device' },
]

function handleDemoScore(segment: number, multiplier: number) {
  if (demoThrows.value.length >= 3)
    return
  const points = segment * multiplier
  if (demoScore.value - points < 0)
    return
  demoThrows.value = [...demoThrows.value, { segment, multiplier }]
  demoScore.value -= points
}

function resetDemo() {
  demoScore.value = 170
  demoThrows.value = []
}

</script>

<template>
  <div class="overflow-x-hidden bg-surface-0">
    <!-- ── Hero ────────────────────────────────────────────────────── -->
    <section class="relative min-h-screen max-sm:min-h-[92vh] flex items-center justify-center overflow-hidden px-xl">
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.08),_transparent_55%)]" />
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_rgba(255,215,0,0.18),_transparent_45%)]" />
        <div class="absolute inset-0" style="background-image: radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px); background-size: 22px 22px;" />
      </div>

      <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div class="absolute w-[280px] h-[280px] rounded-full border-2 border-black opacity-10" style="animation: pulse-ring 6s var(--ease-out) infinite;" />
        <div class="absolute w-[520px] h-[520px] rounded-full border-2 border-black opacity-8" style="animation: pulse-ring 8s var(--ease-out) infinite 0.3s;" />
        <div class="absolute w-[760px] h-[760px] rounded-full border-2 border-black opacity-6" style="animation: pulse-ring 10s var(--ease-out) infinite 0.6s;" />
      </div>

      <div class="absolute top-[12%] left-[12%] w-20 h-20 border-2 border-black rounded-full bg-yellow-light shadow-md anim-float" style="--float-duration: 6s; --float-delay: 0ms;" />
      <div class="absolute top-[18%] right-[10%] w-24 h-24 border-2 border-black rounded-lg bg-blue-light shadow-md anim-float-reverse" style="--float-duration: 7s; --float-delay: 200ms;" />
      <div class="absolute bottom-[18%] left-[8%] w-28 h-28 border-2 border-black rounded-xl bg-purple-light shadow-md anim-float" style="--float-duration: 8s; --float-delay: 400ms;" />
      <div class="absolute bottom-[20%] right-[12%] w-16 h-16 border-2 border-black rounded-full bg-green-light shadow-md anim-float-reverse" style="--float-duration: 6.5s; --float-delay: 100ms;" />

      <div class="relative z-1 flex flex-col items-center gap-xl p-2xl text-center max-w-[900px]">
        <div class="flex flex-col items-center gap-md">
          <div class="anim-fade-in" style="--delay: 0ms; --from-scale: 0.8;">
            <DartsLogo :size="120" />
          </div>
          <div class="flex items-center gap-md px-lg py-sm border-2 border-black bg-surface-1 shadow-md rounded-full text-[0.8rem] font-bold text-fg-secondary anim-fade-in-up" style="--delay: 150ms;">
            <span class="inline-flex items-center gap-xs">
              <span class="w-2.5 h-2.5 rounded-full bg-green" style="animation: pulse-opacity 1.8s ease-in-out infinite;" />
              Live scoring engine
            </span>
            <span class="h-4 w-[2px] bg-black/20" />
            <span>Offline-ready PWA</span>
          </div>
        </div>

        <h1 class="anim-fade-in-up font-black leading-[1.02] tracking-tight text-[clamp(3.2rem,8vw,5.6rem)]" style="--delay: 260ms;">
          <span class="block text-fg">Darts</span>
          <span class="block text-yellow font-black">Scorer</span>
        </h1>

        <p class="anim-fade-in-up text-fg-secondary max-w-[620px] leading-relaxed text-[clamp(1rem,2.6vw,1.35rem)]" style="--delay: 380ms;">
          Tournament-ready scoring, pro-grade training drills, and stat insights that keep every visit accountable.
        </p>

        <div class="flex flex-col sm:flex-row items-center gap-lg">
          <NuxtLink to="/play" class="inline-flex items-center justify-center gap-sm px-3xl py-md text-base font-extrabold bg-yellow border-2 border-black rounded-lg shadow-md transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
            Play Now
          </NuxtLink>
          <NuxtLink to="/login" class="inline-flex items-center justify-center gap-sm px-3xl py-md text-base font-bold bg-surface-2 border-2 border-black rounded-lg shadow-md transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
            Sign In
          </NuxtLink>
        </div>

        <div class="mt-xl w-full max-w-[560px] bg-surface-1 border-2 border-black rounded-xl shadow-lg p-lg flex flex-col gap-md anim-fade-in-up" style="--delay: 500ms;">
          <div class="flex items-center justify-between text-[0.9rem] font-semibold text-fg-secondary">
            <span>Scoring demo</span>
            <span class="text-fg-muted">Checkout: {{ heroDemo.checkout.join(' · ') }}</span>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-sm">
              <span class="text-[2.5rem] font-black text-fg">{{ heroDemo.score }}</span>
              <span class="text-[0.8rem] font-bold text-fg-muted">remaining</span>
            </div>
            <div class="flex items-center gap-xs text-[0.9rem] font-bold text-fg-secondary">
              <span class="px-sm py-xs rounded-md border-2 border-black bg-surface-2">{{ heroDemo.player }}</span>
              <span class="px-sm py-xs rounded-md border-2 border-black bg-surface-2">{{ heroDemo.leg }}</span>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-sm">
            <div class="p-sm border-2 border-black rounded-md bg-surface-0 text-center">
              <div class="text-[0.7rem] text-fg-muted font-bold uppercase">Dart 1</div>
              <div class="text-[1rem] font-black text-fg">{{ heroDemo.darts[0] }}</div>
            </div>
            <div class="p-sm border-2 border-black rounded-md bg-surface-0 text-center">
              <div class="text-[0.7rem] text-fg-muted font-bold uppercase">Dart 2</div>
              <div class="text-[1rem] font-black text-fg">{{ heroDemo.darts[1] }}</div>
            </div>
            <div class="p-sm border-2 border-black rounded-md bg-surface-0 text-center">
              <div class="text-[0.7rem] text-fg-muted font-bold uppercase">Dart 3</div>
              <div class="text-[1rem] font-black text-fg">{{ heroDemo.darts[2] }}</div>
            </div>
          </div>
          <div class="flex items-center justify-between text-[0.85rem] text-fg-secondary">
            <span>Visit total</span>
            <span class="font-bold text-fg">{{ heroDemo.visitTotal }}</span>
          </div>
        </div>
      </div>

      <div class="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-xs text-fg-muted text-[0.75rem]">
        <span>Scroll to explore</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: bounce-chevron 1.8s ease-in-out infinite;">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </section>

    <!-- ── Social Proof ─────────────────────────────────────────────── -->
    <section class="border-y-2 border-black bg-surface-1 px-xl py-2xl">
      <div class="max-w-[1100px] mx-auto grid grid-cols-5 gap-lg max-md:grid-cols-2 max-sm:grid-cols-1">
        <div
          v-for="(item, i) in counters"
          :key="item.label"
          class="flex flex-col items-center text-center gap-xs p-lg bg-surface-0 border-2 border-black rounded-lg shadow-sm anim-fade-in"
          :style="{ '--delay': `${i * 100}ms` }"
        >
          <span class="text-[2rem] font-black text-fg">
            {{ item.value }}{{ item.suffix }}
          </span>
          <span class="text-[0.8rem] font-semibold text-fg-muted uppercase tracking-[0.12em]">
            {{ item.label }}
          </span>
        </div>
      </div>
    </section>

    <!-- ── Feature Deep Dives ───────────────────────────────────────── -->
    <section class="px-xl py-3xl max-w-[1200px] mx-auto flex flex-col gap-3xl max-sm:px-lg">
      <div class="text-center max-w-[700px] mx-auto">
        <h2 class="font-extrabold text-fg text-[clamp(1.7rem,4vw,2.4rem)]">Built for match nights and training labs</h2>
        <p class="text-fg-muted mt-sm text-[clamp(0.95rem,2vw,1.1rem)]">
          Every feature is tuned for competitive play and long-term improvement.
        </p>
      </div>

      <div
        v-for="(feature, i) in deepFeatures"
        :key="feature.title"
        class="grid grid-cols-2 gap-2xl items-center max-lg:grid-cols-1"
      >
        <div
          :class="feature.align === 'left' ? 'order-1' : 'order-2 max-lg:order-1'"
          class="flex flex-col gap-md"
        >
          <span class="text-[0.75rem] uppercase tracking-[0.2em] text-fg-muted font-bold">{{ feature.eyebrow }}</span>
          <h3 class="text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold text-fg">{{ feature.title }}</h3>
          <p class="text-[1rem] text-fg-secondary leading-relaxed">{{ feature.description }}</p>
          <div class="flex flex-wrap gap-sm">
            <span
              v-for="highlight in feature.highlights"
              :key="highlight"
              class="px-md py-xs text-[0.75rem] font-bold uppercase tracking-[0.12em] border-2 border-black rounded-full bg-surface-1"
            >
              {{ highlight }}
            </span>
          </div>
        </div>

        <div
          :class="feature.align === 'left' ? 'order-2' : 'order-1 max-lg:order-2'"
          class="bg-surface-1 border-2 border-black rounded-xl shadow-lg p-2xl"
        >
          <div v-if="i === 0" class="grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-lg max-md:grid-cols-1">
            <div class="flex flex-col gap-md">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-sm">
                  <span class="px-sm py-xs rounded-md bg-surface-2 border-2 border-black text-[0.75rem] font-bold">P1</span>
                  <span class="text-fg-muted text-[0.75rem]">Round {{ demoRound }} · {{ demoDartsLabel }}</span>
                </div>
                <span class="text-[1.6rem] font-black text-fg">{{ demoScore }}</span>
              </div>
              <div class="grid grid-cols-3 gap-xs">
                <div
                  v-for="(label, index) in ['Dart 1', 'Dart 2', 'Dart 3']"
                  :key="label"
                  class="p-sm border-2 border-black rounded-md bg-surface-0 text-center"
                >
                  <div class="text-[0.7rem] text-fg-muted font-bold uppercase">{{ label }}</div>
                  <div class="text-[1rem] font-black text-fg" :class="demoLabels[index] ? 'anim-dart-pop' : ''">
                    {{ demoLabels[index] ?? '—' }}
                  </div>
                </div>
              </div>
              <div class="flex items-center justify-between text-[0.85rem] text-fg-secondary">
                <span>Turn total</span>
                <span class="font-bold">{{ demoTurnTotal }}</span>
              </div>
              <div class="flex items-center justify-between text-[0.85rem] text-fg-secondary">
                <span>Suggested checkout</span>
                <span class="font-bold text-fg">{{ demoCheckout.join(' · ') || '—' }}</span>
              </div>
              <div class="flex items-center gap-sm">
                <button
                  class="inline-flex items-center justify-center px-lg py-sm text-[0.85rem] font-bold bg-yellow border-2 border-black rounded-md shadow-sm transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md"
                  @click="resetDemo"
                >
                  Reset Demo
                </button>
                <span class="text-[0.75rem] text-fg-muted">Click the board to score</span>
              </div>
            </div>
            <div class="flex items-center justify-center">
              <DartBoard class="max-w-[320px]" :highlight-segments="demoHighlights" @score="handleDemoScore" />
            </div>
          </div>

          <div v-else-if="i === 1" class="grid grid-cols-2 gap-md">
            <div
              v-for="(level, index) in ['Easy', 'Medium', 'Hard', 'Pro']"
              :key="level"
              class="p-md border-2 border-black rounded-lg bg-surface-0 shadow-sm flex flex-col gap-sm"
            >
              <div class="flex items-center justify-between">
                <span class="text-[0.85rem] font-bold text-fg">{{ level }}</span>
                <span class="text-[0.7rem] text-fg-muted">Lvl {{ index + 1 }}</span>
              </div>
              <div class="h-2 rounded-full bg-surface-2 border border-black overflow-hidden">
                <div class="h-full bg-yellow" :style="{ width: `${60 + index * 12}%` }" />
              </div>
              <span class="text-[0.75rem] text-fg-secondary">Checkout IQ {{ 40 + index * 18 }}%</span>
            </div>
            <div class="col-span-2 p-md border-2 border-black rounded-lg bg-surface-0 text-[0.85rem] text-fg-secondary">
              Bots use real dartboard adjacency — misses land where real darts do.
            </div>
          </div>

          <div v-else class="grid grid-cols-2 gap-lg max-md:grid-cols-1">
            <div class="p-lg border-2 border-black rounded-lg bg-surface-0 flex flex-col gap-md">
              <div class="flex items-center justify-between">
                <span class="text-[0.9rem] font-bold text-fg">3-Dart Average</span>
                <span class="text-[1.6rem] font-black text-fg">78.4</span>
              </div>
              <div class="h-20 rounded-lg bg-surface-2 border-2 border-black relative overflow-hidden">
                <div class="absolute inset-0 flex items-end gap-xs p-sm">
                  <div v-for="n in 10" :key="n" class="w-full bg-yellow" :style="{ height: `${30 + n * 4}%` }" />
                </div>
              </div>
              <span class="text-[0.75rem] text-fg-muted">Rolling average over last 10 legs</span>
            </div>
            <div class="p-lg border-2 border-black rounded-lg bg-surface-0 flex flex-col gap-md">
              <div class="flex items-center justify-between">
                <span class="text-[0.9rem] font-bold text-fg">Checkout Rate</span>
                <span class="text-[1.6rem] font-black text-fg">42%</span>
              </div>
              <div class="flex items-center justify-center">
                <div class="relative w-24 h-24 rounded-full border-2 border-black bg-surface-2 overflow-hidden">
                  <div class="absolute inset-0 rounded-full" style="background: conic-gradient(#FFD700 0 42%, transparent 42% 100%);" />
                  <div class="absolute inset-3 rounded-full bg-surface-0 border-2 border-black" />
                </div>
              </div>
              <span class="text-[0.75rem] text-fg-muted">Heatmaps + checkout breakdowns</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Game Modes Overview ─────────────────────────────────────── -->
    <section class="px-xl py-3xl bg-surface-1 border-y-2 border-black">
      <div class="max-w-[1100px] mx-auto grid grid-cols-2 gap-2xl items-center max-lg:grid-cols-1">
        <div class="flex flex-col gap-md">
          <h2 class="font-extrabold text-fg text-[clamp(1.7rem,4vw,2.4rem)]">Match formats built for every night</h2>
          <p class="text-fg-secondary leading-relaxed">
            Configure legs, sets, and checkout rules in seconds. Play quick 301s or full tournament-length 501s.
          </p>
          <div class="grid grid-cols-2 gap-md max-sm:grid-cols-1">
            <div v-for="mode in gameModes" :key="mode.title" class="p-lg bg-surface-0 border-2 border-black rounded-lg shadow-sm">
              <h3 class="font-bold text-fg">{{ mode.title }}</h3>
              <p class="text-[0.85rem] text-fg-muted mt-xs">{{ mode.description }}</p>
            </div>
          </div>
        </div>
        <div class="bg-surface-0 border-2 border-black rounded-xl shadow-lg p-2xl flex flex-col gap-md">
          <div class="flex items-center justify-between">
            <span class="text-[0.85rem] font-bold text-fg">Quick Start</span>
            <span class="px-sm py-xs rounded-full text-[0.7rem] font-bold bg-yellow border-2 border-black">501 Double Out</span>
          </div>
          <div class="grid grid-cols-2 gap-md text-[0.85rem]">
            <div class="p-md border-2 border-black rounded-md bg-surface-1">
              <div class="text-fg-muted">Players</div>
              <div class="font-bold text-fg">2–4 (humans + bots)</div>
            </div>
            <div class="p-md border-2 border-black rounded-md bg-surface-1">
              <div class="text-fg-muted">Input</div>
              <div class="font-bold text-fg">Per Dart / Per Visit</div>
            </div>
            <div class="p-md border-2 border-black rounded-md bg-surface-1">
              <div class="text-fg-muted">Legs</div>
              <div class="font-bold text-fg">Best of 3</div>
            </div>
            <div class="p-md border-2 border-black rounded-md bg-surface-1">
              <div class="text-fg-muted">Sets</div>
              <div class="font-bold text-fg">Best of 1</div>
            </div>
          </div>
          <div class="text-[0.8rem] text-fg-muted">Save presets for rematches and quick start games.</div>
        </div>
      </div>
    </section>

    <!-- ── Training Modes ───────────────────────────────────────────── -->
    <section class="px-xl py-3xl max-w-[1200px] mx-auto max-sm:px-lg">
      <div class="flex flex-col gap-lg">
        <div class="flex items-center justify-between flex-wrap gap-sm">
          <div>
            <h2 class="font-extrabold text-fg text-[clamp(1.7rem,4vw,2.4rem)]">Seven training drills built for growth</h2>
            <p class="text-fg-muted mt-xs">Solo sessions built around scoring, doubles, and pressure finishes.</p>
          </div>
          <NuxtLink to="/training" class="text-[0.85rem] font-bold text-fg-secondary hover:text-yellow transition-colors">Explore training →</NuxtLink>
        </div>
        <div class="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-md">
          <div
            v-for="mode in TRAINING_MODES"
            :key="mode.mode"
            class="p-lg border-2 border-black rounded-lg bg-surface-1 shadow-md transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div class="text-[1.8rem]" :style="{ color: mode.color }">
              {{ trainingIcons[mode.icon] ?? '🎯' }}
            </div>
            <h3 class="font-bold text-fg mt-sm">{{ mode.name }}</h3>
            <p class="text-[0.8rem] text-fg-muted mt-xs leading-relaxed">{{ mode.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Tournaments ─────────────────────────────────────────────── -->
    <section class="px-xl py-3xl bg-surface-1 border-y-2 border-black">
      <div class="max-w-[1200px] mx-auto grid grid-cols-2 gap-2xl items-center max-lg:grid-cols-1">
        <div class="flex flex-col gap-md">
          <span class="text-[0.75rem] uppercase tracking-[0.2em] text-fg-muted font-bold">Tournament Suite</span>
          <h2 class="font-extrabold text-fg text-[clamp(1.7rem,4vw,2.4rem)]">Host leagues, brackets, and group nights in one place</h2>
          <p class="text-fg-secondary leading-relaxed">Create tournaments with auto-generated brackets, live standings, and real-time spectate dashboards with optional camera streaming.</p>
          <div class="grid grid-cols-2 gap-md max-sm:grid-cols-1">
            <div v-for="format in tournamentFormats" :key="format.title" class="p-md border-2 border-black rounded-lg bg-surface-0 shadow-sm">
              <h3 class="font-bold text-fg">{{ format.title }}</h3>
              <p class="text-[0.8rem] text-fg-muted mt-xs">{{ format.description }}</p>
            </div>
          </div>
        </div>
        <div class="bg-surface-0 border-2 border-black rounded-xl shadow-lg p-2xl">
          <div class="flex items-center justify-between">
            <span class="text-[0.85rem] font-bold text-fg">Live Bracket</span>
            <span class="px-sm py-xs rounded-full text-[0.7rem] font-bold bg-green-light border-2 border-black">LIVE</span>
          </div>
          <svg viewBox="0 0 280 180" class="w-full mt-md">
            <g fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="stroke-dasharray: 200; stroke-dashoffset: 200; animation: draw-bracket 1.6s var(--ease-out) forwards; --dash-total: 200;">
              <path d="M82 30 H102 V50 H122" />
              <path d="M82 110 H102 V130 H122" />
              <path d="M192 50 H200" />
              <path d="M192 130 H200" />
              <path d="M200 50 V130" />
              <path d="M200 90 H208" />
            </g>
            <g fill="#FFF" stroke="#000" stroke-width="2">
              <rect x="12" y="22" width="70" height="16" rx="4" />
              <rect x="12" y="102" width="70" height="16" rx="4" />
              <rect x="122" y="42" width="70" height="16" rx="4" />
              <rect x="122" y="122" width="70" height="16" rx="4" />
              <rect x="208" y="82" width="70" height="16" rx="4" />
            </g>
          </svg>
          <div class="mt-md grid grid-cols-3 gap-sm text-[0.75rem] text-fg-muted">
            <div class="p-xs border border-black rounded-md bg-surface-1">Standings</div>
            <div class="p-xs border border-black rounded-md bg-surface-1">Fixtures</div>
            <div class="p-xs border border-black rounded-md bg-surface-1">Spectate</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Extra Features ───────────────────────────────────────────── -->
    <section class="px-xl py-3xl max-w-[1200px] mx-auto max-sm:px-lg">
      <div class="text-center max-w-[700px] mx-auto">
        <h2 class="font-extrabold text-fg text-[clamp(1.7rem,4vw,2.4rem)]">Everything else your league keeps asking for</h2>
        <p class="text-fg-muted mt-sm">Replay, spectate, achievements, exports — it all ships in the box.</p>
      </div>
      <div class="grid grid-cols-3 gap-lg mt-2xl max-lg:grid-cols-2 max-sm:grid-cols-1">
        <div
          v-for="item in extraFeatures"
          :key="item.title"
          class="p-xl border-2 border-black rounded-lg bg-surface-1 shadow-md flex flex-col gap-md"
        >
          <div class="w-12 h-12 flex items-center justify-center rounded-md border-2 border-black" :class="item.color">
            <svg v-if="item.icon === 'play'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="6 4 20 12 6 20 6 4" />
            </svg>
            <svg v-else-if="item.icon === 'eye'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <svg v-else-if="item.icon === 'star'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15 9 22 9 17 14 19 22 12 18 5 22 7 14 2 9 9 9" />
            </svg>
            <svg v-else-if="item.icon === 'download'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <svg v-else-if="item.icon === 'spark'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2l1.5 5L19 9l-5.5 2L12 17l-1.5-6L5 9l5.5-2L12 2z" />
              <path d="M4 16l.8 2.4L7 19l-2.2.6L4 22l-.8-2.4L1 19l2.2-.6L4 16z" />
            </svg>
            <svg v-else-if="item.icon === 'wifi'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12.55a11 11 0 0 1 14.08 0" />
              <path d="M1.5 9.5a16 16 0 0 1 21 0" />
              <path d="M8.5 15.5a6 6 0 0 1 7 0" />
              <circle cx="12" cy="18" r="1" />
            </svg>
          </div>
          <div>
            <h3 class="font-bold text-fg">{{ item.title }}</h3>
            <p class="text-[0.85rem] text-fg-muted mt-xs leading-relaxed">{{ item.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Highlights ──────────────────────────────────────────────── -->
    <section class="border-y-2 border-black bg-surface-1 px-xl py-2xl">
      <div class="flex justify-center gap-3xl max-w-[900px] mx-auto max-sm:flex-col max-sm:items-center max-sm:gap-xl">
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
    <section class="px-xl py-3xl max-w-[1000px] mx-auto flex justify-center max-sm:px-lg">
      <div class="flex flex-col items-center gap-lg p-3xl text-center max-w-[580px] w-full bg-yellow border-2 border-black shadow-lg rounded-lg">
        <DartsLogo :size="64" />
        <h2 class="font-extrabold text-fg text-[clamp(1.3rem,3vw,1.8rem)]">Ready to Level Up Your Darts Game?</h2>
        <p class="text-[0.95rem] text-fg-secondary leading-relaxed">Join players using Darts Scorer for professional-grade game tracking.</p>
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
