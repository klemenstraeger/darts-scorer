<script setup lang="ts">
const route = useRoute()

const isFullScreenPage = computed(() =>
  route.name === 'training-play',
)
</script>

<template>
  <div class="h-[100dvh] flex flex-col">
    <AppNav />
    <div
      class="flex-1 min-h-0"
      :class="isFullScreenPage ? '' : 'default-layout-content'"
    >
      <slot />
    </div>
  </div>
</template>

<style>
/* Bottom-nav padding only when nav is visible (not on training-play).
   env() safe-area calculation cannot be expressed in Tailwind. */
.default-layout-content {
  padding-bottom: calc(82px + env(safe-area-inset-bottom, 0px));
}

@media (min-width: 640px) {
  .default-layout-content {
    padding-bottom: 0;
  }
}
</style>
