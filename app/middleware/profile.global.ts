/**
 * Global middleware: ensures authenticated users have a profile.
 * Runs after Supabase's built-in auth redirect middleware.
 * Redirects to /profile-setup if the user is logged in but has no profile.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // Skip for auth-related pages
  const skipPaths = ['/', '/login', '/confirm', '/profile-setup']
  if (skipPaths.includes(to.path) || to.path.startsWith('/spectate') || to.path.startsWith('/camera')) return

  const user = useSupabaseUser()
  if (!user.value) return

  // Check if we already cached the profile check this session
  const profileChecked = useState<boolean>('profileChecked', () => false)
  if (profileChecked.value) return

  try {
    const { profile } = await $fetch<{ profile: any }>('/api/profile')
    if (!profile) {
      return navigateTo('/profile-setup')
    }
    profileChecked.value = true
  } catch {
    // If the profile check fails, allow navigation (don't block the app)
  }
})
