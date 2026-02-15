<template>
  <div class="char-stats">
    <section class="stat-section">
      <h4>Attributes</h4>
      <div class="stat-row">
        <span class="stat-name str">Strength</span>
        <span class="stat-value">{{ character.baseStats.strength }}</span>
      </div>
      <div class="stat-row">
        <span class="stat-name dex">Dexterity</span>
        <span class="stat-value">{{ character.baseStats.dexterity }}</span>
      </div>
      <div class="stat-row">
        <span class="stat-name int">Intelligence</span>
        <span class="stat-value">{{ character.baseStats.intelligence }}</span>
      </div>
    </section>

    <section class="stat-section" v-if="stats">
      <h4>Offense</h4>
      <div class="stat-row">
        <span class="stat-name">Attack Damage</span>
        <span class="stat-value">{{ stats.attackDamage }}</span>
      </div>
      <div class="stat-row">
        <span class="stat-name">Attack Speed</span>
        <span class="stat-value">{{ stats.attackSpeed.toFixed(2) }}/s</span>
      </div>
      <div class="stat-row">
        <span class="stat-name">Movement Speed</span>
        <span class="stat-value">{{ stats.movementSpeed }}%</span>
      </div>
    </section>

    <section class="stat-section" v-if="stats">
      <h4>Defense</h4>
      <div class="stat-row">
        <span class="stat-name">Armour</span>
        <span class="stat-value">{{ stats.defense }}</span>
      </div>
      <div class="stat-row">
        <span class="stat-name">Life</span>
        <span class="stat-value">{{ stats.health }}</span>
      </div>
      <div class="stat-row">
        <span class="stat-name">Mana</span>
        <span class="stat-value">{{ stats.mana }}</span>
      </div>
    </section>

    <section class="stat-section" v-if="stats">
      <h4>Resistances</h4>
      <div class="stat-row">
        <span class="stat-name fire">Fire</span>
        <span class="stat-value" :class="resClass(stats.fireResistance)">
          {{ stats.fireResistance }}%
        </span>
      </div>
      <div class="stat-row">
        <span class="stat-name ice">Cold</span>
        <span class="stat-value" :class="resClass(stats.iceResistance)">
          {{ stats.iceResistance }}%
        </span>
      </div>
      <div class="stat-row">
        <span class="stat-name lightning">Lightning</span>
        <span class="stat-value" :class="resClass(stats.lightningResistance)">
          {{ stats.lightningResistance }}%
        </span>
      </div>
      <div class="stat-row">
        <span class="stat-name chaos">Chaos</span>
        <span class="stat-value" :class="resClass(stats.chaosResistance)">
          {{ stats.chaosResistance }}%
        </span>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Character } from '@/types'
import { useCharactersStore } from '@/stores'

const props = defineProps<{ character: Character }>()
const charactersStore = useCharactersStore()
const stats = computed(() => charactersStore.getComputedStats(props.character.id))

function resClass(val: number): string {
  if (val >= 75) return 'res-capped'
  if (val >= 40) return 'res-good'
  if (val < 0)   return 'res-negative'
  return ''
}
</script>

<style scoped>
.char-stats {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.stat-section {
  background: var(--color-bg-dark);
  border-radius: var(--radius-sm);
  padding: var(--spacing-sm);
}

.stat-section h4 {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-dim);
  margin-bottom: var(--spacing-xs);
  padding-bottom: var(--spacing-xs);
  border-bottom: 1px solid var(--color-border);
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
}

.stat-name { font-size: 12px; color: var(--color-text-secondary); }
.stat-value { font-size: 12px; color: var(--color-text-primary); font-weight: 600; }

.str        { color: #c86050; }
.dex        { color: #60c870; }
.int        { color: #6090e0; }
.fire       { color: var(--color-fire); }
.ice        { color: var(--color-ice); }
.lightning  { color: var(--color-lightning); }
.chaos      { color: var(--color-chaos); }

.res-capped   { color: var(--color-rarity-rare); }
.res-good     { color: var(--color-text-primary); }
.res-negative { color: var(--color-danger); }
</style>
