<template>
  <div class="skill-slot" :class="{ empty: !gemId }">
    <div v-if="gemId && skillDef" class="skill-content">
      <div class="skill-name">{{ skillDef.name }}</div>
      <div class="skill-info">
        <span v-if="skillDef.type === 'active'" class="skill-cost">{{ skillDef.manaCost }} mana</span>
        <span v-if="skillDef.type === 'active'" class="skill-cd">{{ skillDef.cooldown }}s CD</span>
        <span v-if="skillDef.type === 'passive'" class="skill-reserve">{{ skillDef.manaReservation }}% reserved</span>
      </div>
      <div
        v-if="skillStatDisplay"
        class="skill-stat"
        :class="skillStatDisplay.type"
        @mouseenter="onTip(skillTooltip, $event)"
        @mousemove="onTip(skillTooltip, $event)"
        @mouseleave="onTip(null, null)"
      >{{ skillStatDisplay.label }}</div>
      <button class="unequip-btn" @click.stop="emit('unequip')" title="Unequip skill">✕</button>
    </div>
    <div v-else class="empty-slot" @click="emit('equip')">
      <span class="slot-label">{{ slotLabel }}</span>
      <span class="hint">Click to equip</span>
    </div>
  </div>

  <Teleport to="body">
    <div v-if="activeTip" class="skill-tooltip" :style="{ top: tipY + 'px', left: tipX + 'px' }">
      {{ activeTip }}
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { SkillSlot, Character, EquipmentItem } from '@/types'
import { useSkillsStore } from '@/stores/skills'
import { useCharactersStore } from '@/stores/characters'
import { getSkillDefinition } from '@/data/skillDefinitions'
import { calculateStats } from '@/engine/statCalculator'
import { calculateSkillDamage } from '@/engine/offensiveCombat'
import { initializeSkillState, applySkillBuffs } from '@/engine/skillExecutor'

const props = defineProps<{
  slot: SkillSlot
  gemId?: string
  characterId?: string
}>()

const emit = defineEmits<{
  equip: []
  unequip: []
}>()

const skillsStore = useSkillsStore()
const charactersStore = useCharactersStore()

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

const character = computed(() => (props.characterId ? charactersStore.getCharacter(props.characterId) : null))
const computedStats = computed(() => (character.value ? calculateStats(character.value) : null))
const allSkills = computed(() => (character.value ? charactersStore.getEquippedSkills(character.value.id) : []))
const boostedStats = computed(() => {
  if (!computedStats.value) return null
  const { activeBuffs } = initializeSkillState(allSkills.value)
  return applySkillBuffs(computedStats.value, activeBuffs)
})

const skillStatDisplay = computed((): { label: string; type: 'damage' | 'buff' | 'aura' } | null => {
  if (!skillDef.value || !character.value || !computedStats.value || !boostedStats.value) return null

  const def = skillDef.value

  // Active damage skill
  const damageEffect = def.effects.find((e) => e.type === 'damage')
  if (def.type === 'active' && damageEffect) {
    const dmg = calculateSkillDamage(def, character.value.baseStats, boostedStats.value)
    return { label: `${dmg} dmg/cast`, type: 'damage' }
  }

  // Active buff skill
  const buffEffect = def.effects.find((e) => e.type === 'buff')
  if (def.type === 'active' && buffEffect) {
    const sign = (buffEffect.buffKind === 'flat' ? '+' : '+') + (buffEffect.buffValue ?? 0)
    const target = formatStatLabel(buffEffect.buffTarget ?? '')
    const dur = buffEffect.buffDuration ? ` ${buffEffect.buffDuration}s` : ''
    return { label: `${sign}% ${target}${dur}`, type: 'buff' }
  }

  // Passive aura
  if (def.type === 'passive' && buffEffect) {
    const base = buffEffect.buffValue ?? 0
    const scaled = base * (1 + computedStats.value.auraEffect / 100)
    const target = formatStatLabel(buffEffect.buffTarget ?? '')
    const sign = buffEffect.buffKind === 'flat' ? '+' : '+'
    return { label: `${sign}${Math.round(scaled)}% ${target}`, type: 'aura' }
  }

  return null
})

const skillTooltip = computed((): string | null => {
  if (!skillDef.value || !character.value || !computedStats.value || !boostedStats.value) return null

  const def = skillDef.value
  const stats = computedStats.value
  const boosted = boostedStats.value

  const damageEffect = def.effects.find((e) => e.type === 'damage')
  const buffEffect = def.effects.find((e) => e.type === 'buff')

  // Damage skill tooltip
  if (def.type === 'active' && damageEffect && damageEffect.baseDamage) {
    const [min, max] = damageEffect.baseDamage
    const baseDmg = (min + max) / 2
    const attrVal = character.value.baseStats[def.scaling.attribute]
    const attrBonus = attrVal * def.scaling.factor
    const total = calculateSkillDamage(def, character.value.baseStats, boosted)

    const lines: string[] = [`Damage per cast: ${total}`, '']
    lines.push(`Base: ${min}–${max} (avg ${baseDmg.toFixed(1)})`)
    if (attrBonus > 0) {
      const attrLabel = def.scaling.attribute.charAt(0).toUpperCase() + def.scaling.attribute.slice(1)
      lines.push(`${attrLabel} bonus: +${attrBonus.toFixed(1)} (${attrVal} × ${def.scaling.factor})`)
    }

    // Collect increased damage modifiers
    let spellPct = 0
    let typePct = 0
    const typeStatKey = getDamageTypeStat(damageEffect.damageType ?? 'physical')
    spellPct = damageEffect.damageType !== 'physical' ? boosted.spellDamage : 0
    typePct = typeStatKey ? (boosted[typeStatKey as keyof typeof boosted] as number) : 0

    const totalInc = spellPct + typePct
    if (totalInc > 0) {
      if (spellPct > 0) {
        lines.push(`Spell Damage: +${spellPct}%`)
        const spellBreakdown = getStatSourceLines('spellDamage', character.value, stats, allSkills.value, boosted)
        for (const l of spellBreakdown) lines.push(`  ${l}`)
      }
      if (typePct > 0 && typeStatKey) {
        lines.push(`${capitalize(damageEffect.damageType ?? '')} Damage: +${typePct}%`)
        const typeBreakdown = getStatSourceLines(typeStatKey, character.value, stats, allSkills.value, boosted)
        for (const l of typeBreakdown) lines.push(`  ${l}`)
      }
    }

    const critFactor = 1 + (boosted.critChance / 100) * (boosted.critMultiplier / 100 - 1)
    if (critFactor > 1) {
      lines.push(`Crit: ×${critFactor.toFixed(2)} (${boosted.critChance.toFixed(1)}% chance · ${boosted.critMultiplier}% mult)`)
    }

    return lines.join('\n')
  }

  // Active buff skill tooltip
  if (def.type === 'active' && buffEffect) {
    const sign = '+' + (buffEffect.buffValue ?? 0)
    const target = formatStatLabel(buffEffect.buffTarget ?? '')
    const dur = buffEffect.buffDuration ? `${buffEffect.buffDuration}s` : 'permanent'
    const lines = [
      `Buff: ${sign}% ${target} for ${dur}`,
      '',
      `Applied on cast, expires after ${dur}.`,
      '(Active buffs are not scaled by Aura Effect)',
    ]
    return lines.join('\n')
  }

  // Passive aura tooltip
  if (def.type === 'passive' && buffEffect) {
    const base = buffEffect.buffValue ?? 0
    const auraEff = stats.auraEffect
    const scaled = base * (1 + auraEff / 100)
    const target = formatStatLabel(buffEffect.buffTarget ?? '')

    const lines = [
      `Aura: ${target} +${base}% → +${Math.round(scaled)}% scaled`,
      '',
      `Base value: +${base}%`,
      `Aura Effect: +${auraEff}%`,
    ]

    // Show sources of aura effect
    const auraSourceLines = getStatSourceLines('auraEffect', character.value, stats, allSkills.value, boosted)
    for (const l of auraSourceLines) lines.push(`  ${l}`)

    lines.push(`Effective: +${base}% × ${(1 + auraEff / 100).toFixed(2)} = +${Math.round(scaled)}%`)
    return lines.join('\n')
  }

  return null
})

// --- helpers ---

function getDamageTypeStat(damageType: string): string {
  switch (damageType) {
    case 'fire': return 'fireDamage'
    case 'cold': return 'coldDamage'
    case 'lightning': return 'lightningDamage'
    case 'chaos': return 'chaosDamage'
    default: return ''
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const STAT_LABELS: Record<string, string> = {
  defense: 'Defense',
  health: 'Life',
  maxMana: 'Mana',
  spellDamage: 'Spell Dmg',
  attackDamage: 'Atk Dmg',
  fireDamage: 'Fire Dmg',
  coldDamage: 'Cold Dmg',
  lightningDamage: 'Lightning Dmg',
  chaosDamage: 'Chaos Dmg',
  auraEffect: 'Aura Effect',
  critChance: 'Crit Chance',
  critMultiplier: 'Crit Multi',
  movementSpeed: 'Move Speed',
  attackSpeed: 'Atk Speed',
}

function formatStatLabel(key: string): string {
  return STAT_LABELS[key] ?? key
}

function getStatSourceLines(
  statKey: string,
  char: Character,
  baseComputedStats: ReturnType<typeof calculateStats>,
  equippedSkills: ReturnType<typeof charactersStore.getEquippedSkills>,
  _boosted: ReturnType<typeof applySkillBuffs>
): string[] {
  const lines: string[] = []

  // Equipment sources
  const SLOT_LABELS: Record<string, string> = {
    helmet: 'Helmet', bodyArmor: 'Body Armour', weapon: 'Weapon',
    gloves: 'Gloves', boots: 'Boots', leftRing: 'Left Ring', rightRing: 'Right Ring',
  }
  for (const [slot, item] of Object.entries(char.equipment) as [string, EquipmentItem | undefined][]) {
    if (!item) continue
    for (const mod of item.modifiers) {
      const targets = [mod.target, ...(mod.extraTargets ?? [])]
      if (targets.includes(statKey as never)) {
        lines.push(`${SLOT_LABELS[slot] ?? slot}: ${mod.label}`)
      }
    }
  }

  // Aura skill contributions (delta between boosted and base)
  for (const skill of equippedSkills) {
    if (skill.type !== 'passive') continue
    for (const effect of skill.effects) {
      if (effect.type === 'buff' && effect.buffTarget === statKey) {
        const base = effect.buffValue ?? 0
        const scaled = base * (1 + baseComputedStats.auraEffect / 100)
        lines.push(`${skill.name}: +${Math.round(scaled)}%`)
      }
    }
  }

  return lines
}

// --- tooltip state ---
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
</script>

<style scoped>
.skill-slot {
  width: 120px;
  height: 100px;
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

.skill-stat {
  font-size: 11px;
  font-weight: 600;
  cursor: default;
  margin-top: 2px;
}

.skill-stat.damage {
  color: #f39c12;
}

.skill-stat.buff {
  color: #1abc9c;
}

.skill-stat.aura {
  color: #8e44ad;
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

.skill-tooltip {
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
  white-space: pre-line;
}
</style>
