<script setup lang="ts">
import type { TabsListProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { TabsList } from 'reka-ui'
import { cn } from '@/lib/utils'

interface Props extends TabsListProps {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
</script>

<template>
  <TabsList
    :class="cn(
      'inline-flex items-center justify-center rounded-lg border-2 border-black bg-[var(--surface-2)] p-1 gap-1',
      props.class,
    )"
  >
    <slot />
  </TabsList>
</template>
