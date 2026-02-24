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
  { value: 'login', label: 'Log In' },
  { value: 'signup', label: 'Sign Up' },
  { value: 'magic', label: 'Magic Link' },
]

const modeCopy = computed(() => {
  if (mode.value === 'signup') {
    return {
      title: 'Create your account',
      subtitle: 'Save stats, tournaments, and player history.',
      helper: 'We will send a confirmation email to finish setup.',
      cta: 'Create Account',
      passwordHint: 'Minimum 6 characters.',
    }
  }
  if (mode.value === 'magic') {
    return {
      title: 'Sign in with a magic link',
      subtitle: 'Passwordless access, perfect for shared devices.',
      helper: 'We will email a secure sign-in link.',
      cta: 'Send Magic Link',
      passwordHint: '',
    }
  }
  return {
    title: 'Welcome back',
    subtitle: 'Log in to continue your match night.',
    helper: 'Use the email and password tied to your account.',
    cta: 'Log In',
    passwordHint: '',
  }
})

const heroHighlights = [
  {
    title: 'Live Scoring Engine',
    description: 'Throw-by-throw accuracy with instant checkout math.',
    accent: 'bg-yellow-light',
  },
  {
    title: 'Training Drills',
    description: 'Seven focused modes for doubles and scoring.',
    accent: 'bg-cyan-light',
  },
  {
    title: 'Tournament Ready',
    description: 'Groups, knockouts, and live standings in minutes.',
    accent: 'bg-orange-light',
  },
  {
    title: 'Stats That Matter',
    description: 'Averages, checkout rate, heatmaps, and trends.',
    accent: 'bg-green-light',
  },
]

const trustBadges = [
  'Offline-ready PWA',
  'Auto checkout hints',
  'Teams + doubles',
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
  <div class="min-h-screen bg-surface-0">
    <div class="relative min-h-screen overflow-hidden">
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.08),_transparent_55%)]" />
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,_rgba(255,215,0,0.2),_transparent_45%)]" />
        <div class="absolute inset-0" style="background-image: radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px); background-size: 22px 22px;" />
      </div>

      <div class="absolute top-[12%] left-[10%] w-20 h-20 border-2 border-black rounded-full bg-yellow-light shadow-md anim-float" style="--float-duration: 6s; --float-delay: 0ms;" />
      <div class="absolute top-[18%] right-[12%] w-24 h-24 border-2 border-black rounded-lg bg-cyan-light shadow-md anim-float-reverse" style="--float-duration: 7s; --float-delay: 200ms;" />
      <div class="absolute bottom-[16%] left-[12%] w-28 h-28 border-2 border-black rounded-xl bg-orange-light shadow-md anim-float" style="--float-duration: 8s; --float-delay: 400ms;" />
      <div class="absolute bottom-[18%] right-[10%] w-16 h-16 border-2 border-black rounded-full bg-green-light shadow-md anim-float-reverse" style="--float-duration: 6.5s; --float-delay: 100ms;" />

      <div class="relative z-1 mx-auto grid min-h-screen w-full max-w-[1200px] grid-cols-1 items-center gap-2xl px-lg py-3xl lg:grid-cols-[1.05fr_0.95fr] lg:gap-3xl">
        <div class="flex flex-col gap-2xl">
          <div class="flex items-center gap-md">
            <div class="bg-surface-1 border-2 border-black rounded-full px-lg py-sm shadow-sm text-[0.8rem] font-bold text-fg-secondary">
              Darts Scorer
            </div>
            <div class="flex items-center gap-xs text-[0.8rem] font-semibold text-fg-muted">
              <span class="w-2.5 h-2.5 rounded-full bg-green" style="animation: pulse-opacity 1.8s ease-in-out infinite;" />
              Live scoring engine
            </div>
          </div>

          <div>
            <h1 class="text-[clamp(2.6rem,4.4vw,4rem)] font-black leading-[1.05] text-fg">
              Sign in to keep
              <span class="block text-yellow">every dart accountable</span>
            </h1>
            <p class="mt-md max-w-[520px] text-[clamp(0.95rem,2vw,1.15rem)] text-fg-secondary leading-relaxed">
              Track legs, tournament progress, and long-term performance. Your stats follow you from practice to finals night.
            </p>
          </div>

          <div class="grid grid-cols-1 gap-md sm:grid-cols-2">
            <div
              v-for="item in heroHighlights"
              :key="item.title"
              class="flex flex-col gap-xs rounded-lg border-2 border-black bg-surface-1 p-lg shadow-md"
            >
              <div class="flex items-center gap-sm">
                <span class="h-8 w-8 rounded-md border-2 border-black" :class="item.accent" />
                <span class="text-[0.95rem] font-bold text-fg">{{ item.title }}</span>
              </div>
              <p class="text-[0.8rem] text-fg-muted leading-relaxed">
                {{ item.description }}
              </p>
            </div>
          </div>

          <div class="flex flex-wrap gap-sm">
            <span
              v-for="badge in trustBadges"
              :key="badge"
              class="px-md py-xs rounded-full border-2 border-black bg-surface-1 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-fg-muted"
            >
              {{ badge }}
            </span>
          </div>
        </div>

        <div
          v-motion
          class="relative flex w-full flex-col gap-2xl rounded-2xl border-[3px] border-black bg-surface-1 px-2xl py-3xl shadow-xl"
          :initial="{ opacity: 0, y: 20 }"
          :enter="{ opacity: 1, y: 0, transition: { duration: 400 } }"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-sm">
              <div class="h-10 w-10 rounded-lg border-2 border-black bg-yellow-light shadow-sm" />
              <div>
                <h2 class="text-[1.4rem] font-black text-fg">
                  {{ modeCopy.title }}
                </h2>
                <p class="text-[0.85rem] text-fg-muted">
                  {{ modeCopy.subtitle }}
                </p>
              </div>
            </div>
          </div>

          <div class="rounded-lg border-2 border-black bg-surface-2 p-sm">
            <ModeToggle
              :model-value="mode"
              :options="modeOptions"
              class="text-[0.85rem]"
              @update:model-value="(v: string | number) => { mode = v as 'login' | 'signup' | 'magic'; error = ''; magicLinkSent = false }"
            />
          </div>

          <div class="rounded-lg border-2 border-black bg-surface-0 p-lg shadow-sm">
            <!-- Magic link sent confirmation -->
            <div v-if="magicLinkSent" class="text-center flex flex-col items-center gap-lg">
              <div class="text-[3rem] opacity-80">
                &#x2709;
              </div>
              <div>
                <p class="text-fg-secondary text-[0.95rem] leading-relaxed">
                  Check your email for a {{ mode === 'magic' ? 'magic link' : 'confirmation link' }}.
                </p>
                <p class="text-[0.8rem] text-fg-muted mt-xs">
                  The link expires shortly for your security.
                </p>
              </div>
              <Button variant="secondary" class="w-full" @click="magicLinkSent = false; mode = 'login'">
                Back to login
              </Button>
            </div>

            <!-- Auth form -->
            <form v-else class="w-full flex flex-col gap-lg" @submit.prevent="handleEmailAuth">
              <div class="flex flex-col gap-xs">
                <label class="text-[0.75rem] font-semibold text-fg-muted uppercase tracking-wide" for="email">Email</label>
                <Input
                  id="email"
                  v-model="email"
                  type="email"
                  placeholder="you@dartsclub.com"
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
                <p v-if="modeCopy.passwordHint" class="text-[0.75rem] text-fg-muted">
                  {{ modeCopy.passwordHint }}
                </p>
              </div>

              <p class="text-[0.8rem] text-fg-muted">
                {{ modeCopy.helper }}
              </p>

              <p v-if="error" class="text-red text-[0.85rem] text-center">
                {{ error }}
              </p>

              <Button
                type="submit"
                class="w-full p-md text-[1rem]"
                :disabled="loading"
              >
                {{ loading ? 'Please wait...' : modeCopy.cta }}
              </Button>
            </form>
          </div>

          <div class="grid grid-cols-2 gap-md text-[0.75rem] text-fg-muted">
            <div class="rounded-md border-2 border-black bg-surface-2 px-md py-sm text-center font-bold">
              Zero ads
            </div>
            <div class="rounded-md border-2 border-black bg-surface-2 px-md py-sm text-center font-bold">
              Free forever
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
