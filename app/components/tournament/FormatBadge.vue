<script setup lang="ts">
import type { TournamentFormat } from '~/types/tournament'
import { FORMAT_COLORS, FORMAT_LABELS } from '~/types/tournament'

const props = defineProps<{
  format: TournamentFormat
}>()

const label = computed(() => FORMAT_LABELS[props.format])
const colorClass = computed(() => `format-badge-${FORMAT_COLORS[props.format]}`)
</script>

<template>
  <span class="inline-flex items-center py-[2px] px-sm rounded-sm text-[0.7rem] font-bold uppercase tracking-[0.5px] whitespace-nowrap border-2 border-black" :class="colorClass">{{ label }}</span>
</template>

<style>
.format-badge-red {
  background: var(--red-light);
  color: black;
}

.format-badge-blue {
  background: var(--blue-light);
  color: black;
}

.format-badge-green {
  background: var(--green-light);
  color: black;
}

.format-badge-purple {
  background: var(--purple-light);
  color: black;
}
</style>
