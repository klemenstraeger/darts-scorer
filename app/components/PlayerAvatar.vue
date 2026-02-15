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
    class="player-avatar"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.4)}px` }"
  >
    <img
      v-if="!failed"
      :src="url"
      :alt="name"
      :width="size"
      :height="size"
      loading="lazy"
      @error="failed = true"
    />
    <span v-else class="avatar-fallback">{{ initial }}</span>
  </div>
</template>

<style scoped>
.player-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  overflow: hidden;
  background: var(--surface-3);
  flex-shrink: 0;
}

.player-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  font-weight: 700;
  color: var(--text-muted);
  line-height: 1;
}
</style>
