<template>
  <div class="char-stats">
    <section class="stat-section">
      <h4>Attributes</h4>
      <StatRow label="Strength"     :value="String(character.baseStats.strength)"     color="str"       tip="Each point gives +5 Maximum Life and +1 Armour per 5 points." @tip="onTip" />
      <StatRow label="Dexterity"    :value="String(character.baseStats.dexterity)"    color="dex"       tip="Each point gives +0.002 Attack Speed and +0.2% Movement Speed." @tip="onTip" />
      <StatRow label="Intelligence" :value="String(character.baseStats.intelligence)" color="int"       tip="Each point gives +3 Maximum Mana." @tip="onTip" />
    </section>

    <template v-if="stats">
      <section class="stat-section">
        <h4>Offense</h4>
        <StatRow label="Overall DPS"   :value="fmtNum(dps)"                               tip="Total damage per second from all equipped active skills. Factors in base damage, attribute scaling, spell/attack damage bonuses, and crit. Zero if no active skills are equipped." @tip="onTip" />
        <StatRow label="Attack Damage" :value="String(stats.attackDamage)"               tip="Average physical damage per hit. Scaled by weapon base damage, Strength modifiers, and % increased modifiers." @tip="onTip" />
        <StatRow label="Attack Speed"  :value="stats.attackSpeed.toFixed(2) + '/s'"      tip="Attacks per second. Base 1.0 + 0.002 per Dexterity, further scaled by % increased Attack Speed modifiers." @tip="onTip" />
        <StatRow label="Move Speed"    :value="stats.movementSpeed + '%'"                 tip="Movement speed relative to base (100%). Each Dexterity point adds 0.2%. Increased by movement speed modifiers." @tip="onTip" />
      </section>

      <section class="stat-section">
        <h4>Defense</h4>
        <StatRow label="Survivability" :value="fmtNum(survivability)"                    tip="Average Effective HP across all damage types (physical, fire, cold, lightning, chaos) weighted equally. Higher is harder to kill." @tip="onTip" />
        <StatRow label="Armour"  :value="String(stats.defense)"  tip="Reduces incoming physical damage. Sum of equipment base defense plus 1 per 5 Strength, then scaled by % increased Armour modifiers." @tip="onTip" />
        <StatRow label="Life"    :value="String(stats.health)"   tip="Maximum life. Base 50 + 5 per Strength point. Increased by flat Maximum Life modifiers." @tip="onTip" />
        <StatRow label="Mana"    :value="String(stats.maxMana)"     tip="Maximum mana. Base 30 + 3 per Intelligence point. Increased by flat Maximum Mana modifiers." @tip="onTip" />
      </section>

      <section class="stat-section">
        <h4>Resistances</h4>
        <StatRow label="Fire"      :value="stats.fireResistance + '%'"        color="fire"      :valueClass="resClass(stats.fireResistance)"      tip="Reduces fire damage taken. Capped at 75%. Stack fire resistance modifiers on gear to reach the cap." @tip="onTip" />
        <StatRow label="Cold"      :value="stats.iceResistance + '%'"         color="ice"       :valueClass="resClass(stats.iceResistance)"       tip="Reduces cold damage taken. Capped at 75%." @tip="onTip" />
        <StatRow label="Lightning" :value="stats.lightningResistance + '%'"   color="lightning" :valueClass="resClass(stats.lightningResistance)"  tip="Reduces lightning damage taken. Capped at 75%." @tip="onTip" />
        <StatRow label="Chaos"     :value="stats.chaosResistance + '%'"       color="chaos"     :valueClass="resClass(stats.chaosResistance)"     tip="Reduces chaos damage taken. No cap — can be negative. Rare modifiers can raise this." @tip="onTip" />
      </section>
    </template>

    <!-- Floating tooltip -->
    <Teleport to="body">
      <div
        v-if="activeTip"
        class="stat-tooltip"
        :style="{ top: tipY + 'px', left: tipX + 'px' }"
      >
        {{ activeTip }}
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Character } from '@/types'
import { useCharactersStore } from '@/stores'
import { calculateStats } from '@/engine/statCalculator'
import { computeTotalDPS } from '@/engine/offensiveCombat'
import { computeAverageSurvivability } from '@/engine/combatSimulator'
import StatRow from './StatRow.vue'

const props = defineProps<{ character: Character }>()
const charactersStore = useCharactersStore()
const stats = computed(() => charactersStore.getComputedStats(props.character.id))

const equippedSkills = computed(() => charactersStore.getEquippedSkills(props.character.id))

const dps = computed(() => {
  const s = calculateStats(props.character)
  return computeTotalDPS(equippedSkills.value, props.character.baseStats, s)
})

const survivability = computed(() => {
  const s = calculateStats(props.character)
  return computeAverageSurvivability(s, equippedSkills.value)
})

function fmtNum(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

const activeTip = ref<string | null>(null)
const tipX = ref(0)
const tipY = ref(0)

function onTip(tip: string | null, event: MouseEvent | null) {
  activeTip.value = tip
  if (event) {
    tipX.value = event.clientX + 14
    tipY.value = event.clientY + 14
  }
}

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

.stat-tooltip {
  position: fixed;
  z-index: 300;
  pointer-events: none;
  background: #1a1410;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 12px;
  color: var(--color-text-secondary);
  max-width: 240px;
  line-height: 1.5;
}
</style>
