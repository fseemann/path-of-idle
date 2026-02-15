<template>
  <div
    class="item-card"
    :class="[`border-${item.rarity}`, { 'item-locked': item.locked }]"
    @mouseenter="showTip = true"
    @mouseleave="showTip = false"
    @click="emit('equip', item)"
  >
    <div class="item-header">
      <span class="item-name" :class="`rarity-${item.rarity}`">{{ item.name }}</span>
      <button
        class="lock-btn"
        :class="{ 'is-locked': item.locked }"
        :title="item.locked ? 'Unlock item' : 'Lock item (prevents disassembly)'"
        @click.stop="inventoryStore.toggleLock(item.id)"
      >{{ item.locked ? '🔒' : '🔓' }}</button>
      <span class="item-slot">{{ SLOT_LABELS[item.slot] }}</span>
    </div>
    <div class="item-mods">
      <span
        v-for="(mod, i) in item.modifiers"
        :key="i"
        class="mod-tag"
        :class="mod.kind === 'increased' ? 'mod-increased' : 'mod-flat'"
      >{{ mod.label }}</span>
    </div>

    <Teleport to="body">
      <div
        v-if="showTip"
        class="tooltip-anchor"
        :style="tipStyle"
      >
        <ItemTooltip :item="item" />
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { EquipmentItem } from '@/types'
import { useInventoryStore } from '@/stores'
import ItemTooltip from './ItemTooltip.vue'

defineProps<{ item: EquipmentItem }>()
const emit = defineEmits<{ equip: [item: EquipmentItem] }>()

const inventoryStore = useInventoryStore()

const SLOT_LABELS: Record<string, string> = {
  helmet: 'Helmet',
  bodyArmor: 'Body Armour',
  weapon: 'Weapon',
  boots: 'Boots',
  leftRing: 'Left Ring',
  rightRing: 'Right Ring',
  ring: 'Ring',
}

const showTip = ref(false)
const tipStyle = reactive({ top: '0px', left: '0px' })

function onMouseMove(e: MouseEvent) {
  tipStyle.top = `${e.clientY + 12}px`
  tipStyle.left = `${e.clientX + 12}px`
}
</script>

<style scoped>
.item-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--spacing-sm);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.item-card:hover {
  background: var(--color-bg-card-hover);
}

.item-locked {
  opacity: 0.75;
}

.item-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--spacing-xs);
}

.item-name {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.lock-btn {
  background: none;
  border: none;
  padding: 0 2px;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  opacity: 0.4;
  flex-shrink: 0;
  transition: opacity 0.15s;
}

.lock-btn:hover,
.lock-btn.is-locked {
  opacity: 1;
}

.item-slot {
  font-size: 10px;
  color: var(--color-text-dim);
  flex-shrink: 0;
}

.item-mods {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.mod-tag {
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 2px;
  background: var(--color-bg-dark);
}

.mod-flat     { color: #a0c8a0; }
.mod-increased { color: var(--color-rarity-magic); }

.tooltip-anchor {
  position: fixed;
  z-index: 200;
  pointer-events: none;
}
</style>
