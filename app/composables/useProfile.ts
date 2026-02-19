interface Profile {
  id: string
  displayName: string
  createdAt: string
}

// Module-level singleton
const profile = ref<Profile | null>(null)
const loaded = ref(false)

export function useProfile() {
  async function fetch() {
    try {
      const { profile: p } = await $fetch<{ profile: Profile | null }>('/api/profile')
      profile.value = p
    }
    catch {
      profile.value = null
    }
    loaded.value = true
  }

  async function logout() {
    const supabase = useSupabaseClient()
    await supabase.auth.signOut()
    profile.value = null
    loaded.value = false
    // Reset the profileChecked state so middleware re-checks on next login
    useState<boolean>('profileChecked').value = false
    navigateTo('/login')
  }

  return {
    profile: readonly(profile),
    loaded: readonly(loaded),
    fetch,
    logout,
  }
}
