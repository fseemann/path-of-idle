import type { GameMap, ComputedStats, DamageProfile, SkillDefinition, BaseStats } from '@/types'
import { calculateTotalSkillDamage, calculateClearSpeedMultiplier } from './offensiveCombat'
import { initializeSkillState, applySkillBuffs } from './skillExecutor'

/**
 * Compute average Effective HP across all 5 damage types with equal weighting.
 * Passive aura buffs (e.g. Vitality +15% health) are applied before computing
 * so the survivability figure reflects their contribution.
 *
 * EHP for each type = health / (1 - mitigation)
 */
export function computeAverageSurvivability(
  stats: ComputedStats,
  skills: SkillDefinition[] = []
): number {
  const { activeBuffs } = initializeSkillState(skills)
  const boostedStats = applySkillBuffs(stats, activeBuffs)

  const physMit = Math.min(0.75, boostedStats.defense / (boostedStats.defense + 200))
  const fireMit = Math.min(0.75, boostedStats.fireResistance / 100)
  const coldMit = Math.min(0.75, boostedStats.iceResistance / 100)
  const lightningMit = Math.min(0.75, boostedStats.lightningResistance / 100)
  const chaosMit = Math.max(-1, boostedStats.chaosResistance / 100)

  const ehp = (mit: number) => boostedStats.health / Math.max(0.01, 1 - mit)
  const avg = (ehp(physMit) + ehp(fireMit) + ehp(coldMit) + ehp(lightningMit) + ehp(chaosMit)) / 5
  return Math.round(avg)
}

export interface CombatResult {
  survivalRatio: number
  totalDamageTaken: number
  clearSpeedMultiplier: number
  totalDamageDealt: number
}

export function simulateCombat(
  map: GameMap,
  stats: ComputedStats,
  baseStats: BaseStats,
  equippedSkills: SkillDefinition[] = []
): CombatResult {
  const { enemyDps, damageProfile, durationSeconds } = map

  // Calculate offensive damage output
  const skillDamageResults = calculateTotalSkillDamage(
    equippedSkills,
    baseStats,
    stats,
    durationSeconds
  )
  const totalDamageDealt = skillDamageResults.reduce((sum, r) => sum + r.totalDamage, 0)
  const clearSpeedMultiplier = calculateClearSpeedMultiplier(totalDamageDealt)

  // Physical mitigation: armor formula, capped at 75%
  const physMitigation = Math.min(0.75, stats.defense / (stats.defense + 200))
  // Elemental: statCalculator already caps these at 0–75
  const fireMitigation = stats.fireResistance / 100
  const coldMitigation = stats.iceResistance / 100
  const lightningMitigation = stats.lightningResistance / 100
  // Chaos: uncapped, can amplify damage
  const chaosMitigation = Math.max(-1, stats.chaosResistance / 100)

  const mitigations: Record<keyof DamageProfile, number> = {
    physical: physMitigation,
    fire: fireMitigation,
    cold: coldMitigation,
    lightning: lightningMitigation,
    chaos: chaosMitigation,
  }

  // Higher damage output kills enemies faster, reducing the effective window of incoming damage
  const effectiveDuration = durationSeconds * clearSpeedMultiplier

  let totalDamageTaken = 0
  for (const type of Object.keys(damageProfile) as Array<keyof DamageProfile>) {
    const fraction = damageProfile[type]
    if (fraction <= 0) continue
    const typeDps = enemyDps * fraction
    totalDamageTaken += typeDps * (1 - mitigations[type]) * effectiveDuration
  }

  if (totalDamageTaken <= 0) {
    return {
      survivalRatio: 1,
      totalDamageTaken: 0,
      clearSpeedMultiplier,
      totalDamageDealt,
    }
  }

  return {
    survivalRatio: Math.min(1, stats.health / totalDamageTaken),
    totalDamageTaken,
    clearSpeedMultiplier,
    totalDamageDealt,
  }
}
