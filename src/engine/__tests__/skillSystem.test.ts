import { describe, test, expect } from 'bun:test'
import { calculateStats } from '../statCalculator'
import { simulateCombat } from '../combatSimulator'
import { calculateManaMetrics, regenerateMana } from '../manaCalculator'
import { initializeSkillState, tickSkills } from '../skillExecutor'
import { skillDefinitions } from '@/data/skillDefinitions'
import { GAME_MAPS } from '@/data/maps'
import type { Character } from '@/types'

describe('Skill System', () => {
  const testCharacter: Character = {
    id: 'test-char',
    name: 'Test Witch',
    level: 10,
    experience: 0,
    experienceToNextLevel: 1000,
    baseStats: { strength: 6, dexterity: 10, intelligence: 20 },
    equipment: {},
    skills: {
      active1: 'fireball',
      passive1: 'clarity',
    },
  }

  test('stat calculation includes skill stats', () => {
    const stats = calculateStats(testCharacter)

    // Base spell damage from INT (20 INT * 0.5 = 10)
    expect(stats.spellDamage).toBe(10)

    // Base crit chance from DEX (10 DEX * 0.05 = 0.5%)
    expect(stats.critChance).toBe(0.5)

    // Base mana from INT (30 + 20 * 3 = 90)
    expect(stats.maxMana).toBe(90)

    // Base mana regen (1.75%)
    expect(stats.manaRegenPercent).toBe(1.75)
  })

  test('mana reservation works correctly', () => {
    const stats = calculateStats(testCharacter)
    const equippedSkills = [
      skillDefinitions.find(s => s.id === 'fireball')!,
      skillDefinitions.find(s => s.id === 'clarity')!,
    ]

    const passiveSkills = equippedSkills.filter(s => s.type === 'passive')
    const metrics = calculateManaMetrics(stats, passiveSkills)

    // Clarity reserves 20% of 90 = 18 mana
    expect(metrics.reservedMana).toBe(18)
    expect(metrics.availableMana).toBe(72)
  })

  test('skill initialization creates correct state', () => {
    const equippedSkills = [
      skillDefinitions.find(s => s.id === 'fireball')!,
      skillDefinitions.find(s => s.id === 'clarity')!,
    ]

    const { cooldowns, activeBuffs } = initializeSkillState(equippedSkills, Date.now())

    // Should have 1 cooldown (fireball)
    expect(cooldowns.length).toBe(1)
    expect(cooldowns[0]?.skillId).toBe('fireball')
    expect(cooldowns[0]?.remainingCooldown).toBe(0) // Ready to cast

    // Should have Clarity aura buffs
    expect(activeBuffs.length).toBeGreaterThan(0)
    expect(activeBuffs.some(b => b.skillId === 'clarity')).toBe(true)
  })

  test('skill execution consumes mana and triggers cooldowns', () => {
    const equippedSkills = [
      skillDefinitions.find(s => s.id === 'fireball')!,
    ]

    const { cooldowns, activeBuffs } = initializeSkillState(equippedSkills, Date.now())
    const currentMana = 90

    // Tick once (skills should cast)
    const result = tickSkills(
      equippedSkills,
      cooldowns,
      activeBuffs,
      currentMana,
      Date.now(),
      1 // 1 second
    )

    // Fireball costs 15 mana
    expect(result.manaConsumed).toBe(15)

    // Fireball has 3s cooldown
    const fireballCd = result.cooldowns.find(c => c.skillId === 'fireball')
    expect(fireballCd?.remainingCooldown).toBe(3)
  })

  test('mana regeneration works correctly', () => {
    const stats = calculateStats(testCharacter)
    const currentMana = 50
    const reservedMana = 18 // Clarity reserves 20%
    const regenRate = 1.75 // Base rate

    // Regenerate for 10 seconds
    const newMana = regenerateMana(currentMana, stats.maxMana, reservedMana, regenRate, 10)

    // Should regenerate 1.75% of 90 per second = 1.575 mana/sec
    // 10 seconds = 15.75 mana
    // 50 + 15.75 = 65.75, but capped at (90 - 18) = 72
    expect(newMana).toBeGreaterThan(currentMana)
    expect(newMana).toBeLessThanOrEqual(72)
  })

  test('offensive combat calculates clear speed bonus', () => {
    const stats = calculateStats(testCharacter)
    const equippedSkills = [
      skillDefinitions.find(s => s.id === 'fireball')!,
    ]
    const map = GAME_MAPS[0]! // Mudflats

    const result = simulateCombat(map, stats, testCharacter.baseStats, equippedSkills)

    // With active skills, should deal some damage
    expect(result.totalDamageDealt).toBeGreaterThan(0)

    // Clear speed should be less than 1.0 (faster clear)
    expect(result.clearSpeedMultiplier).toBeLessThan(1.0)
    expect(result.clearSpeedMultiplier).toBeGreaterThanOrEqual(0.5) // Min 0.5 (50% faster)
  })

  test('character without skills has no offensive bonus', () => {
    const noSkillsChar: Character = {
      ...testCharacter,
      skills: {},
    }

    const stats = calculateStats(noSkillsChar)
    const map = GAME_MAPS[0]!

    const result = simulateCombat(map, stats, noSkillsChar.baseStats, [])

    // No skills = no damage
    expect(result.totalDamageDealt).toBe(0)

    // Clear speed multiplier should be 1.0 (no bonus)
    expect(result.clearSpeedMultiplier).toBe(1.0)
  })
})
