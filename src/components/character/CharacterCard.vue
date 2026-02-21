<template>
  <div
    class="char-card"
    :class="{ selected: isSelected, busy: activeRun !== null }"
    @click="onSelect"
  >
    <div class="char-header">
      <div class="char-title">
        <span class="char-name">{{ character.name }}</span>
        <span class="char-level">Lv. {{ character.level }}</span>
      </div>
      <span v-if="activeRun" class="status-running">Running…</span>
    </div>

    <div class="xp-bar" :title="`${character.experience} / ${character.experienceToNextLevel} XP`">
      <div class="xp-fill" :style="{ width: `${xpPercent}%` }" />
    </div>
    <div class="xp-label">{{ character.experience }} / {{ character.experienceToNextLevel }} XP</div>

    <template v-if="isSelected">
      <hr class="divider" />
      <CharacterStats :character="character" />
      <hr class="divider" />
      <EquipmentSlots :character="character" />
      <hr class="divider" />
      <SkillPanel
        :equippedSkills="character.skills"
        @equipSkill="onEquipSkill"
        @unequipSkill="onUnequipSkill"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Character, SkillSlot } from '@/types'
import { useCharactersStore, useMapRunsStore } from '@/stores'
import CharacterStats from './CharacterStats.vue'
import EquipmentSlots from './EquipmentSlots.vue'
import SkillPanel from '../skills/SkillPanel.vue'

const props = defineProps<{ character: Character }>()

const charactersStore = useCharactersStore()
const mapRunsStore = useMapRunsStore()

const isSelected = computed(() => charactersStore.selectedCharacterId === props.character.id)
const activeRun = computed(() => mapRunsStore.getActiveRunForCharacter(props.character.id))
const xpPercent = computed(() =>
  Math.round((props.character.experience / props.character.experienceToNextLevel) * 100)
)

function onSelect() {
  charactersStore.selectCharacter(props.character.id)
}

function onEquipSkill(slot: SkillSlot, gemId: string) {
  charactersStore.equipSkill(props.character.id, slot, gemId)
}

function onUnequipSkill(slot: SkillSlot) {
  charactersStore.unequipSkill(props.character.id, slot)
}
</script>

<style scoped>
.char-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: border-color 0.15s;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.char-card:hover {
  border-color: var(--color-border-light);
}

.char-card.selected {
  border-color: var(--color-text-primary);
}

.char-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.char-title {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
}

.char-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.char-level {
  font-size: 12px;
  color: var(--color-text-dim);
}

.status-running {
  font-size: 12px;
  color: var(--color-lightning);
}

.xp-bar {
  height: 4px;
  background: var(--color-progress-bg);
  border-radius: 2px;
  overflow: hidden;
}

.xp-fill {
  height: 100%;
  background: #5a6e2a;
  border-radius: 2px;
  transition: width 0.5s ease;
}

.xp-label {
  font-size: 10px;
  color: var(--color-text-dim);
  text-align: right;
}

.divider {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: var(--spacing-xs) 0;
}
</style>
