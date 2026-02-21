<template>
  <div class="skill-slot" :class="{ empty: !gemId }">
    <div v-if="gemId && skillDef" class="skill-content">
      <div class="skill-name">{{ skillDef.name }}</div>
      <div class="skill-info">
        <span v-if="skillDef.type === 'active'" class="skill-cost">{{ skillDef.manaCost }} mana</span>
        <span v-if="skillDef.type === 'active'" class="skill-cd">{{ skillDef.cooldown }}s CD</span>
        <span v-if="skillDef.type === 'passive'" class="skill-reserve">{{ skillDef.manaReservation }}% reserved</span>
      </div>
      <button class="unequip-btn" @click.stop="emit('unequip')" title="Unequip skill">✕</button>
    </div>
    <div v-else class="empty-slot" @click="emit('equip')">
      <span class="slot-label">{{ slotLabel }}</span>
      <span class="hint">Click to equip</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SkillSlot } from '@/types'
import { useSkillsStore } from '@/stores/skills'
import { getSkillDefinition } from '@/data/skillDefinitions'

const props = defineProps<{
  slot: SkillSlot
  gemId?: string
}>()

const emit = defineEmits<{
  equip: []
  unequip: []
}>()

const skillsStore = useSkillsStore()

const skillDef = computed(() => {
  if (!props.gemId) return null
  const gem = skillsStore.getSkillGem(props.gemId)
  if (!gem) return null
  return getSkillDefinition(gem.skillId)
})

const slotLabel = computed(() => {
  const type = props.slot.startsWith('active') ? 'Active' : 'Passive'
  const num = props.slot.replace(/\D/g, '')
  return `${type} ${num}`
})
</script>

<style scoped>
.skill-slot {
  width: 120px;
  height: 80px;
  border: 2px solid #444;
  border-radius: 8px;
  background: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: border-color 0.2s;
}

.skill-slot.empty {
  border-style: dashed;
  cursor: pointer;
}

.skill-slot.empty:hover {
  border-color: #666;
  background: #222;
}

.skill-content {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  height: 100%;
}

.skill-name {
  font-size: 13px;
  font-weight: bold;
  color: #fff;
}

.skill-info {
  font-size: 11px;
  color: #888;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.skill-cost {
  color: #4a90e2;
}

.skill-cd {
  color: #e67e22;
}

.skill-reserve {
  color: #9b59b6;
}

.empty-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #555;
  font-size: 11px;
  width: 100%;
  height: 100%;
}

.slot-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.hint {
  font-size: 10px;
  color: #666;
}

.unequip-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  border: none;
  background: #444;
  color: #aaa;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.unequip-btn:hover {
  background: #e74c3c;
  color: #fff;
}
</style>
