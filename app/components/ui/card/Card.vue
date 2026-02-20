<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    data-slot="card"
    :class="
      cn(
        'bg-[var(--surface-1)] text-black flex flex-col gap-6 rounded-lg border-2 border-black py-6 shadow-md',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
