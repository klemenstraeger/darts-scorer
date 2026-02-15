<script setup lang="ts">
interface Achievement {
  readonly type: string
  readonly name: string
  readonly description: string
  readonly icon: string
  readonly playerName: string
}

const props = defineProps<{
  achievements: readonly Achievement[]
}>()

const emit = defineEmits<{
  dismiss: []
}>()

const visible = ref(true)

onMounted(() => {
  setTimeout(() => {
    visible.value = false
    setTimeout(() => emit('dismiss'), 400)
  }, 5000)
})
</script>

<template>
  <Transition name="toast-slide">
    <div v-if="visible && achievements.length > 0" class="achievement-toast-container">
      <div
        v-for="(achievement, i) in achievements"
        :key="achievement.type + '-' + achievement.playerName"
        class="achievement-toast"
        :style="{ animationDelay: `${i * 150}ms` }"
      >
        <div class="achievement-icon">{{ achievement.icon }}</div>
        <div class="achievement-info">
          <div class="achievement-label">Achievement Unlocked!</div>
          <div class="achievement-name">{{ achievement.name }}</div>
          <div class="achievement-desc">{{ achievement.description }}</div>
          <div class="achievement-player">{{ achievement.playerName }}</div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.achievement-toast-container {
  position: fixed;
  top: var(--spacing-lg, 16px);
  right: var(--spacing-lg, 16px);
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm, 8px);
  max-width: 360px;
  width: calc(100vw - 32px);
}

.achievement-toast {
  display: flex;
  align-items: center;
  gap: var(--spacing-md, 12px);
  padding: var(--spacing-md, 12px) var(--spacing-lg, 16px);
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 215, 0, 0.05));
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: var(--radius-lg, 12px);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 24px rgba(255, 215, 0, 0.15);
  animation: toast-appear 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.achievement-icon {
  font-size: 2rem;
  line-height: 1;
  flex-shrink: 0;
  filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.4));
}

.achievement-info {
  flex: 1;
  min-width: 0;
}

.achievement-label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--gold, #ffd700);
  margin-bottom: 2px;
}

.achievement-name {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-primary, #fff);
  line-height: 1.2;
}

.achievement-desc {
  font-size: 0.75rem;
  color: var(--text-secondary, #aaa);
  margin-top: 2px;
}

.achievement-player {
  font-size: 0.7rem;
  color: var(--text-muted, #888);
  margin-top: 4px;
  font-weight: 500;
}

@keyframes toast-appear {
  from {
    opacity: 0;
    transform: translateX(40px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

.toast-slide-leave-active {
  transition: all 0.4s ease-in;
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(40px);
}
</style>
