<script setup lang="ts">
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const loading = ref(true)
const error = ref('')

const statusTitle = computed(() =>
  loading.value ? 'Confirming your account' : error.value ? 'We hit a snag' : 'Success',
)

const statusMessage = computed(() => {
  if (loading.value)
    return 'We are validating your session and getting you signed in.'
  if (error.value)
    return error.value
  return 'Your account is ready. Redirecting you now.'
})

onMounted(async () => {
  try {
    const queryParams = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))

    const errorParam = queryParams.get('error') || hashParams.get('error')
    const errorDescription = queryParams.get('error_description') || hashParams.get('error_description')
    if (errorParam || errorDescription) {
      throw new Error(errorDescription || 'Authentication failed')
    }

    const code = queryParams.get('code')
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      if (exchangeError)
        throw exchangeError
    }
    else {
      const accessToken = hashParams.get('access_token') || queryParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token')

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        if (sessionError)
          throw sessionError
      }
    }

    const { profile } = await $fetch<{ profile: any }>('/api/profile')

    if (!profile) {
      navigateTo('/profile-setup')
    }
    else {
      navigateTo('/dashboard')
    }
  }
  catch (err: any) {
    error.value = err?.message || 'Something went wrong'
    setTimeout(() => navigateTo('/login'), 3000)
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-surface-0">
    <div class="relative min-h-screen overflow-hidden">
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.08),_transparent_55%)]" />
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,_rgba(255,215,0,0.2),_transparent_45%)]" />
        <div class="absolute inset-0" style="background-image: radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px); background-size: 22px 22px;" />
      </div>

      <div class="relative z-1 mx-auto flex min-h-screen w-full max-w-[760px] items-center justify-center px-lg py-3xl">
        <div class="w-full rounded-2xl border-[3px] border-black bg-surface-1 px-2xl py-3xl text-center shadow-xl">
          <div class="mx-auto mb-lg flex h-14 w-14 items-center justify-center rounded-xl border-2 border-black bg-yellow-light shadow-sm">
            <div v-if="loading" class="size-7 border-[3px] border-surface-3 border-t-yellow rounded-full" style="animation: spin 0.8s linear infinite;" />
            <svg v-else-if="error" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <circle cx="12" cy="16" r="1" />
            </svg>
            <svg v-else width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          <h1 class="text-[1.8rem] font-black text-fg">{{ statusTitle }}</h1>
          <p class="mt-sm text-[0.95rem] text-fg-secondary leading-relaxed">
            {{ statusMessage }}
          </p>

          <div v-if="error" class="mt-xl flex flex-col gap-sm">
            <Button class="w-full" @click="navigateTo('/login')">
              Back to login
            </Button>
            <p class="text-[0.8rem] text-fg-muted">
              Redirecting automatically in a few seconds.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
