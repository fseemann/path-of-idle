import type { RolledModifier } from './modifiers'
import type { BaseStats } from './stats'

export type EquipmentSlot =
  | 'helmet'
  | 'bodyArmor'
  | 'weapon'
  | 'boots'
  | 'leftRing'
  | 'rightRing'

// ItemSlot is broader than EquipmentSlot: rings in the inventory have slot 'ring'
// and can be placed into either leftRing or rightRing at equip time.
export type ItemSlot = EquipmentSlot | 'ring'

export type ItemRarity = 'normal' | 'magic' | 'rare'

export const MAX_MODIFIERS_BY_SLOT: Record<ItemSlot, number> = {
  helmet: 4,
  bodyArmor: 4,
  weapon: 4,
  boots: 4,
  leftRing: 4,
  rightRing: 4,
  ring: 4,
}

interface BaseItem {
  id: string
  name: string
  slot: ItemSlot
  rarity: ItemRarity
  levelRequirement: number
  /** Map tier the item dropped in; gates which modifier tiers can be crafted onto it. Defaults to 1 for legacy items. */
  itemTier?: number
  statRequirements: Partial<BaseStats>
  modifiers: RolledModifier[]
  locked?: boolean
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
  slot: 'ring'
}

export type EquipmentItem = ArmorItem | WeaponItem | RingItem
