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
/* env() safe-area calculations cannot be expressed in Tailwind.
   On mobile the desktop nav is hidden, so content needs top safe-area padding.
   Bottom padding accounts for the fixed bottom nav bar. */
.default-layout-content {
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: calc(82px + env(safe-area-inset-bottom, 0px));
}

@media (min-width: 640px) {
  .default-layout-content {
    padding-top: 0;
    padding-bottom: 0;
  }
}
</style>
