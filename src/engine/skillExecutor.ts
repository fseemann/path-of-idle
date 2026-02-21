import type { SkillDefinition, SkillCooldownState, ActiveBuff, ComputedStats } from '@/types'

/**
 * Initialize skill state for a new map run.
 * Sets all active skills on cooldown 0 and applies aura buffs.
 */
export function initializeSkillState(
  skills: SkillDefinition[],
  currentTime: number
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
 * Tick skills forward by deltaSeconds.
 * - Decrements cooldowns
 * - Casts skills that are ready and have enough mana
 * - Applies buff effects
 * - Removes expired buffs
 *
 * @returns Updated state and mana cost consumed during this tick
 */
export function tickSkills(
  skills: SkillDefinition[],
  cooldowns: SkillCooldownState[],
  activeBuffs: ActiveBuff[],
  currentMana: number,
  currentTime: number,
  deltaSeconds: number
): {
  cooldowns: SkillCooldownState[]
  activeBuffs: ActiveBuff[]
  manaConsumed: number
} {
  let manaConsumed = 0
  const updatedCooldowns = [...cooldowns]
  const updatedBuffs = [...activeBuffs]

  // Decrement all cooldowns
  for (const cooldown of updatedCooldowns) {
    cooldown.remainingCooldown = Math.max(0, cooldown.remainingCooldown - deltaSeconds)
  }

  // Try to cast ready skills
  const activeSkills = skills.filter((s) => s.type === 'active')
  for (const skill of activeSkills) {
    const cooldownState = updatedCooldowns.find((c) => c.skillId === skill.id)
    if (!cooldownState) continue

    // Check if skill is ready to cast
    if (cooldownState.remainingCooldown > 0) continue

    // Check if we have enough mana
    const manaCost = skill.manaCost || 0
    if (currentMana - manaConsumed < manaCost) continue

    // Cast the skill!
    manaConsumed += manaCost
    cooldownState.remainingCooldown = skill.cooldown || 0

    // Apply skill effects
    for (const effect of skill.effects) {
      if (effect.type === 'buff' && effect.buffTarget && effect.buffDuration !== undefined) {
        const expiresAt = effect.buffDuration ? currentTime + effect.buffDuration * 1000 : null

        updatedBuffs.push({
          skillId: skill.id,
          target: effect.buffTarget,
          kind: effect.buffKind || 'flat',
          value: effect.buffValue || 0,
          expiresAt,
        })
      }
      // Damage effects are handled separately in offensiveCombat
    }
  }

  // Remove expired buffs (but keep auras which have expiresAt: null)
  const validBuffs = updatedBuffs.filter((buff) => {
    if (buff.expiresAt === null) return true // Auras never expire
    return buff.expiresAt > currentTime
  })

  return {
    cooldowns: updatedCooldowns,
    activeBuffs: validBuffs,
    manaConsumed,
  }
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

    if (buff.kind === 'flat') {
      flatMods[target] = (flatMods[target] || 0) + buff.value
    } else if (buff.kind === 'increased') {
      increasedMods[target] = (increasedMods[target] || 0) + buff.value
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

/**
 * Get equipped skills from a character's skill slots.
 * Filters out empty slots and returns skill definitions.
 */
export function getEquippedSkills(
  skillSlots: Partial<Record<string, string>> | undefined,
  skillDefinitions: SkillDefinition[]
): SkillDefinition[] {
  if (!skillSlots) return []
  const skillIds = Object.values(skillSlots).filter((id): id is string => Boolean(id))
  return skillIds
    .map((id) => skillDefinitions.find((def) => def.id === id))
    .filter((skill): skill is SkillDefinition => Boolean(skill))
}
