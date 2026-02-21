import type { Character } from '@/types'

export function xpRequiredForLevel(level: number): number {
  return Math.round(100 * Math.pow(1.5, level - 1))
}

export function getInitialCharacters(): Character[] {
  return [
    {
      id: crypto.randomUUID(),
      name: 'Duelist',
      level: 1,
      experience: 0,
      experienceToNextLevel: xpRequiredForLevel(1),
      baseStats: { strength: 14, dexterity: 14, intelligence: 8 },
      equipment: {},
      skills: {},
    },
    {
      id: crypto.randomUUID(),
      name: 'Witch',
      level: 1,
      experience: 0,
      experienceToNextLevel: xpRequiredForLevel(1),
      baseStats: { strength: 6, dexterity: 10, intelligence: 20 },
      equipment: {},
      skills: {},
    },
    {
      id: crypto.randomUUID(),
      name: 'Ranger',
      level: 1,
      experience: 0,
      experienceToNextLevel: xpRequiredForLevel(1),
      baseStats: { strength: 8, dexterity: 22, intelligence: 6 },
      equipment: {},
      skills: {},
    },
  ]
}
