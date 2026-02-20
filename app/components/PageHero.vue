<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  title: string
  subtitle?: string
  color?: 'yellow' | 'blue' | 'green' | 'orange'
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  color: 'yellow',
  subtitle: '',
})

const colorMap: Record<string, string> = {
  yellow: 'bg-[var(--yellow-light)]',
  blue: 'bg-[var(--blue-light)]',
  green: 'bg-[var(--green-light)]',
  orange: 'bg-[var(--orange-light)]',
}
</script>

<template>
  <div
    :class="cn(
      'relative flex items-center gap-lg p-lg px-xl rounded-xl border-2 border-black shadow-md mb-xl overflow-hidden',
      colorMap[props.color],
      props.class,
    )"
  >
    <div class="flex-1">
      <h2 class="text-[2rem] font-extrabold text-fg mb-xs">
        {{ title }}
      </h2>
      <p v-if="subtitle" class="text-[0.9rem] text-fg-secondary">
        {{ subtitle }}
      </p>
      <slot name="subtitle" />
    </div>
    <slot name="action" />
  </div>
</template>
