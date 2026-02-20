<script setup lang="ts">
const props = defineProps<{
  groupCount: number
  modelValue: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const groupLabels = computed(() =>
  Array.from({ length: props.groupCount }, (_, i) => String.fromCharCode(65 + i)),
)
</script>

<template>
  <div class="group-tabs-container">
    <button
      v-for="(label, i) in groupLabels"
      :key="i"
      class="group-tabs-btn"
      :class="{ active: modelValue === i }"
      @click="emit('update:modelValue', i)"
    >
      Group {{ label }}
    </button>
    <div
      class="group-tabs-pill"
      :style="{
        width: `calc(${100 / groupCount}% - 2px)`,
        transform: `translateX(${modelValue * 100}%)`,
      }"
    />
  </div>
</template>

<style>
/* GroupTabs — requires absolute pill positioning */
.group-tabs-container {
  position: relative;
  display: flex;
  background: var(--surface-2);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 2px solid black;
}

.group-tabs-btn {
  position: relative;
  z-index: 1;
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: color var(--duration-normal) var(--ease-out);
  text-align: center;
}

.group-tabs-btn.active {
  color: black;
}

.group-tabs-pill {
  position: absolute;
  top: 2px;
  left: 2px;
  height: calc(100% - 4px);
  background: var(--yellow);
  border-radius: calc(var(--radius-md) - 2px);
  transition: transform var(--duration-normal) var(--ease-spring);
}
</style>
