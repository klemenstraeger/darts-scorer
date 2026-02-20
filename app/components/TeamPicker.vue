<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: string[]
  min?: number
  max?: number
}>(), {
  min: 2,
  max: 16,
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const { teams, ensureLoaded } = useTeams()

const search = ref('')

onMounted(() => {
  ensureLoaded()
})

const showSearch = computed(() => teams.value.length > 6)

const filteredTeams = computed(() => {
  const q = search.value.toLowerCase()
  if (!q)
    return teams.value
  return teams.value.filter(t => t.name.toLowerCase().includes(q))
})

const maxReached = computed(() => props.modelValue.length >= props.max)

function selectionIndex(name: string): number {
  return props.modelValue.indexOf(name)
}

function toggleTeam(name: string) {
  const idx = selectionIndex(name)
  if (idx >= 0) {
    const updated = [...props.modelValue]
    updated.splice(idx, 1)
    emit('update:modelValue', updated)
  }
  else if (!maxReached.value) {
    emit('update:modelValue', [...props.modelValue, name])
  }
}

function removeTeam(name: string) {
  emit('update:modelValue', props.modelValue.filter(n => n !== name))
}
</script>

<template>
  <div class="flex flex-col gap-lg w-full">
    <!-- Search bar -->
    <input
      v-if="showSearch"
      v-model="search"
      class="w-full px-sm py-sm bg-surface-1 border-2 border-black rounded-md text-fg text-[0.9rem] outline-none transition-all duration-150 focus:shadow-sm placeholder:text-fg-muted"
      type="text"
      placeholder="Search teams..."
    >

    <!-- Team grid -->
    <div class="grid grid-cols-2 gap-md max-[400px]:grid-cols-1">
      <button
        v-for="team in filteredTeams"
        :key="team.id"
        class="flex flex-col items-center gap-xs px-sm py-lg bg-surface-1 border-2 border-black rounded-lg cursor-pointer transition-all duration-150 min-h-[90px] font-sans shadow-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        :class="{
          'border-yellow bg-yellow-light': selectionIndex(team.name) >= 0,
          'opacity-35 cursor-default pointer-events-none': maxReached && selectionIndex(team.name) < 0,
        }"
        @click="toggleTeam(team.name)"
      >
        <div class="relative w-12 h-12 rounded-full flex items-center justify-center text-fg-muted" :class="selectionIndex(team.name) >= 0 ? 'bg-yellow-light text-fg' : 'bg-surface-3'">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span
            v-if="selectionIndex(team.name) >= 0"
            class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-yellow text-fg-inverse text-[0.7rem] font-extrabold flex items-center justify-center border-2 border-black"
          >
            {{ selectionIndex(team.name) + 1 }}
          </span>
        </div>
        <span class="text-[0.8rem] font-semibold text-center overflow-hidden text-ellipsis whitespace-nowrap max-w-full" :class="selectionIndex(team.name) >= 0 ? 'text-fg' : 'text-fg-secondary'">{{ team.name }}</span>
        <span class="text-[0.65rem] text-fg-muted text-center overflow-hidden text-ellipsis whitespace-nowrap max-w-full">{{ team.members.map(m => m.playerName).join(', ') }}</span>
      </button>

      <div v-if="filteredTeams.length === 0" class="col-span-full flex flex-col items-center gap-md p-2xl text-fg-muted text-[0.9rem]">
        <template v-if="teams.length === 0">
          <p>No teams yet.</p>
          <NuxtLink
            to="/teams"
            class="inline-flex items-center justify-center px-lg py-sm bg-surface-1 border-2 border-black rounded-lg text-fg font-bold text-[0.85rem] no-underline shadow-sm transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            Manage Teams
          </NuxtLink>
        </template>
        <p v-else>
          No teams match "{{ search }}"
        </p>
      </div>
    </div>

    <!-- Selected summary -->
    <div v-if="modelValue.length > 0" class="pt-sm border-t-2 border-black/10">
      <div class="flex flex-wrap gap-sm">
        <span
          v-for="name in modelValue"
          :key="name"
          class="flex items-center gap-xs px-md py-xs bg-yellow-light border-2 border-black rounded-full text-fg text-[0.8rem] font-semibold"
        >
          {{ name }}
          <button class="bg-transparent border-none text-fg-muted text-[1rem] cursor-pointer p-0 leading-none transition-colors duration-150 hover:text-red" @click="removeTeam(name)">&times;</button>
        </span>
      </div>
    </div>

    <!-- Status line -->
    <p class="text-[0.75rem] text-fg-muted text-center">
      {{ modelValue.length }} of {{ min }}-{{ max }} teams
    </p>
  </div>
</template>
