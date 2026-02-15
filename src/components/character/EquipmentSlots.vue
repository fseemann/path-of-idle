<template>
  <div class="equipment-slots">
    <div
      v-for="slot in SLOTS"
      :key="slot.id"
      class="slot"
      :class="[`slot-${slot.id}`, { occupied: !!equip[slot.id] }]"
    >
      <div class="slot-label">{{ slot.label }}</div>
      <div
        v-if="equip[slot.id]"
        class="slot-item"
        :class="`border-${equip[slot.id]!.rarity}`"
        @click="onUnequip(slot.id)"
        :title="`Click to unequip: ${equip[slot.id]!.name}`"
      >
        <span :class="`rarity-${equip[slot.id]!.rarity}`">
          {{ equip[slot.id]!.name }}
        </span>
        <span class="unequip-hint">×</span>
      </div>
      <div v-else class="slot-empty">—</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Character, EquipmentSlot } from '@/types'
import { useCharactersStore, useInventoryStore } from '@/stores'

const props = defineProps<{ character: Character }>()

const SLOTS: { id: EquipmentSlot; label: string }[] = [
  { id: 'helmet',    label: 'Helmet' },
  { id: 'bodyArmor', label: 'Body Armour' },
  { id: 'weapon',    label: 'Weapon' },
  { id: 'boots',     label: 'Boots' },
  { id: 'leftRing',  label: 'Left Ring' },
  { id: 'rightRing', label: 'Right Ring' },
]

const equip = props.character.equipment
const charactersStore = useCharactersStore()
const inventoryStore = useInventoryStore()

function onUnequip(slot: EquipmentSlot) {
  const item = charactersStore.unequipItem(props.character.id, slot)
  if (item) inventoryStore.addItems([item])
}
</script>

<style scoped>
.equipment-slots {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-sm);
}

.slot {
  background: var(--color-bg-dark);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  min-height: 52px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.slot-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-dim);
}

.slot-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-xs);
  font-size: 12px;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  transition: background 0.1s;
}

.slot-item:hover {
  background: var(--color-bg-card-hover);
}

.slot-item > span:first-child {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.unequip-hint {
  color: var(--color-danger);
  font-size: 14px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.1s;
}

.slot-item:hover .unequip-hint {
  opacity: 1;
}

.slot-empty {
  font-size: 12px;
  color: var(--color-text-dim);
}
</style>
