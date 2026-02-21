<script setup lang="ts">
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppNav />
    <div class="default-layout-content flex-1">
      <slot />
    </div>
  </div>
</template>

<style>
/* env() safe-area calculation cannot be expressed in Tailwind */
.default-layout-content {
  padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px));
}

@media (min-width: 640px) {
  .default-layout-content {
    padding-bottom: 0;
  }
}
</style>
