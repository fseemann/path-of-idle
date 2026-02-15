import type { ComputedStats } from './stats'

export enum ModifierGroup {
  MaximumLife = 'MaximumLife',
  MaximumMana = 'MaximumMana',
  FireResistance = 'FireResistance',
  ColdResistance = 'ColdResistance',
  LightningResistance = 'LightningResistance',
  ChaosResistance = 'ChaosResistance',
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
  minValue: number
  maxValue: number
  weight: number
  label: string // contains "{value}" placeholder
}

export interface RolledModifier {
  definitionId: string
  group: ModifierGroup
  kind: ModifierKind
  target: ModifierTarget
  value: number
  label: string // value already substituted
}
