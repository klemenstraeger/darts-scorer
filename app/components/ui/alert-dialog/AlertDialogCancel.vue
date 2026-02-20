<script setup lang="ts">
import type { AlertDialogCancelProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { AlertDialogCancel } from 'reka-ui'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
