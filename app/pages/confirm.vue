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
    <ThemeToggle class="fixed top-sm right-sm z-50" />
    <div class="glass-card-heavy p-3xl text-center">
      <div v-if="loading" class="flex flex-col items-center gap-lg text-fg-secondary">
        <div class="spinner" />
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

<style scoped>
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-subtle);
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
