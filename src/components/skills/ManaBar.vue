<template>
  <div class="mana-bar">
    <div class="mana-segments">
      <div
        class="mana-available"
        :style="{ width: availablePercent + '%' }"
        :title="`${currentMana}/${maxMana} available mana`"
      />
      <div
        class="mana-reserved"
        :style="{ width: reservedPercent + '%' }"
        :title="`${reservedMana} reserved by auras`"
      />
    </div>
    <div class="mana-text">
      {{ Math.round(currentMana) }}/{{ maxMana }} mana
      <span v-if="reservedMana > 0" class="reserved-text">({{ reservedMana }} reserved)</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  currentMana: number
  maxMana: number
  reservedMana: number
}>()

const availablePercent = computed(() => {
  if (props.maxMana === 0) return 0
  return (props.currentMana / props.maxMana) * 100
})

const reservedPercent = computed(() => {
  if (props.maxMana === 0) return 0
  return (props.reservedMana / props.maxMana) * 100
})
</script>

<style scoped>
.mana-bar {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mana-segments {
  display: flex;
  height: 8px;
  background: #333;
  border-radius: 4px;
  overflow: hidden;
}

.mana-available {
  background: linear-gradient(90deg, #4a90e2, #357abd);
  transition: width 0.3s ease;
}

.mana-reserved {
  background: linear-gradient(90deg, #9b59b6, #8e44ad);
  transition: width 0.3s ease;
}

.mana-text {
  font-size: 12px;
  color: #ccc;
}

.reserved-text {
  color: #9b59b6;
  margin-left: 4px;
}
</style>
