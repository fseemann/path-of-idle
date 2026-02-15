import type { EquipmentItem } from './equipment'

export interface LootResult {
  runId: string
  characterId: string
  items: EquipmentItem[]
  xpAwarded: number
  generatedAt: number
}
