<template>
  <nav class="app-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="tab-btn"
      :class="{ active: modelValue === tab.id }"
      @click="emit('update:modelValue', tab.id)"
    >
      {{ tab.label }}
    </button>
  </nav>
</template>

<script setup lang="ts">
export type TabId = 'maps' | 'characters' | 'inventory'

defineProps<{
  modelValue: TabId
}>()

const emit = defineEmits<{
  'update:modelValue': [value: TabId]
}>()

const tabs: { id: TabId; label: string }[] = [
  { id: 'maps', label: 'Maps' },
  { id: 'characters', label: 'Characters' },
  { id: 'inventory', label: 'Inventory' },
]
</script>

<style scoped>
.app-tabs {
  display: flex;
  gap: 2px;
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-bg-panel);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.tab-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: 13px;
  transition: all 0.15s;
}

.tab-btn:hover {
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  border-color: var(--color-border);
}

.tab-btn.active {
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  border-color: var(--color-border-light);
}
</style>
