<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-box">

      <!-- Gem info -->
      <div class="gem-info-pane">
        <div class="gem-info-header">
          <span class="gem-info-name">{{ skillDef?.name ?? gem.skillId }}</span>
          <span class="gem-type-badge" :class="skillDef?.type">
            {{ skillDef?.type === 'passive' ? 'Aura / Passive' : 'Active Skill' }}
          </span>
          <span class="gem-tier-badge">Tier {{ skillDef?.tier }}</span>
        </div>
        <div v-if="skillDef" class="gem-info-stats">
          <span v-if="skillDef.type === 'active'" class="stat-chip mana">
            {{ skillDef.manaCost }} mana
          </span>
          <span v-if="skillDef.type === 'active'" class="stat-chip cd">
            {{ skillDef.cooldown }}s CD
          </span>
          <span v-if="skillDef.type === 'passive'" class="stat-chip reserve">
            {{ skillDef.manaReservation }}% reserved
          </span>
          <span class="stat-chip scaling">
            Scales with {{ scalingLabel }}
          </span>
        </div>
        <div v-if="skillDef?.description" class="gem-info-description">
          {{ skillDef.description }}
        </div>
      </div>

      <hr class="modal-divider" />

      <p class="modal-sub">Equip to which character?</p>

      <!-- Character list -->
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
        </div>
        <p v-if="eligibleChars.length === 0" class="no-chars">
          No characters meet the level requirement ({{ skillDef?.levelRequirement ?? 1 }}).
        </p>
      </div>

      <!-- Slot picker (shown when a character is selected) -->
      <div v-if="selectedCharId" class="slot-picker">
        <div class="section-label">Select slot</div>
        <div class="slot-btns">
          <button
            v-for="slot in availableSlots"
            :key="slot"
            class="slot-btn"
            :class="{ active: selectedSlot === slot }"
            @click="selectedSlot = slot"
          >
            {{ slotLabels[slot] }}
            <span v-if="getSlotGemName(slot)" class="displaced-hint">
              ↪ {{ getSlotGemName(slot) }}
            </span>
          </button>
        </div>
      </div>

      <!-- Stat preview (shown when a character and slot are selected) -->
      <div v-if="selectedCharId && selectedSlot" class="stat-preview">
        <div class="section-label">Stat Changes</div>
        <div class="stat-preview-rows">
          <div class="stat-preview-row">
            <span class="stat-preview-label">Overall DPS</span>
            <span class="stat-preview-values">
              <span class="stat-val">{{ fmtNum(currentDPS) }}</span>
              <span class="stat-arrow">→</span>
              <span class="stat-val">{{ fmtNum(newDPS) }}</span>
              <span class="stat-delta" :class="deltaCls(newDPS - currentDPS)">
                {{ fmtDelta(newDPS - currentDPS) }}
              </span>
            </span>
          </div>
          <div class="stat-preview-row">
            <span class="stat-preview-label">Survivability</span>
            <span class="stat-preview-values">
              <span class="stat-val">{{ fmtNum(currentSurv) }}</span>
              <span class="stat-arrow">→</span>
              <span class="stat-val">{{ fmtNum(newSurv) }}</span>
              <span class="stat-delta" :class="deltaCls(newSurv - currentSurv)">
                {{ fmtDelta(newSurv - currentSurv) }}
              </span>
            </span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="modal-actions">
        <button @click="emit('close')">Cancel</button>
        <button class="disassemble-btn" @click="onDisassemble">
          Disassemble
          <span class="yield-hint">→ 1 Annulment Shard</span>
        </button>
        <button class="primary" :disabled="!canEquip" @click="onEquip">
          Equip
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { SkillGem, SkillSlot } from '@/types'
import { useCharactersStore } from '@/stores/characters'
import { useSkillsStore } from '@/stores/skills'
import { getSkillDefinition } from '@/data/skillDefinitions'
import { calculateStats } from '@/engine/statCalculator'
import { computeTotalDPS } from '@/engine/offensiveCombat'
import { computeAverageSurvivability } from '@/engine/combatSimulator'

const props = defineProps<{ gem: SkillGem }>()
const emit = defineEmits<{ close: [] }>()

const charactersStore = useCharactersStore()
const skillsStore = useSkillsStore()

const skillDef = computed(() => getSkillDefinition(props.gem.skillId))

const scalingLabel = computed(() => {
  const attr = skillDef.value?.scaling.attribute
  if (!attr) return ''
  return attr.charAt(0).toUpperCase() + attr.slice(1)
})

const selectedCharId = ref<string | null>(charactersStore.selectedCharacterId)
const selectedSlot = ref<SkillSlot | null>(null)

const selectedChar = computed(() =>
  charactersStore.characters.find((c) => c.id === selectedCharId.value) ?? null
)

const eligibleChars = computed(() =>
  charactersStore.characters.filter(
    (c) => c.level >= (skillDef.value?.levelRequirement ?? 1)
  )
)

const activeSlots: SkillSlot[] = ['active1', 'active2', 'active3']
const passiveSlots: SkillSlot[] = ['passive1', 'passive2']

const availableSlots = computed<SkillSlot[]>(() =>
  skillDef.value?.type === 'passive' ? passiveSlots : activeSlots
)

const slotLabels: Record<SkillSlot, string> = {
  active1: 'Active 1',
  active2: 'Active 2',
  active3: 'Active 3',
  passive1: 'Passive 1',
  passive2: 'Passive 2',
}

function getSlotGemName(slot: SkillSlot): string | null {
  const char = selectedChar.value
  if (!char) return null
  const gemId = char.skills[slot]
  if (!gemId) return null
  const gem = skillsStore.getSkillGem(gemId)
  if (!gem) return null
  return getSkillDefinition(gem.skillId)?.name ?? null
}

// Skills the character would have after equipping this gem into the selected slot
const newSkillsList = computed(() => {
  const char = selectedChar.value
  if (!char || !skillDef.value || !selectedSlot.value) return null
  const currentSkills = charactersStore.getEquippedSkills(char.id)
  const slotGemId = char.skills[selectedSlot.value]
  const displaced = slotGemId
    ? (() => {
        const g = skillsStore.getSkillGem(slotGemId)
        return g ? getSkillDefinition(g.skillId) ?? null : null
      })()
    : null
  const without = displaced ? currentSkills.filter((sk) => sk.id !== displaced.id) : currentSkills
  return [...without, skillDef.value]
})

const currentDPS = computed(() => {
  const char = selectedChar.value
  if (!char) return 0
  const s = calculateStats(char)
  const skills = charactersStore.getEquippedSkills(char.id)
  return computeTotalDPS(skills, char.baseStats, s)
})

const newDPS = computed(() => {
  const char = selectedChar.value
  if (!char || !newSkillsList.value) return currentDPS.value
  return computeTotalDPS(newSkillsList.value, char.baseStats, calculateStats(char))
})

const currentSurv = computed(() => {
  const char = selectedChar.value
  if (!char) return 0
  return computeAverageSurvivability(calculateStats(char), charactersStore.getEquippedSkills(char.id)).ehp
})

const newSurv = computed(() => {
  const char = selectedChar.value
  if (!char || !newSkillsList.value) return currentSurv.value
  return computeAverageSurvivability(calculateStats(char), newSkillsList.value).ehp
})

function fmtNum(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

function fmtDelta(d: number): string {
  if (d === 0) return ''
  return (d > 0 ? '+' : '') + fmtNum(d)
}

function deltaCls(d: number): string {
  if (d > 0) return 'delta-pos'
  if (d < 0) return 'delta-neg'
  return ''
}

const canEquip = computed(() => selectedCharId.value !== null && selectedSlot.value !== null)

function onEquip() {
  if (!selectedCharId.value || !selectedSlot.value) return
  charactersStore.equipSkill(selectedCharId.value, selectedSlot.value, props.gem.id)
  emit('close')
}

function onDisassemble() {
  skillsStore.disassembleGem(props.gem.id)
  emit('close')
}
</script>

<style scoped>
/* Gem info pane */
.gem-info-pane {
  margin-bottom: var(--spacing-md);
}

.gem-info-header {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
  flex-wrap: wrap;
}

.gem-info-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  flex: 1;
}

.gem-type-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 3px;
  background: var(--color-bg-dark);
}

.gem-type-badge.active  { color: #e67e22; border: 1px solid #5a3a1a; }
.gem-type-badge.passive { color: #9b59b6; border: 1px solid #3a1a5a; }

.gem-tier-badge {
  font-size: 11px;
  color: var(--color-text-dim);
  background: var(--color-bg-dark);
  border: 1px solid var(--color-border);
  padding: 2px 8px;
  border-radius: 3px;
}

.gem-info-stats {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  margin-bottom: var(--spacing-xs);
}

.stat-chip {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 3px;
  background: var(--color-bg-dark);
}

.stat-chip.mana    { color: #4a90e2; }
.stat-chip.cd      { color: #e67e22; }
.stat-chip.reserve { color: #9b59b6; }
.stat-chip.scaling { color: var(--color-text-dim); font-style: italic; }

.gem-info-description {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.modal-divider {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: var(--spacing-md) 0;
}

.modal-sub {
  font-size: 13px;
  color: var(--color-text-dim);
  margin-bottom: var(--spacing-sm);
}

/* Char list */
.char-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
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

.no-chars {
  color: var(--color-text-dim);
  font-size: 13px;
  text-align: center;
  padding: var(--spacing-md);
}

/* Slot picker */
.slot-picker {
  margin-bottom: var(--spacing-lg);
}

.section-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-dim);
  margin-bottom: var(--spacing-xs);
}

.slot-btns {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.slot-btn {
  flex: 1;
  min-width: 100px;
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

.slot-btn:hover {
  border-color: var(--color-border-light);
  background: var(--color-bg-card-hover);
}

.slot-btn.active {
  border-color: var(--color-text-primary);
  color: var(--color-text-primary);
  background: var(--color-bg-card);
}

.displaced-hint {
  font-size: 10px;
  color: var(--color-text-dim);
  font-style: italic;
}

/* Stat preview */
.stat-preview {
  margin-bottom: var(--spacing-md);
}

.stat-preview-rows {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-preview-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  margin-top: 4px;
}

.stat-preview-label {
  color: var(--color-text-secondary);
}

.stat-preview-values {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-val {
  color: var(--color-text-primary);
  font-weight: 500;
  min-width: 36px;
  text-align: right;
}

.stat-arrow {
  color: var(--color-text-dim);
  font-size: 11px;
}

.stat-delta {
  font-size: 12px;
  min-width: 40px;
  text-align: right;
}

.delta-pos { color: #6cbf6c; }
.delta-neg { color: #c06060; }

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
