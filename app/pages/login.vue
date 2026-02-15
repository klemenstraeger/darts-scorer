<script setup lang="ts">
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

// Redirect if already logged in
watchEffect(() => {
  if (user.value) navigateTo('/dashboard')
})

const mode = ref<'login' | 'signup' | 'magic'>('login')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const magicLinkSent = ref(false)

async function handleEmailAuth() {
  loading.value = true
  error.value = ''

  try {
    if (mode.value === 'magic') {
      const { error: err } = await supabase.auth.signInWithOtp({
        email: email.value,
        options: { emailRedirectTo: `${window.location.origin}/confirm` },
      })
      if (err) throw err
      magicLinkSent.value = true
    } else if (mode.value === 'signup') {
      const { error: err } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
        options: { emailRedirectTo: `${window.location.origin}/confirm` },
      })
      if (err) throw err
      magicLinkSent.value = true // Email confirmation needed
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      })
      if (err) throw err
    }
  } catch (err: any) {
    error.value = err.message || 'Authentication failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-lg bg-surface-0">
    <ThemeToggle class="fixed top-sm right-sm z-50" />

    <div
      class="glass-card-heavy w-full max-w-[400px] px-2xl py-3xl flex flex-col items-center gap-2xl"
      v-motion
      :initial="{ opacity: 0, y: 20 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 400 } }"
    >
      <h1 class="text-center text-[2rem] font-black leading-tight">
        <span class="block text-fg">Darts</span>
        <span class="block text-gradient-gold">Scorer</span>
      </h1>

      <!-- Magic link sent confirmation -->
      <div v-if="magicLinkSent" class="text-center flex flex-col items-center gap-lg">
        <div class="text-[3rem] opacity-80">&#x2709;</div>
        <p class="text-fg-secondary text-[0.95rem] leading-relaxed">Check your email for a {{ mode === 'magic' ? 'magic link' : 'confirmation link' }}.</p>
        <button class="btn btn-secondary" @click="magicLinkSent = false; mode = 'login'">
          Back to login
        </button>
      </div>

      <!-- Auth form -->
      <form v-else @submit.prevent="handleEmailAuth" class="w-full flex flex-col gap-lg">
        <!-- Mode tabs -->
        <div class="mode-tabs">
          <button
            type="button"
            class="mode-tab"
            :class="{ active: mode === 'login' }"
            @click="mode = 'login'; error = ''"
          >
            Login
          </button>
          <button
            type="button"
            class="mode-tab"
            :class="{ active: mode === 'signup' }"
            @click="mode = 'signup'; error = ''"
          >
            Sign Up
          </button>
          <button
            type="button"
            class="mode-tab"
            :class="{ active: mode === 'magic' }"
            @click="mode = 'magic'; error = ''"
          >
            Magic Link
          </button>
        </div>

        <div class="flex flex-col gap-xs">
          <label class="text-[0.75rem] font-semibold text-fg-muted uppercase tracking-wide" for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="form-input"
            placeholder="your@email.com"
            required
            autocomplete="email"
          />
        </div>

        <div v-if="mode !== 'magic'" class="flex flex-col gap-xs">
          <label class="text-[0.75rem] font-semibold text-fg-muted uppercase tracking-wide" for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="form-input"
            placeholder="••••••••"
            required
            minlength="6"
            autocomplete="current-password"
          />
        </div>

        <p v-if="error" class="text-red text-[0.85rem] text-center">{{ error }}</p>

        <button
          type="submit"
          class="btn btn-gold w-full p-md text-[1rem] mt-sm"
          :disabled="loading"
        >
          {{ loading ? 'Please wait...' : mode === 'login' ? 'Log In' : mode === 'signup' ? 'Create Account' : 'Send Magic Link' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.mode-tabs {
  display: flex;
  background: var(--surface-2);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
}

.mode-tab {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-out);
}

.mode-tab.active {
  background: var(--surface-3);
  color: var(--gold);
}

.form-input {
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.95rem;
  outline: none;
  transition: border-color var(--duration-normal) var(--ease-out);
}

.form-input:focus {
  border-color: var(--gold-dim);
}

.form-input::placeholder {
  color: var(--text-muted);
}
</style>
