<script setup lang="ts">
interface FilterState {
  from: string | null
  to: string | null
  mode: string | null
}

const emit = defineEmits<{
  (e: 'update', value: FilterState): void
}>()

const activeDate = ref<'7d' | '30d' | '90d' | 'all'>('all')
const activeMode = ref<'all' | '501' | '301'>('all')

const datePresets = [
  { key: '7d' as const, label: '7d' },
  { key: '30d' as const, label: '30d' },
  { key: '90d' as const, label: '90d' },
  { key: 'all' as const, label: 'All' },
]

const modeOptions = [
  { key: 'all' as const, label: 'All' },
  { key: '501' as const, label: '501' },
  { key: '301' as const, label: '301' },
]

function getDateRange(preset: typeof activeDate.value): { from: string | null, to: string | null } {
  if (preset === 'all')
    return { from: null, to: null }
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90
  const from = new Date()
  from.setDate(from.getDate() - days)
  return { from: from.toISOString(), to: null }
}

function selectDate(key: typeof activeDate.value) {
  activeDate.value = key
  emitUpdate()
}

function selectMode(key: typeof activeMode.value) {
  activeMode.value = key
  emitUpdate()
}

function emitUpdate() {
  const { from, to } = getDateRange(activeDate.value)
  emit('update', {
    from,
    to,
    mode: activeMode.value === 'all' ? null : activeMode.value,
  })
}
</script>

<template>
  <div class="flex flex-wrap gap-lg items-center">
    <div class="flex items-center gap-sm">
      <span class="text-[0.7rem] text-fg-muted uppercase tracking-[1px] font-semibold">Period</span>
      <div class="flex gap-xs">
        <button
          v-for="preset in datePresets"
          :key="preset.key"
          class="px-3 py-1 bg-surface-1 border-2 border-black rounded-full text-fg-secondary text-[0.78rem] font-medium cursor-pointer transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          :class="{ 'bg-blue border-black text-white font-semibold': activeDate === preset.key }"
          @click="selectDate(preset.key)"
        >
          {{ preset.label }}
        </button>
      </div>
    </div>
    <div class="flex items-center gap-sm">
      <span class="text-[0.7rem] text-fg-muted uppercase tracking-[1px] font-semibold">Mode</span>
      <div class="flex gap-xs">
        <button
          v-for="opt in modeOptions"
          :key="opt.key"
          class="px-3 py-1 bg-surface-1 border-2 border-black rounded-full text-fg-secondary text-[0.78rem] font-medium cursor-pointer transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          :class="{ 'bg-blue border-black text-white font-semibold': activeMode === opt.key }"
          @click="selectMode(opt.key)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>
  </div>
</template>
