import type { ComputedStats } from './stats'

export enum ModifierGroup {
  MaximumLife = 'MaximumLife',
  MaximumMana = 'MaximumMana',
  FireResistance = 'FireResistance',
  ColdResistance = 'ColdResistance',
  LightningResistance = 'LightningResistance',
  ChaosResistance = 'ChaosResistance',
  FireColdResistance = 'FireColdResistance',
  FireLightningResistance = 'FireLightningResistance',
  ColdLightningResistance = 'ColdLightningResistance',
  IncreasedArmor = 'IncreasedArmor',
  AddedPhysicalDamage = 'AddedPhysicalDamage',
  IncreasedPhysicalDamage = 'IncreasedPhysicalDamage',
  IncreasedAttackSpeed = 'IncreasedAttackSpeed',
  IncreasedMovementSpeed = 'IncreasedMovementSpeed',
  AddedStrength = 'AddedStrength',
  AddedDexterity = 'AddedDexterity',
  AddedIntelligence = 'AddedIntelligence',
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
  /** If true, only rolls on ring items. */
  ringOnly?: boolean
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
