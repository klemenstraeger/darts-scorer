<script setup lang="ts">
defineProps<{
  title: string
  detail: string
  tone?: 'gold' | 'blue' | 'green'
}>()
</script>

<template>
  <div
    class="flex flex-col gap-xs p-md px-lg rounded-lg border-2 border-black bg-white shadow-md"
    :class="{
      'border-l-[4px] border-l-yellow': !tone || tone === 'gold',
      'border-l-[4px] border-l-blue': tone === 'blue',
      'border-l-[4px] border-l-green': tone === 'green',
    }"
  >
    <div class="text-[0.75rem] tracking-[1px] uppercase text-fg-muted font-bold">
      {{ title }}
    </div>
    <div class="text-[0.95rem] font-bold text-fg">
      {{ detail }}
    </div>
  </div>
</template>
