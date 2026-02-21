import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { SkillGem } from '@/types'
import { getSkillDefinition } from '@/data/skillDefinitions'
import { useCharactersStore } from './characters'
import { useCurrencyStore } from './currency'

const STORAGE_KEY = 'poi-skillgems'

export const useSkillsStore = defineStore('skills', () => {
  const skillGems = ref<SkillGem[]>([])

  // Load persisted state
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      skillGems.value = JSON.parse(saved) as SkillGem[]
    } catch {
      skillGems.value = []
    }
  }

  // Persist on change
  watch(skillGems, (val) => localStorage.setItem(STORAGE_KEY, JSON.stringify(val)), { deep: true })

  // Getters
  function getSkillGem(gemId: string): SkillGem | undefined {
    return skillGems.value.find((gem) => gem.id === gemId)
  }

  function getSkillGemsBySkillId(skillId: string): SkillGem[] {
    return skillGems.value.filter((gem) => gem.skillId === skillId)
  }

  function getEquippedGemIds(): Set<string> {
    const equippedIds = new Set<string>()
    const charactersStore = useCharactersStore()
    for (const char of charactersStore.characters) {
      for (const gemId of Object.values(char.skills)) {
        if (gemId) equippedIds.add(gemId)
      }
    }
    return equippedIds
  }

  function getUnequippedGems(): SkillGem[] {
    const equipped = getEquippedGemIds()
    return skillGems.value.filter((gem) => !equipped.has(gem.id))
  }

  function disassembleGem(gemId: string): boolean {
    const gem = skillGems.value.find((g) => g.id === gemId)
    if (!gem) return false
    // Block disassembly of equipped gems
    if (getEquippedGemIds().has(gemId)) return false
    removeSkillGem(gemId)
    useCurrencyStore().annulmentShards += 1
    return true
  }

  // Actions
  function addSkillGem(skillId: string): string {
    const skillDef = getSkillDefinition(skillId)
    if (!skillDef) {
      throw new Error(`Unknown skill: ${skillId}`)
    }

    const gemId = crypto.randomUUID()
    const gem: SkillGem = {
      id: gemId,
      skillId,
    }

    skillGems.value.push(gem)
    return gemId
  }

  function addSkillGems(gems: SkillGem[]) {
    skillGems.value.push(...gems)
  }

  function removeSkillGem(gemId: string) {
    const index = skillGems.value.findIndex((gem) => gem.id === gemId)
    if (index !== -1) {
      skillGems.value.splice(index, 1)
    }
  }

  return {
    skillGems,
    getSkillGem,
    getSkillGemsBySkillId,
    getUnequippedGems,
    addSkillGem,
    addSkillGems,
    removeSkillGem,
    disassembleGem,
  }
})
