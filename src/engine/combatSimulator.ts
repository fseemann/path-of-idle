import type { GameMap, ComputedStats, DamageProfile } from '@/types'

export interface CombatResult {
  survivalRatio: number
  totalDamageTaken: number
}

export function simulateCombat(map: GameMap, stats: ComputedStats): CombatResult {
  const { enemyDps, damageProfile, durationSeconds } = map

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

  let totalDamageTaken = 0
  for (const type of Object.keys(damageProfile) as Array<keyof DamageProfile>) {
    const fraction = damageProfile[type]
    if (fraction <= 0) continue
    const typeDps = enemyDps * fraction
    totalDamageTaken += typeDps * (1 - mitigations[type]) * durationSeconds
  }

  if (totalDamageTaken <= 0) return { survivalRatio: 1, totalDamageTaken: 0 }

  return {
    survivalRatio: Math.min(1, stats.health / totalDamageTaken),
    totalDamageTaken,
  }
}
