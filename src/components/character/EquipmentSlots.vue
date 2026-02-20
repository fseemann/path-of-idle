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
      >
        <div class="item-header">
          <span class="item-name" :class="`rarity-${equip[slot.id]!.rarity}`">
            {{ equip[slot.id]!.name }}
          </span>
          <span class="unequip-hint" title="Unequip">×</span>
        </div>

        <div v-if="'baseDefense' in equip[slot.id]!" class="item-base-stat">
          {{ (equip[slot.id] as ArmorItem).baseDefense }} Armour
        </div>
        <div v-if="'baseAttackDamage' in equip[slot.id]!" class="item-base-stat">
          {{ (equip[slot.id] as WeaponItem).baseAttackDamage[0] }}–{{ (equip[slot.id] as WeaponItem).baseAttackDamage[1] }} Damage
        </div>

        <div class="item-mods">
          <div
            v-for="(mod, i) in equip[slot.id]!.modifiers"
            :key="i"
            class="mod-line"
            :class="mod.kind === 'increased' ? 'mod-increased' : 'mod-flat'"
          >
            {{ mod.label }}
          </div>
        </div>
      </div>

      <div v-else class="slot-empty">Empty</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Character, EquipmentSlot, ArmorItem, WeaponItem } from '@/types'
import { useCharactersStore, useInventoryStore } from '@/stores'

const props = defineProps<{ character: Character }>()

const SLOTS: { id: EquipmentSlot; label: string }[] = [
  { id: 'helmet',    label: 'Helmet' },
  { id: 'bodyArmor', label: 'Body Armour' },
  { id: 'weapon',    label: 'Weapon' },
  { id: 'gloves',    label: 'Gloves' },
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
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.slot-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-dim);
}

.slot-item {
  cursor: pointer;
  padding: 4px 6px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  transition: background 0.1s;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.slot-item:hover {
  background: var(--color-bg-card-hover);
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-xs);
}

.item-name {
  font-size: 12px;
  font-weight: 600;
}

.unequip-hint {
  color: var(--color-danger);
  font-size: 14px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.1s;
  line-height: 1;
}

.slot-item:hover .unequip-hint {
  opacity: 1;
}

.item-base-stat {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.item-mods {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.mod-line {
  font-size: 11px;
}

.mod-flat     { color: #a0c8a0; }
.mod-increased { color: var(--color-rarity-magic); }

.slot-empty {
  font-size: 12px;
  color: var(--color-text-dim);
  padding: 4px 6px;
}
</style>
