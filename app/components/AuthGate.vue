<script setup lang="ts">
defineProps<{
  feature: string
  description?: string
}>()

const { isAuthenticated } = useAuth()
</script>

<template>
  <template v-if="isAuthenticated">
    <slot />
  </template>
  <div v-else class="auth-gate">
    <div class="auth-gate-content">
      <div class="auth-gate-icon">
        <!-- Lock icon -->
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <h2 class="auth-gate-title">
        {{ feature }}
      </h2>
      <p class="auth-gate-description">
        {{ description || `Sign in to access ${feature.toLowerCase()}. It's free!` }}
      </p>
      <div class="auth-gate-actions">
        <NuxtLink to="/login" class="btn btn-gold auth-gate-btn">
          Sign In
        </NuxtLink>
        <NuxtLink to="/play" class="btn btn-secondary auth-gate-btn">
          Play as Guest
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-gate {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 120px);
  padding: var(--spacing-xl);
}

.auth-gate-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
  max-width: 400px;
  text-align: center;
}

.auth-gate-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-lg);
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
}

.auth-gate-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
}

.auth-gate-description {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.auth-gate-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-sm);
}

.auth-gate-btn {
  padding: var(--spacing-sm) var(--spacing-xl);
  font-size: 0.9rem;
}
</style>
