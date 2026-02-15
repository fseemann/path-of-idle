<template>
  <div class="map-card" :class="{ locked: !canRun }">
    <div class="map-header">
      <div class="map-title-row">
        <span class="map-name">{{ map.name }}</span>
        <span class="map-tier" :class="`tier-${map.tier}`">T{{ map.tier }}</span>
        <span v-if="activeRun?.autoRerun" class="auto-badge">Auto</span>
      </div>
      <p class="map-desc">{{ map.description }}</p>
    </div>

    <div class="map-meta">
      <span>Lv. {{ map.levelRequirement }}+</span>
      <span>{{ formatDuration(map.durationSeconds) }}</span>
      <span>×{{ map.lootMultiplier.toFixed(1) }} loot</span>
    </div>

    <RunProgressBar v-if="activeRun" :run-id="activeRun.id" />

    <div class="map-actions">
      <!-- Auto-rerun: show only a Stop button, loot is collected silently -->
      <template v-if="activeRun?.autoRerun">
        <button @click="onStop">Stop</button>
      </template>

      <!-- Normal run completed, waiting for loot collection -->
      <template v-else-if="activeRun?.completedAt !== null && activeRun">
        <button class="primary" @click="onAcknowledge">Collect Loot</button>
      </template>

      <!-- Idle or running without auto -->
      <template v-else>
        <button
          class="primary"
          :disabled="!canRun || !!activeRun"
          @click="emit('dispatch', map)"
        >
          {{ activeRun ? 'Running…' : 'Send Hero' }}
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GameMap } from '@/types'
import { useCharactersStore, useMapRunsStore } from '@/stores'
import RunProgressBar from './RunProgressBar.vue'

const props = defineProps<{ map: GameMap }>()
const emit = defineEmits<{ dispatch: [map: GameMap] }>()

const charactersStore = useCharactersStore()
const mapRunsStore = useMapRunsStore()

const canRun = computed(() =>
  charactersStore.characters.some((c) => c.level >= props.map.levelRequirement)
)

const activeRun = computed(() => {
  return (
    mapRunsStore.activeRuns.find((r) => r.mapId === props.map.id) ??
    mapRunsStore.pendingLoot.find((r) => r.mapId === props.map.id) ??
    null
  )
})

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  if (m > 0 && s > 0) return `${m}m ${s}s`
  if (m > 0) return `${m}m`
  return `${s}s`
}

function onAcknowledge() {
  if (activeRun.value) mapRunsStore.acknowledgeLoot(activeRun.value.id)
}

function onStop() {
  if (activeRun.value) mapRunsStore.stopRun(activeRun.value.characterId)
}
</script>

<style scoped>
.map-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  transition: border-color 0.15s;
}

.map-card:not(.locked):hover {
  border-color: var(--color-border-light);
}

.map-card.locked {
  opacity: 0.5;
}

.map-title-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.map-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.map-tier {
  font-size: 11px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: var(--radius-sm);
  border: 1px solid;
}

.tier-1 { color: #aaa; border-color: #555; }
.tier-2 { color: #68c; border-color: #468; }
.tier-3 { color: #8c8; border-color: #585; }
.tier-4 { color: var(--color-rarity-magic); border-color: var(--color-rarity-magic); }
.tier-5 { color: var(--color-rarity-rare); border-color: var(--color-rarity-rare); }

.auto-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  background: #2a3a1a;
  border: 1px solid #4a7a2a;
  color: #8fc060;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.map-desc {
  font-size: 12px;
  color: var(--color-text-dim);
  margin-top: 2px;
}

.map-meta {
  display: flex;
  gap: var(--spacing-md);
  font-size: 12px;
  color: var(--color-text-secondary);
}

.map-actions {
  display: flex;
  gap: var(--spacing-sm);
}
</style>
