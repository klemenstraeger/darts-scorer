<script setup lang="ts">
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

// Redirect if already logged in
watchEffect(() => {
  if (user.value)
    navigateTo('/dashboard')
})

const mode = ref<'login' | 'signup' | 'magic'>('login')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const magicLinkSent = ref(false)

const modeOptions = [
  { value: 'login', label: 'Login' },
  { value: 'signup', label: 'Sign Up' },
  { value: 'magic', label: 'Magic Link' },
]

async function handleEmailAuth() {
  loading.value = true
  error.value = ''

  try {
    if (mode.value === 'magic') {
      const { error: err } = await supabase.auth.signInWithOtp({
        email: email.value,
        options: { emailRedirectTo: `${window.location.origin}/confirm` },
      })
      if (err)
        throw err
      magicLinkSent.value = true
    }
    else if (mode.value === 'signup') {
      const { error: err } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
        options: { emailRedirectTo: `${window.location.origin}/confirm` },
      })
      if (err)
        throw err
      magicLinkSent.value = true // Email confirmation needed
    }
    else {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      })
      if (err)
        throw err
    }
  }
  catch (err: any) {
    error.value = err.message || 'Authentication failed'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-lg bg-surface-0">
    <div
      v-motion
      class="bg-surface-1 border-[3px] border-black rounded-lg shadow-lg w-full max-w-[400px] px-2xl py-3xl flex flex-col items-center gap-2xl"
      :initial="{ opacity: 0, y: 20 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 400 } }"
    >
      <h1 class="text-center text-[2rem] font-black leading-tight">
        <span class="block text-fg">Darts</span>
        <span class="block text-yellow font-black">Scorer</span>
      </h1>

      <!-- Magic link sent confirmation -->
      <div v-if="magicLinkSent" class="text-center flex flex-col items-center gap-lg">
        <div class="text-[3rem] opacity-80">
          &#x2709;
        </div>
        <p class="text-fg-secondary text-[0.95rem] leading-relaxed">
          Check your email for a {{ mode === 'magic' ? 'magic link' : 'confirmation link' }}.
        </p>
        <Button variant="secondary" @click="magicLinkSent = false; mode = 'login'">
          Back to login
        </Button>
      </div>

      <!-- Auth form -->
      <form v-else class="w-full flex flex-col gap-lg" @submit.prevent="handleEmailAuth">
        <!-- Mode tabs -->
        <ModeToggle
          :model-value="mode"
          :options="modeOptions"
          class="text-[0.8rem]"
          @update:model-value="(v: string | number) => { mode = v as 'login' | 'signup' | 'magic'; error = '' }"
        />

        <div class="flex flex-col gap-xs">
          <label class="text-[0.75rem] font-semibold text-fg-muted uppercase tracking-wide" for="email">Email</label>
          <Input
            id="email"
            v-model="email"
            type="email"
            placeholder="your@email.com"
            required
            autocomplete="email"
          />
        </div>

        <div v-if="mode !== 'magic'" class="flex flex-col gap-xs">
          <label class="text-[0.75rem] font-semibold text-fg-muted uppercase tracking-wide" for="password">Password</label>
          <Input
            id="password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            required
            minlength="6"
            autocomplete="current-password"
          />
        </div>

        <p v-if="error" class="text-red text-[0.85rem] text-center">
          {{ error }}
        </p>

        <Button
          type="submit"
          class="w-full p-md text-[1rem] mt-sm"
          :disabled="loading"
        >
          {{ loading ? 'Please wait...' : mode === 'login' ? 'Log In' : mode === 'signup' ? 'Create Account' : 'Send Magic Link' }}
        </Button>
      </form>
    </div>
  </div>
</template>
