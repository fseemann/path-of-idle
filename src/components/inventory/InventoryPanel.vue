<template>
  <div class="inv-panel">
    <div class="panel-header">
      <h2>Inventory</h2>
      <span class="panel-sub">Click an item to equip or manage it.</span>
      <span class="item-count">{{ inventoryStore.items.length }} item(s)</span>
    </div>

    <!-- Currency Stash -->
    <div class="currency-stash">
      <div class="stash-title">Currency Stash</div>
      <div class="stash-grid">
        <div class="currency-row">
          <span class="currency-label annulment-color">Annulment</span>
          <span class="currency-orbs">{{ currencyStore.annulments }} orb{{ currencyStore.annulments !== 1 ? 's' : '' }}</span>
          <div class="shard-bar">
            <div
              class="shard-fill annulment-fill"
              :style="{ width: `${(currencyStore.annulmentRemainder / SHARDS_PER_CURRENCY) * 100}%` }"
            />
          </div>
          <span class="shard-count">{{ currencyStore.annulmentRemainder }}/{{ SHARDS_PER_CURRENCY }} shards</span>
        </div>
        <div class="currency-row">
          <span class="currency-label exalt-color">Exalt</span>
          <span class="currency-orbs">{{ currencyStore.exalts }} orb{{ currencyStore.exalts !== 1 ? 's' : '' }}</span>
          <div class="shard-bar">
            <div
              class="shard-fill exalt-fill"
              :style="{ width: `${(currencyStore.exaltRemainder / SHARDS_PER_CURRENCY) * 100}%` }"
            />
          </div>
          <span class="shard-count">{{ currencyStore.exaltRemainder }}/{{ SHARDS_PER_CURRENCY }} shards</span>
        </div>
      </div>
    </div>

    <!-- Filter Buttons -->
    <div class="filter-row">
      <button
        v-for="f in filterDefs"
        :key="f.key"
        class="filter-btn"
        :class="{ active: activeFilter === f.key }"
        @click="activeFilter = f.key"
      >{{ f.label }} <span class="filter-count">({{ f.count }})</span></button>
    </div>

    <!-- Bulk Actions -->
    <div v-if="showEquipmentBulk || showGemBulk" class="bulk-actions">
      <span class="bulk-label">Disassemble:</span>
      <button
        v-if="showGemBulk"
        class="bulk-btn bulk-gems"
        @click="disassembleAllGems"
      >Gems ({{ unequippedGems.length }})</button>
      <template v-if="showEquipmentBulk">
        <button
          class="bulk-btn"
          :class="{ 'bulk-normal': normalCount > 0 }"
          :disabled="normalCount === 0"
          @click="disassembleAllRarity('normal')"
        >Normal ({{ normalCount }})</button>
        <button
          class="bulk-btn"
          :class="{ 'bulk-magic': magicCount > 0 }"
          :disabled="magicCount === 0"
          @click="disassembleAllRarity('magic')"
        >Magic ({{ magicCount }})</button>
        <button
          class="bulk-btn"
          :class="{ 'bulk-rare': rareCount > 0 }"
          :disabled="rareCount === 0"
          @click="disassembleAllRarity('rare')"
        >Rare ({{ rareCount }})</button>
      </template>
    </div>

    <!-- Unified Item Grid -->
    <div v-if="filteredItems.length === 0" class="inv-empty">
      <p>No items match this filter.</p>
    </div>
    <div v-else class="inv-grid">
      <template v-for="entry in filteredItems" :key="entry.kind === 'equipment' ? entry.item.id : entry.gem.id">
        <ItemCard v-if="entry.kind === 'equipment'" :item="entry.item" @equip="openEquip" />
        <SkillGemCard v-else :gem="entry.gem" @open="openGem" />
      </template>
    </div>

    <EquipItemModal
      v-if="equipTarget"
      :item="equipTarget"
      @close="equipTarget = null"
    />
    <SkillGemModal
      v-if="gemTarget"
      :gem="gemTarget"
      @close="gemTarget = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { EquipmentItem, ItemRarity, SkillGem } from '@/types'
import { useInventoryStore, useCurrencyStore, SHARDS_PER_CURRENCY } from '@/stores'
import { useSkillsStore } from '@/stores/skills'
import ItemCard from './ItemCard.vue'
import EquipItemModal from './EquipItemModal.vue'
import SkillGemCard from './SkillGemCard.vue'
import SkillGemModal from './SkillGemModal.vue'

const inventoryStore = useInventoryStore()
const currencyStore = useCurrencyStore()
const skillsStore = useSkillsStore()

const equipTarget = ref<EquipmentItem | null>(null)
const gemTarget = ref<SkillGem | null>(null)

const unequippedGems = computed(() => skillsStore.getUnequippedGems())

function openEquip(item: EquipmentItem) {
  equipTarget.value = item
}

function openGem(gem: SkillGem) {
  gemTarget.value = gem
}

function disassembleAllGems() {
  for (const gem of unequippedGems.value.slice()) {
    skillsStore.disassembleGem(gem.id)
  }
}

type FilterKey = 'all' | 'helmet' | 'bodyArmor' | 'weapon' | 'gloves' | 'boots' | 'ring' | 'gems'
const activeFilter = ref<FilterKey>('all')

type UnifiedEntry =
  | { kind: 'equipment'; item: EquipmentItem }
  | { kind: 'gem'; gem: SkillGem }

const filterDefs = computed(() => [
  { key: 'all' as FilterKey,      label: 'All',      count: inventoryStore.items.length + unequippedGems.value.length },
  { key: 'helmet' as FilterKey,   label: 'Helmet',   count: inventoryStore.items.filter(i => i.slot === 'helmet').length },
  { key: 'bodyArmor' as FilterKey,label: 'Body',     count: inventoryStore.items.filter(i => i.slot === 'bodyArmor').length },
  { key: 'weapon' as FilterKey,   label: 'Weapon',   count: inventoryStore.items.filter(i => i.slot === 'weapon').length },
  { key: 'gloves' as FilterKey,   label: 'Gloves',   count: inventoryStore.items.filter(i => i.slot === 'gloves').length },
  { key: 'boots' as FilterKey,    label: 'Boots',    count: inventoryStore.items.filter(i => i.slot === 'boots').length },
  { key: 'ring' as FilterKey,     label: 'Ring',     count: inventoryStore.items.filter(i => i.slot === 'ring').length },
  { key: 'gems' as FilterKey,     label: 'Gems',     count: unequippedGems.value.length },
])

const filteredItems = computed((): UnifiedEntry[] => {
  const allEntries: UnifiedEntry[] = [
    ...inventoryStore.items.map(item => ({ kind: 'equipment' as const, item })),
    ...unequippedGems.value.map(gem => ({ kind: 'gem' as const, gem })),
  ]
  allEntries.sort((a, b) => {
    const ta = a.kind === 'equipment' ? (a.item.createdAt ?? 0) : (a.gem.createdAt ?? 0)
    const tb = b.kind === 'equipment' ? (b.item.createdAt ?? 0) : (b.gem.createdAt ?? 0)
    return ta - tb
  })
  if (activeFilter.value === 'all') return allEntries
  if (activeFilter.value === 'gems') return allEntries.filter(e => e.kind === 'gem')
  return allEntries.filter(e => e.kind === 'equipment' && e.item.slot === activeFilter.value)
})

const filteredEquipment = computed(() =>
  filteredItems.value.filter((e): e is { kind: 'equipment'; item: EquipmentItem } => e.kind === 'equipment').map(e => e.item)
)

const normalCount = computed(() => filteredEquipment.value.filter(i => i.rarity === 'normal' && !i.locked).length)
const magicCount  = computed(() => filteredEquipment.value.filter(i => i.rarity === 'magic'  && !i.locked).length)
const rareCount   = computed(() => filteredEquipment.value.filter(i => i.rarity === 'rare'   && !i.locked).length)

const showEquipmentBulk = computed(() => filteredEquipment.value.length > 0)
const showGemBulk = computed(() =>
  unequippedGems.value.length > 0 && (activeFilter.value === 'all' || activeFilter.value === 'gems')
)

function disassembleAllRarity(rarity: ItemRarity) {
  const targets = filteredEquipment.value.filter(i => i.rarity === rarity && !i.locked).slice()
  for (const item of targets) {
    currencyStore.disassembleItem(item)
    inventoryStore.removeItem(item.id)
  }
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

/* Currency Stash */
.currency-stash {
  background: var(--color-bg-panel);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--spacing-sm) var(--spacing-md);
}

.stash-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-dim);
  margin-bottom: var(--spacing-sm);
}

.stash-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.currency-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.currency-label {
  font-size: 13px;
  font-weight: 600;
  width: 80px;
  flex-shrink: 0;
}

.annulment-color { color: #9ab8d8; }
.exalt-color     { color: #d4a855; }

.currency-orbs {
  font-size: 13px;
  color: var(--color-text-primary);
  width: 60px;
  flex-shrink: 0;
}

.shard-bar {
  flex: 1;
  height: 6px;
  background: var(--color-bg-dark);
  border-radius: 3px;
  overflow: hidden;
}

.shard-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.annulment-fill { background: #9ab8d8; }
.exalt-fill     { background: #d4a855; }

.shard-count {
  font-size: 11px;
  color: var(--color-text-dim);
  width: 70px;
  flex-shrink: 0;
  text-align: right;
}

/* Filter row */
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.filter-btn {
  font-size: 12px;
  padding: 3px var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-dark);
  color: var(--color-text-dim);
  cursor: pointer;
  transition: all 0.15s;
}

.filter-btn.active {
  border-color: var(--color-text-primary);
  color: var(--color-text-primary);
}

.filter-count {
  font-size: 11px;
  color: var(--color-text-muted, var(--color-text-dim));
  opacity: 0.7;
}

/* Bulk actions */
.bulk-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.bulk-label {
  font-size: 12px;
  color: var(--color-text-dim);
  flex-shrink: 0;
}

.bulk-btn {
  font-size: 12px;
  padding: 3px var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-dark);
  color: var(--color-text-dim);
  cursor: pointer;
  transition: all 0.15s;
}

.bulk-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.bulk-gems        { color: #9ab8d8; }
.bulk-gems:hover  { border-color: #9ab8d8; color: #9ab8d8; }

.bulk-normal:hover { border-color: var(--color-rarity-normal); color: var(--color-rarity-normal); }
.bulk-magic:hover  { border-color: var(--color-rarity-magic);  color: var(--color-rarity-magic); }
.bulk-rare:hover   { border-color: var(--color-rarity-rare);   color: var(--color-rarity-rare); }

/* Items */
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
