<script setup lang="ts">
import { AlertDialogCancel, type AlertDialogCancelProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import type { HTMLAttributes } from 'vue'

interface Props extends AlertDialogCancelProps {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
</script>

<template>
  <AlertDialogCancel
    :class="cn(buttonVariants({ variant: 'secondary' }), props.class)"
  >
    <slot />
  </AlertDialogCancel>
</template>
