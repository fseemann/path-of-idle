import type { EquipmentItem } from './equipment'
import type { SkillGem } from './skills'

export interface LootResult {
  runId: string
  characterId: string
  items: EquipmentItem[]
  skillGems: SkillGem[]
  xpAwarded: number
  generatedAt: number
}
