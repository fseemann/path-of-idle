export type MapTier = 1 | 2 | 3 | 4 | 5

export interface GameMap {
  id: string
  name: string
  tier: MapTier
  levelRequirement: number
  durationSeconds: number
  description: string
  lootMultiplier: number
  xpReward: number
}

export interface MapRun {
  id: string
  mapId: string
  characterId: string
  startedAt: number
  durationMs: number
  completedAt: number | null
  lootCollected: boolean
}

export interface RunProgress {
  runId: string
  elapsed: number
  remaining: number
  fraction: number
  isComplete: boolean
}
