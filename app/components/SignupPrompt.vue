<template>
  <div class="signup-prompt">
    <div class="prompt-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    </div>
    <h4 class="prompt-title">
      Save Your Stats
    </h4>
    <p class="prompt-text">
      Create a free account to save game history, track averages, manage players, and compete in tournaments.
    </p>
    <NuxtLink to="/login" class="btn btn-gold prompt-btn">
      Create Free Account
    </NuxtLink>
  </div>
</template>

<style scoped>
.signup-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg) var(--spacing-xl);
  background: var(--surface-glass);
  backdrop-filter: blur(var(--blur-glass));
  -webkit-backdrop-filter: blur(var(--blur-glass));
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  text-align: center;
  animation: scale-in 0.5s var(--ease-spring) 0.18s both;
}

.prompt-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  background: var(--gold-tint);
  color: var(--gold);
}

.prompt-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.prompt-text {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.5;
  max-width: 320px;
}

.prompt-btn {
  padding: var(--spacing-sm) var(--spacing-xl);
  font-size: 0.85rem;
  margin-top: var(--spacing-xs);
}

@keyframes scale-in {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
