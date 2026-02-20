<script setup lang="ts">
definePageMeta({ layout: false })

const user = useSupabaseUser()

// Redirect logged-in users to dashboard
if (import.meta.client) {
  watchEffect(() => {
    if (user.value)
      navigateTo('/dashboard')
  })
}

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

const features = [
  {
    icon: 'target',
    color: 'gold',
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
</script>

<template>
  <div class="landing-page bg-surface-0">
    <!-- ── Hero ────────────────────────────────────────────────────── -->
    <section class="hero-section">
      <div class="hero-bg">
        <div class="hero-ring hero-ring-1" />
        <div class="hero-ring hero-ring-2" />
        <div class="hero-ring hero-ring-3" />
      </div>

      <div class="hero-content">
        <div class="anim-fade-in" style="--delay: 0ms; --from-scale: 0.8;">
          <DartsLogo :size="120" class="hero-logo" />
        </div>

        <h1 class="hero-title anim-fade-in-up" style="--delay: 200ms;">
          <span class="block text-fg">Darts</span>
          <span class="block text-gradient-gold">Scorer</span>
        </h1>

        <p class="hero-tagline anim-fade-in-up" style="--delay: 350ms;">
          Professional scoring, tournament management, and statistics
        </p>

        <div class="hero-ctas anim-fade-in-up" style="--delay: 500ms;">
          <NuxtLink to="/play" class="btn btn-gold hero-btn">
            Play Now
          </NuxtLink>
          <NuxtLink to="/login" class="btn btn-secondary hero-btn">
            Sign In
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ── Features ────────────────────────────────────────────────── -->
    <section id="features" class="landing-section">
      <h2 class="section-title">
        Everything You Need
      </h2>
      <p class="section-subtitle">
        A complete darts companion built for players who take their game seriously.
      </p>

      <div class="features-grid">
        <div
          v-for="(feature, i) in features"
          :key="feature.title"
          class="feature-card glass-card anim-fade-in-up"
          :style="{ '--delay': `${i * 100}ms` }"
        >
          <div class="feature-icon" :class="`feature-icon-${feature.color}`">
            <!-- Target icon -->
            <svg v-if="feature.icon === 'target'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
            </svg>
            <!-- Trophy icon -->
            <svg v-else-if="feature.icon === 'trophy'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
            <!-- Bot icon -->
            <svg v-else-if="feature.icon === 'bot'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="8.5" cy="16" r="1.5" /><circle cx="15.5" cy="16" r="1.5" /><path d="M12 2v5M7 7h10" />
            </svg>
            <!-- Chart icon -->
            <svg v-else-if="feature.icon === 'chart'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <h3 class="feature-title">
            {{ feature.title }}
          </h3>
          <p class="feature-description">
            {{ feature.description }}
          </p>
        </div>
      </div>
    </section>

    <!-- ── How It Works ────────────────────────────────────────────── -->
    <section class="landing-section how-it-works-section">
      <h2 class="section-title">
        Get Started in Seconds
      </h2>
      <p class="section-subtitle">
        From landing to first throw in under a minute.
      </p>

      <div class="steps-grid">
        <div
          v-for="(step, i) in steps"
          :key="step.number"
          class="step-card anim-fade-in-up"
          :style="{ '--delay': `${i * 120}ms` }"
        >
          <div class="step-number">
            {{ step.number }}
          </div>
          <h3 class="step-title">
            {{ step.title }}
          </h3>
          <p class="step-description">
            {{ step.description }}
          </p>
        </div>
      </div>
    </section>

    <!-- ── Highlights ──────────────────────────────────────────────── -->
    <section class="highlights-section">
      <div class="highlights-grid">
        <div
          v-for="(item, i) in highlights"
          :key="item.label"
          class="highlight-item anim-fade-in"
          :style="{ '--delay': `${i * 100}ms` }"
        >
          <span class="highlight-label">{{ item.label }}</span>
          <span class="highlight-sublabel">{{ item.sublabel }}</span>
        </div>
      </div>
    </section>

    <!-- ── Final CTA ───────────────────────────────────────────────── -->
    <section class="landing-section cta-section">
      <div class="cta-card glass-card-heavy anim-fade-in-up">
        <h2 class="cta-title">
          Ready to Level Up Your Darts Game?
        </h2>
        <p class="cta-subtitle">
          Join players using Darts Scorer for professional-grade game tracking.
        </p>
        <NuxtLink to="/play" class="btn btn-gold cta-btn">
          Start Playing Now
        </NuxtLink>
      </div>
    </section>

    <!-- ── Footer ──────────────────────────────────────────────────── -->
    <footer class="landing-footer">
      <div class="footer-content">
        <div class="footer-brand">
          <DartsLogo :size="24" />
          <span class="footer-brand-text">Darts Scorer</span>
        </div>
        <nav class="footer-nav">
          <NuxtLink to="/login" class="footer-link">
            Login
          </NuxtLink>
        </nav>
        <p class="footer-copy">
          &copy; {{ new Date().getFullYear() }} Darts Scorer
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* ── CSS Animations (SSR-safe replacement for v-motion) ──────────────── */
.anim-fade-in-up {
  animation: fade-in-up 600ms var(--ease-out) both;
  animation-delay: var(--delay, 0ms);
}

.anim-fade-in {
  animation: fade-in 500ms var(--ease-out) both;
  animation-delay: var(--delay, 0ms);
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(var(--from-scale, 1));
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* ── Landing page container ──────────────────────────────────────────── */
.landing-page {
  overflow-x: hidden;
}

/* ── Hero section ────────────────────────────────────────────────────── */
.hero-section {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

@media (max-width: 640px) {
  .hero-section {
    min-height: 90vh;
  }
}

.hero-bg {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.hero-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid var(--border-subtle);
  opacity: 0.08;
  animation: ring-pulse 6s ease-in-out infinite;
}

.hero-ring-1 {
  width: 300px;
  height: 300px;
  animation-delay: 0s;
}

.hero-ring-2 {
  width: 500px;
  height: 500px;
  animation-delay: 2s;
}

.hero-ring-3 {
  width: 700px;
  height: 700px;
  animation-delay: 4s;
}

@keyframes ring-pulse {
  0%, 100% { transform: scale(1); opacity: 0.08; }
  50% { transform: scale(1.05); opacity: 0.04; }
}

.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xl);
  padding: var(--spacing-2xl);
  text-align: center;
}

.hero-logo {
  filter: drop-shadow(0 0 30px var(--gold-glow));
}

.hero-title {
  font-size: clamp(3rem, 8vw, 5rem);
  font-weight: 900;
  line-height: 1.05;
  letter-spacing: -1px;
}

.hero-tagline {
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  color: var(--text-secondary);
  max-width: 500px;
  line-height: 1.5;
}

.hero-ctas {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

@media (max-width: 480px) {
  .hero-ctas {
    flex-direction: column;
    width: 100%;
    max-width: 280px;
  }
}

.hero-btn {
  padding: var(--spacing-md) var(--spacing-2xl);
  font-size: 1rem;
}

/* ── Sections ────────────────────────────────────────────────────────── */
.landing-section {
  padding: var(--spacing-3xl) var(--spacing-xl);
  max-width: 1000px;
  margin: 0 auto;
}

@media (max-width: 640px) {
  .landing-section {
    padding: var(--spacing-2xl) var(--spacing-lg);
  }
}

.section-title {
  font-size: clamp(1.5rem, 4vw, 2.2rem);
  font-weight: 800;
  color: var(--text-primary);
  text-align: center;
  margin-bottom: var(--spacing-sm);
}

.section-subtitle {
  font-size: clamp(0.9rem, 2vw, 1.05rem);
  color: var(--text-muted);
  text-align: center;
  max-width: 520px;
  margin: 0 auto var(--spacing-2xl);
  line-height: 1.5;
}

/* ── Features grid ───────────────────────────────────────────────────── */
.features-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
}

@media (max-width: 640px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
}

.feature-card {
  padding: var(--spacing-2xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  transition: border-color var(--duration-normal) var(--ease-out);
}

.feature-card:hover {
  border-color: var(--border-gold);
}

.feature-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
}

.feature-icon-gold {
  background: var(--gold-tint);
  color: var(--gold);
}

.feature-icon-blue {
  background: var(--blue-tint);
  color: var(--blue);
}

.feature-icon-purple {
  background: rgba(168, 85, 247, 0.1);
  color: var(--purple);
}

.feature-icon-green {
  background: var(--green-tint);
  color: var(--green);
}

.feature-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.feature-description {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* ── How It Works ────────────────────────────────────────────────────── */
.how-it-works-section {
  padding-top: var(--spacing-xl);
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-lg);
}

@media (max-width: 640px) {
  .steps-grid {
    grid-template-columns: 1fr;
  }
}

.step-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--spacing-md);
  padding: var(--spacing-2xl) var(--spacing-lg);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  transition: border-color var(--duration-normal) var(--ease-out);
}

.step-card:hover {
  border-color: var(--border-gold);
}

.step-number {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--gold-gradient);
  color: var(--text-inverse);
  font-size: 1.1rem;
  font-weight: 800;
}

.step-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
}

.step-description {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.5;
}

/* ── Highlights ──────────────────────────────────────────────────────── */
.highlights-section {
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-1);
  padding: var(--spacing-2xl) var(--spacing-xl);
}

.highlights-grid {
  display: flex;
  justify-content: center;
  gap: var(--spacing-3xl);
  max-width: 800px;
  margin: 0 auto;
}

@media (max-width: 640px) {
  .highlights-grid {
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-xl);
  }
}

.highlight-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--spacing-xs);
}

.highlight-label {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--gold);
}

.highlight-sublabel {
  font-size: 0.85rem;
  color: var(--text-muted);
}

/* ── Final CTA ───────────────────────────────────────────────────────── */
.cta-section {
  display: flex;
  justify-content: center;
}

.cta-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-3xl) var(--spacing-2xl);
  text-align: center;
  max-width: 560px;
  width: 100%;
}

.cta-title {
  font-size: clamp(1.3rem, 3vw, 1.8rem);
  font-weight: 800;
  color: var(--text-primary);
}

.cta-subtitle {
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.cta-btn {
  padding: var(--spacing-md) var(--spacing-3xl);
  font-size: 1.05rem;
}

/* ── Footer ──────────────────────────────────────────────────────────── */
.landing-footer {
  padding: var(--spacing-2xl) var(--spacing-xl);
  border-top: 1px solid var(--border-subtle);
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1000px;
  margin: 0 auto;
}

@media (max-width: 640px) {
  .footer-content {
    flex-direction: column;
    gap: var(--spacing-lg);
  }
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.footer-brand-text {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.footer-nav {
  display: flex;
  gap: var(--spacing-lg);
}

.footer-link {
  font-size: 0.85rem;
  color: var(--text-muted);
  text-decoration: none;
  transition: color var(--duration-fast);
}

.footer-link:hover {
  color: var(--gold);
}

.footer-copy {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* ── Reduce motion for accessibility ─────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .anim-fade-in-up,
  .anim-fade-in,
  .hero-ring {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
</style>
