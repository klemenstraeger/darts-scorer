<script setup lang="ts">
definePageMeta({ layout: false })

const user = useSupabaseUser()

// Redirect if not logged in
watchEffect(() => {
  if (!user.value)
    navigateTo('/login')
})

// ── Wizard state ──────────────────────────────────────────────────────
const step = ref(1)
const direction = ref<'forward' | 'backward'>('forward')
const profileCreated = ref(false)

const transitionName = computed(() =>
  direction.value === 'forward' ? 'slide-left' : 'slide-right',
)

function nextStep() {
  direction.value = 'forward'
  step.value++
}

function prevStep() {
  direction.value = 'backward'
  step.value--
}

// ── Profile form state ────────────────────────────────────────────────
const displayName = ref('')
const loading = ref(false)
const error = ref('')
const nameInput = ref<HTMLInputElement>()

// Auto-focus name input when entering step 2
watch(step, (s) => {
  if (s === 2) {
    nextTick(() => nameInput.value?.focus())
  }
})

async function createProfile() {
  const name = displayName.value.trim()
  if (name.length < 2 || name.length > 20) {
    error.value = 'Display name must be 2-20 characters'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await $fetch('/api/profile', {
      method: 'POST',
      body: { displayName: name },
    })
    profileCreated.value = true
    nextStep()
  }
  catch (err: any) {
    const msg = err.data?.message || err.message || 'Failed to create profile'
    error.value = msg
  }
  finally {
    loading.value = false
  }
}

// ── Tour features ─────────────────────────────────────────────────────
const features = [
  { icon: '🎯', title: 'Score Games', description: 'Track 501 & 301 with checkout rules' },
  { icon: '📊', title: 'Track Stats', description: 'Averages, checkouts, trends over time' },
  { icon: '🏆', title: 'Tournaments', description: 'Round-robin & knockout brackets' },
  { icon: '👥', title: 'Players', description: 'Manage your group with custom avatars' },
]
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-lg bg-surface-0">
    <ThemeToggle class="fixed top-sm right-sm z-50" />

    <div
      v-motion
      class="glass-card-heavy w-full max-w-[400px] overflow-hidden"
      style="padding: var(--spacing-3xl) var(--spacing-2xl)"
      :initial="{ opacity: 0, y: 20 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 400 } }"
    >
      <!-- Step indicator dots -->
      <div class="flex justify-center gap-sm mb-2xl">
        <span
          v-for="i in 3"
          :key="i"
          class="step-dot"
          :class="{
            active: i === step,
            completed: i < step,
          }"
        />
      </div>

      <!-- Step content with slide transitions -->
      <Transition :name="transitionName" mode="out-in">
        <!-- Step 1: Welcome -->
        <div v-if="step === 1" key="welcome" class="flex flex-col items-center gap-xl">
          <h1 class="text-center text-[2rem] font-black leading-tight">
            <span class="block text-fg">Darts</span>
            <span class="block text-gradient-gold">Scorer</span>
          </h1>

          <p class="text-fg-muted text-[0.9rem] text-center leading-relaxed">
            Your personal darts companion.<br>
            Score games, track stats, compete.
          </p>

          <button class="btn btn-gold w-full p-md text-base" @click="nextStep">
            Get Started
          </button>
        </div>

        <!-- Step 2: Display Name -->
        <div v-else-if="step === 2" key="name" class="flex flex-col items-center gap-xl">
          <h1 class="text-2xl font-extrabold text-fg text-center">
            Choose Your Name
          </h1>
          <p class="text-fg-muted text-[0.9rem] text-center -mt-md">
            This is how other players will see you.
          </p>

          <form class="w-full flex flex-col gap-lg" @submit.prevent="createProfile">
            <div class="relative">
              <input
                ref="nameInput"
                v-model="displayName"
                type="text"
                class="form-input w-full p-md px-lg bg-surface-2 border border-border-subtle rounded-md text-fg text-[1.1rem] font-semibold text-center outline-none"
                placeholder="Your display name"
                required
                minlength="2"
                maxlength="20"
              >
              <span
                class="absolute right-md top-1/2 -translate-y-1/2 text-[0.7rem] text-fg-muted"
                :class="{ 'text-gold': displayName.length > 18 }"
              >
                {{ displayName.length }}/20
              </span>
            </div>

            <p v-if="error" class="text-red text-[0.85rem] text-center">
              {{ error }}
            </p>

            <button
              type="submit"
              class="btn btn-gold w-full p-md text-base"
              :disabled="loading || displayName.trim().length < 2"
            >
              {{ loading ? 'Creating...' : 'Continue' }}
            </button>
          </form>

          <button
            class="text-fg-muted text-[0.85rem] font-medium hover:text-fg transition-colors"
            @click="prevStep"
          >
            &larr; Back
          </button>
        </div>

        <!-- Step 3: Quick Tour -->
        <div v-else key="tour" class="flex flex-col items-center gap-xl">
          <h1 class="text-2xl font-extrabold text-fg text-center">
            What You Can Do
          </h1>

          <div class="grid grid-cols-2 gap-md w-full">
            <div
              v-for="feature in features"
              :key="feature.title"
              class="feature-card"
            >
              <span class="text-2xl">{{ feature.icon }}</span>
              <span class="text-[0.85rem] font-bold text-fg">{{ feature.title }}</span>
              <span class="text-[0.7rem] text-fg-muted leading-snug">{{ feature.description }}</span>
            </div>
          </div>

          <button class="btn btn-gold w-full p-md text-base" @click="navigateTo('/dashboard')">
            Let's Go
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
/* ── Form input ──────────────────────────────────────────────────────── */
.form-input {
  font-family: var(--font-sans);
  transition: border-color var(--duration-normal) var(--ease-out);
}

.form-input:focus {
  border-color: var(--gold-dim);
}

.form-input::placeholder {
  color: var(--text-muted);
  font-weight: 400;
}

/* ── Step indicator dots ─────────────────────────────────────────────── */
.step-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--surface-3);
  transition: all var(--duration-normal) var(--ease-out);
}

.step-dot.active {
  background: var(--gold);
  transform: scale(1.35);
  box-shadow: 0 0 8px var(--gold-glow);
}

.step-dot.completed {
  background: var(--gold-dim);
}

/* ── Feature cards ───────────────────────────────────────────────────── */
.feature-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-lg) var(--spacing-md);
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  transition: border-color var(--duration-normal) var(--ease-out);
}

.feature-card:hover {
  border-color: var(--border-gold);
}

/* ── Slide transitions ───────────────────────────────────────────────── */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all var(--duration-slow) var(--ease-out);
}

/* Forward: enter from right, leave to left */
.slide-left-enter-from {
  opacity: 0;
  transform: translateX(40px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-40px);
}

/* Backward: enter from left, leave to right */
.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-40px);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(40px);
}
</style>
