<script setup lang="ts">
import type { TabsTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { TabsTrigger } from 'reka-ui'
import { cn } from '@/lib/utils'

interface Props extends TabsTriggerProps {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
</script>

<template>
  <TabsTrigger
    v-bind="props"
    :class="cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-bold transition-all disabled:pointer-events-none disabled:opacity-40 data-[state=active]:bg-white data-[state=active]:border-2 data-[state=active]:border-black data-[state=active]:shadow-sm data-[state=inactive]:border-2 data-[state=inactive]:border-transparent cursor-pointer',
      props.class,
    )"
  >
    <slot />
  </TabsTrigger>
</template>
