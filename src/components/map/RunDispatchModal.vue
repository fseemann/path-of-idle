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

const props = defineProps<{ map: GameMap }>()
const emit = defineEmits<{ close: [] }>()

const charactersStore = useCharactersStore()
const mapRunsStore = useMapRunsStore()

const selectedId = ref<string | null>(
  charactersStore.selectedCharacterId
)

const eligibleCharacters = computed(() =>
  charactersStore.characters.filter((c) => c.level >= props.map.levelRequirement)
)

function isBusy(characterId: string): boolean {
  return mapRunsStore.getActiveRunForCharacter(characterId) !== null
}

function onSend() {
  if (!selectedId.value) return
  mapRunsStore.startRun(props.map.id, selectedId.value)
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
  margin-bottom: var(--spacing-lg);
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

.modal-actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
}
</style>
