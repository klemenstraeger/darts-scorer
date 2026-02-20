<script setup lang="ts">
import { getAvatarUrl } from '~/utils/avatar'

const props = withDefaults(defineProps<{
  name: string
  avatarSeed?: string | null
  avatarStyle?: string | null
  size?: number
}>(), {
  size: 32,
})

const url = computed(() => getAvatarUrl(props.name, props.avatarSeed, props.avatarStyle, props.size))
const failed = ref(false)
const initial = computed(() => props.name.charAt(0).toUpperCase())

watch(() => [props.name, props.avatarSeed, props.avatarStyle], () => {
  failed.value = false
})
</script>

<template>
  <div
    class="inline-flex items-center justify-center rounded-full overflow-hidden bg-surface-3 border-2 border-black shrink-0"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.4)}px` }"
  >
    <img
      v-if="!failed"
      :src="url"
      :alt="name"
      :width="size"
      :height="size"
      loading="lazy"
      class="w-full h-full object-cover"
      @error="failed = true"
    >
    <span v-else class="font-bold text-fg-muted leading-none">{{ initial }}</span>
  </div>
</template>
