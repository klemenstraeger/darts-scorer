<template>
  <div class="spectate-root">
    <slot />
  </div>
</template>

<style scoped>
.spectate-root {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: var(--surface-0);
}
</style>
