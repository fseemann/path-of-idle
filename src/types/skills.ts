import type { ComputedStats } from './stats'

export type SkillType = 'active' | 'passive'
export type DamageType = 'physical' | 'fire' | 'cold' | 'lightning' | 'chaos'
export type SkillTag = 'attack' | 'spell' | 'aura' | 'buff' | 'area'

export interface SkillScaling {
  attribute: 'strength' | 'dexterity' | 'intelligence'
  factor: number // how much attribute contributes to effectiveness
}

export interface SkillEffect {
  type: 'damage' | 'buff'
  damageType?: DamageType
  baseDamage?: [number, number] // [min, max]
  buffTarget?: keyof ComputedStats | 'manaRegenFlat' | 'manaRegenPercent'
  buffKind?: 'flat' | 'increased'
  buffValue?: number
  buffDuration?: number | null // seconds, null = permanent (auras)
}

export interface SkillDefinition {
  id: string
  name: string
  type: SkillType
  tags: SkillTag[]
  description: string
  scaling: SkillScaling
  manaCost?: number // active skills only
  cooldown?: number // active skills only, in seconds
  manaReservation?: number // passive skills only, percentage
  effects: SkillEffect[]
  levelRequirement: number
  tier: number // 1-5, determines drop locations
}

export interface SkillGem {
  id: string
  skillId: string // references SkillDefinition
  // Future: quality, level, etc.
}

export type SkillSlot = 'active1' | 'active2' | 'active3' | 'passive1' | 'passive2'

// Runtime state during map runs
export interface SkillCooldownState {
  skillId: string
  remainingCooldown: number
}

export interface ActiveBuff {
  skillId: string
  target: string
  kind: 'flat' | 'increased'
  value: number
  expiresAt: number | null // null = permanent (auras)
}
