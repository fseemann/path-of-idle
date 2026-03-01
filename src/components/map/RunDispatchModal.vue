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

      <div v-if="preview" class="breakdown-sections">
        <!-- Duration breakdown -->
        <div class="breakdown-section">
          <div class="section-title">Duration</div>
          <div class="breakdown-rows">
            <div class="breakdown-row">
              <span class="row-label">Base</span>
              <span class="row-value">{{ map.durationSeconds }}s</span>
            </div>
            <div class="breakdown-row">
              <span class="row-label">
                Movement speed
                <span class="row-detail">{{ preview.movementSpeed }}</span>
              </span>
              <span
                class="row-value"
                :class="preview.speedPct < 0 ? 'col-positive' : preview.speedPct > 0 ? 'col-negative' : ''"
              >
                {{ formatMultiplier(preview.speedFactor) }}
                <span v-if="preview.speedPct !== 0" class="row-delta">{{ formatDelta(preview.speedPct) }}</span>
              </span>
            </div>
            <div class="breakdown-row">
              <span class="row-label">
                Clear speed
                <span class="row-detail">{{ preview.totalDps }} DPS</span>
              </span>
              <span class="row-value" :class="preview.clearSpeedPct < 0 ? 'col-positive' : ''">
                {{ formatMultiplier(preview.clearSpeedMultiplier) }}
                <span v-if="preview.clearSpeedPct !== 0" class="row-delta">{{ formatDelta(preview.clearSpeedPct) }}</span>
              </span>
            </div>
          </div>
          <div class="breakdown-total">
            <span class="row-label">Effective</span>
            <span class="row-value">{{ preview.effectiveDuration }}s</span>
          </div>
        </div>

        <!-- Survivability breakdown -->
        <div class="breakdown-section">
          <div class="section-title">Survivability</div>
          <div class="breakdown-rows">
            <div class="breakdown-row">
              <span class="row-label">Health</span>
              <span class="row-value">{{ preview.health }}</span>
            </div>
            <div class="breakdown-row" :class="{ 'row-dim': map.damageProfile.physical === 0 }">
              <span class="row-label">
                Phys. mitigation
                <span class="row-detail">Defense {{ preview.defense }}</span>
              </span>
              <span class="row-value" :class="resistClass(preview.physMitigation)">{{ preview.physMitigation }}%</span>
            </div>
            <div class="breakdown-row" :class="{ 'row-dim': map.damageProfile.fire === 0 }">
              <span class="row-label">Fire resistance</span>
              <span class="row-value" :class="resistClass(preview.fireResistance)">{{ preview.fireResistance }}%</span>
            </div>
            <div class="breakdown-row" :class="{ 'row-dim': map.damageProfile.cold === 0 }">
              <span class="row-label">Cold resistance</span>
              <span class="row-value" :class="resistClass(preview.iceResistance)">{{ preview.iceResistance }}%</span>
            </div>
            <div class="breakdown-row" :class="{ 'row-dim': map.damageProfile.lightning === 0 }">
              <span class="row-label">Lightning resist.</span>
              <span class="row-value" :class="resistClass(preview.lightningResistance)">{{ preview.lightningResistance }}%</span>
            </div>
            <div class="breakdown-row" :class="{ 'row-dim': map.damageProfile.chaos === 0 }">
              <span class="row-label">Chaos resistance</span>
              <span class="row-value" :class="resistClass(preview.chaosResistance)">{{ preview.chaosResistance }}%</span>
            </div>
            <div class="breakdown-row row-sep">
              <span class="row-label">Effective HP</span>
              <span class="row-value">{{ preview.ehp }}</span>
            </div>
            <div class="breakdown-row">
              <span class="row-label">Enemy damage</span>
              <span class="row-value">{{ preview.totalRawDamage }}</span>
            </div>
          </div>
          <div class="breakdown-total">
            <span class="row-label">Survival</span>
            <span
              class="row-value"
              :class="preview.survivalPct >= 100 ? 'col-positive' : preview.survivalPct < 30 ? 'col-negative' : ''"
            >
              {{ preview.survivalPct >= 100 ? '100%' : preview.survivalPct + '%' }}
            </span>
          </div>
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
        <button class="primary" :disabled="!selectedId" @click="onSend">Send</button>
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

const preview = computed(() => {
  const char = selectedCharacter.value
  if (!char) return null

  const stats = calculateStats(char)
  const equippedSkills = charactersStore.getEquippedSkills(char.id)
  const combat = simulateCombat(props.map, stats, char.baseStats, equippedSkills)

  return {
    movementSpeed: Math.round(stats.movementSpeed),
    speedFactor: combat.speedFactor,
    speedPct: Math.round((combat.speedFactor - 1) * 100),
    totalDps: Math.round(combat.totalDamageDealt / props.map.durationSeconds),
    clearSpeedMultiplier: combat.clearSpeedMultiplier,
    clearSpeedPct: Math.round((combat.clearSpeedMultiplier - 1) * 100),
    effectiveDuration: Math.round(combat.durationMs / 100) / 10,
    health: combat.health,
    defense: combat.defense,
    physMitigation: combat.physMitigation,
    fireResistance: combat.fireResistance,
    iceResistance: combat.iceResistance,
    lightningResistance: combat.lightningResistance,
    chaosResistance: combat.chaosResistance,
    ehp: combat.ehp,
    totalRawDamage: Math.round(combat.totalDamageTaken),
    survivalPct: Math.round(Math.min(1, combat.survivalRatio) * 100),
  }
})

function formatMultiplier(factor: number): string {
  return `×${factor.toFixed(2)}`
}

function formatDelta(pct: number): string {
  return `(${pct > 0 ? '+' : ''}${pct}%)`
}

function resistClass(value: number): string {
  if (value >= 75) return 'col-capped'
  if (value >= 40) return 'col-positive'
  if (value < 0) return 'col-negative'
  return ''
}

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

/* Breakdown layout */

.breakdown-sections {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.breakdown-section {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.section-title {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-dim);
  padding: 5px var(--spacing-md);
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
}

.breakdown-rows {
  display: flex;
  flex-direction: column;
}

.breakdown-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 3px var(--spacing-md);
  font-size: 12px;
  gap: var(--spacing-md);
}

.breakdown-row.row-sep {
  margin-top: 4px;
  padding-top: 6px;
  border-top: 1px solid var(--color-border);
}

.breakdown-row.row-dim {
  opacity: 0.35;
}

.row-label {
  color: var(--color-text-dim);
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-shrink: 0;
}

.row-detail {
  font-size: 10px;
  color: var(--color-text-dim);
  opacity: 0.7;
}

.row-value {
  color: var(--color-text-primary);
  font-weight: 500;
  white-space: nowrap;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.row-delta {
  font-size: 10px;
  font-weight: 400;
  opacity: 0.8;
}

.breakdown-total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 5px var(--spacing-md);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-card);
  font-size: 13px;
  font-weight: 600;
}

.breakdown-total .row-label {
  color: var(--color-text-primary);
}

/* Color classes */
.col-positive {
  color: var(--color-life);
}

.col-negative {
  color: var(--color-fire);
}

.col-capped {
  color: var(--color-lightning);
}

/* Auto-rerun toggle */

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
