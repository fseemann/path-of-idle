<template>
  <div
    class="stat-row"
    @mouseenter="emit('tip', tip, $event)"
    @mousemove="emit('tip', tip, $event)"
    @mouseleave="emit('tip', null, null)"
  >
    <span class="stat-name" :class="color">{{ label }}</span>
    <span class="stat-value" :class="valueClass">{{ value }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string
  tip: string
  color?: string
  valueClass?: string
}>()

const emit = defineEmits<{
  tip: [tip: string | null, event: MouseEvent | null]
}>()
</script>

<style scoped>
.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 2px;
  border-radius: var(--radius-sm);
  cursor: default;
  transition: background 0.1s;
}

.stat-row:hover {
  background: rgba(255, 255, 255, 0.04);
}

.stat-name {
  font-size: 12px;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-name::after {
  content: '?';
  font-size: 9px;
  color: var(--color-text-dim);
  border: 1px solid var(--color-border);
  border-radius: 50%;
  width: 12px;
  height: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.1s;
}

.stat-row:hover .stat-name::after {
  opacity: 1;
}

.stat-value {
  font-size: 12px;
  color: var(--color-text-primary);
  font-weight: 600;
}

.str       { color: #c86050; }
.dex       { color: #60c870; }
.int       { color: #6090e0; }
.fire      { color: var(--color-fire); }
.ice       { color: var(--color-ice); }
.lightning { color: var(--color-lightning); }
.chaos     { color: var(--color-chaos); }
</style>
