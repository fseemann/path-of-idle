<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Select Skill Gem for {{ slotLabel }}</h3>
        <button class="close-btn" @click="emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <div v-if="availableGems.length === 0" class="empty">
          <p>No compatible skill gems available.</p>
          <p class="hint">Run maps to find {{ slotType }} skill gems!</p>
        </div>

        <div v-else class="gem-grid">
          <div
            v-for="gem in availableGems"
            :key="gem.id"
            class="gem-option"
            @click="selectGem(gem.skillId)"
          >
            <div class="gem-header">
              <span class="gem-name">{{ getSkillDef(gem.skillId)?.name }}</span>
              <span class="gem-tier">T{{ getSkillDef(gem.skillId)?.tier }}</span>
            </div>

            <div class="gem-stats">
              <span v-if="isActive(gem.skillId)" class="stat mana">
                {{ getSkillDef(gem.skillId)?.manaCost }} mana
              </span>
              <span v-if="isActive(gem.skillId)" class="stat cd">
                {{ getSkillDef(gem.skillId)?.cooldown }}s CD
              </span>
              <span v-if="isPassive(gem.skillId)" class="stat reserve">
                {{ getSkillDef(gem.skillId)?.manaReservation }}% reserved
              </span>
            </div>

            <div class="gem-description">
              {{ getSkillDef(gem.skillId)?.description }}
            </div>

            <div class="gem-scaling">
              Scales with {{ getScalingLabel(gem.skillId) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SkillSlot as SkillSlotType, SkillGem } from '@/types'
import { useSkillsStore } from '@/stores/skills'
import { getSkillDefinition } from '@/data/skillDefinitions'

const props = defineProps<{
  slot: SkillSlotType
  currentSkillId?: string
}>()

const emit = defineEmits<{
  close: []
  select: [skillId: string]
}>()

const skillsStore = useSkillsStore()

const slotType = computed(() => {
  return props.slot.startsWith('active') ? 'active' : 'passive'
})

const slotLabel = computed(() => {
  const num = props.slot.replace(/\D/g, '')
  return slotType.value === 'active' ? `Active Slot ${num}` : `Passive Slot ${num}`
})

const availableGems = computed(() => {
  return skillsStore.skillGems.filter(gem => {
    const skillDef = getSkillDefinition(gem.skillId)
    if (!skillDef) return false
    // Filter by slot type (active/passive)
    return skillDef.type === slotType.value
  })
})

function getSkillDef(skillId: string) {
  return getSkillDefinition(skillId)
}

function isActive(skillId: string) {
  return getSkillDefinition(skillId)?.type === 'active'
}

function isPassive(skillId: string) {
  return getSkillDefinition(skillId)?.type === 'passive'
}

function getScalingLabel(skillId: string) {
  const skill = getSkillDefinition(skillId)
  if (!skill) return ''
  const attr = skill.scaling.attribute
  return attr.charAt(0).toUpperCase() + attr.slice(1)
}

function selectGem(skillId: string) {
  emit('select', skillId)
  emit('close')
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 8px;
  width: 100%;
  max-width: 700px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #333;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  color: #fff;
}

.close-btn {
  background: none;
  border: none;
  color: #888;
  font-size: 20px;
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #fff;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
}

.empty {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.empty p {
  margin: 8px 0;
}

.hint {
  font-size: 13px;
  color: #888;
}

.gem-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.gem-option {
  background: #252525;
  border: 2px solid #333;
  border-radius: 6px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.gem-option:hover {
  border-color: #555;
  background: #2a2a2a;
  transform: translateY(-2px);
}

.gem-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}

.gem-name {
  font-weight: bold;
  font-size: 14px;
  color: #fff;
}

.gem-tier {
  font-size: 11px;
  color: #888;
  background: #333;
  padding: 2px 6px;
  border-radius: 3px;
}

.gem-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 12px;
}

.stat {
  display: flex;
  align-items: center;
}

.stat.mana {
  color: #4a90e2;
}

.stat.cd {
  color: #e67e22;
}

.stat.reserve {
  color: #9b59b6;
}

.gem-description {
  font-size: 12px;
  color: #aaa;
  line-height: 1.4;
  margin-bottom: 8px;
}

.gem-scaling {
  font-size: 11px;
  color: #666;
  font-style: italic;
}
</style>
