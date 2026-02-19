<script setup lang="ts">
defineProps<{
  title: string
  detail: string
  tone?: 'gold' | 'blue' | 'green'
}>()
</script>

<template>
  <div
    class="flex flex-col gap-xs p-md px-lg rounded-lg border border-border-subtle bg-glass shadow-sm"
    :class="tone ?? 'gold'"
  >
    <div class="text-[0.75rem] tracking-[1px] uppercase text-fg-muted font-bold">
      {{ title }}
    </div>
    <div class="text-[0.95rem] font-bold text-fg">
      {{ detail }}
    </div>
  </div>
</template>

<style scoped>
.gold {
  border-color: rgba(255, 215, 0, 0.2);
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.08);
}

.blue {
  border-color: rgba(59, 130, 246, 0.2);
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.08);
}

.green {
  border-color: rgba(34, 197, 94, 0.2);
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.08);
}
</style>
