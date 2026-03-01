export type MapTier = 1 | 2 | 3 | 4 | 5

export interface DamageProfile {
  physical: number
  fire: number
  cold: number
  lightning: number
  chaos: number
}

export interface MapEnemy {
  name: string
  damageType: keyof DamageProfile
}

export interface GameMap {
  id: string
  name: string
  tier: MapTier
  levelRequirement: number
  durationSeconds: number
  description: string
  lootMultiplier: number
  xpReward: number
  enemyDps: number
  damageProfile: DamageProfile
  enemies: MapEnemy[]
}

export interface MapRun {
  id: string
  mapId: string
  characterId: string
  startedAt: number
  durationMs: number
  completedAt: number | null
  lootCollected: boolean
  autoRerun: boolean
  survivalRatio?: number
}

export interface RunProgress {
  runId: string
  elapsed: number
  remaining: number
  fraction: number
  isComplete: boolean
}
