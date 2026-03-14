import { describe, test, expect } from 'bun:test'
import { simulateCombat, computeAverageSurvivability, computeRunDurationMs } from '../combatSimulator'
import { calculateStats } from '../statCalculator'
import { skillDefinitions } from '@/data/skillDefinitions'
import { GAME_MAPS } from '@/data/maps'
import type { ComputedStats, GameMap, BaseStats } from '@/types'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BASE_STATS: BaseStats = { strength: 10, dexterity: 10, intelligence: 20 }

const BASE_COMPUTED_STATS: ComputedStats = {
  health: 100,
  defense: 0,
  attackDamage: 5,
  attackSpeed: 1.0,
  movementSpeed: 100,
  fireResistance: 0,
  iceResistance: 0,
  lightningResistance: 0,
  chaosResistance: 0,
  maxMana: 90,
  manaRegenFlat: 0,
  manaRegenPercent: 1.75,
  spellDamage: 0,
  fireDamage: 0,
  coldDamage: 0,
  lightningDamage: 0,
  chaosDamage: 0,
  increasedPhysicalDamage: 0,
  addedPhysicalDamage: 0,
  addedFireDamage: 0,
  addedColdDamage: 0,
  addedLightningDamage: 0,
  addedChaosDamage: 0,
  critChance: 0,
  critMultiplier: 150,
  auraEffect: 0,
  cooldownRecovery: 0,
}

const PHYSICAL_ONLY_MAP: GameMap = {
  id: 'test-phys',
  name: 'Test Map',
  tier: 1,
  levelRequirement: 1,
  durationSeconds: 60,
  description: '',
  lootMultiplier: 1,
  xpReward: 0,
  enemyDps: 10,
  damageProfile: { physical: 1.0, fire: 0, cold: 0, lightning: 0, chaos: 0 },
  enemies: [],
}

const MIXED_DAMAGE_MAP: GameMap = {
  ...PHYSICAL_ONLY_MAP,
  id: 'test-mixed',
  damageProfile: { physical: 0.25, fire: 0.25, cold: 0.25, lightning: 0.25, chaos: 0 },
}

// ── simulateCombat ─────────────────────────────────────────────────────────────

describe('simulateCombat', () => {
  test('returns all expected fields', () => {
    const result = simulateCombat(PHYSICAL_ONLY_MAP, BASE_COMPUTED_STATS, BASE_STATS)

    expect(result).toHaveProperty('survivalRatio')
    expect(result).toHaveProperty('totalDamageTaken')
    expect(result).toHaveProperty('totalDamageDealt')
    expect(result).toHaveProperty('clearSpeedMultiplier')
    expect(result).toHaveProperty('ehp')
    expect(result).toHaveProperty('health')
    expect(result).toHaveProperty('defense')
    expect(result).toHaveProperty('durationMs')
    expect(result).toHaveProperty('speedFactor')
  })

  test('survivalRatio is clamped between 0 and 1', () => {
    // Weak character against strong map — low survival
    const weakStats = { ...BASE_COMPUTED_STATS, health: 10 }
    const strongMap = { ...PHYSICAL_ONLY_MAP, enemyDps: 1000 }
    const weakResult = simulateCombat(strongMap, weakStats, BASE_STATS)
    expect(weakResult.survivalRatio).toBeGreaterThanOrEqual(0)
    expect(weakResult.survivalRatio).toBeLessThanOrEqual(1)

    // Strong character against weak map — full survival
    const tankStats = { ...BASE_COMPUTED_STATS, health: 100000 }
    const easyMap = { ...PHYSICAL_ONLY_MAP, enemyDps: 1 }
    const strongResult = simulateCombat(easyMap, tankStats, BASE_STATS)
    expect(strongResult.survivalRatio).toBe(1)
  })

  test('zero enemy DPS yields survivalRatio of 1 and zero damage taken', () => {
    const safemap = { ...PHYSICAL_ONLY_MAP, enemyDps: 0 }
    const result = simulateCombat(safemap, BASE_COMPUTED_STATS, BASE_STATS)

    expect(result.survivalRatio).toBe(1)
    expect(result.totalDamageTaken).toBe(0)
  })

  test('higher defense improves survivability against physical damage', () => {
    const noDefense = simulateCombat(PHYSICAL_ONLY_MAP, BASE_COMPUTED_STATS, BASE_STATS)
    const highDefense = simulateCombat(PHYSICAL_ONLY_MAP, { ...BASE_COMPUTED_STATS, defense: 500 }, BASE_STATS)

    expect(highDefense.survivalRatio).toBeGreaterThan(noDefense.survivalRatio)
    expect(highDefense.ehp).toBeGreaterThan(noDefense.ehp)
  })

  test('fire resistance improves survivability against fire damage', () => {
    const fireMap = { ...PHYSICAL_ONLY_MAP, damageProfile: { physical: 0, fire: 1.0, cold: 0, lightning: 0, chaos: 0 } }
    const noRes = simulateCombat(fireMap, BASE_COMPUTED_STATS, BASE_STATS)
    const highRes = simulateCombat(fireMap, { ...BASE_COMPUTED_STATS, fireResistance: 75 }, BASE_STATS)

    expect(highRes.survivalRatio).toBeGreaterThan(noRes.survivalRatio)
  })

  test('active skills increase totalDamageDealt and lower clearSpeedMultiplier', () => {
    const noSkills = simulateCombat(PHYSICAL_ONLY_MAP, BASE_COMPUTED_STATS, BASE_STATS, [])
    const fireball = skillDefinitions.find((s) => s.id === 'fireball')!
    const withSkill = simulateCombat(PHYSICAL_ONLY_MAP, BASE_COMPUTED_STATS, BASE_STATS, [fireball])

    expect(withSkill.totalDamageDealt).toBeGreaterThan(noSkills.totalDamageDealt)
    expect(withSkill.clearSpeedMultiplier).toBeLessThan(noSkills.clearSpeedMultiplier)
    expect(withSkill.durationMs).toBeLessThan(noSkills.durationMs)
  })

  test('clearSpeedMultiplier is bounded between 0.5 and 1.0', () => {
    const result = simulateCombat(PHYSICAL_ONLY_MAP, BASE_COMPUTED_STATS, BASE_STATS)
    expect(result.clearSpeedMultiplier).toBeGreaterThanOrEqual(0.5)
    expect(result.clearSpeedMultiplier).toBeLessThanOrEqual(1.0)
  })

  test('aura passives (vitality) boost health before computing EHP', () => {
    const vitality = skillDefinitions.find((s) => s.id === 'vitality')!
    const withoutAura = simulateCombat(PHYSICAL_ONLY_MAP, BASE_COMPUTED_STATS, BASE_STATS, [])
    const withAura = simulateCombat(PHYSICAL_ONLY_MAP, BASE_COMPUTED_STATS, BASE_STATS, [vitality])

    expect(withAura.health).toBeGreaterThan(withoutAura.health)
    expect(withAura.ehp).toBeGreaterThan(withoutAura.ehp)
  })

  test('works correctly with real map data', () => {
    const char = {
      id: 'c',
      name: 'Witch',
      level: 1,
      experience: 0,
      experienceToNextLevel: 1000,
      baseStats: BASE_STATS,
      equipment: {},
      skills: { active1: 'fireball', passive1: 'clarity' },
    }
    const stats = calculateStats(char)
    const map = GAME_MAPS[0]!
    const skills = [
      skillDefinitions.find((s) => s.id === 'fireball')!,
      skillDefinitions.find((s) => s.id === 'clarity')!,
    ]

    const result = simulateCombat(map, stats, char.baseStats, skills)
    expect(result.survivalRatio).toBeGreaterThan(0)
    expect(result.durationMs).toBeGreaterThan(0)
  })
})

// ── computeAverageSurvivability ────────────────────────────────────────────────

describe('computeAverageSurvivability', () => {
  test('EHP equals health when all mitigations are zero', () => {
    // With zero defense and zero resistances, each damage type takes full damage.
    // Equal weighting 0.2×5 = sum of (0.2 × 1.0) = 1.0 factor → EHP = health.
    const result = computeAverageSurvivability(BASE_COMPUTED_STATS)
    expect(result.ehp).toBe(BASE_COMPUTED_STATS.health)
  })

  test('resistances are capped at 75 in output', () => {
    const overcapped = { ...BASE_COMPUTED_STATS, fireResistance: 100, iceResistance: 90 }
    const result = computeAverageSurvivability(overcapped)
    expect(result.fireResistance).toBe(75)
    expect(result.iceResistance).toBe(75)
  })

  test('negative chaos resistance reduces EHP', () => {
    const negChaos = { ...BASE_COMPUTED_STATS, chaosResistance: -60 }
    const equalProfile = { physical: 0.2, fire: 0.2, cold: 0.2, lightning: 0.2, chaos: 0.2 }
    const baseline = computeAverageSurvivability(BASE_COMPUTED_STATS, [], equalProfile)
    const withNegChaos = computeAverageSurvivability(negChaos, [], equalProfile)

    expect(withNegChaos.ehp).toBeLessThan(baseline.ehp)
  })

  test('physMitigation is capped at 75', () => {
    const highDef = { ...BASE_COMPUTED_STATS, defense: 100000 }
    const result = computeAverageSurvivability(highDef)
    expect(result.physMitigation).toBe(75)
  })

  test('damage profile affects EHP weighting', () => {
    const fireHeavy = { physical: 0, fire: 1.0, cold: 0, lightning: 0, chaos: 0 }
    const physHeavy = { physical: 1.0, fire: 0, cold: 0, lightning: 0, chaos: 0 }

    const withFireRes = { ...BASE_COMPUTED_STATS, fireResistance: 75 }

    const vsFireMap = computeAverageSurvivability(withFireRes, [], fireHeavy)
    const vsPhysMap = computeAverageSurvivability(withFireRes, [], physHeavy)

    // High fire res helps on a fire map, not a phys map
    expect(vsFireMap.ehp).toBeGreaterThan(vsPhysMap.ehp)
  })
})

// ── computeRunDurationMs ──────────────────────────────────────────────────────

describe('computeRunDurationMs', () => {
  test('base movement speed (100) produces speedFactor of 1.0', () => {
    const result = computeRunDurationMs(60, 100, 1.0)
    expect(result.speedFactor).toBe(1.0)
    expect(result.durationMs).toBe(60_000)
  })

  test('higher movement speed reduces durationMs', () => {
    const slow = computeRunDurationMs(60, 100, 1.0)
    const fast = computeRunDurationMs(60, 150, 1.0)
    expect(fast.durationMs).toBeLessThan(slow.durationMs)
  })

  test('speedFactor is clamped at 0.5 for very high movement speed', () => {
    const result = computeRunDurationMs(60, 10000, 1.0)
    expect(result.speedFactor).toBe(0.5)
    expect(result.durationMs).toBe(30_000)
  })

  test('clearSpeedMultiplier scales durationMs linearly', () => {
    const full = computeRunDurationMs(60, 100, 1.0)
    const half = computeRunDurationMs(60, 100, 0.5)
    expect(half.durationMs).toBe(Math.round(full.durationMs * 0.5))
  })
})
