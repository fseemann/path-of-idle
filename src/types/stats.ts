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

  // Offensive stats — % increased damage (applied multiplicatively to matching hit damage)
  spellDamage: number
  fireDamage: number
  coldDamage: number
  lightningDamage: number
  chaosDamage: number

  // % increased damage per type
  increasedPhysicalDamage: number

  // Flat added damage to attacks (auto-attack and attack-tagged skills)
  addedPhysicalDamage: number
  addedFireDamage: number
  addedColdDamage: number
  addedLightningDamage: number
  addedChaosDamage: number

  critChance: number
  critMultiplier: number

  // Skill effectiveness
  auraEffect: number
  cooldownRecovery: number
}
