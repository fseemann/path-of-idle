import type { ComputedStats } from './stats'
import type { EquipmentSlot, ItemSlot } from './equipment'

export enum ModifierGroup {
  MaximumLife = 'MaximumLife',
  MaximumMana = 'MaximumMana',
  SingleResistance = 'SingleResistance',
  DualResistance = 'DualResistance',
  IncreasedArmor = 'IncreasedArmor',
  AddedPhysicalDamage = 'AddedPhysicalDamage',
  IncreasedPhysicalDamage = 'IncreasedPhysicalDamage',
  IncreasedAttackSpeed = 'IncreasedAttackSpeed',
  IncreasedMovementSpeed = 'IncreasedMovementSpeed',
  AddedStrength = 'AddedStrength',
  AddedDexterity = 'AddedDexterity',
  AddedIntelligence = 'AddedIntelligence',
  // Skill system modifiers
  IncreasedSpellDamage = 'IncreasedSpellDamage',
  IncreasedFireDamage = 'IncreasedFireDamage',
  IncreasedColdDamage = 'IncreasedColdDamage',
  IncreasedLightningDamage = 'IncreasedLightningDamage',
  IncreasedManaRegeneration = 'IncreasedManaRegeneration',
  ReducedManaReservation = 'ReducedManaReservation',
  IncreasedAuraEffect = 'IncreasedAuraEffect',
  IncreasedCooldownRecovery = 'IncreasedCooldownRecovery',
  IncreasedCriticalStrikeChance = 'IncreasedCriticalStrikeChance',
  IncreasedCriticalStrikeMultiplier = 'IncreasedCriticalStrikeMultiplier',
  // Slot-specific modifier groups
  IncreasedAttackSpeed_Gloves = 'IncreasedAttackSpeed_Gloves',
  AddedDexterity_Gloves = 'AddedDexterity_Gloves',
  IncreasedMovementSpeed_Boots = 'IncreasedMovementSpeed_Boots',
  AddedIntelligence_Helmet = 'AddedIntelligence_Helmet',
  MaximumMana_Helmet = 'MaximumMana_Helmet',
  AddedPhysicalDamage_Weapon = 'AddedPhysicalDamage_Weapon',
  IncreasedAttackSpeed_Weapon = 'IncreasedAttackSpeed_Weapon',
  MaximumLife_Armor = 'MaximumLife_Armor',
  IncreasedArmor_Armor = 'IncreasedArmor_Armor',
}

export type ModifierKind = 'flat' | 'increased'
export type ModifierTarget = keyof ComputedStats

export interface ModifierDefinition {
  id: string
  group: ModifierGroup
  kind: ModifierKind
  target: ModifierTarget
  /** Secondary targets that also receive the same value (e.g. dual resistance rings) */
  extraTargets?: ModifierTarget[]
  minValue: number
  maxValue: number
  weight: number
  label: string // contains "{value}" placeholder
  /** Modifier tier (1–3). Defaults to 1. */
  tier?: number
  /** Minimum item tier required to roll this modifier (1–5). Defaults to 1. */
  minItemTier?: number
  /** If specified, only rolls on these item slots. */
  allowedSlots?: ItemSlot[]
}

export interface RolledModifier {
  definitionId: string
  group: ModifierGroup
  kind: ModifierKind
  target: ModifierTarget
  /** Carried from definition for multi-stat modifiers. */
  extraTargets?: ModifierTarget[]
  value: number
  label: string // value already substituted
}
