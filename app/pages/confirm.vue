<script setup lang="ts">
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    // Handle the auth callback (PKCE flow)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const queryParams = new URLSearchParams(window.location.search)

    const accessToken = hashParams.get('access_token') || queryParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token')

    if (accessToken && refreshToken) {
      await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
    }

    // Check if user has a profile
    const { profile } = await $fetch<{ profile: any }>('/api/profile')

    if (!profile) {
      navigateTo('/profile-setup')
    }
    else {
      navigateTo('/dashboard')
    }
  }
  catch (err: any) {
    error.value = err.message || 'Something went wrong'
    // Redirect to login after a delay
    setTimeout(() => navigateTo('/login'), 3000)
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-lg bg-surface-0">
    <div class="bg-surface-1 border-[3px] border-black rounded-lg shadow-lg p-3xl text-center">
      <div v-if="loading" class="flex flex-col items-center gap-lg text-fg-secondary">
        <div class="size-8 border-[3px] border-surface-3 border-t-yellow rounded-full" style="animation: spin 0.8s linear infinite;" />
        <p>Confirming your account...</p>
      </div>
      <div v-else-if="error">
        <p class="text-red mb-sm">
          {{ error }}
        </p>
        <p class="text-fg-muted text-[0.85rem]">
          Redirecting to login...
        </p>
      </div>
    </div>
  </div>
</template>
