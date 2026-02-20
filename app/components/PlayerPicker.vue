<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: string[]
  min?: number
  max?: number
}>(), {
  min: 2,
  max: 4,
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const { players, ensureLoaded } = usePlayers()

const search = ref('')

onMounted(() => {
  ensureLoaded()
})

const showSearch = computed(() => players.value.length > 6)

const filteredPlayers = computed(() => {
  const q = search.value.toLowerCase()
  if (!q)
    return players.value
  return players.value.filter(p => p.name.toLowerCase().includes(q))
})

const maxReached = computed(() => props.modelValue.length >= props.max)

function selectionIndex(name: string): number {
  return props.modelValue.indexOf(name)
}

function togglePlayer(name: string) {
  const idx = selectionIndex(name)
  if (idx >= 0) {
    // Deselect
    const updated = [...props.modelValue]
    updated.splice(idx, 1)
    emit('update:modelValue', updated)
  }
  else if (!maxReached.value) {
    // Select
    emit('update:modelValue', [...props.modelValue, name])
  }
}

function removePlayer(name: string) {
  emit('update:modelValue', props.modelValue.filter(n => n !== name))
}

function getAvatarProps(name: string) {
  const player = players.value.find(p => p.name === name)
  return {
    name,
    avatarSeed: player?.avatarSeed ?? null,
    avatarStyle: player?.avatarStyle ?? null,
  }
}
</script>

<template>
  <div class="flex flex-col gap-lg w-full">
    <!-- Search bar (only if many players) -->
    <input
      v-if="showSearch"
      v-model="search"
      class="w-full px-sm py-sm bg-surface-1 border-2 border-black rounded-md text-fg text-[0.9rem] outline-none transition-all duration-150 focus:shadow-sm placeholder:text-fg-muted"
      type="text"
      placeholder="Search players..."
    >

    <!-- Player grid -->
    <div class="grid grid-cols-3 gap-md max-[400px]:grid-cols-2">
      <button
        v-for="player in filteredPlayers"
        :key="player.id"
        class="flex flex-col items-center gap-sm px-sm py-lg bg-surface-1 border-2 border-black rounded-lg cursor-pointer transition-all duration-150 min-h-[90px] font-sans shadow-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        :class="{
          'border-yellow bg-yellow-light': selectionIndex(player.name) >= 0,
          'opacity-35 cursor-default pointer-events-none': maxReached && selectionIndex(player.name) < 0,
        }"
        @click="togglePlayer(player.name)"
      >
        <div class="relative">
          <PlayerAvatar
            v-bind="getAvatarProps(player.name)"
            :size="48"
          />
          <span
            v-if="selectionIndex(player.name) >= 0"
            class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-yellow text-fg-inverse text-[0.7rem] font-extrabold flex items-center justify-center border-2 border-black"
          >
            {{ selectionIndex(player.name) + 1 }}
          </span>
        </div>
        <span class="text-[0.8rem] font-semibold text-center overflow-hidden text-ellipsis whitespace-nowrap max-w-full" :class="selectionIndex(player.name) >= 0 ? 'text-fg' : 'text-fg-secondary'">{{ player.name }}</span>
      </button>

      <div v-if="filteredPlayers.length === 0" class="col-span-full flex flex-col items-center gap-md p-2xl text-fg-muted text-[0.9rem]">
        <template v-if="players.length === 0">
          <p>No players yet.</p>
          <NuxtLink
            to="/players"
            class="inline-flex items-center justify-center px-lg py-sm bg-surface-1 border-2 border-black rounded-lg text-fg font-bold text-[0.85rem] no-underline shadow-sm transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            Manage Players
          </NuxtLink>
        </template>
        <p v-else>
          No players match "{{ search }}"
        </p>
      </div>
    </div>

    <!-- Selected summary -->
    <div v-if="modelValue.length > 0" class="pt-sm border-t-2 border-black/10">
      <div class="flex flex-wrap gap-sm">
        <span
          v-for="name in modelValue"
          :key="name"
          class="flex items-center gap-xs pl-xs pr-md py-xs bg-yellow-light border-2 border-black rounded-full text-fg text-[0.8rem] font-semibold"
        >
          <PlayerAvatar v-bind="getAvatarProps(name)" :size="20" />
          {{ name }}
          <button class="bg-transparent border-none text-fg-muted text-[1rem] cursor-pointer p-0 leading-none transition-colors duration-150 hover:text-red" @click="removePlayer(name)">&times;</button>
        </span>
      </div>
    </div>

    <!-- Status line -->
    <p class="text-[0.75rem] text-fg-muted text-center">
      {{ modelValue.length }} of {{ min }}-{{ max }} players
    </p>
  </div>
</template>
