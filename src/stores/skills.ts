import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { SkillGem } from '@/types'
import { getSkillDefinition } from '@/data/skillDefinitions'

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

  function getUnequippedGems(): SkillGem[] {
    // TODO: Once characters store tracks equipped gems, filter them out here
    return skillGems.value
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
  }
})
