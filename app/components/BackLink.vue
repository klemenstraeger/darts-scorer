<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  to: string
  label?: string
  class?: HTMLAttributes['class']
}

withDefaults(defineProps<Props>(), {
  label: '',
})
</script>

<template>
  <NuxtLink
    :to="to"
    :class="cn(
      'inline-flex items-center gap-xs text-[var(--text-muted)] text-[0.85rem] font-semibold transition-colors hover:text-[var(--text-primary)]',
      $props.class,
    )"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
    <span v-if="label">{{ label }}</span>
    <slot v-else />
  </NuxtLink>
</template>
