<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AlertDialogTitle, type AlertDialogTitleProps } from 'reka-ui'
import { cn } from '@/lib/utils'

interface Props extends AlertDialogTitleProps {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
</script>

<template>
  <AlertDialogTitle
    :class="cn('text-lg font-black tracking-tight', props.class)"
  >
    <slot />
  </AlertDialogTitle>
</template>
