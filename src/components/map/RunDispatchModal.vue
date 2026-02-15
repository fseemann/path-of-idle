<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-box">
      <h3>Send to: {{ map.name }}</h3>
      <p class="map-desc">{{ map.description }}</p>

      <div class="char-list">
        <div
          v-for="char in eligibleCharacters"
          :key="char.id"
          class="char-option"
          :class="{ selected: selectedId === char.id, busy: isBusy(char.id) }"
          @click="!isBusy(char.id) && (selectedId = char.id)"
        >
          <div class="char-name">{{ char.name }}</div>
          <div class="char-sub">
            Lv. {{ char.level }}
            <span v-if="isBusy(char.id)" class="busy-tag">Running</span>
          </div>
        </div>
        <p v-if="eligibleCharacters.length === 0" class="no-chars">
          No characters meet the level requirement ({{ map.levelRequirement }}).
        </p>
      </div>

      <div v-if="selectedId" class="stat-preview">
        <div class="stat-pill">
          <span class="stat-label">Duration</span>
          <span class="stat-value">
            {{ effectiveDurationSecs }}s
            <span v-if="durationDeltaPct !== 0" class="stat-delta" :class="durationDeltaPct < 0 ? 'positive' : 'negative'">
              ({{ durationDeltaPct > 0 ? '+' : '' }}{{ durationDeltaPct }}%)
            </span>
          </span>
        </div>
        <div class="stat-pill">
          <span class="stat-label">Loot bonus</span>
          <span class="stat-value">
            <span :class="dpsBonus > 0 ? 'positive' : ''">+{{ dpsBonus }} item{{ dpsBonus !== 1 ? 's' : '' }}</span>
          </span>
        </div>
        <div class="stat-pill">
          <span class="stat-label">Rarity chance</span>
          <span class="stat-value">
            <span :class="rarityBonusPct > 0 ? 'positive' : ''">+{{ rarityBonusPct }}%</span>
          </span>
        </div>
        <div class="stat-pill">
          <span class="stat-label">Survival</span>
          <span class="stat-value" :class="survivalPct >= 100 ? 'positive' : survivalPct < 30 ? 'negative' : ''">
            {{ survivalPct >= 100 ? '100%' : survivalPct + '%' }}
          </span>
        </div>
      </div>

      <label class="auto-rerun-toggle">
        <input type="checkbox" v-model="autoRerun" />
        <span class="toggle-label">
          Auto rerun
          <span class="toggle-hint">Loot is collected automatically and the map restarts immediately on completion.</span>
        </span>
      </label>

      <div class="modal-actions">
        <button @click="emit('close')">Cancel</button>
        <button class="primary" :disabled="!selectedId" @click="onSend">
          Send
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { GameMap } from '@/types'
import { useCharactersStore, useMapRunsStore } from '@/stores'
import { calculateStats } from '@/engine/statCalculator'
import { simulateCombat } from '@/engine/combatSimulator'

const props = defineProps<{ map: GameMap }>()
const emit = defineEmits<{ close: [] }>()

const charactersStore = useCharactersStore()
const mapRunsStore = useMapRunsStore()

const selectedId = ref<string | null>(charactersStore.selectedCharacterId)
const autoRerun = ref(false)

const eligibleCharacters = computed(() =>
  charactersStore.characters.filter((c) => c.level >= props.map.levelRequirement)
)

const selectedCharacter = computed(() =>
  selectedId.value ? charactersStore.getCharacter(selectedId.value) ?? null : null
)

const effectiveDurationSecs = computed(() => {
  if (!selectedCharacter.value) return props.map.durationSeconds
  const stats = calculateStats(selectedCharacter.value)
  const speedFactor = Math.max(0.5, 100 / stats.movementSpeed)
  return Math.round((props.map.durationSeconds * speedFactor * 10)) / 10
})

const durationDeltaPct = computed(() => {
  const base = props.map.durationSeconds
  const delta = effectiveDurationSecs.value - base
  return Math.round((delta / base) * 100)
})

const dpsBonus = computed(() => {
  if (!selectedCharacter.value) return 0
  const stats = calculateStats(selectedCharacter.value)
  const dps = stats.attackDamage * stats.attackSpeed
  return Math.floor(Math.max(0, dps / 15.0 - 1))
})

const rarityBonusPct = computed(() => {
  if (!selectedCharacter.value) return 0
  const stats = calculateStats(selectedCharacter.value)
  const dps = stats.attackDamage * stats.attackSpeed
  return Math.round(Math.min(75, Math.max(0, (dps - 3) / 30) * 100))
})

const survivalPct = computed(() => {
  if (!selectedCharacter.value) return 100
  const stats = calculateStats(selectedCharacter.value)
  const { survivalRatio } = simulateCombat(props.map, stats)
  return Math.round(Math.min(1, survivalRatio) * 100)
})

function isBusy(characterId: string): boolean {
  return mapRunsStore.getActiveRunForCharacter(characterId) !== null
}

function onSend() {
  if (!selectedId.value) return
  mapRunsStore.startRun(props.map.id, selectedId.value, autoRerun.value)
  emit('close')
}
</script>

<style scoped>
.map-desc {
  color: var(--color-text-dim);
  font-size: 13px;
  margin-bottom: var(--spacing-lg);
}

.char-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.char-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s;
}

.char-option:hover:not(.busy) {
  border-color: var(--color-border-light);
  background: var(--color-bg-card-hover);
}

.char-option.selected {
  border-color: var(--color-text-primary);
  background: var(--color-bg-card);
}

.char-option.busy {
  opacity: 0.5;
  cursor: not-allowed;
}

.char-name {
  color: var(--color-text-primary);
  font-weight: 600;
}

.char-sub {
  font-size: 12px;
  color: var(--color-text-dim);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.busy-tag {
  color: var(--color-lightning);
  font-size: 11px;
}

.no-chars {
  color: var(--color-text-dim);
  font-size: 13px;
  text-align: center;
  padding: var(--spacing-md);
}

.stat-preview {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.stat-pill {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 12px;
}

.stat-label {
  color: var(--color-text-dim);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.stat-value {
  color: var(--color-text-primary);
  font-weight: 600;
}

.stat-delta {
  font-weight: 400;
  font-size: 11px;
}

.positive {
  color: var(--color-life);
}

.negative {
  color: var(--color-fire);
}

.auto-rerun-toggle {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  margin-bottom: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: border-color 0.15s;
}

.auto-rerun-toggle:hover {
  border-color: var(--color-border-light);
}

.auto-rerun-toggle input[type='checkbox'] {
  margin-top: 2px;
  accent-color: var(--color-text-primary);
  flex-shrink: 0;
  cursor: pointer;
}

.toggle-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
  color: var(--color-text-primary);
  cursor: pointer;
}

.toggle-hint {
  font-size: 11px;
  color: var(--color-text-dim);
}

.modal-actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
}
</style>
