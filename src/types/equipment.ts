import type { RolledModifier } from './modifiers'
import type { BaseStats } from './stats'

export type EquipmentSlot =
  | 'helmet'
  | 'bodyArmor'
  | 'weapon'
  | 'boots'
  | 'leftRing'
  | 'rightRing'

export type ItemRarity = 'normal' | 'magic' | 'rare'

export const MAX_MODIFIERS_BY_SLOT: Record<EquipmentSlot, number> = {
  helmet: 4,
  bodyArmor: 4,
  weapon: 4,
  boots: 4,
  leftRing: 1,
  rightRing: 1,
}

interface BaseItem {
  id: string
  name: string
  slot: EquipmentSlot
  rarity: ItemRarity
  levelRequirement: number
  statRequirements: Partial<BaseStats>
  modifiers: RolledModifier[]
}

export interface ArmorItem extends BaseItem {
  slot: 'helmet' | 'bodyArmor' | 'boots'
  baseDefense: number
}

export interface WeaponItem extends BaseItem {
  slot: 'weapon'
  baseAttackDamage: [number, number]
}

export interface RingItem extends BaseItem {
  slot: 'leftRing' | 'rightRing'
  modifiers: [RolledModifier]
}

export type EquipmentItem = ArmorItem | WeaponItem | RingItem
