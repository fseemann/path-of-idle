<template>
  <header class="app-header">
    <div class="header-left">
      <span class="game-title">Path of Idle</span>
    </div>
    <div class="header-right">
      <span v-if="pendingCount > 0" class="loot-notice" @click="emit('goToInventory')">
        <span class="badge">{{ pendingCount }}</span>
        <span class="loot-label">new items</span>
      </span>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMapRunsStore } from '@/stores'

const emit = defineEmits<{ goToInventory: [] }>()

const mapRunsStore = useMapRunsStore()
const pendingCount = computed(() => mapRunsStore.pendingLoot.length)
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-lg);
  height: 48px;
  background: var(--color-bg-panel);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.game-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.loot-notice {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: 13px;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  transition: background 0.15s;
}

.loot-notice:hover {
  background: var(--color-bg-card);
}

.loot-label {
  color: var(--color-text-primary);
}
</style>
