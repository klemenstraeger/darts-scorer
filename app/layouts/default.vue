<script setup lang="ts">
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppNav />
    <div class="layout-content flex-1">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.layout-content {
  padding-bottom: calc(48px + env(safe-area-inset-bottom, 0px));
}

@media (min-width: 640px) {
  .layout-content {
    padding-bottom: 0;
  }
}
</style>
