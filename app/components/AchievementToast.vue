<script setup lang="ts">
interface Achievement {
  readonly type: string
  readonly name: string
  readonly description: string
  readonly icon: string
  readonly playerName: string
}

const _props = defineProps<{
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
    <div v-if="visible && achievements.length > 0" class="fixed top-lg right-lg z-200 flex flex-col gap-sm max-w-[360px] w-[calc(100vw-32px)]">
      <div
        v-for="(achievement, i) in achievements"
        :key="`${achievement.type}-${achievement.playerName}`"
        class="flex items-center gap-md px-lg py-md bg-surface-1 border-2 border-black rounded-lg shadow-md"
        :style="{ animationDelay: `${i * 150}ms`, animation: 'toast-appear 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both' }"
      >
        <div class="text-[2rem] leading-none shrink-0">
          {{ achievement.icon }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-[0.65rem] font-bold uppercase tracking-[1.5px] text-yellow mb-[2px]">
            Achievement Unlocked!
          </div>
          <div class="text-[1rem] font-extrabold text-fg leading-[1.2]">
            {{ achievement.name }}
          </div>
          <div class="text-[0.75rem] text-fg-secondary mt-[2px]">
            {{ achievement.description }}
          </div>
          <div class="text-[0.7rem] text-fg-muted mt-[4px] font-medium">
            {{ achievement.playerName }}
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
