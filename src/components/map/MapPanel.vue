<template>
  <div class="map-panel">
    <div class="panel-header">
      <h2>Maps</h2>
      <span class="panel-sub">Select a map and send a character to run it.</span>
    </div>

    <div class="map-grid">
      <MapCard
        v-for="map in GAME_MAPS"
        :key="map.id"
        :map="map"
        @dispatch="openDispatch"
      />
    </div>

    <RunDispatchModal
      v-if="dispatchTarget"
      :map="dispatchTarget"
      @close="dispatchTarget = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { GameMap } from '@/types'
import { GAME_MAPS } from '@/data/maps'
import MapCard from './MapCard.vue'
import RunDispatchModal from './RunDispatchModal.vue'

const dispatchTarget = ref<GameMap | null>(null)

function openDispatch(map: GameMap) {
  dispatchTarget.value = map
}
</script>

<style scoped>
.map-panel {
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

.map-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--spacing-md);
}
</style>
