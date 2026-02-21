import type { SkillDefinition } from '@/types'

export const skillDefinitions: SkillDefinition[] = [
  // Active Skills - Offensive
  {
    id: 'fireball',
    name: 'Fireball',
    type: 'active',
    tags: ['spell', 'area'],
    description: 'Launches a ball of fire that explodes on impact.',
    scaling: { attribute: 'intelligence', factor: 0.6 },
    manaCost: 15,
    cooldown: 3,
    effects: [{ type: 'damage', damageType: 'fire', baseDamage: [18, 27] }],
    levelRequirement: 1,
    tier: 1,
  },
  {
    id: 'ground_slam',
    name: 'Ground Slam',
    type: 'active',
    tags: ['attack', 'area'],
    description: 'Slams the ground with incredible force, dealing physical damage.',
    scaling: { attribute: 'strength', factor: 0.8 },
    manaCost: 12,
    cooldown: 4,
    effects: [{ type: 'damage', damageType: 'physical', baseDamage: [25, 38] }],
    levelRequirement: 1,
    tier: 1,
  },
  {
    id: 'lightning_strike',
    name: 'Lightning Strike',
    type: 'active',
    tags: ['attack', 'spell'],
    description: 'Strikes with lightning-fast precision, dealing lightning damage.',
    scaling: { attribute: 'dexterity', factor: 0.7 },
    manaCost: 10,
    cooldown: 2,
    effects: [{ type: 'damage', damageType: 'lightning', baseDamage: [12, 22] }],
    levelRequirement: 1,
    tier: 1,
  },

  // Active Skills - Defensive
  {
    id: 'stone_skin',
    name: 'Stone Skin',
    type: 'active',
    tags: ['buff'],
    description: 'Hardens your skin, temporarily increasing armor by 40% for 5 seconds.',
    scaling: { attribute: 'strength', factor: 0.3 },
    manaCost: 20,
    cooldown: 8,
    effects: [
      {
        type: 'buff',
        buffTarget: 'defense',
        buffKind: 'increased',
        buffValue: 40,
        buffDuration: 5,
      },
    ],
    levelRequirement: 4,
    tier: 2,
  },

  // Passive Skills - Offensive Auras
  {
    id: 'herald_of_fire',
    name: 'Herald of Fire',
    type: 'passive',
    tags: ['aura'],
    description: 'Reserves 25% of mana to increase spell damage by 30%.',
    scaling: { attribute: 'intelligence', factor: 0 },
    manaReservation: 25,
    effects: [
      {
        type: 'buff',
        buffTarget: 'spellDamage',
        buffKind: 'increased',
        buffValue: 30,
        buffDuration: null,
      },
    ],
    levelRequirement: 8,
    tier: 2,
  },

  // Passive Skills - Utility Auras
  {
    id: 'clarity',
    name: 'Clarity',
    type: 'passive',
    tags: ['aura'],
    description: 'Reserves 20% of mana to double your mana regeneration rate.',
    scaling: { attribute: 'intelligence', factor: 0 },
    manaReservation: 20,
    effects: [
      {
        type: 'buff',
        buffTarget: 'manaRegenPercent',
        buffKind: 'increased',
        buffValue: 100,
        buffDuration: null,
      },
    ],
    levelRequirement: 6,
    tier: 2,
  },

  // Passive Skills - Defensive Auras
  {
    id: 'vitality',
    name: 'Vitality',
    type: 'passive',
    tags: ['aura'],
    description: 'Reserves 35% of mana to increase maximum life by 15%.',
    scaling: { attribute: 'strength', factor: 0 },
    manaReservation: 35,
    effects: [
      {
        type: 'buff',
        buffTarget: 'health',
        buffKind: 'increased',
        buffValue: 15,
        buffDuration: null,
      },
    ],
    levelRequirement: 10,
    tier: 3,
  },
]

export function getSkillDefinition(skillId: string): SkillDefinition | undefined {
  return skillDefinitions.find((skill) => skill.id === skillId)
}

export function getSkillDefinitionsByTier(tier: number): SkillDefinition[] {
  return skillDefinitions.filter((skill) => skill.tier === tier)
}

export function getSkillDefinitionsByType(type: 'active' | 'passive'): SkillDefinition[] {
  return skillDefinitions.filter((skill) => skill.type === type)
}
