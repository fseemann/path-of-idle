import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { MapRun, RunProgress } from '@/types'
import { GAME_MAPS } from '@/data/maps'
import { generateLoot } from '@/engine/lootGenerator'
import { calculateStats } from '@/engine/statCalculator'
import { simulateCombat } from '@/engine/combatSimulator'
import { initializeSkillState, tickSkills } from '@/engine/skillExecutor'
import { calculateReservedMana, regenerateMana, calculateManaRegenRate } from '@/engine/manaCalculator'
import { useCharactersStore } from './characters'
import { useInventoryStore } from './inventory'
import { useSkillsStore } from './skills'

const STORAGE_KEY = 'poi-mapruns'

export const useMapRunsStore = defineStore('mapRuns', () => {
  const runs = ref<MapRun[]>([])
  const currentTime = ref(Date.now()) // updated every tick — makes getProgress reactive
  let intervalId: ReturnType<typeof setInterval> | null = null

  // Load persisted state
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      runs.value = JSON.parse(saved) as MapRun[]
    } catch {
      runs.value = []
    }
  }

  // Persist on change
  watch(runs, (val) => localStorage.setItem(STORAGE_KEY, JSON.stringify(val)), { deep: true })

  // Getters
  const activeRuns = computed(() => runs.value.filter((r) => r.completedAt === null))
  const completedRuns = computed(() => runs.value.filter((r) => r.completedAt !== null))
  const pendingLoot = computed(() =>
    runs.value.filter((r) => r.completedAt !== null && !r.lootCollected)
  )

  function getRunsForCharacter(characterId: string) {
    return runs.value.filter((r) => r.characterId === characterId)
  }

  function getActiveRunForCharacter(characterId: string): MapRun | null {
    return activeRuns.value.find((r) => r.characterId === characterId) ?? null
  }

  function getProgress(runId: string): RunProgress | null {
    const run = runs.value.find((r) => r.id === runId)
    if (!run) return null
    const now = currentTime.value // reactive — computed updates when tick() fires
    const elapsed =
      run.completedAt !== null
        ? run.durationMs
        : Math.min(now - run.startedAt, run.durationMs)
    return {
      runId,
      elapsed,
      remaining: Math.max(0, run.durationMs - elapsed),
      fraction: Math.min(1, elapsed / run.durationMs),
      isComplete: run.completedAt !== null,
    }
  }

  // Actions
  function startRun(mapId: string, characterId: string, autoRerun = false): string {
    const map = GAME_MAPS.find((m) => m.id === mapId)
    if (!map) throw new Error(`Unknown map: ${mapId}`)

    // Cancel any existing active run for this character
    const existing = getActiveRunForCharacter(characterId)
    if (existing) {
      existing.completedAt = Date.now()
      existing.lootCollected = true
    }

    const character = useCharactersStore().getCharacter(characterId)
    const baseDurationMs = map.durationSeconds * 1000
    let durationMs = baseDurationMs
    if (character) {
      const stats = calculateStats(character)
      const speedFactor = Math.max(0.5, 100 / stats.movementSpeed)
      durationMs = Math.round(baseDurationMs * speedFactor)
    }

    const runId = crypto.randomUUID()
    const now = Date.now()

    // Initialize skill state
    const equippedSkills = character
      ? useCharactersStore().getEquippedSkills(character.id)
      : []
    const { cooldowns, activeBuffs } = initializeSkillState(equippedSkills)

    // Calculate initial mana
    const stats = character ? calculateStats(character) : { maxMana: 30 } as any
    const passiveSkills = equippedSkills.filter((s) => s.type === 'passive')
    const reservedMana = calculateReservedMana(stats.maxMana, passiveSkills)
    const availableMana = stats.maxMana - reservedMana

    runs.value.push({
      id: runId,
      mapId,
      characterId,
      startedAt: now,
      durationMs,
      completedAt: null,
      lootCollected: false,
      autoRerun,
      skillCooldowns: cooldowns,
      activeBuffs,
      currentMana: availableMana,
    })
    return runId
  }

  function stopRun(characterId: string) {
    const run = getActiveRunForCharacter(characterId)
    if (run) {
      run.autoRerun = false
      run.completedAt = Date.now()
      run.lootCollected = true
    }
  }

  function completeRun(run: MapRun, now: number) {
    const map = GAME_MAPS.find((m) => m.id === run.mapId)
    const charactersStore = useCharactersStore()
    const inventoryStore = useInventoryStore()
    const character = charactersStore.getCharacter(run.characterId)

    if (map && character) {
      const stats = calculateStats(character)
      const equippedSkills = charactersStore.getEquippedSkills(character.id)
      const { survivalRatio } = simulateCombat(map, stats, character.baseStats, equippedSkills)
      run.survivalRatio = survivalRatio

      const loot = generateLoot(map, character, survivalRatio)
      loot.runId = run.id
      inventoryStore.addItems(loot.items)

      // Add skill gems to skills store
      const skillsStore = useSkillsStore()
      if (loot.skillGems.length > 0) {
        skillsStore.addSkillGems(loot.skillGems)
      }

      charactersStore.awardXp(run.characterId, loot.xpAwarded)
    }

    run.completedAt = now

    if (run.autoRerun) {
      // Auto-collect loot silently and immediately start the next run
      run.lootCollected = true
      startRun(run.mapId, run.characterId, true)
    }
    // Otherwise lootCollected stays false — UI shows notification
  }

  function tick() {
    const now = Date.now()
    currentTime.value = now // triggers reactivity for getProgress computed
    const deltaSeconds = 1 // tick runs every 1 second

    for (const run of runs.value) {
      if (run.completedAt !== null) continue

      // Get character and skills
      const character = useCharactersStore().getCharacter(run.characterId)
      if (character) {
        const equippedSkills = useCharactersStore().getEquippedSkills(character.id)
        const stats = calculateStats(character)

        // Tick skills if we have skill state
        if (run.skillCooldowns && run.activeBuffs && run.currentMana !== undefined) {
          const result = tickSkills(
            equippedSkills,
            run.skillCooldowns,
            run.activeBuffs,
            run.currentMana,
            now,
            deltaSeconds
          )

          run.skillCooldowns = result.cooldowns
          run.activeBuffs = result.activeBuffs
          run.currentMana -= result.manaConsumed

          // Regenerate mana
          const passiveSkills = equippedSkills.filter((s) => s.type === 'passive')
          const reservedMana = calculateReservedMana(stats.maxMana, passiveSkills)
          const regenRate = calculateManaRegenRate(stats)

          run.currentMana = regenerateMana(
            run.currentMana,
            stats.maxMana,
            reservedMana,
            regenRate,
            deltaSeconds
          )
        }
      }

      // Check for completion
      if (now >= run.startedAt + run.durationMs) {
        completeRun(run, now)
      }
    }
  }

  function acknowledgeLoot(runId: string) {
    const run = runs.value.find((r) => r.id === runId)
    if (run) run.lootCollected = true
  }

  function clearOldRuns() {
    // Keep only last 20 completed runs to prevent unbounded growth
    const completed = runs.value.filter((r) => r.completedAt !== null && r.lootCollected)
    if (completed.length > 20) {
      const toRemove = new Set(completed.slice(0, completed.length - 20).map((r) => r.id))
      runs.value = runs.value.filter((r) => !toRemove.has(r.id))
    }
  }

  function startLoop() {
    if (intervalId !== null) return
    tick() // immediate check on mount (catches offline completions)
    clearOldRuns()
    intervalId = setInterval(tick, 1000)
  }

  function stopLoop() {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  return {
    runs,
    activeRuns,
    completedRuns,
    pendingLoot,
    getRunsForCharacter,
    getActiveRunForCharacter,
    getProgress,
    startRun,
    stopRun,
    acknowledgeLoot,
    tick,
    startLoop,
    stopLoop,
  }
})
