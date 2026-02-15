<template>
  <div class="inv-panel">
    <div class="panel-header">
      <h2>Inventory</h2>
      <span class="panel-sub">Click an item to equip it to a character.</span>
      <span class="item-count">{{ inventoryStore.items.length }} item(s)</span>
    </div>

    <div v-if="inventoryStore.items.length === 0" class="inv-empty">
      <p>No items yet. Send heroes on maps to find equipment.</p>
    </div>

    <div v-else class="inv-grid">
      <ItemCard
        v-for="item in inventoryStore.items"
        :key="item.id"
        :item="item"
        @equip="openEquip"
      />
    </div>

    <EquipItemModal
      v-if="equipTarget"
      :item="equipTarget"
      @close="equipTarget = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { EquipmentItem } from '@/types'
import { useInventoryStore } from '@/stores'
import ItemCard from './ItemCard.vue'
import EquipItemModal from './EquipItemModal.vue'

const inventoryStore = useInventoryStore()
const equipTarget = ref<EquipmentItem | null>(null)

function openEquip(item: EquipmentItem) {
  equipTarget.value = item
}
</script>

<style scoped>
.inv-panel {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.panel-header {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.panel-header h2 {
  color: var(--color-text-primary);
  font-size: 18px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.panel-sub {
  font-size: 13px;
  color: var(--color-text-dim);
  flex: 1;
}

.item-count {
  font-size: 12px;
  color: var(--color-text-dim);
}

.inv-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--color-text-dim);
  font-size: 14px;
  text-align: center;
}

.inv-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--spacing-sm);
  align-content: start;
}
</style>
