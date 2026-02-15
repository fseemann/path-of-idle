<template>
  <div class="item-tooltip" :class="`border-${item.rarity}`">
    <div class="tooltip-name" :class="`rarity-${item.rarity}`">{{ item.name }}</div>
    <div class="tooltip-type">{{ slotLabel }} · Lv. {{ item.levelRequirement }}+</div>

    <hr class="tooltip-divider" />

    <div v-if="'baseDefense' in item" class="tooltip-stat">
      <span>Armour</span>
      <span>{{ item.baseDefense }}</span>
    </div>
    <div v-if="'baseAttackDamage' in item" class="tooltip-stat">
      <span>Attack Damage</span>
      <span>{{ item.baseAttackDamage[0] }}–{{ item.baseAttackDamage[1] }}</span>
    </div>

    <hr v-if="item.modifiers.length > 0" class="tooltip-divider" />

    <div
      v-for="(mod, i) in item.modifiers"
      :key="i"
      class="tooltip-mod"
      :class="mod.kind === 'increased' ? 'mod-increased' : 'mod-flat'"
    >
      {{ mod.label }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EquipmentItem } from '@/types'

const props = defineProps<{ item: EquipmentItem }>()

const SLOT_LABELS: Record<string, string> = {
  helmet: 'Helmet',
  bodyArmor: 'Body Armour',
  weapon: 'Weapon',
  boots: 'Boots',
  leftRing: 'Left Ring',
  rightRing: 'Right Ring',
  ring: 'Ring',
}

const slotLabel = SLOT_LABELS[props.item.slot] ?? props.item.slot
</script>

<style scoped>
.item-tooltip {
  background: #1a1410;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  min-width: 200px;
  max-width: 260px;
  pointer-events: none;
}

.tooltip-name {
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 2px;
}

.tooltip-type {
  font-size: 11px;
  color: var(--color-text-dim);
  margin-bottom: var(--spacing-xs);
}

.tooltip-divider {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: var(--spacing-xs) 0;
}

.tooltip-stat {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--color-text-secondary);
  padding: 1px 0;
}

.tooltip-mod {
  font-size: 12px;
  padding: 1px 0;
}

.mod-flat     { color: #a0c8a0; }
.mod-increased { color: var(--color-rarity-magic); }
</style>
