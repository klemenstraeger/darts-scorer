<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Separator as SeparatorRoot, type SeparatorProps as SeparatorRootProps } from 'reka-ui'
import { cn } from '@/lib/utils'

interface Props extends SeparatorRootProps {
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  orientation: 'horizontal',
})
</script>

<template>
  <SeparatorRoot
    :orientation="orientation"
    :decorative="decorative"
    :class="cn(
      'shrink-0 border-black',
      orientation === 'horizontal' ? 'h-0 w-full border-t-2' : 'h-full w-0 border-l-2',
      props.class,
    )"
  />
</template>
