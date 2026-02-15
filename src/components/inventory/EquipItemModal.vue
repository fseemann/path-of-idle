<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-box">
      <h3 :class="`rarity-${localItem.rarity}`">{{ localItem.name }}</h3>

      <div v-if="'baseDefense' in localItem" class="modal-stat">
        <span>Base Armour:</span> <span>{{ (localItem as ArmorItem).baseDefense }}</span>
      </div>
      <div v-if="'baseAttackDamage' in localItem" class="modal-stat">
        <span>Attack Damage:</span>
        <span>{{ (localItem as WeaponItem).baseAttackDamage[0] }}–{{ (localItem as WeaponItem).baseAttackDamage[1] }}</span>
      </div>

      <div class="mod-list">
        <div
          v-for="(mod, i) in localItem.modifiers"
          :key="i"
          :class="mod.kind === 'increased' ? 'mod-increased' : 'mod-flat'"
        >{{ mod.label }}</div>
      </div>

      <!-- Crafting section (disabled for rings) -->
      <div v-if="!isRing" class="craft-section">
        <div class="section-label">Crafting</div>
        <div class="craft-row">
          <button
            class="craft-btn"
            :disabled="!canAnnul"
            @click="onAnnulment"
          >
            Annulment Orb
            <span class="craft-count">({{ currencyStore.annulments }})</span>
            <span class="craft-hint">Remove random modifier</span>
          </button>
          <button
            class="craft-btn"
            :disabled="!canExalt"
            @click="onExalt"
          >
            Exalt Orb
            <span class="craft-count">({{ currencyStore.exalts }})</span>
            <span class="craft-hint">Add random modifier</span>
          </button>
        </div>
      </div>

      <hr class="modal-divider" />

      <p class="modal-sub">Equip to which character?</p>

      <!-- Ring slot picker — only shown for rings -->
      <div v-if="isRing" class="ring-slot-picker">
        <button
          class="ring-slot-btn"
          :class="{ active: ringSlot === 'leftRing' }"
          @click="ringSlot = 'leftRing'"
        >
          Left Ring
          <span v-if="selectedChar?.equipment.leftRing" class="displaced-hint">
            ↪ {{ selectedChar.equipment.leftRing.name }}
          </span>
        </button>
        <button
          class="ring-slot-btn"
          :class="{ active: ringSlot === 'rightRing' }"
          @click="ringSlot = 'rightRing'"
        >
          Right Ring
          <span v-if="selectedChar?.equipment.rightRing" class="displaced-hint">
            ↪ {{ selectedChar.equipment.rightRing.name }}
          </span>
        </button>
      </div>

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
          <span v-if="!isRing && char.equipment[targetSlot]" class="char-equipped">
            ↪ {{ char.equipment[targetSlot]!.name }}
          </span>
        </div>
        <p v-if="eligibleChars.length === 0" class="no-chars">
          No characters meet the level requirement ({{ localItem.levelRequirement }}).
        </p>
      </div>

      <div class="modal-actions">
        <button @click="emit('close')">Cancel</button>
        <button class="disassemble-btn" @click="onDisassemble">
          Disassemble
          <span class="yield-hint">→ {{ yieldText }}</span>
        </button>
        <button class="primary" :disabled="!selectedCharId" @click="onEquip">
          Equip
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { EquipmentItem, EquipmentSlot, ArmorItem, WeaponItem } from '@/types'
import { MAX_MODIFIERS_BY_SLOT } from '@/types'
import { useCharactersStore, useInventoryStore, useCurrencyStore } from '@/stores'
import { getDisassembleYield } from '@/engine/disassembler'

const props = defineProps<{ item: EquipmentItem }>()
const emit = defineEmits<{ close: [] }>()

const charactersStore = useCharactersStore()
const inventoryStore = useInventoryStore()
const currencyStore = useCurrencyStore()

// Reactive local copy — updated in-place by crafting operations.
// JSON round-trip unwraps the Vue reactive Proxy before cloning.
const localItem = ref<EquipmentItem>(JSON.parse(JSON.stringify(props.item)))

const isRing = computed(() => localItem.value.slot === 'ring')
const ringSlot = ref<'leftRing' | 'rightRing'>('leftRing')

const targetSlot = computed<EquipmentSlot>(() =>
  isRing.value ? ringSlot.value : (localItem.value.slot as EquipmentSlot)
)

const selectedCharId = ref<string | null>(charactersStore.selectedCharacterId)

const selectedChar = computed(() =>
  charactersStore.characters.find((c) => c.id === selectedCharId.value) ?? null
)

const eligibleChars = computed(() =>
  charactersStore.characters.filter((c) => c.level >= localItem.value.levelRequirement)
)

const canAnnul = computed(() =>
  !isRing.value &&
  currencyStore.annulments >= 1 &&
  localItem.value.modifiers.length > 0
)

const canExalt = computed(() => {
  if (isRing.value || currencyStore.exalts < 1) return false
  return localItem.value.modifiers.length < MAX_MODIFIERS_BY_SLOT[localItem.value.slot]
})

const yieldText = computed(() => {
  const y = getDisassembleYield(localItem.value)
  const parts: string[] = []
  if (y.annulmentShards > 0) parts.push(`${y.annulmentShards} Annulment Shard${y.annulmentShards > 1 ? 's' : ''}`)
  if (y.exaltShards > 0) parts.push(`${y.exaltShards} Exalt Shard${y.exaltShards > 1 ? 's' : ''}`)
  return parts.join(' + ') || '0 shards'
})

function syncItem(result: EquipmentItem) {
  inventoryStore.removeItem(localItem.value.id)
  inventoryStore.addItems([result])
  localItem.value = result
}

function onAnnulment() {
  const result = currencyStore.useAnnulment(localItem.value)
  if (result) syncItem(result)
}

function onExalt() {
  const result = currencyStore.useExalt(localItem.value)
  if (result) syncItem(result)
}

function onDisassemble() {
  currencyStore.disassembleItem(localItem.value)
  inventoryStore.removeItem(localItem.value.id)
  emit('close')
}

function onEquip() {
  if (!selectedCharId.value) return
  const removed = inventoryStore.removeItem(localItem.value.id)
  if (!removed) return
  const displaced = charactersStore.equipItem(selectedCharId.value, targetSlot.value, removed)
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

/* Crafting */
.craft-section {
  margin: var(--spacing-sm) 0;
}

.section-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-dim);
  margin-bottom: var(--spacing-xs);
}

.craft-row {
  display: flex;
  gap: var(--spacing-sm);
}

.craft-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-dark);
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.craft-btn:not(:disabled):hover {
  border-color: var(--color-border-light);
  background: var(--color-bg-card-hover);
  color: var(--color-text-primary);
}

.craft-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.craft-count {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 13px;
}

.craft-hint {
  font-size: 10px;
  color: var(--color-text-dim);
}

.modal-divider {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: var(--spacing-md) 0;
}

/* Ring slot picker */
.ring-slot-picker {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}

.ring-slot-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-dark);
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.ring-slot-btn:hover {
  border-color: var(--color-border-light);
  background: var(--color-bg-card-hover);
}

.ring-slot-btn.active {
  border-color: var(--color-text-primary);
  color: var(--color-text-primary);
  background: var(--color-bg-card);
}

.displaced-hint {
  font-size: 10px;
  color: var(--color-text-dim);
  font-style: italic;
}

/* Char list */
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

/* Actions */
.modal-actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
  align-items: center;
}

.disassemble-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  background: transparent;
  border: 1px solid #6b4040;
  color: #c07070;
  border-radius: var(--radius-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.disassemble-btn:hover {
  background: #3a1a1a;
  border-color: #c07070;
}

.yield-hint {
  font-size: 11px;
  color: var(--color-text-dim);
}
</style>
