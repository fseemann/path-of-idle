import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { EquipmentItem } from '@/types'
import { getDisassembleYield, applyAnnulment, applyExalt, applyAlchemy, applyChaos, applyDivine } from '@/engine/disassembler'
import type { CurrencyDropResult } from '@/engine/lootGenerator'

const STORAGE_KEY = 'poi-currency'
export const SHARDS_PER_CURRENCY = 10

export const useCurrencyStore = defineStore('currency', () => {
  const annulmentShards = ref(0)
  const exaltShards = ref(0)
  const alchemyShards = ref(0)
  const chaosShards = ref(0)
  const divineShards = ref(0)

  // Load persisted state
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const data = JSON.parse(saved) as {
        annulmentShards?: number
        exaltShards?: number
        alchemyShards?: number
        chaosShards?: number
        divineShards?: number
      }
      annulmentShards.value = data.annulmentShards ?? 0
      exaltShards.value = data.exaltShards ?? 0
      alchemyShards.value = data.alchemyShards ?? 0
      chaosShards.value = data.chaosShards ?? 0
      divineShards.value = data.divineShards ?? 0
    } catch { /* ignore */ }
  }

  // Persist on change
  watch([annulmentShards, exaltShards, alchemyShards, chaosShards, divineShards], () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      annulmentShards: annulmentShards.value,
      exaltShards: exaltShards.value,
      alchemyShards: alchemyShards.value,
      chaosShards: chaosShards.value,
      divineShards: divineShards.value,
    }))
  })

  // Full orbs (floored)
  const annulments = computed(() => Math.floor(annulmentShards.value / SHARDS_PER_CURRENCY))
  const exalts = computed(() => Math.floor(exaltShards.value / SHARDS_PER_CURRENCY))
  const alchemys = computed(() => Math.floor(alchemyShards.value / SHARDS_PER_CURRENCY))
  const chaos = computed(() => Math.floor(chaosShards.value / SHARDS_PER_CURRENCY))
  const divines = computed(() => Math.floor(divineShards.value / SHARDS_PER_CURRENCY))

  // Leftover shards after full orbs
  const annulmentRemainder = computed(() => annulmentShards.value % SHARDS_PER_CURRENCY)
  const exaltRemainder = computed(() => exaltShards.value % SHARDS_PER_CURRENCY)
  const alchemyRemainder = computed(() => alchemyShards.value % SHARDS_PER_CURRENCY)
  const chaosRemainder = computed(() => chaosShards.value % SHARDS_PER_CURRENCY)
  const divineRemainder = computed(() => divineShards.value % SHARDS_PER_CURRENCY)

  function disassembleItem(item: EquipmentItem): void {
    const { annulmentShards: a, exaltShards: e } = getDisassembleYield(item)
    annulmentShards.value += a
    exaltShards.value += e
  }

  /** Spend one Annulment Orb. Returns the modified item, or null on failure. */
  function useAnnulment(item: EquipmentItem): EquipmentItem | null {
    if (annulments.value < 1) return null
    const result = applyAnnulment(item)
    if (!result) return null
    annulmentShards.value -= SHARDS_PER_CURRENCY
    return result
  }

  /** Spend one Exalt Orb. Returns the modified item, or null on failure. */
  function useExalt(item: EquipmentItem): EquipmentItem | null {
    if (exalts.value < 1) return null
    const result = applyExalt(item)
    if (!result) return null
    exaltShards.value -= SHARDS_PER_CURRENCY
    return result
  }

  /** Spend one Alchemy Orb. Returns the modified item, or null on failure. */
  function useAlchemy(item: EquipmentItem): EquipmentItem | null {
    if (alchemys.value < 1) return null
    const result = applyAlchemy(item)
    if (!result) return null
    alchemyShards.value -= SHARDS_PER_CURRENCY
    return result
  }

  /** Spend one Chaos Orb. Returns the modified item, or null on failure. */
  function useChaos(item: EquipmentItem): EquipmentItem | null {
    if (chaos.value < 1) return null
    const result = applyChaos(item)
    if (!result) return null
    chaosShards.value -= SHARDS_PER_CURRENCY
    return result
  }

  /** Spend one Divine Orb. Returns the modified item, or null on failure. */
  function useDivine(item: EquipmentItem): EquipmentItem | null {
    if (divines.value < 1) return null
    const result = applyDivine(item)
    if (!result) return null
    divineShards.value -= SHARDS_PER_CURRENCY
    return result
  }

  function addCurrencyDrops(drops: CurrencyDropResult): void {
    alchemyShards.value += drops.alchemyShards
    chaosShards.value += drops.chaosShards
    divineShards.value += drops.divineShards
  }

  return {
    annulmentShards,
    exaltShards,
    alchemyShards,
    chaosShards,
    divineShards,
    annulments,
    exalts,
    alchemys,
    chaos,
    divines,
    annulmentRemainder,
    exaltRemainder,
    alchemyRemainder,
    chaosRemainder,
    divineRemainder,
    disassembleItem,
    useAnnulment,
    useExalt,
    useAlchemy,
    useChaos,
    useDivine,
    addCurrencyDrops,
  }
})
