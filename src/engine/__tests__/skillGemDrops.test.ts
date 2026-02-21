import { describe, test, expect } from 'bun:test'
import { generateLoot } from '../lootGenerator'
import { GAME_MAPS } from '@/data/maps'
import { getSkillDefinition } from '@/data/skillDefinitions'
import type { Character } from '@/types'

describe('Skill Gem Drops', () => {
  const testCharacter: Character = {
    id: 'test-char',
    name: 'Test Character',
    level: 10,
    experience: 0,
    experienceToNextLevel: 1000,
    baseStats: { strength: 10, dexterity: 10, intelligence: 10 },
    equipment: {},
    skills: {},
  }

  test('skill gems can drop from loot', () => {
    // Run many map completions to ensure at least one skill gem drops
    // With 15% drop rate, running 100 times should give us ~15 gems
    let totalGems = 0
    const map = GAME_MAPS[0]! // Mudflats, tier 1

    for (let i = 0; i < 100; i++) {
      const loot = generateLoot(map, testCharacter, 1.0)
      totalGems += loot.skillGems.length
    }

    // We should have gotten at least a few gems
    console.log(`Got ${totalGems} skill gems in 100 runs (expected ~15)`)
    expect(totalGems).toBeGreaterThan(0)
  })

  test('skill gem tier matches map tier', () => {
    const tier3Map = GAME_MAPS.find(m => m.tier === 3)!
    let foundGem = false
    let gemTier = 0

    // Run until we get a gem
    for (let i = 0; i < 200 && !foundGem; i++) {
      const loot = generateLoot(tier3Map, testCharacter, 1.0)
      if (loot.skillGems.length > 0) {
        foundGem = true
        const gem = loot.skillGems[0]!
        // Look up the skill definition to check its tier
        const skillDef = getSkillDefinition(gem.skillId)
        if (skillDef) {
          gemTier = skillDef.tier
          console.log(`Dropped ${skillDef.name} (tier ${skillDef.tier}) from tier ${tier3Map.tier} map`)
        }
      }
    }

    expect(foundGem).toBe(true)
    expect(gemTier).toBe(tier3Map.tier)
  })

  test('skill gems respect level requirements', () => {
    const lowLevelChar: Character = {
      ...testCharacter,
      level: 1, // Very low level
    }

    const highTierMap = GAME_MAPS.find(m => m.tier === 5)!
    let foundGem = false

    // Run many times
    for (let i = 0; i < 200 && !foundGem; i++) {
      const loot = generateLoot(highTierMap, lowLevelChar, 1.0)
      if (loot.skillGems.length > 0) {
        foundGem = true
        const gem = loot.skillGems[0]!
        const skillDef = getSkillDefinition(gem.skillId)

        // Should not drop skills that require higher level
        if (skillDef) {
          console.log(`Level ${lowLevelChar.level} char got ${skillDef.name} (requires level ${skillDef.levelRequirement})`)
          expect(skillDef.levelRequirement).toBeLessThanOrEqual(lowLevelChar.level)
        }
      }
    }

    // With level 1, might not get any gems from tier 5 if all tier 5 skills require higher level
    // This is expected behavior
  })

  test('loot result always includes skillGems array', () => {
    const map = GAME_MAPS[0]!
    const loot = generateLoot(map, testCharacter, 1.0)

    expect(loot).toHaveProperty('skillGems')
    expect(Array.isArray(loot.skillGems)).toBe(true)
  })

  test('skill gems have valid structure', () => {
    const map = GAME_MAPS[0]!
    let foundGem = false

    for (let i = 0; i < 200 && !foundGem; i++) {
      const loot = generateLoot(map, testCharacter, 1.0)
      if (loot.skillGems.length > 0) {
        foundGem = true
        const gem = loot.skillGems[0]!

        expect(gem).toHaveProperty('id')
        expect(gem).toHaveProperty('skillId')
        expect(typeof gem.id).toBe('string')
        expect(typeof gem.skillId).toBe('string')
        expect(gem.id.length).toBeGreaterThan(0)
        expect(gem.skillId.length).toBeGreaterThan(0)

        console.log(`Valid gem structure: ${JSON.stringify(gem)}`)
      }
    }

    expect(foundGem).toBe(true)
  })
})
