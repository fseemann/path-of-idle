import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Character, EquipmentSlot, EquipmentItem, SkillSlot, SkillDefinition } from '@/types'
import { calculateStats } from '@/engine/statCalculator'
import { xpRequiredForLevel } from '@/engine/xpCalculator'
import { getInitialCharacters } from '@/data/characters'
import { skillDefinitions } from '@/data/skillDefinitions'
import { useSkillsStore } from './skills'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const STORAGE_KEY = 'poi-characters'

export const useCharactersStore = defineStore('characters', () => {
  const characters = ref<Character[]>([])
  const selectedCharacterId = ref<string | null>(null)

  // Load persisted state
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      characters.value = JSON.parse(saved) as Character[]
      // Migrate old characters to have skills field and strip legacy skillId values
      for (const char of characters.value) {
        if (!char.skills) {
          char.skills = {}
        } else {
          // Skills now store gemIds (UUIDs). Clear any slot that still has a plain skillId.
          for (const slot of Object.keys(char.skills) as SkillSlot[]) {
            const val = char.skills[slot]
            if (val && !UUID_RE.test(val)) {
              delete char.skills[slot]
            }
          }
        }
      }
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

  // Skill management — character.skills maps SkillSlot → gemId (UUID)
  function equipSkill(characterId: string, slot: SkillSlot, gemId: string): string | null {
    const char = getCharacter(characterId)
    if (!char) return null
    const displaced = char.skills[slot] ?? null
    char.skills[slot] = gemId
    return displaced
  }

  function unequipSkill(characterId: string, slot: SkillSlot): string | null {
    const char = getCharacter(characterId)
    if (!char) return null
    const gemId = char.skills[slot] ?? null
    if (gemId) delete char.skills[slot]
    return gemId
  }

  function getEquippedSkills(characterId: string): SkillDefinition[] {
    const char = getCharacter(characterId)
    if (!char) return []
    const skillsStore = useSkillsStore()
    const gemIds = Object.values(char.skills).filter((id): id is string => Boolean(id))
    return gemIds
      .map((gemId) => {
        const gem = skillsStore.getSkillGem(gemId)
        if (!gem) return null
        return skillDefinitions.find((def) => def.id === gem.skillId) ?? null
      })
      .filter((skill): skill is SkillDefinition => Boolean(skill))
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
    equipSkill,
    unequipSkill,
    getEquippedSkills,
  }
})
