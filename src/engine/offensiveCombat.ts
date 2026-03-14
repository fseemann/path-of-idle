import type { SkillDefinition, ComputedStats, BaseStats } from '@/types'
import { initializeSkillState, applySkillBuffs } from './skillExecutor'
import { calculateReservedMana, calculateAvailableMana, calculateManaRegenRate } from './manaCalculator'

export interface SkillDamageResult {
  skillId: string
  baseDamage: number
  scaledDamage: number
  castsPerRun: number
  totalDamage: number
}

/**
 * Calculate the damage dealt by a single cast of an active skill.
 * Formula: (baseDamage + attributeValue * scalingFactor) * (1 + increasedDamage / 100)
 */
export function calculateSkillDamage(
  skill: SkillDefinition,
  baseStats: BaseStats,
  computedStats: ComputedStats
): number {
  const damageEffect = skill.effects.find((e) => e.type === 'damage')
  if (!damageEffect || !damageEffect.baseDamage) {
    return 0
  }

  // Calculate base damage (average of min/max)
  const [min, max] = damageEffect.baseDamage
  const baseDamage = (min + max) / 2

  // Get attribute value for scaling
  const attributeValue = baseStats[skill.scaling.attribute]
  const attributeBonus = attributeValue * skill.scaling.factor

  // Apply damage type modifiers
  let increasedDamage = 0
  switch (damageEffect.damageType) {
    case 'fire':
      increasedDamage += computedStats.spellDamage + computedStats.fireDamage
      break
    case 'cold':
      increasedDamage += computedStats.spellDamage + computedStats.coldDamage
      break
    case 'lightning':
      increasedDamage += computedStats.spellDamage + computedStats.lightningDamage
      break
    case 'chaos':
      increasedDamage += computedStats.spellDamage + computedStats.chaosDamage
      break
    case 'physical':
      // Physical damage uses attack damage stat
      increasedDamage += computedStats.attackDamage
      break
  }

  // Average crit multiplier: non-crits deal 1×, crits deal (critMultiplier/100)×
  const avgCritFactor = 1 + (computedStats.critChance / 100) * (computedStats.critMultiplier / 100 - 1)

  // Calculate final damage from the skill's own damage type
  let scaledDamage = (baseDamage + attributeBonus) * (1 + increasedDamage / 100) * avgCritFactor

  // Attack-tagged skills also benefit from flat added elemental damage on gear
  if (skill.tags.includes('attack')) {
    scaledDamage += computedStats.addedFireDamage * (1 + computedStats.fireDamage / 100) * avgCritFactor
    scaledDamage += computedStats.addedColdDamage * (1 + computedStats.coldDamage / 100) * avgCritFactor
    scaledDamage += computedStats.addedLightningDamage * (1 + computedStats.lightningDamage / 100) * avgCritFactor
    scaledDamage += computedStats.addedChaosDamage * (1 + computedStats.chaosDamage / 100) * avgCritFactor
  }

  return Math.round(scaledDamage)
}

/**
 * Calculate how many times a skill will be cast during a map run.
 * Casts are limited by both cooldown and available mana (pool + regen over the run).
 */
export function calculateCastsPerRun(
  skill: SkillDefinition,
  runDurationSeconds: number,
  cooldownRecovery: number = 0,
  availableMana: number = Infinity,
  manaRegenPerSecond: number = 0
): number {
  if (!skill.cooldown) {
    return 0
  }

  const effectiveCooldown = skill.cooldown / (1 + cooldownRecovery / 100)
  const castsByCooldown = Math.floor(runDurationSeconds / effectiveCooldown)

  const manaCost = skill.manaCost || 0
  if (manaCost <= 0) {
    return castsByCooldown
  }

  const totalManaForRun = availableMana + manaRegenPerSecond * runDurationSeconds
  const maxCastsByMana = Math.floor(totalManaForRun / manaCost)

  return Math.min(castsByCooldown, maxCastsByMana)
}

/**
 * Calculate total damage output for all active skills during a map run.
 */
export function calculateTotalSkillDamage(
  skills: SkillDefinition[],
  baseStats: BaseStats,
  computedStats: ComputedStats,
  runDurationSeconds: number
): SkillDamageResult[] {
  const results: SkillDamageResult[] = []

  const passiveSkills = skills.filter((s) => s.type === 'passive')
  const reservedMana = calculateReservedMana(computedStats.maxMana, passiveSkills)
  const availableMana = calculateAvailableMana(computedStats.maxMana, reservedMana)
  const manaRegenPerSecond = (computedStats.maxMana * calculateManaRegenRate(computedStats)) / 100

  const activeSkills = skills.filter((s) => s.type === 'active')

  for (const skill of activeSkills) {
    const baseDamage = calculateSkillDamage(skill, baseStats, computedStats)
    const castsPerRun = calculateCastsPerRun(
      skill,
      runDurationSeconds,
      computedStats.cooldownRecovery,
      availableMana,
      manaRegenPerSecond
    )
    const totalDamage = baseDamage * castsPerRun

    results.push({
      skillId: skill.id,
      baseDamage,
      scaledDamage: baseDamage,
      castsPerRun,
      totalDamage,
    })
  }

  return results
}

/**
 * Calculate the clear speed multiplier based on total damage output.
 * Higher damage = faster clear time = lower duration multiplier.
 * Formula: 1 - min(0.5, totalDamage / threshold)
 *
 * The threshold is tuned so that moderate offense builds reach ~25-35% clear speed bonus,
 * while pure offense builds approach the 50% cap.
 */
export function calculateClearSpeedMultiplier(totalDamage: number): number {
  // Damage threshold for 50% clear speed bonus (max)
  // This value should be tuned during testing
  const damageThreshold = 10000

  const reduction = Math.min(0.5, totalDamage / damageThreshold)
  return 1 - reduction
}

/**
 * Calculate the effective run duration after applying clear speed bonus.
 */
export function calculateEffectiveDuration(
  baseDuration: number,
  clearSpeedMultiplier: number
): number {
  return baseDuration * clearSpeedMultiplier
}

/**
 * Calculate overall DPS including auto-attacks and all equipped active skills.
 * Passive aura buffs are applied to stats first so they affect both auto-attacks
 * and skill scaling (e.g. Herald of Fire boosting spell damage).
 * Mana costs are accounted for: skills that run out of mana mid-run have their
 * effective DPS reduced proportionally.
 *
 * Auto-attack DPS = attackDamage × attackSpeed
 * Skill DPS       = Σ (castsPerRun × damagePerCast) / runDurationSeconds
 */
export function computeTotalDPS(
  skills: SkillDefinition[],
  baseStats: BaseStats,
  computedStats: ComputedStats,
  runDurationSeconds: number = 60
): number {
  // Apply passive aura buffs (e.g. Herald of Fire +30% spell damage)
  const { activeBuffs } = initializeSkillState(skills)
  const boostedStats = applySkillBuffs(computedStats, activeBuffs)

  // Mana budget over the run
  const passiveSkills = skills.filter((s) => s.type === 'passive')
  const reservedMana = calculateReservedMana(boostedStats.maxMana, passiveSkills)
  const availableMana = calculateAvailableMana(boostedStats.maxMana, reservedMana)
  const manaRegenPerSecond = (boostedStats.maxMana * calculateManaRegenRate(boostedStats)) / 100

  // Auto-attack: physical base + added elemental (each scaled by its own % increased)
  const addedElementalPerHit =
    boostedStats.addedFireDamage * (1 + boostedStats.fireDamage / 100) +
    boostedStats.addedColdDamage * (1 + boostedStats.coldDamage / 100) +
    boostedStats.addedLightningDamage * (1 + boostedStats.lightningDamage / 100) +
    boostedStats.addedChaosDamage * (1 + boostedStats.chaosDamage / 100)
  let total = (boostedStats.attackDamage + addedElementalPerHit) * boostedStats.attackSpeed

  // Active skills
  const activeSkills = skills.filter((s) => s.type === 'active' && s.cooldown && s.cooldown > 0)
  for (const skill of activeSkills) {
    const damagePerCast = calculateSkillDamage(skill, baseStats, boostedStats)
    const castsPerRun = calculateCastsPerRun(
      skill,
      runDurationSeconds,
      boostedStats.cooldownRecovery,
      availableMana,
      manaRegenPerSecond
    )
    total += (damagePerCast * castsPerRun) / runDurationSeconds
  }

  return Math.round(total)
}
