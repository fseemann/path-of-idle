<template>
  <div class="char-panel">
    <div class="panel-header">
      <h2>Characters</h2>
      <span class="panel-sub">Click a character to view stats and equipment. Click an equipped item to unequip it.</span>
    </div>
    <div class="char-list">
      <CharacterCard
        v-for="char in charactersStore.characters"
        :key="char.id"
        :character="char"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCharactersStore } from '@/stores'
import CharacterCard from './CharacterCard.vue'

const charactersStore = useCharactersStore()
</script>

<style scoped>
.char-panel {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
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
}

.char-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  max-width: 600px;
}
</style>
