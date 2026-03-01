import type { GameMap, ComputedStats, DamageProfile, SkillDefinition, BaseStats } from '@/types'
import { computeTotalDPS, calculateClearSpeedMultiplier } from './offensiveCombat'
import { initializeSkillState, applySkillBuffs } from './skillExecutor'

const EQUAL_DAMAGE_PROFILE: DamageProfile = {
  physical: 0.2,
  fire: 0.2,
  cold: 0.2,
  lightning: 0.2,
  chaos: 0.2,
}

/**
 * Compute Effective HP weighted by a damage profile.
 * Passive aura buffs (e.g. Vitality +15% health) are applied before computing.
 *
 * Formula: health / Σ(fraction_i × max(0.01, 1 − mitigation_i))
 *
 * With the default equal weighting this produces the character sheet survivability.
 * Passing a map's damageProfile produces a map-specific EHP used in combat.
 */
export function computeAverageSurvivability(
  stats: ComputedStats,
  skills: SkillDefinition[] = [],
  damageProfile: DamageProfile = EQUAL_DAMAGE_PROFILE
): number {
  const { activeBuffs } = initializeSkillState(skills)
  const boostedStats = applySkillBuffs(stats, activeBuffs)

  const mitigations: Record<keyof DamageProfile, number> = {
    physical: Math.min(0.75, boostedStats.defense / (boostedStats.defense + 200)),
    fire: Math.min(0.75, boostedStats.fireResistance / 100),
    cold: Math.min(0.75, boostedStats.iceResistance / 100),
    lightning: Math.min(0.75, boostedStats.lightningResistance / 100),
    chaos: Math.max(-1, boostedStats.chaosResistance / 100),
  }

  const weightedDamageFactor = (Object.keys(mitigations) as Array<keyof DamageProfile>).reduce(
    (sum, type) => sum + damageProfile[type] * Math.max(0.01, 1 - mitigations[type]),
    0
  )

  return Math.round(boostedStats.health / weightedDamageFactor)
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

  // Calculate offensive damage output — same DPS figure shown on character sheet
  const totalDps = computeTotalDPS(equippedSkills, baseStats, stats)
  const totalDamageDealt = totalDps * durationSeconds
  const clearSpeedMultiplier = calculateClearSpeedMultiplier(totalDamageDealt)

  // EHP weighted by this map's damage profile — same formula as character sheet survivability
  const ehp = computeAverageSurvivability(stats, equippedSkills, damageProfile)
  const totalRawDamage = enemyDps * durationSeconds * clearSpeedMultiplier

  if (totalRawDamage <= 0) {
    return {
      survivalRatio: 1,
      totalDamageTaken: 0,
      clearSpeedMultiplier,
      totalDamageDealt,
    }
  }

  return {
    survivalRatio: Math.min(1, ehp / totalRawDamage),
    totalDamageTaken: totalRawDamage,
    clearSpeedMultiplier,
    totalDamageDealt,
  }
}
