import type { SkillDefinition, SkillCooldownState, ActiveBuff, ComputedStats } from '@/types'

/**
 * Initialize skill state for a new map run.
 * Sets all active skills on cooldown 0 and applies aura buffs.
 */
export function initializeSkillState(
  skills: SkillDefinition[]
): {
  cooldowns: SkillCooldownState[]
  activeBuffs: ActiveBuff[]
} {
  const activeSkills = skills.filter((s) => s.type === 'active')
  const passiveSkills = skills.filter((s) => s.type === 'passive')

  // Initialize cooldowns for active skills (all ready to cast)
  const cooldowns: SkillCooldownState[] = activeSkills.map((skill) => ({
    skillId: skill.id,
    remainingCooldown: 0, // Ready to cast immediately
  }))

  // Apply aura buffs (permanent buffs from passive skills)
  const activeBuffs: ActiveBuff[] = []
  for (const skill of passiveSkills) {
    for (const effect of skill.effects) {
      if (effect.type === 'buff' && effect.buffTarget) {
        activeBuffs.push({
          skillId: skill.id,
          target: effect.buffTarget,
          kind: effect.buffKind || 'flat',
          value: effect.buffValue || 0,
          expiresAt: null, // Auras don't expire
        })
      }
    }
  }

  return { cooldowns, activeBuffs }
}

/**
 * Apply active skill buffs to computed stats.
 * This modifies stats in-place based on current active buffs.
 *
 * Note: This is used for temporary buff effects during runs.
 * Aura effects should be applied in the main stat calculator.
 */
export function applySkillBuffs(baseStats: ComputedStats, buffs: ActiveBuff[]): ComputedStats {
  const stats = { ...baseStats }

  // Separate flat and increased modifiers
  const flatMods: Partial<Record<keyof ComputedStats | 'manaRegenFlat' | 'manaRegenPercent', number>> = {}
  const increasedMods: Partial<Record<keyof ComputedStats | 'manaRegenFlat' | 'manaRegenPercent', number>> = {}

  for (const buff of buffs) {
    const target = buff.target as keyof ComputedStats | 'manaRegenFlat' | 'manaRegenPercent'
    // Permanent auras (expiresAt === null) are scaled by the auraEffect stat
    const effectiveValue =
      buff.expiresAt === null
        ? buff.value * (1 + baseStats.auraEffect / 100)
        : buff.value

    if (buff.kind === 'flat') {
      flatMods[target] = (flatMods[target] || 0) + effectiveValue
    } else if (buff.kind === 'increased') {
      increasedMods[target] = (increasedMods[target] || 0) + effectiveValue
    }
  }

  // Apply modifiers to each stat
  for (const key of Object.keys(stats) as Array<keyof ComputedStats>) {
    const baseValue = stats[key]
    const flat = flatMods[key] || 0
    const increased = increasedMods[key] || 0

    // Formula: (base + flat) * (1 + increased/100)
    stats[key] = (baseValue + flat) * (1 + increased / 100) as any
  }

  return stats
}

