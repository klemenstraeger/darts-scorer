<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AlertDialogDescription, type AlertDialogDescriptionProps } from 'reka-ui'
import { cn } from '@/lib/utils'

interface Props extends AlertDialogDescriptionProps {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
</script>

<template>
  <AlertDialogDescription
    :class="cn('text-sm text-[var(--text-secondary)]', props.class)"
  >
    <slot />
  </AlertDialogDescription>
</template>
