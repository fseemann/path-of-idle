<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-box">
      <h3 :class="`rarity-${item.rarity}`">{{ item.name }}</h3>
      <p class="modal-sub">Equip to which character?</p>

      <div v-if="'baseDefense' in item" class="modal-stat">
        <span>Base Armour:</span> <span>{{ item.baseDefense }}</span>
      </div>
      <div v-if="'baseAttackDamage' in item" class="modal-stat">
        <span>Attack Damage:</span>
        <span>{{ item.baseAttackDamage[0] }}–{{ item.baseAttackDamage[1] }}</span>
      </div>

      <div class="mod-list">
        <div
          v-for="(mod, i) in item.modifiers"
          :key="i"
          :class="mod.kind === 'increased' ? 'mod-increased' : 'mod-flat'"
        >{{ mod.label }}</div>
      </div>

      <hr class="modal-divider" />

      <div class="char-list">
        <div
          v-for="char in eligibleChars"
          :key="char.id"
          class="char-option"
          :class="{ selected: selectedCharId === char.id }"
          @click="selectedCharId = char.id"
        >
          <span class="char-name">{{ char.name }}</span>
          <span class="char-level">Lv. {{ char.level }}</span>
          <span v-if="char.equipment[item.slot]" class="char-equipped">
            ↪ {{ char.equipment[item.slot]!.name }}
          </span>
        </div>
        <p v-if="eligibleChars.length === 0" class="no-chars">
          No characters meet the level requirement ({{ item.levelRequirement }}).
        </p>
      </div>

      <div class="modal-actions">
        <button @click="emit('close')">Cancel</button>
        <button class="primary" :disabled="!selectedCharId" @click="onEquip">
          Equip
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { EquipmentItem } from '@/types'
import { useCharactersStore, useInventoryStore } from '@/stores'

const props = defineProps<{ item: EquipmentItem }>()
const emit = defineEmits<{ close: [] }>()

const charactersStore = useCharactersStore()
const inventoryStore = useInventoryStore()

const selectedCharId = ref<string | null>(charactersStore.selectedCharacterId)

const eligibleChars = computed(() =>
  charactersStore.characters.filter((c) => c.level >= props.item.levelRequirement)
)

function onEquip() {
  if (!selectedCharId.value) return
  const removed = inventoryStore.removeItem(props.item.id)
  if (!removed) return
  const displaced = charactersStore.equipItem(selectedCharId.value, props.item.slot, removed)
  if (displaced) inventoryStore.addItems([displaced])
  emit('close')
}
</script>

<style scoped>
.modal-sub {
  font-size: 13px;
  color: var(--color-text-dim);
  margin-bottom: var(--spacing-sm);
}

.modal-stat {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--color-text-secondary);
  padding: 2px 0;
}

.mod-list {
  margin: var(--spacing-sm) 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mod-flat     { font-size: 13px; color: #a0c8a0; }
.mod-increased { font-size: 13px; color: var(--color-rarity-magic); }

.modal-divider {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: var(--spacing-md) 0;
}

.char-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.char-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s;
}

.char-option:hover {
  border-color: var(--color-border-light);
  background: var(--color-bg-card-hover);
}

.char-option.selected {
  border-color: var(--color-text-primary);
  background: var(--color-bg-card);
}

.char-name {
  font-weight: 600;
  color: var(--color-text-primary);
  flex: 1;
}

.char-level {
  font-size: 12px;
  color: var(--color-text-dim);
}

.char-equipped {
  font-size: 11px;
  color: var(--color-text-dim);
  font-style: italic;
}

.no-chars {
  color: var(--color-text-dim);
  font-size: 13px;
  text-align: center;
  padding: var(--spacing-md);
}

.modal-actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
}
</style>
