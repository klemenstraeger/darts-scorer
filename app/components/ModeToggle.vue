<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

interface Option {
  value: string | number
  label: string
}

interface Props {
  modelValue: string | number
  options: Option[]
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const activeIndex = computed(() =>
  props.options.findIndex(o => o.value === props.modelValue),
)

const pillStyle = computed(() => ({
  width: `calc(${100 / props.options.length}% - 2px)`,
  transform: `translateX(${activeIndex.value * 100}%)`,
}))
</script>

<template>
  <div
    :class="cn(
      'relative flex rounded-lg border-2 border-black bg-[var(--surface-2)] overflow-hidden',
      $props.class,
    )"
  >
    <button
      v-for="opt in options"
      :key="opt.value"
      :class="cn(
        'relative z-[1] flex-1 py-sm px-lg bg-transparent border-0 text-center text-[1.1rem] font-bold cursor-pointer transition-colors duration-150',
        modelValue === opt.value ? 'text-black' : 'text-[var(--text-muted)]',
      )"
      @click="emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
    <div
      class="absolute top-[2px] left-[2px] h-[calc(100%-4px)] bg-[var(--yellow)] rounded-[calc(var(--radius-lg)-4px)] border-2 border-black transition-transform duration-150"
      :style="pillStyle"
      style="transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);"
    />
  </div>
</template>
