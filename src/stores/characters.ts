import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Character, EquipmentSlot, EquipmentItem } from '@/types'
import { calculateStats } from '@/engine/statCalculator'
import { xpRequiredForLevel } from '@/engine/xpCalculator'
import { getInitialCharacters } from '@/data/characters'

const STORAGE_KEY = 'poi-characters'

export const useCharactersStore = defineStore('characters', () => {
  const characters = ref<Character[]>([])
  const selectedCharacterId = ref<string | null>(null)

  // Load persisted state
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      characters.value = JSON.parse(saved) as Character[]
    } catch {
      characters.value = getInitialCharacters()
    }
  } else {
    characters.value = getInitialCharacters()
  }
  if (characters.value.length > 0 && !selectedCharacterId.value) {
    selectedCharacterId.value = characters.value[0]!.id
  }

  // Persist on change
  watch(characters, (val) => localStorage.setItem(STORAGE_KEY, JSON.stringify(val)), { deep: true })

  // Getters
  const selectedCharacter = computed(() =>
    characters.value.find((c) => c.id === selectedCharacterId.value) ?? null
  )

  function getCharacter(id: string): Character | undefined {
    return characters.value.find((c) => c.id === id)
  }

  function getComputedStats(characterId: string) {
    const char = getCharacter(characterId)
    return char ? calculateStats(char) : null
  }

  // Actions
  function selectCharacter(id: string) {
    selectedCharacterId.value = id
  }

  function equipItem(characterId: string, slot: EquipmentSlot, item: EquipmentItem): EquipmentItem | null {
    const char = getCharacter(characterId)
    if (!char) return null
    const displaced = char.equipment[slot] ?? null
    char.equipment[slot] = item
    return displaced
  }

  function unequipItem(characterId: string, slot: EquipmentSlot): EquipmentItem | null {
    const char = getCharacter(characterId)
    if (!char) return null
    const item = char.equipment[slot] ?? null
    if (item) delete char.equipment[slot]
    return item
  }

  function awardXp(characterId: string, xp: number) {
    const char = getCharacter(characterId)
    if (!char) return
    char.experience += xp
    while (char.experience >= char.experienceToNextLevel) {
      char.experience -= char.experienceToNextLevel
      char.level += 1
      char.experienceToNextLevel = xpRequiredForLevel(char.level)
      // +1 to each stat on level up
      char.baseStats.strength += 1
      char.baseStats.dexterity += 1
      char.baseStats.intelligence += 1
    }
  }

  return {
    characters,
    selectedCharacterId,
    selectedCharacter,
    getCharacter,
    getComputedStats,
    selectCharacter,
    equipItem,
    unequipItem,
    awardXp,
  }
})
