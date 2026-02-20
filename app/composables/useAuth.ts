export function useAuth() {
  const user = useSupabaseUser()
  const isAuthenticated = computed(() => !!user.value)
  return { isAuthenticated, user }
}
