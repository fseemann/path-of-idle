<template>
  <div class="skill-panel">
    <h3>Skills</h3>

    <section class="skill-slots">
      <h4>Active Skills ({{ activeSlots.filter(s => equippedSkills[s]).length }}/3)</h4>
      <div class="slots">
        <SkillSlot
          v-for="slot in activeSlots"
          :key="slot"
          :slot="slot"
          :gemId="equippedSkills[slot]"
          @equip="openPicker(slot)"
          @unequip="onUnequip(slot)"
        />
      </div>
    </section>

    <section class="skill-slots">
      <h4>Passive Skills / Auras ({{ passiveSlots.filter(s => equippedSkills[s]).length }}/2)</h4>
      <div class="slots">
        <SkillSlot
          v-for="slot in passiveSlots"
          :key="slot"
          :slot="slot"
          :gemId="equippedSkills[slot]"
          @equip="openPicker(slot)"
          @unequip="onUnequip(slot)"
        />
      </div>
    </section>

    <SkillGemPicker
      v-if="pickerSlot"
      :slot="pickerSlot"
      :currentGemId="equippedSkills[pickerSlot]"
      @select="(gemId) => onEquip(pickerSlot!, gemId)"
      @close="pickerSlot = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { SkillSlot as SkillSlotType } from '@/types'
import SkillSlot from './SkillSlot.vue'
import SkillGemPicker from './SkillGemPicker.vue'

const props = defineProps<{
  equippedSkills: Partial<Record<SkillSlotType, string>>
}>()

const emit = defineEmits<{
  equipSkill: [slot: SkillSlotType, gemId: string]
  unequipSkill: [slot: SkillSlotType]
}>()

const activeSlots: SkillSlotType[] = ['active1', 'active2', 'active3']
const passiveSlots: SkillSlotType[] = ['passive1', 'passive2']

const pickerSlot = ref<SkillSlotType | null>(null)

function openPicker(slot: SkillSlotType) {
  pickerSlot.value = slot
}

function onEquip(slot: SkillSlotType, gemId: string) {
  emit('equipSkill', slot, gemId)
  pickerSlot.value = null
}

function onUnequip(slot: SkillSlotType) {
  emit('unequipSkill', slot)
}
</script>

<style scoped>
.skill-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skill-slots {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slots {
  display: flex;
  gap: 8px;
}

h3 {
  margin: 0;
  font-size: 18px;
}

h4 {
  margin: 0;
  font-size: 14px;
  color: #888;
}
</style>
