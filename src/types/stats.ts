export interface BaseStats {
  strength: number
  dexterity: number
  intelligence: number
}

export interface ComputedStats {
  attackDamage: number
  defense: number
  movementSpeed: number
  attackSpeed: number
  fireResistance: number
  iceResistance: number
  lightningResistance: number
  chaosResistance: number
  health: number

  // Mana system
  maxMana: number
  manaRegenFlat: number
  manaRegenPercent: number

  // Offensive stats
  spellDamage: number
  critChance: number
  critMultiplier: number

  // Skill effectiveness
  auraEffect: number
  cooldownRecovery: number
}
