import type { BaseStats } from './stats'
import type { EquipmentItem, EquipmentSlot } from './equipment'

export type Equipment = Partial<Record<EquipmentSlot, EquipmentItem>>

export interface Character {
  id: string
  name: string
  level: number
  experience: number
  experienceToNextLevel: number
  baseStats: BaseStats
  equipment: Equipment
}
