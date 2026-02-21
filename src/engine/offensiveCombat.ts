import type { SkillDefinition, ComputedStats, BaseStats } from '@/types'

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
    case 'cold':
    case 'lightning':
    case 'chaos':
      // Spell damage applies to all elemental/chaos damage
      increasedDamage += computedStats.spellDamage
      break
    case 'physical':
      // Physical damage uses attack damage stat
      increasedDamage += computedStats.attackDamage
      break
  }

  // Calculate final damage
  const scaledDamage = (baseDamage + attributeBonus) * (1 + increasedDamage / 100)

  return Math.round(scaledDamage)
}

/**
 * Calculate how many times a skill will be cast during a map run.
 */
export function calculateCastsPerRun(skill: SkillDefinition, runDurationSeconds: number): number {
  if (!skill.cooldown) {
    return 0
  }

  // Apply cooldown recovery modifier if needed (future enhancement)
  const effectiveCooldown = skill.cooldown

  return Math.floor(runDurationSeconds / effectiveCooldown)
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

  const activeSkills = skills.filter((s) => s.type === 'active')

  for (const skill of activeSkills) {
    const baseDamage = calculateSkillDamage(skill, baseStats, computedStats)
    const castsPerRun = calculateCastsPerRun(skill, runDurationSeconds)
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
