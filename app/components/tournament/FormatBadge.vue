<script setup lang="ts">
import type { TournamentFormat } from '~/types/tournament'
import { FORMAT_COLORS, FORMAT_LABELS } from '~/types/tournament'

const props = defineProps<{
  format: TournamentFormat
}>()

const label = computed(() => FORMAT_LABELS[props.format])
const colorClass = computed(() => `badge-${FORMAT_COLORS[props.format]}`)
</script>

<template>
  <span class="format-badge" :class="colorClass">{{ label }}</span>
</template>

<style scoped>
.format-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px var(--spacing-sm);
  border-radius: var(--radius-full);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.badge-red {
  background: var(--red-tint);
  color: var(--red);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.badge-blue {
  background: var(--blue-tint);
  color: var(--blue);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.badge-green {
  background: var(--green-tint);
  color: var(--green);
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.badge-purple {
  background: rgba(168, 85, 247, 0.08);
  color: var(--purple);
  border: 1px solid rgba(168, 85, 247, 0.2);
}
</style>
